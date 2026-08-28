from apps.core.hours import has_structured_hours, open_status, resolve_timezone, schedule_label
from apps.core.models import TimeStampedModel
from django.db import models


class MarketTypeChoices(models.TextChoices):
    FORMAL_MEGA_MALL = 'formal_mega_mall', 'Formal Mega-Mall'
    SHOPPING_CENTRE = 'shopping_centre', 'Shopping Centre'
    STRIP_MALL = 'strip_mall', 'Strip Mall / Retail Park'
    WHOLESALE_MARKET = 'wholesale_market', 'Wholesale / B2B Trade Market'
    INFORMAL_TRANSPORT_RANK = 'informal_transport_rank', 'Informal Transport / Taxi Rank Hub'
    TOWNSHIP_COMMERCIAL_CLUSTER = 'township_commercial_cluster', 'Township Commercial Cluster'
    FLEA_MARKET = 'flea_market', 'Flea / Street Market'
    STREET_CORRIDOR = 'street_corridor', 'Commercial Street Corridor'
    VIRTUAL_MARKETPLACE = 'virtual_marketplace', 'Virtual Marketplace'
    VIRTUAL_B2B_NETWORK = 'virtual_b2b_network', 'Virtual B2B Network'

class MarketVerificationChoices(models.TextChoices):
    UNVERIFIED = 'unverified', 'Unverified Discovery Scaffolding'
    CLAIMED = 'claimed', 'Claimed by Operator'
    EVIDENCE_VERIFIED = 'evidence_verified', 'Field / Cadastral Verified'

class Market(TimeStampedModel):
    """
    Spatial & Commercial Digital Twins for Malls, Wholesale Hubs, Taxi Ranks, and Markets.
    Supports strict recursive containment (Markets-in-Markets e.g. Dragon City -> Building 2).
    """
    name = models.CharField(max_length=255, db_index=True)
    canonical_slug = models.SlugField(max_length=255, unique=True, db_index=True)
    market_type = models.CharField(max_length=50, choices=MarketTypeChoices.choices, default=MarketTypeChoices.SHOPPING_CENTRE, db_index=True)
    country = models.CharField(max_length=2, default='ZA', db_index=True)
    province = models.CharField(max_length=100, db_index=True, help_text="e.g. Gauteng, Western Cape, KwaZulu-Natal")
    metro = models.CharField(max_length=100, db_index=True, help_text="e.g. City of Johannesburg, City of Cape Town, eThekwini")

    parent_market = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_markets',
        help_text="Enclosing parent market (Strict Markets-in-Markets containment)"
    )

    verification_state = models.CharField(
        max_length=30,
        choices=MarketVerificationChoices.choices,
        default=MarketVerificationChoices.UNVERIFIED,
        db_index=True
    )

    street_address = models.TextField(blank=True, null=True)
    locality = models.CharField(max_length=100, blank=True, null=True, db_index=True, help_text="Town or suburb, e.g. Sandton")
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    google_maps_url = models.URLField(blank=True, null=True)
    google_place_id = models.CharField(max_length=255, blank=True, null=True)

    stall_capacity = models.IntegerField(default=50)
    active_merchants_count = models.IntegerField(default=0)
    operating_hours = models.CharField(max_length=255, blank=True, null=True, help_text="Human-readable hours summary")
    opening_hours = models.JSONField(default=dict, blank=True, help_text='{"mon": {"open": "09:00", "close": "18:00"}, ...}')
    timezone = models.CharField(max_length=64, blank=True, null=True, help_text="IANA zone, e.g. Africa/Johannesburg")
    image_url = models.URLField(blank=True, null=True, help_text="Hero/exteriors image used for structured data and social cards")
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.CharField(max_length=320, blank=True)

    landmarks = models.JSONField(default=list, blank=True, help_text="List of prominent nearby landmarks")
    safety_notices = models.JSONField(default=list, blank=True, help_text="Security and visitor guidelines")

    class Meta:
        ordering = ['province', 'name']
        verbose_name = 'Market / Shopping Centre'
        verbose_name_plural = 'Markets & Shopping Centres'

    def __str__(self):
        return f"{self.name} ({self.province}, {self.country})"

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
    def public_image_url(self) -> str | None:
        return self.image_url or None
