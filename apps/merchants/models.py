from django.db import models
from apps.core.models import TimeStampedModel

class CountryChoices(models.TextChoices):
    ZA = 'ZA', 'South Africa (ZA)'
    ZW = 'ZW', 'Zimbabwe (ZW)'
    KE = 'KE', 'Kenya (KE)'
    NG = 'NG', 'Nigeria (NG)'
    GB = 'GB', 'United Kingdom (GB)'
    US = 'US', 'United States (US)'

class ClaimStateChoices(models.TextChoices):
    CANDIDATE = 'candidate', 'Candidate Profile (Preloaded)'
    CLAIMED = 'claimed', 'Claimed by Merchant'
    DISPUTED = 'disputed', 'Disputed Ownership'
    OFFBOARDED = 'offboarded', 'Offboarded / Suspended'

class VerificationStateChoices(models.TextChoices):
    UNVERIFIED = 'unverified', 'Unverified'
    PHONE_VERIFIED = 'phone_verified', 'Phone Verified (OTP)'
    FULLY_VERIFIED = 'fully_verified', 'Fully Verified (Field/Document)'

class Merchant(TimeStampedModel):
    """
    Physical & Digital Merchant Registry representing verified shops, wholesale stalls,
    and enterprise suppliers across South Africa & Southern Africa.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, help_text="Unique canonical ID (e.g. m_01, mkt_01_s01)")
    name = models.CharField(max_length=255, db_index=True, help_text="Public operating trading name")
    country = models.CharField(max_length=2, choices=CountryChoices.choices, default=CountryChoices.ZA, db_index=True)
    claim_state = models.CharField(max_length=30, choices=ClaimStateChoices.choices, default=ClaimStateChoices.CANDIDATE, db_index=True)
    verification_state = models.CharField(max_length=30, choices=VerificationStateChoices.choices, default=VerificationStateChoices.UNVERIFIED, db_index=True)
    
    # Primary Contacts
    whatsapp_number = models.CharField(max_length=40, blank=True, null=True, help_text="WhatsApp format e.g. 27712345678")
    telephone = models.CharField(max_length=40, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website_url = models.URLField(blank=True, null=True)

    # Physical Location & Mall Relationship
    market = models.ForeignKey('markets.Market', on_delete=models.SET_NULL, null=True, blank=True, related_name='merchants')
    stall_identifier = models.CharField(max_length=150, blank=True, null=True, help_text='e.g. "Building 2, Shop B-18" or "Stall 44"')
    category = models.CharField(max_length=100, blank=True, null=True, db_index=True, help_text="solar_energy, smartphones, hardware, groceries, etc.")
    address_text = models.TextField(blank=True, null=True)
    province = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    google_place_id = models.CharField(max_length=255, blank=True, null=True)
    google_rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    google_reviews_count = models.IntegerField(default=0)
    google_reviews_url = models.URLField(blank=True, null=True)
    google_maps_url = models.URLField(blank=True, null=True)
    operating_hours = models.CharField(max_length=255, blank=True, null=True)

    # Statutory & Compliance Identity
    cipc_enterprise_number = models.CharField(max_length=100, blank=True, null=True, help_text="CIPC e.g. K2021/123456/07")
    csd_supplier_number = models.CharField(max_length=100, blank=True, null=True, help_text="National Treasury CSD MAAA...")
    cidb_registration_number = models.CharField(max_length=100, blank=True, null=True)
    cidb_grade = models.CharField(max_length=100, blank=True, null=True)
    wireman_license_number = models.CharField(max_length=100, blank=True, null=True)
    bbbee_level = models.CharField(max_length=150, blank=True, null=True)
    tax_compliance_pin = models.CharField(max_length=100, blank=True, null=True)
    storefront_photo_url = models.URLField(blank=True, null=True)
    years_in_business = models.IntegerField(default=1)
    median_response_minutes = models.IntegerField(default=15)

    # Structured opening hours: {"mon": ["08:00","17:00"], "tue": null, ...}
    operating_hours_json = models.JSONField(default=dict, blank=True, help_text="Per-weekday [open, close] pairs; null/omitted = closed")

    # Rich JSON attributes
    delivery_options = models.JSONField(default=list, blank=True)
    payment_methods = models.JSONField(default=list, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    languages_spoken = models.JSONField(default=list, blank=True)
    
    # Trust Score
    trust_score = models.IntegerField(default=80, db_index=True, help_text="0 to 100 calculated trust metric")

    # Verified Reviews summary (aggregated from catalog.Review)
    reviews_summary = models.JSONField(default=dict, blank=True, help_text="Rating distribution, avg, count")

    class Meta:
        ordering = ['-trust_score', 'name']
        verbose_name = 'Merchant'
        verbose_name_plural = 'Merchants'

    def __str__(self):
        return f"{self.name} ({self.country}) - {self.get_verification_state_display()}"

    def is_open_now(self):
        """Return (is_open, label) for the current Africa/Johannesburg time, or (None, legacy)."""
        import datetime
        try:
            from zoneinfo import ZoneInfo
        except Exception:
            ZoneInfo = None
        hours = self.operating_hours_json
        if not isinstance(hours, dict) or not hours:
            return None, self.operating_hours or ''
        now = datetime.datetime.now(ZoneInfo('Africa/Johannesburg')) if ZoneInfo else datetime.datetime.now()
        day = now.strftime('%a').lower()[:3]  # mon, tue, ...
        pairs = hours.get(day)
        if not pairs:
            return False, 'Closed'
        try:
            open_t = datetime.datetime.strptime(pairs[0], '%H:%M').time()
            close_t = datetime.datetime.strptime(pairs[1], '%H:%M').time()
        except (ValueError, IndexError, TypeError):
            return None, self.operating_hours or ''
        current = now.time()
        if open_t <= current <= close_t:
            return True, f'Open now · Closes {pairs[1]}'
        return False, f'Closed · Opens {pairs[0]}'

    def refresh_reviews_summary(self):
        """Recompute reviews_summary from approved reviews and persist it."""
        from apps.catalog.models import aggregate_reviews
        summary = aggregate_reviews(self.reviews.all())
        self.reviews_summary = summary
        type(self).objects.filter(pk=self.pk).update(reviews_summary=summary)


class TrustPassport(TimeStampedModel):
    """
    Real-time trust metrics ledger for fraud mitigation and priority ranking.
    """
    merchant = models.OneToOneField(Merchant, on_delete=models.CASCADE, related_name='trust_passport')
    score = models.IntegerField(default=85)
    fresh_offers_today_count = models.IntegerField(default=0)
    median_response_minutes = models.IntegerField(default=10)
    complaint_count_last_90d = models.IntegerField(default=0)
    state = models.CharField(
        max_length=30,
        choices=[
            ('VERIFIED_ACTIVE', 'Verified Active'),
            ('FLAGGED', 'Flagged for Review'),
            ('SUSPENDED', 'Suspended'),
        ],
        default='VERIFIED_ACTIVE'
    )

    class Meta:
        verbose_name = 'Trust Passport'
        verbose_name_plural = 'Trust Passports'

    def __str__(self):
        return f"Trust Passport: {self.merchant.name} (Score: {self.score}/100)"


class DraftTypeChoices(models.TextChoices):
    CATALOGUE_ENRICHMENT = 'catalogue_enrichment', 'Catalogue Enrichment'
    ALIAS_EXPANSION = 'alias_expansion', 'Alias Expansion'
    CAMPAIGN_PROPOSAL = 'campaign_proposal', 'Hyperlocal Campaign Proposal'
    REQUEST_RESPONSE = 'request_response', 'Buyer Request Negotiation Response'
    OFFER_CANDIDATE = 'offer_candidate', 'Offer Candidate Draft'
    MEDIA_SCRIPT = 'media_script', 'Media Hub Script'

class ReviewStateChoices(models.TextChoices):
    PENDING = 'pending', 'Pending Merchant Review'
    APPROVED = 'approved', 'Approved & Executed'
    AUTO_APPROVED = 'auto_approved', 'Auto-Approved by Policy'
    REJECTED = 'rejected', 'Rejected by Merchant'
    EXPIRED = 'expired', 'Expired'

class Draft(TimeStampedModel):
    """
    Candidate draft generated by AI intelligence workloads awaiting authoritative promotion (v8.1 Part XI).
    """
    draft_id = models.CharField(max_length=120, unique=True, db_index=True)
    draft_type = models.CharField(max_length=50, choices=DraftTypeChoices.choices, default=DraftTypeChoices.CATALOGUE_ENRICHMENT, db_index=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, null=True, blank=True, related_name='drafts')
    product = models.ForeignKey('catalog.MasterProduct', on_delete=models.SET_NULL, null=True, blank=True, related_name='drafts')
    payload = models.JSONField(default=dict)
    confidence = models.FloatField(default=0.85)
    review_state = models.CharField(max_length=30, choices=ReviewStateChoices.choices, default=ReviewStateChoices.PENDING, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant OS Draft'
        verbose_name_plural = 'Merchant OS Drafts'

    def __str__(self):
        return f"Draft {self.draft_id} [{self.get_draft_type_display()}] - {self.get_review_state_display()}"


class AgentRun(TimeStampedModel):
    """
    Bounded merchant-agent execution run (v8.1 Part XII).
    """
    run_id = models.CharField(max_length=120, unique=True, db_index=True)
    agent_name = models.CharField(max_length=100, db_index=True)
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='agent_runs')
    status = models.CharField(max_length=30, default='completed')
    tokens_consumed = models.IntegerField(default=0)
    tool_calls_count = models.IntegerField(default=0)
    summary = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Agent Run'
        verbose_name_plural = 'Agent Runs'

    def __str__(self):
        return f"{self.agent_name} for {self.merchant.name} ({self.status})"


# ---------------------------------------------------------------------------
# Merchant Centre commerce models (Orders, Promotions, Shipping, Settings)
# Parity scope: Google Merchant Centre + Amazon Seller Central + Shopify Admin
# ---------------------------------------------------------------------------

class OrderStatusChoices(models.TextChoices):
    PENDING_PAYMENT = 'pending_payment', 'Pending Payment'
    PAID = 'paid', 'Paid'
    PROCESSING = 'processing', 'Processing'
    FULFILLED = 'fulfilled', 'Fulfilled'
    SHIPPED = 'shipped', 'Shipped'
    DELIVERED = 'delivered', 'Delivered'
    CANCELLED = 'cancelled', 'Cancelled'
    REFUNDED = 'refunded', 'Refunded'


class Order(TimeStampedModel):
    """
    Buyer order placed against a merchant (Amazon Seller Central / Shopify Admin parity).
    Line items are snapshotted so price/title survive later offer edits.
    """
    reference = models.CharField(max_length=120, unique=True, db_index=True, help_text="Human-friendly order ref e.g. ORD-2026-0001")
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='orders')
    buyer_name = models.CharField(max_length=255)
    buyer_contact = models.CharField(max_length=80, blank=True, null=True, help_text="WhatsApp / phone")
    buyer_email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=30, choices=OrderStatusChoices.choices, default=OrderStatusChoices.PENDING_PAYMENT, db_index=True)
    currency = models.CharField(max_length=3, default='ZAR')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_method = models.CharField(max_length=80, blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    placed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant Order'
        verbose_name_plural = 'Merchant Orders'

    def __str__(self):
        return f"{self.reference} · {self.buyer_name} · {self.get_status_display()}"

    def recalc(self):
        """Recompute subtotal/total from line items and persist."""
        subtotal = sum((it.line_total or 0) for it in self.items.all())
        self.subtotal = subtotal
        self.total = subtotal + (self.shipping_fee or 0)
        type(self).objects.filter(pk=self.pk).update(subtotal=self.subtotal, total=self.total)


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    offer = models.ForeignKey('offers.Offer', on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    title = models.CharField(max_length=255)
    sku = models.CharField(max_length=120, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']
        verbose_name = 'Order Line Item'
        verbose_name_plural = 'Order Line Items'

    def __str__(self):
        return f"{self.quantity} × {self.title} ({self.order.reference})"

    def save(self, *args, **kwargs):
        self.line_total = (self.unit_price or 0) * (self.quantity or 1)
        super().save(*args, **kwargs)


class PromotionTypeChoices(models.TextChoices):
    PERCENTAGE = 'percentage', 'Percentage Discount'
    FIXED_AMOUNT = 'fixed_amount', 'Fixed Amount Off'
    FREE_SHIPPING = 'free_shipping', 'Free Shipping'
    BUNDLE = 'bundle', 'Bundle / Buy X Get Y'


class PromotionScopeChoices(models.TextChoices):
    STOREWIDE = 'storewide', 'Storewide'
    CATEGORY = 'category', 'Specific Category'
    OFFER = 'offer', 'Specific Product / Offer'


class Promotion(TimeStampedModel):
    """
    Merchant promotion / coupon (GMC Promotions + Amazon Seller Central + Shopify parity).
    """
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='promotions')
    title = models.CharField(max_length=255)
    promo_type = models.CharField(max_length=30, choices=PromotionTypeChoices.choices, default=PromotionTypeChoices.PERCENTAGE)
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Percent (0-100) or fixed ZAR amount")
    code = models.CharField(max_length=60, blank=True, null=True, db_index=True, help_text="Optional coupon code")
    scope = models.CharField(max_length=30, choices=PromotionScopeChoices.choices, default=PromotionScopeChoices.STOREWIDE)
    target_ref = models.CharField(max_length=160, blank=True, null=True, help_text="Category slug or offer canonical_id when scoped")
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True, db_index=True)
    usage_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant Promotion'
        verbose_name_plural = 'Merchant Promotions'

    def __str__(self):
        return f"{self.title} ({self.get_promo_type_display()})"

    def is_live(self):
        import datetime
        if not self.active:
            return False
        now = datetime.datetime.now(datetime.timezone.utc)
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at < now:
            return False
        return True


class ShippingRate(TimeStampedModel):
    """
    Structured shipping method / rate (GMC shipping settings + Shopify parity).
    """
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='shipping_rates')
    method = models.CharField(max_length=120, help_text="e.g. Standard Courier, Collection, Same-Day")
    zone = models.CharField(max_length=120, blank=True, null=True, help_text="Region/city or 'national'")
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    free_above = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Free shipping threshold")
    eta_days = models.PositiveIntegerField(default=3, help_text="Estimated delivery days")
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['rate']
        verbose_name = 'Shipping Rate'
        verbose_name_plural = 'Shipping Rates'

    def __str__(self):
        return f"{self.method} · {self.zone or 'national'} · R{self.rate}"


class MerchantCentreSettings(TimeStampedModel):
    """
    Storefront / Merchant Centre profile settings (GMC business info + Shopify parity).
    """
    merchant = models.OneToOneField(Merchant, on_delete=models.CASCADE, related_name='centre_settings')
    about_text = models.TextField(blank=True, null=True)
    return_policy = models.TextField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)
    social_links = models.JSONField(default=list, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="VAT % e.g. 15.00")
    low_stock_threshold = models.PositiveIntegerField(default=5)

    class Meta:
        verbose_name = 'Merchant Centre Settings'
        verbose_name_plural = 'Merchant Centre Settings'

    def __str__(self):
        return f"Centre Settings · {self.merchant.name}"


def diagnose_offer_feed_status(offer):
    """
    GMC-style product feed diagnostics for a single Offer.

    Returns a dict: {
        'status': 'approved' | 'limited' | 'disapproved' | 'pending',
        'issues': [{'severity': 'error'|'warning', 'code': str, 'message': str}, ...]
    }
    """
    from apps.offers.models import AvailabilityStateChoices
    issues = []
    status = 'approved'

    if offer.availability_state in (AvailabilityStateChoices.HIDDEN, AvailabilityStateChoices.EXPIRED):
        issues.append({
            'severity': 'error',
            'code': 'not_eligible',
            'message': f"Offer is {offer.get_availability_state_display().lower()} and cannot serve in the feed.",
        })
        return {'status': 'disapproved', 'issues': issues}

    if offer.price_amount is None:
        issues.append({
            'severity': 'error',
            'code': 'missing_price',
            'message': "Missing price — offers without a price are disapproved in the product feed.",
        })
        status = 'disapproved'

    if offer.availability_state == AvailabilityStateChoices.OUT_OF_STOCK:
        issues.append({
            'severity': 'warning',
            'code': 'out_of_stock',
            'message': "Out of stock — eligible but will not serve until restocked.",
        })
        if status != 'disapproved':
            status = 'limited'

    if offer.availability_state == AvailabilityStateChoices.QUOTE_REQUIRED:
        issues.append({
            'severity': 'warning',
            'code': 'quote_required',
            'message': "Quote required — pending merchant pricing before it can serve.",
        })
        if status != 'disapproved':
            status = 'pending'

    if offer.availability_state == AvailabilityStateChoices.CONFIRM_REQUIRED:
        issues.append({
            'severity': 'warning',
            'code': 'confirm_required',
            'message': "Confirmation required — serving on provisional price; confirm to avoid limited status.",
        })
        if status not in ('disapproved', 'pending'):
            status = 'limited'

    variant = getattr(offer, 'variant', None)
    if variant is not None:
        image = getattr(variant, 'image_url', None)
        if not image:
            issues.append({
                'severity': 'warning',
                'code': 'missing_image',
                'message': "Missing product image — limited eligibility in shopping surfaces.",
            })
            if status not in ('disapproved', 'pending'):
                status = 'limited'
        gcat = getattr(variant, 'google_category_id', None)
        if not gcat:
            issues.append({
                'severity': 'warning',
                'code': 'missing_google_category',
                'message': "Missing Google product category — limited eligibility in shopping surfaces.",
            })
            if status not in ('disapproved', 'pending'):
                status = 'limited'

    return {'status': status, 'issues': issues}
