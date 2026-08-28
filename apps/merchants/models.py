from apps.core.hours import has_structured_hours, open_status, resolve_timezone, schedule_label
from apps.core.models import TimeStampedModel
from django.conf import settings
from django.db import models
from django.utils import timezone


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
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='owned_merchants',
        help_text="Authenticated user who manages this merchant record",
    )
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
    locality = models.CharField(max_length=100, blank=True, null=True, db_index=True, help_text="City or town, e.g. Johannesburg")
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    google_place_id = models.CharField(max_length=255, blank=True, null=True)
    google_rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    google_reviews_count = models.IntegerField(default=0)
    google_reviews_url = models.URLField(blank=True, null=True)
    google_maps_url = models.URLField(blank=True, null=True)
    operating_hours = models.CharField(max_length=255, blank=True, null=True)
    opening_hours = models.JSONField(default=dict, blank=True, null=True, help_text='{"mon": {"open": "08:30", "close": "17:30"}, ...}')
    special_hours = models.JSONField(default=dict, blank=True, null=True, help_text='{"2026-12-25": {"closed": true}, "2026-12-26": {"open": "09:00", "close": "13:00"}}')
    timezone = models.CharField(max_length=64, blank=True, null=True, help_text="IANA zone, e.g. Africa/Johannesburg")
    profile_categories = models.JSONField(default=list, blank=True, null=True, help_text="Primary category first, then secondary categories")
    appointment_url = models.URLField(blank=True, null=True)
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.CharField(max_length=320, blank=True, null=True)

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

    # Merchant Center syndication (per-merchant feed overrides)
    shipping_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Standard shipping price in ZAR (feed g:shipping)")
    shipping_service = models.CharField(max_length=80, blank=True, default='', help_text="Shipping service name, e.g. Standard Courier")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Tax rate percentage, e.g. 15.00 (feed g:tax)")

    # Rich JSON attributes
    delivery_options = models.JSONField(default=list, blank=True)
    payment_methods = models.JSONField(default=list, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    languages_spoken = models.JSONField(default=list, blank=True)

    # Trust Score
    trust_score = models.IntegerField(default=80, db_index=True, help_text="0 to 100 calculated trust metric")

    class Meta:
        ordering = ['id']
        verbose_name = 'Merchant'
        verbose_name_plural = 'Merchants'

    def __str__(self):
        return f"{self.name} ({self.country}) - {self.get_verification_state_display()}"

    @property
    def resolved_timezone(self) -> str:
        return resolve_timezone(self.timezone, self.country)

    @property
    def has_confirmed_hours(self) -> bool:
        return has_structured_hours(self.opening_hours)

    @property
    def open_now(self):
        """Live status dict, or None when hours were never confirmed."""
        return open_status(self.opening_hours, self.resolved_timezone)

    @property
    def hours_label(self) -> str:
        return schedule_label(self.opening_hours) or (self.operating_hours or '').strip()

    @property
    def primary_category(self) -> str:
        if self.profile_categories:
            return str(self.profile_categories[0])
        return (self.category or '').replace('_', ' ').strip().title()

    @property
    def public_image_url(self) -> str | None:
        return self.storefront_photo_url or None

    @property
    def rating_count(self) -> int:
        return self.google_reviews_count or 0

    @property
    def is_claimed(self) -> bool:
        return self.claim_state == ClaimStateChoices.CLAIMED

    @property
    def measured_response_minutes(self):
        """Reply speed is attributable only after the operator claims the profile."""
        return self.median_response_minutes if self.is_claimed else None

    @property
    def reported_years_in_business(self):
        return self.years_in_business if self.is_claimed else None

    @property
    def is_syndication_eligible(self) -> bool:
        """Catalogue syndication requires an opted-in (claimed) profile."""
        return self.is_claimed and self.verification_state != VerificationStateChoices.UNVERIFIED


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


class MerchantReview(TimeStampedModel):
    """GMB-style customer reviews with owner replies (pending moderation)."""

    class StateChoices(models.TextChoices):
        PENDING = 'pending', 'Pending moderation'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='reviews')
    author_name = models.CharField(max_length=150)
    rating = models.PositiveSmallIntegerField(choices=[(i, f'{i} star') for i in range(1, 6)])
    comment = models.TextField()
    state = models.CharField(max_length=20, choices=StateChoices.choices, default=StateChoices.PENDING, db_index=True)
    reply_text = models.TextField(blank=True, default='')
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant Review'
        verbose_name_plural = 'Merchant Reviews'

    def __str__(self):
        return f'{self.author_name} ★{self.rating} — {self.merchant.name}'


class MerchantQuestion(TimeStampedModel):
    """GMB-style Q&A: public questions, owner answers (pending moderation)."""

    class StateChoices(models.TextChoices):
        PENDING = 'pending', 'Pending moderation'
        APPROVED = 'approved', 'Approved'

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='questions')
    asker_name = models.CharField(max_length=120)
    question = models.TextField()
    answer = models.TextField(blank=True, default='')
    answered_at = models.DateTimeField(null=True, blank=True)
    state = models.CharField(max_length=20, choices=StateChoices.choices, default=StateChoices.PENDING, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant Question'
        verbose_name_plural = 'Merchant Questions'

    def __str__(self):
        return f'{self.asker_name} → {self.merchant.name}'


class MerchantPhoto(TimeStampedModel):
    """GMB-style photo contributions (URL-based; pending moderation)."""

    class StateChoices(models.TextChoices):
        PENDING = 'pending', 'Pending moderation'
        APPROVED = 'approved', 'Approved'

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='photos')
    image_url = models.URLField()
    caption = models.CharField(max_length=200, blank=True, default='')
    state = models.CharField(max_length=20, choices=StateChoices.choices, default=StateChoices.PENDING, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant Photo'
        verbose_name_plural = 'Merchant Photos'

    def __str__(self):
        return f'{self.merchant.name}: {self.image_url[:60]}'


class MerchantPost(TimeStampedModel):
    """GMB-style updates: text posts or offers published by the store owner."""

    class KindChoices(models.TextChoices):
        TEXT = 'text', 'Update'
        OFFER = 'offer', 'Offer'

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='posts')
    kind = models.CharField(max_length=20, choices=KindChoices.choices, default=KindChoices.TEXT)
    title = models.CharField(max_length=150)
    body = models.TextField()
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Merchant Post'
        verbose_name_plural = 'Merchant Posts'

    def __str__(self):
        return f'{self.merchant.name}: {self.title}'


class Campaign(TimeStampedModel):
    """
    Google-Ads-style campaign owned by a merchant: targeting, budget cap,
    ad creative (headline/description) and UTM-attributed referral reporting.
    Launch links are /l/<offer>?utm_campaign=<canonical> — attribution flows
    into ReferralEvent.source_campaign automatically.
    """

    class TypeChoices(models.TextChoices):
        HYPERLOCAL = 'hyperlocal', 'Hyperlocal Radius'
        SHOPPING_OFFER = 'shopping_offer', 'Shopping Offer'
        BRAND = 'brand', 'Brand Awareness'

    class StatusChoices(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        ACTIVE = 'active', 'Active'
        PAUSED = 'paused', 'Paused'
        ENDED = 'ended', 'Ended'

    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, help_text="e.g. cmp_abc123")
    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='campaigns')
    name = models.CharField(max_length=150)
    campaign_type = models.CharField(max_length=30, choices=TypeChoices.choices, default=TypeChoices.HYPERLOCAL, db_index=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.DRAFT, db_index=True)
    budget_zar = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text='Optional budget cap in ZAR')
    target_province = models.CharField(max_length=100, blank=True, default='', db_index=True)
    radius_km = models.IntegerField(blank=True, null=True, help_text='Optional radius targeting')
    target_category = models.CharField(max_length=100, blank=True, default='')
    headline = models.CharField(max_length=150, blank=True, default='')
    description = models.CharField(max_length=300, blank=True, default='')
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Campaign'
        verbose_name_plural = 'Campaigns'

    def __str__(self):
        return f'{self.name} [{self.get_status_display()}] — {self.merchant.name}'

    @property
    def is_live(self) -> bool:
        now = timezone.now()
        return self.status == self.StatusChoices.ACTIVE and (self.valid_until is None or self.valid_until > now)

    def launch_link(self, offer_canonical_id: str) -> str:
        return f'/l/{offer_canonical_id}?utm_campaign={self.canonical_id}'


class Follow(TimeStampedModel):
    """LinkedIn-style merchant follow (session-keyed, no account required)."""

    merchant = models.ForeignKey(Merchant, on_delete=models.CASCADE, related_name='followers')
    follower_key = models.CharField(max_length=128, db_index=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['merchant', 'follower_key'], name='unique_merchant_follower'),
        ]
        verbose_name = 'Merchant Follow'
        verbose_name_plural = 'Merchant Follows'

    def __str__(self):
        return f'{self.follower_key[:20]} → {self.merchant.name}'
