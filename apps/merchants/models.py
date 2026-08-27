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
