"""
Merchant-Center-grade web crawl & catalog health engine.

Three cooperating pieces:

* ``record_url_impression`` — append-only impression ledger (deduped per URL
  per hour) that also marks the URL for the next refresh, so a URL that is
  actually shown to users gets re-verified promptly.
* ``verify_record`` / ``verify_url`` — live re-check of one URL through the
  TinyFish fetch tier: capture EvidenceArtifact, refresh title / price /
  availability, resolve redirects, enforce the expected-domain rule (the
  "correct URLs" check) and track price drift.
* ``crawl_rotation`` / ``discover_merchant_urls`` — periodic batch runner and
  web discovery of new product URLs for a merchant.

Every function degrades gracefully (never raises) so the admin portal, the
merchant dashboard and the API can call it freely.
"""

import hashlib
import time as time_module
from urllib.parse import urlparse

from apps.offers.models import (
    CrawlRun,
    UrlHealthRecord,
    UrlHealthStateChoices,
    UrlImpression,
)
from django.core.cache import cache
from django.db.models import Case, Count, F, Value, When
from django.utils import timezone

STALE_AFTER_DAYS = 7
_IMP_HTML_KEYWORDS = ('in stock', 'add to cart', 'available', 'buy now', 'order now')
_OUT_HTML_KEYWORDS = ('out of stock', 'sold out', 'unavailable', 'discontinued', 'no longer available')


def hostname_of(url: str) -> str:
    """Lower-cased hostname (with www stripped) or '' for junk input."""
    if not url:
        return ''
    try:
        host = urlparse(url).netloc.lower()
    except ValueError:
        return ''
    return host[4:] if host.startswith('www.') else host


def _impression_gate(url: str) -> bool:
    digest = hashlib.sha256(url.encode()).hexdigest()[:24]
    key = f'sp:imp:{digest}:{int(time_module.time() // 3600)}'
    if cache.get(key):
        return False
    cache.set(key, 1, 3600 + 60)
    return True


def record_url_impression(url: str, *, product=None, merchant=None, source: str = 'search') -> bool:
    """Ledger one impression for a URL (max 1 write per URL per hour).

    Unknown URLs are tracked on first impression — anything actually shown to
    shoppers joins the crawl ledger and requests a refresh.
    """
    if not url:
        return False
    try:
        if not _impression_gate(url):
            return False
        UrlImpression.objects.create(url=url, product=product, merchant=merchant, source=source)
        record = ensure_url_record(
            url,
            merchant=merchant,
            product=product,
            expected_hostname=hostname_of(merchant.website_url) if merchant is not None else '',
            source='impression-ledger',
        )[0]
        record.refresh_requested_at = timezone.now()
        record.refresh_count += 1
        record.save(update_fields=['refresh_requested_at', 'refresh_count', 'updated_at'])
        return True
    except Exception:
        return False


def ensure_url_record(
    url: str, *, merchant=None, product=None, offer=None,
    discovered_offer=None, expected_hostname: str = '', source: str = 'web_sweep',
) -> tuple[UrlHealthRecord, bool]:
    """Get-or-create the ledger row for a URL, back-filling links when known.

    Returns ``(record, created)`` so callers can tell discovery from recall.
    """
    record, created = UrlHealthRecord.objects.get_or_create(
        url=url,
        defaults={
            'merchant': merchant,
            'master_product': product,
            'offer': offer,
            'discovered_offer': discovered_offer,
            'expected_hostname': expected_hostname or hostname_of(url),
            'source': source,
        },
    )
    if not created:
        changed = False
        if record.merchant_id is None and merchant is not None:
            record.merchant = merchant
            changed = True
        if record.master_product_id is None and product is not None:
            record.master_product = product
            changed = True
        if record.discovered_offer_id is None and discovered_offer is not None:
            record.discovered_offer = discovered_offer
            changed = True
        if not record.expected_hostname and expected_hostname:
            record.expected_hostname = expected_hostname
            changed = True
        if changed:
            record.save(update_fields=['merchant', 'master_product', 'discovered_offer', 'expected_hostname', 'updated_at'])
    return record, created


def _availability_hint(text: str) -> str:
    lowered = (text or '').lower()[:4000]
    if any(k in lowered for k in _OUT_HTML_KEYWORDS):
        return 'out_of_stock'
    if any(k in lowered for k in _IMP_HTML_KEYWORDS):
        return 'in_stock'
    return ''


def verify_record(record: UrlHealthRecord, *, intent: str = '', timeout_ms: int = 45000) -> dict:
    """
    Live re-check of one URL: fetch → capture → update health + linked offer.

    Returns a JSON-safe dict (``snapshot`` is None when the page could not be
    read). Never raises.
    """
    from apps.intelligence.connectors.tinyfish import TinyFishFetchProvider

    result = {
        'record_id': record.canonical_id,
        'state': record.state,
        'price': None,
        'crawled': False,
        'off_domain': False,
        'error': '',
        'snapshot': None,
    }
    now = timezone.now()
    record.checks_count += 1
    record.last_crawled_at = now

    provider = TinyFishFetchProvider({
        'per_url_timeout_ms': min(timeout_ms, 44_000),
        'image_links': True,
    })
    if not provider.is_available():
        record.state = UrlHealthStateChoices.FAILED
        record.error_text = 'TinyFish fetch tier unavailable (API key or rights gate)'
        record.save(update_fields=['state', 'checks_count', 'last_crawled_at', 'error_text', 'updated_at'])
        result['state'] = record.state
        result['error'] = record.error_text
        return result

    try:
        snapshots = provider.fetch(
            [record.url],
            intent=intent or 'capture the current product title, price, availability and images',
        )
    except Exception as exc:  # defensive ceiling — provider never raises, belt & braces
        snapshots = []
        result['error'] = str(exc)[:300]

    if not snapshots:
        record.state = UrlHealthStateChoices.FAILED
        errors = getattr(provider, 'last_errors', []) or []
        parts = [f"{e.get('url', '')}: {e.get('error', 'failed')}" for e in errors[:2]]
        record.error_text = '; '.join(parts) or result['error'] or 'page could not be read'
        statuses = [e.get('status') for e in errors if e.get('status')]
        record.last_http_status = statuses[0] if statuses else None
        record.save(update_fields=[
            'state', 'last_http_status', 'checks_count', 'last_crawled_at', 'error_text', 'updated_at',
        ])
        result['state'] = record.state
        result['error'] = record.error_text
        return result

    snapshot = snapshots[0]
    final_url = snapshot.get('final_url') or record.url
    resolved_host = hostname_of(final_url)
    expected = (record.expected_hostname or '').lower().strip()
    off_domain = bool(expected) and bool(resolved_host) and expected not in resolved_host and resolved_host not in expected

    new_price = snapshot.get('price_amount')
    record.final_url = final_url
    record.last_title = (snapshot.get('title') or '')[:300]
    hint = _availability_hint(f"{(snapshot.get('title') or '')} {(snapshot.get('snippet') or '')}")
    record.last_availability_text = hint.replace('_', ' ') if hint else ''
    record.last_image_url = snapshot.get('image_url') or ''
    record.last_success_at = now
    record.last_http_status = 200
    record.error_text = ''
    record.previous_price_amount = record.last_price_amount

    from decimal import Decimal, InvalidOperation

    try:
        record.last_price_amount = Decimal(new_price) if new_price else None
    except (InvalidOperation, TypeError):
        record.last_price_amount = None
    if record.last_price_amount is not None and record.previous_price_amount is not None:
        record.price_drift_amount = record.last_price_amount - record.previous_price_amount
    else:
        record.price_drift_amount = None
    record.state = UrlHealthStateChoices.OFF_DOMAIN if off_domain else UrlHealthStateChoices.HEALTHY
    record.refresh_requested_at = None
    update_fields = [
        'final_url', 'last_title', 'last_availability_text', 'last_image_url',
        'last_success_at', 'last_http_status', 'error_text', 'previous_price_amount',
        'last_price_amount', 'price_drift_amount', 'state', 'refresh_requested_at',
        'checks_count', 'last_crawled_at', 'updated_at',
    ]
    if record.discovered_offer_id:
        dof = record.discovered_offer
        dof_fields = []
        if record.last_price_amount is not None:
            dof.discovered_price_amount = record.last_price_amount
            dof_fields.append('discovered_price_amount')
        if record.last_availability_text:
            dof.availability_text = record.last_availability_text
            dof_fields.append('availability_text')
        if record.last_title:
            dof.raw_price_text = record.last_title[:100]
            dof_fields.append('raw_price_text')
        dof.observed_at = now
        dof_fields.append('observed_at')
        dof.save(update_fields=dof_fields)
    record.save(update_fields=update_fields)

    snapshot['image_url'] = record.last_image_url
    result.update({
        'state': record.state,
        'price': str(record.last_price_amount) if record.last_price_amount is not None else None,
        'crawled': True,
        'off_domain': off_domain,
        'snapshot': snapshot,
    })
    return result


def verify_url(url: str, *, intent: str = '', timeout_ms: int = 45000) -> dict:
    """Ledger + verify a URL in one call (used by the API and per-URL buttons)."""
    record = ensure_url_record(url, source='interactive_verify')[0]
    return verify_record(record, intent=intent, timeout_ms=timeout_ms)


def crawl_rotation(*, limit: int = 10, merchant=None, trigger: str = 'periodic', pacing: float = 2.1) -> dict:
    """
    Check the next ``limit`` URLs: impression-requested first, then never
    checked, then oldest. ``pacing`` throttles the free TinyFish tier (set 0
    in tests / high-trust environments).
    """
    qs = UrlHealthRecord.objects.all()
    if merchant is not None:
        qs = qs.filter(merchant=merchant)
    qs = qs.annotate(
        _priority=Case(
            When(refresh_requested_at__isnull=False, then=Value(0)),
            default=Value(1),
        ),
    ).order_by('_priority', F('last_crawled_at').asc(nulls_first=True))
    records = list(qs[:limit])
    if not records:
        return {'run_id': None, 'attempted': 0, 'ok': 0, 'failed': 0, 'checked': []}

    run = CrawlRun.objects.create(trigger=trigger, merchant=merchant)
    ok = failed = 0
    checked = []
    try:
        for record in records:
            if pacing:
                time_module.sleep(pacing)
            outcome = verify_record(record)
            checked.append(outcome)
            if outcome['state'] in (
                UrlHealthStateChoices.HEALTHY, UrlHealthStateChoices.OFF_DOMAIN,
            ):
                ok += 1
            else:
                failed += 1
        run.status = 'completed'
    except Exception as exc:  # pragma: no cover - defensive ceiling
        run.status = 'failed'
        run.error = str(exc)[:500]
    run.urls_attempted = len(records)
    run.urls_ok = ok
    run.urls_failed = failed
    run.finished_at = timezone.now()
    run.save(update_fields=['status', 'urls_attempted', 'urls_ok', 'urls_failed', 'finished_at', 'error', 'updated_at'])
    return {'run_id': run.run_id, 'attempted': len(records), 'ok': ok, 'failed': failed, 'checked': checked}


def discover_merchant_urls(merchant, *, products_limit: int = 3, hits_per_query: int = 3) -> dict:
    """
    Web discovery for a merchant: TinyFish searches for the merchant's
    products and tracks the returned URLs as new health records (never
    duplicates). Best-effort, never raises.
    """
    from apps.intelligence.connectors.tinyfish import TinyFishProvider

    empty = {'queries': 0, 'found': 0, 'error': '', 'created': []}
    provider = TinyFishProvider({'location': 'ZA', 'language': 'en'})
    if not provider.is_available():
        empty['error'] = 'TinyFish tier unavailable (API key or rights gate)'
        return empty

    queries = [f'{merchant.name} {merchant.category or "products"}'.strip()]
    from apps.offers.models import VendorProduct

    for vp in (
        merchant.vendor_products.select_related('master_product')
        .filter(status=VendorProduct.StatusChoices.ACTIVE)[:products_limit]
    ):
        queries.append(f'{merchant.name} {vp.master_product.title}'.strip())

    expected_host = hostname_of(merchant.website_url or '')
    created: list[UrlHealthRecord] = []
    for query in queries:
        if not query:
            continue
        try:
            hits = provider.search(query[:200], limit=hits_per_query)
        except Exception:
            continue
        for hit in hits:
            record, is_new = ensure_url_record(
                hit.url, merchant=merchant, expected_hostname=expected_host,
                source='tinyfish_discovery',
            )
            if is_new:
                created.append(record)
    return {'queries': len(queries), 'found': len(created), 'error': '', 'created': created}


def health_summary(merchant=None, *, limit: int = 50) -> dict:
    """
    Roll-up for the merchant dashboard + public API: state counts, staleness,
    pending impression refreshes, last crawl run and the top-priority URLs.
    """
    qs = UrlHealthRecord.objects.all()
    if merchant is not None:
        qs = qs.filter(merchant=merchant)

    states = dict(qs.values('state').annotate(n=Count('id')).values_list('state', 'n'))
    now = timezone.now()
    stale_cutoff = now - timezone.timedelta(days=STALE_AFTER_DAYS)
    rows = list(
        qs.select_related('master_product', 'merchant', 'discovered_offer')
        .order_by('-refresh_requested_at', F('last_crawled_at').asc(nulls_first=True))[:limit]
    )
    last_run = CrawlRun.objects.filter(merchant=merchant).first() if merchant is not None else CrawlRun.objects.first()

    return {
        'total': qs.count(),
        'healthy': states.get(UrlHealthStateChoices.HEALTHY, 0),
        'failed': states.get(UrlHealthStateChoices.FAILED, 0),
        'off_domain': states.get(UrlHealthStateChoices.OFF_DOMAIN, 0),
        'never_checked': states.get(UrlHealthStateChoices.UNKNOWN, 0),
        'stale': qs.filter(
            state=UrlHealthStateChoices.HEALTHY, last_success_at__lt=stale_cutoff,
        ).count(),
        'refresh_pending': qs.filter(refresh_requested_at__isnull=False).count(),
        'last_run': {
            'trigger': last_run.trigger,
            'status': last_run.status,
            'started_at': last_run.started_at.isoformat(),
            'attempted': last_run.urls_attempted,
            'ok': last_run.urls_ok,
            'failed': last_run.urls_failed,
        } if last_run else None,
        'urls': [
            {
                'url': r.url,
                'final_url': r.final_url or r.url,
                'state': r.effective_state,
                'expected_hostname': r.expected_hostname,
                'title': r.last_title,
                'price_amount': str(r.last_price_amount) if r.last_price_amount is not None else None,
                'price_drift_amount': str(r.price_drift_amount) if r.price_drift_amount is not None else None,
                'availability': r.last_availability_text,
                'image_url': r.last_image_url,
                'last_crawled_at': r.last_crawled_at.isoformat() if r.last_crawled_at else None,
                'last_success_at': r.last_success_at.isoformat() if r.last_success_at else None,
                'refresh_pending': r.refresh_requested_at is not None,
                'checks_count': r.checks_count,
                'error_text': r.error_text,
                'product_title': r.master_product.title if r.master_product_id else '',
                'merchant_name': r.merchant.name if r.merchant_id else '',
            }
            for r in rows
        ],
    }
