from apps.catalog.models import ConditionChoices
from apps.core.models import TimeStampedModel
from django.db import models
from django.utils import timezone


class DestinationTypeChoices(models.TextChoices):
    MERCHANT_WHATSAPP = 'merchant_whatsapp', 'Merchant WhatsApp Direct'
    RETAILER_WEBSITE = 'retailer_website', 'Retailer Website'
    MARKETPLACE_LISTING = 'marketplace_listing', 'Marketplace Listing'
    PHYSICAL_STALL = 'physical_stall', 'Physical Stall Visit'


class CurrencyChoices(models.TextChoices):
    ZAR = 'ZAR', 'South African Rand (ZAR)'
    USD = 'USD', 'US Dollar (USD)'
    ZWG = 'ZWG', 'Zimbabwe Gold (ZWG)'


class AvailabilityStateChoices(models.TextChoices):
    FRESH = 'fresh', 'Fresh (Active SLA)'
    CONFIRM_REQUIRED = 'confirm_required', 'Confirmation Required'
    QUOTE_REQUIRED = 'quote_required', 'Quote Required'
    OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'
    EXPIRED = 'expired', 'Expired / Stale'
    HIDDEN = 'hidden', 'Hidden / Suspended'


class SlaClassChoices(models.TextChoices):
    FAST_MOVING_24H = 'fast_moving_24h', 'Fast Moving (24h Window)'
    RETAIL_72H = 'retail_72h', 'Retail Stock (72h Window)'
    CATALOGUE_7D = 'catalogue_7d', 'Catalogue Price (7 Days)'
    SERVICE_30D = 'service_30d', 'Service Capability (30 Days)'


SLA_VALIDITY = {
    SlaClassChoices.FAST_MOVING_24H: timezone.timedelta(hours=24),
    SlaClassChoices.RETAIL_72H: timezone.timedelta(hours=72),
    SlaClassChoices.CATALOGUE_7D: timezone.timedelta(days=7),
    SlaClassChoices.SERVICE_30D: timezone.timedelta(days=30),
}
DEFAULT_SLA = SLA_VALIDITY[SlaClassChoices.RETAIL_72H]

# schema.org / Google Merchant Center vocabulary per availability state.
SCHEMA_AVAILABILITY = {
    AvailabilityStateChoices.FRESH: 'https://schema.org/InStock',
    AvailabilityStateChoices.CONFIRM_REQUIRED: 'https://schema.org/LimitedAvailability',
    AvailabilityStateChoices.QUOTE_REQUIRED: 'https://schema.org/LimitedAvailability',
    AvailabilityStateChoices.OUT_OF_STOCK: 'https://schema.org/OutOfStock',
    AvailabilityStateChoices.EXPIRED: 'https://schema.org/OutOfStock',
}
FEED_AVAILABILITY = {
    AvailabilityStateChoices.FRESH: 'in_stock',
    AvailabilityStateChoices.CONFIRM_REQUIRED: 'in_stock',
    AvailabilityStateChoices.QUOTE_REQUIRED: 'in_stock',
    AvailabilityStateChoices.OUT_OF_STOCK: 'out_of_stock',
    AvailabilityStateChoices.EXPIRED: 'out_of_stock',
}
# States a price may be syndicated under; hidden/expired rows never publish.
PUBLISHABLE_STATES = (
    AvailabilityStateChoices.FRESH,
    AvailabilityStateChoices.CONFIRM_REQUIRED,
    AvailabilityStateChoices.QUOTE_REQUIRED,
    AvailabilityStateChoices.OUT_OF_STOCK,
)


class VendorProduct(TimeStampedModel):
    """
    A merchant's first-party listing of a canonical master product.

    The stable link between the merchant world (SKU, barcode, condition,
    stock) and the master product graph. Offers become price-state records
    against the listing; promotions and evidence claims attach here too.
    One listing per (merchant, master_product, condition, unit_descriptor).
    """

    class StockStateChoices(models.TextChoices):
        IN_STOCK = 'in_stock', 'In Stock'
        LOW_STOCK = 'low_stock', 'Low Stock'
        OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'
        UNKNOWN = 'unknown', 'Unknown'

    class StatusChoices(models.TextChoices):
        ACTIVE = 'active', 'Active'
        DRAFT = 'draft', 'Draft'
        OFFBOARDED = 'offboarded', 'Offboarded / Suspended'

    class MatchSourceChoices(models.TextChoices):
        SWEEP = 'sweep', 'Public Web Sweep'
        MANUAL = 'manual', 'Operator Entered'
        MERCHANT_CLAIMED = 'merchant_claimed', 'Merchant Claimed'
        EVIDENCE = 'evidence', 'Field Evidence'

    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, blank=True, help_text='e.g. vp_ab12cd34ef56')
    master_product = models.ForeignKey('catalog.MasterProduct', on_delete=models.CASCADE, related_name='vendor_products')
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.CASCADE, related_name='vendor_products')

    vendor_sku = models.CharField(max_length=100, blank=True, default='', db_index=True, help_text='The merchant\'s own SKU for this listing')
    vendor_gtin = models.CharField(max_length=14, blank=True, null=True, help_text='Vendor barcode when it differs from the master GTIN')
    mpn = models.CharField(max_length=100, blank=True, default='')

    condition = models.CharField(max_length=20, choices=ConditionChoices.choices, default=ConditionChoices.NEW)
    unit_descriptor = models.CharField(max_length=50, blank=True, default='', help_text='e.g. each, per 5L, box of 10')
    stock_state = models.CharField(max_length=20, choices=StockStateChoices.choices, default=StockStateChoices.UNKNOWN, db_index=True)
    stall_ref = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE, db_index=True)

    match_source = models.CharField(max_length=30, choices=MatchSourceChoices.choices, default=MatchSourceChoices.MANUAL)
    match_confidence = models.FloatField(default=0.85)

    class Meta:
        ordering = ['merchant', 'master_product']
        verbose_name = 'Vendor Product Listing'
        verbose_name_plural = 'Vendor Product Listings'
        constraints = [
            models.UniqueConstraint(
                fields=['merchant', 'master_product', 'condition', 'unit_descriptor'],
                name='uniq_vendor_product_listing',
            ),
        ]

    def __str__(self):
        sku = f' [{self.vendor_sku}]' if self.vendor_sku else ''
        return f'{self.merchant.name} — {self.master_product.title}{sku}'

    def save(self, *args, **kwargs):
        if not self.canonical_id:
            import uuid

            self.canonical_id = f'vp_{uuid.uuid4().hex[:12]}'
        super().save(*args, **kwargs)


class Offer(TimeStampedModel):
    """
    Confirmed Offer: Direct first-party commercial proposition from a verified merchant.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, help_text="e.g. ofr_01")
    vendor_product = models.ForeignKey(
        VendorProduct, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='offers', help_text='Stable listing this price-state record belongs to',
    )
    variant = models.ForeignKey('catalog.MasterProduct', on_delete=models.CASCADE, related_name='offers')
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.CASCADE, related_name='offers')
    destination_type = models.CharField(
        max_length=40,
        choices=DestinationTypeChoices.choices,
        default=DestinationTypeChoices.MERCHANT_WHATSAPP,
        db_index=True
    )
    destination_url = models.URLField(blank=True, null=True)
    stall_ref = models.CharField(max_length=150, blank=True, null=True)

    price_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, db_index=True)
    currency = models.CharField(max_length=3, choices=CurrencyChoices.choices, default=CurrencyChoices.ZAR)
    price_source_timestamp = models.DateTimeField(auto_now_add=True)

    availability_state = models.CharField(
        max_length=30,
        choices=AvailabilityStateChoices.choices,
        default=AvailabilityStateChoices.FRESH,
        db_index=True
    )
    sla_class = models.CharField(
        max_length=30,
        choices=SlaClassChoices.choices,
        default=SlaClassChoices.RETAIL_72H
    )
    last_confirmed_at = models.DateTimeField(default=timezone.now, help_text="Moves only on an actual merchant confirmation")
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['price_amount', '-last_confirmed_at']
        verbose_name = 'Confirmed Offer'
        verbose_name_plural = 'Confirmed Offers'

    def __str__(self):
        return f"{self.variant.title} @ {self.merchant.name} - R{self.price_amount}"

    def save(self, *args, **kwargs):
        if self.vendor_product_id is None and self.variant_id and self.merchant_id:
            # Every confirmed offer implies a vendor listing; resolve or create it
            # so price-state rows always hang off the stable listing.
            self.vendor_product, _ = VendorProduct.objects.get_or_create(
                merchant=self.merchant,
                master_product=self.variant,
                condition=self.variant.condition_type or ConditionChoices.NEW,
                unit_descriptor='',
                defaults={
                    'match_source': VendorProduct.MatchSourceChoices.MANUAL,
                    'vendor_sku': '',
                },
            )
        stored = (
            Offer.objects.filter(pk=self.pk).values_list('pk', 'price_amount').first()
            if self.pk else None
        )
        is_new_offer = stored is None
        previous_price = stored[1] if stored else None
        if not self.expires_at:
            self.expires_at = timezone.now() + SLA_VALIDITY.get(self.sla_class, DEFAULT_SLA)
        super().save(*args, **kwargs)
        price_changed = self.price_amount is not None and (
            is_new_offer or previous_price != self.price_amount
        )
        if price_changed:
            self.observations.create(
                price_amount=self.price_amount,
                currency=self.currency,
                source=PriceObservation.SourceChoices.CREATE if is_new_offer else PriceObservation.SourceChoices.CHANGE,
            )

    def confirm(self):
        """Refresh the confirmation clock and roll the SLA expiry forward."""
        self.last_confirmed_at = timezone.now()
        self.expires_at = self.last_confirmed_at + SLA_VALIDITY.get(self.sla_class, DEFAULT_SLA)
        self.save(update_fields=['last_confirmed_at', 'expires_at', 'updated_at'])

    @property
    def is_expired(self) -> bool:
        return bool(self.expires_at and self.expires_at < timezone.now())

    @property
    def schema_availability(self) -> str:
        return SCHEMA_AVAILABILITY.get(self.availability_state, 'https://schema.org/OutOfStock')

    @property
    def feed_availability(self) -> str:
        return FEED_AVAILABILITY.get(self.availability_state, 'out_of_stock')

    @property
    def confirmed_age_hours(self):
        if not self.last_confirmed_at:
            return None
        return round((timezone.now() - self.last_confirmed_at).total_seconds() / 3600, 1)

    def price_range(self, days: int = 30):
        """Observed low/high from recorded history — never extrapolated."""
        since = timezone.now() - timezone.timedelta(days=days)
        values = list(self.observations.filter(recorded_at__gte=since).values_list('price_amount', flat=True))
        if not values:
            return None
        return {
            'low': min(values),
            'high': max(values),
            'observations': len(values),
            'days': days,
            'meaningful': len(values) >= 2,
        }


class PriceObservation(TimeStampedModel):
    """Append-only price history so 30-day ranges are measured, not modelled."""

    class SourceChoices(models.TextChoices):
        CREATE = 'create', 'Offer Created'
        CHANGE = 'change', 'Merchant Price Change'
        SWEEP = 'sweep', 'Automated Re-sweep'

    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='observations')
    price_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='ZAR')
    source = models.CharField(max_length=20, choices=SourceChoices.choices, default=SourceChoices.CHANGE)
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-recorded_at']
        indexes = [models.Index(fields=['offer', '-recorded_at'])]
        verbose_name = 'Price Observation'
        verbose_name_plural = 'Price Observations'

    def __str__(self):
        return f"{self.offer_id} @ {self.price_amount} {self.currency}"


class DiscoveredOffer(TimeStampedModel):
    """
    Discovered Offer: Public commercial proposition swept from external web, catalogs,
    and open distributor feeds awaiting direct merchant confirmation.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True)
    master_product = models.ForeignKey('catalog.MasterProduct', on_delete=models.CASCADE, related_name='discovered_offers')
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.SET_NULL, null=True, blank=True, related_name='discovered_offers')
    vendor_product = models.ForeignKey(
        VendorProduct, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='discovered_offers', help_text='Listing this sweep resolved to (if any)',
    )
    merchant_name = models.CharField(max_length=255)
    source_website = models.CharField(max_length=255)
    source_url = models.URLField()

    discovered_price_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    raw_price_text = models.CharField(max_length=100, blank=True, null=True)
    currency = models.CharField(max_length=3, default='ZAR')
    availability_text = models.CharField(max_length=100, blank=True, null=True)

    discovery_source = models.CharField(max_length=50, default='retailer_web_sweep')
    confidence_score = models.FloatField(default=0.85)
    location_hint = models.CharField(max_length=255, blank=True, null=True)
    sku = models.CharField(max_length=100, blank=True, null=True)
    observed_at = models.DateTimeField(default=timezone.now)
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['discovered_price_amount']
        verbose_name = 'Discovered Web Offer'
        verbose_name_plural = 'Discovered Web Offers'

    def __str__(self):
        return f"{self.master_product.title} on {self.source_website} (R{self.discovered_price_amount})"

    @property
    def is_stale(self) -> bool:
        return (timezone.now() - self.observed_at).days > 7


class Promotion(TimeStampedModel):
    """
    Merchant-created product promotion (the Merchant Center 'promotions' surface).
    Active promotions emit g:promotion_id in the merchant feed and badge on the
    product page and dashboard.
    """

    class StateChoices(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ENDED = 'ended', 'Ended'

    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, help_text="e.g. prom_a1b2c3d4e5f6")
    vendor_product = models.ForeignKey(
        VendorProduct, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='promotions', help_text='Listing this promotion applies to',
    )
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.CASCADE, related_name='promotions')
    variant = models.ForeignKey('catalog.MasterProduct', on_delete=models.CASCADE, related_name='promotions')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    percent_off = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="e.g. 10.00 for 10% off")
    price_off = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Flat ZAR discount amount")
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    state = models.CharField(max_length=20, choices=StateChoices.choices, default=StateChoices.ACTIVE, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Promotion'
        verbose_name_plural = 'Promotions'

    def __str__(self):
        return f"{self.title} ({self.merchant.name})"

    def save(self, *args, **kwargs):
        if self.vendor_product_id is None and self.variant_id and self.merchant_id:
            self.vendor_product, _ = VendorProduct.objects.get_or_create(
                merchant=self.merchant,
                master_product=self.variant,
                condition=self.variant.condition_type or ConditionChoices.NEW,
                unit_descriptor='',
                defaults={'match_source': VendorProduct.MatchSourceChoices.MANUAL, 'vendor_sku': ''},
            )
        super().save(*args, **kwargs)

    @property
    def promo_id(self) -> str:
        """Google Merchant Center promotion id (g:promotion_id)."""
        return f'sp_{self.canonical_id}'

    @property
    def discount_label(self) -> str:
        if self.percent_off:
            return f"{self.percent_off:.0f}% off"
        if self.price_off:
            return f"R {self.price_off:,.0f} off"
        return self.title


class UrlHealthStateChoices(models.TextChoices):
    UNKNOWN = 'unknown', 'Never Checked'
    HEALTHY = 'healthy', 'Healthy'
    FAILED = 'failed', 'Check Failed'
    OFF_DOMAIN = 'off_domain', 'Resolves Off Domain'


class UrlHealthRecord(TimeStampedModel):
    """
    Merchant-Center-grade crawl ledger: one row per tracked product URL.

    The periodic crawler (and impression-triggered refreshes) re-fetch each
    URL, capture an EvidenceArtifact, and update this row — live title, price,
    availability, resolved URL, domain match and drift against the previous
    observation. Databases the merchant dashboard's catalog-health tab and the
    admin portal's crawl queues.
    """

    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, blank=True)
    merchant = models.ForeignKey(
        'merchants.Merchant', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='url_health_records',
    )
    master_product = models.ForeignKey(
        'catalog.MasterProduct', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='url_health_records',
    )
    offer = models.ForeignKey(
        Offer, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='url_health_records',
    )
    discovered_offer = models.ForeignKey(
        DiscoveredOffer, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='url_health_records',
    )

    url = models.URLField(unique=True, db_index=True)
    final_url = models.URLField(blank=True, default='', help_text='URL after redirect resolution')
    expected_hostname = models.CharField(max_length=255, blank=True, default='')
    last_image_url = models.URLField(blank=True, default='')

    state = models.CharField(
        max_length=20, choices=UrlHealthStateChoices.choices,
        default=UrlHealthStateChoices.UNKNOWN, db_index=True,
    )
    checks_count = models.PositiveIntegerField(default=0)
    last_crawled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_http_status = models.PositiveIntegerField(null=True, blank=True)

    last_title = models.CharField(max_length=300, blank=True, default='')
    last_price_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    previous_price_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_drift_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    last_availability_text = models.CharField(max_length=100, blank=True, default='')
    error_text = models.TextField(blank=True, default='')

    refresh_requested_at = models.DateTimeField(null=True, blank=True, db_index=True,
                                               help_text='Set by impressions; drained by the next crawl')
    refresh_count = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=30, default='web_sweep', db_index=True)

    class Meta:
        ordering = ['-last_crawled_at']
        verbose_name = 'URL Health Record'
        verbose_name_plural = 'URL Health Records'

    def __str__(self):
        return f'{self.url[:60]} [{self.get_state_display()}]'

    def save(self, *args, **kwargs):
        if not self.canonical_id:
            import uuid

            self.canonical_id = f'uhr_{uuid.uuid4().hex[:12]}'
        super().save(*args, **kwargs)

    @property
    def effective_state(self) -> str:
        """Display state: healthy-but-old surfaces as stale."""
        if self.state == UrlHealthStateChoices.HEALTHY and self.last_success_at:
            age = timezone.now() - self.last_success_at
            if age > timezone.timedelta(days=7):
                return 'stale'
        return self.state


class UrlImpression(models.Model):
    """Append-only ledger: a tracked URL was shown to a user (search/product/feed).

    Writes are deduplicated per URL per hour so bot traffic cannot flood the
    table; the impression also requests a refresh of the URL health record.
    """

    url = models.URLField(db_index=True)
    product = models.ForeignKey(
        'catalog.MasterProduct', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='url_impressions',
    )
    merchant = models.ForeignKey(
        'merchants.Merchant', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='url_impressions',
    )
    source = models.CharField(max_length=30, default='search')
    seen_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-seen_at']
        verbose_name = 'URL Impression'
        verbose_name_plural = 'URL Impressions'

    def __str__(self):
        return f'{self.url[:60]} @ {self.seen_at:%Y-%m-%d %H:%M}'


class CrawlRun(TimeStampedModel):
    """One bounded crawler execution (periodic, discovery or manual)."""

    class TriggerChoices(models.TextChoices):
        PERIODIC = 'periodic', 'Periodic Rotation'
        IMPRESSION = 'impression', 'Impression-Driven'
        MANUAL = 'manual', 'Manual / Dashboard'
        DISCOVERY = 'discovery', 'Discovery Pass'

    run_id = models.CharField(max_length=120, unique=True, db_index=True)
    trigger = models.CharField(max_length=20, choices=TriggerChoices.choices, default=TriggerChoices.PERIODIC)
    merchant = models.ForeignKey(
        'merchants.Merchant', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='crawl_runs',
    )
    status = models.CharField(max_length=20, default='running')  # running | completed | failed
    urls_attempted = models.PositiveIntegerField(default=0)
    urls_ok = models.PositiveIntegerField(default=0)
    urls_failed = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Crawl Run'
        verbose_name_plural = 'Crawl Runs'

    def __str__(self):
        return f'Run {self.run_id[:12]} ({self.get_trigger_display()}) — {self.urls_ok}/{self.urls_attempted} ok'

    def save(self, *args, **kwargs):
        if not self.run_id:
            import uuid

            self.run_id = f'crawl_{uuid.uuid4().hex[:12]}'
        super().save(*args, **kwargs)


class PriceAlert(TimeStampedModel):
    """
    Real price-drop subscription: watch a product, get flagged when the best
    merchant-confirmed price falls below the threshold. A daily sweep command
    (check_price_alerts) marks triggered alerts for delivery.
    """

    class ChannelChoices(models.TextChoices):
        WHATSAPP = 'whatsapp', 'WhatsApp'
        EMAIL = 'email', 'Email'

    product = models.ForeignKey('catalog.MasterProduct', on_delete=models.CASCADE, related_name='price_alerts')
    channel = models.CharField(max_length=20, choices=ChannelChoices.choices, default=ChannelChoices.WHATSAPP)
    contact = models.CharField(max_length=255, help_text='WhatsApp number or email address')
    threshold_price = models.DecimalField(max_digits=12, decimal_places=2)
    active = models.BooleanField(default=True)
    triggered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Price Alert'
        verbose_name_plural = 'Price Alerts'

    def __str__(self):
        return f"{self.product.title[:40]} < R{self.threshold_price} ({self.get_channel_display()}:{self.contact})"
