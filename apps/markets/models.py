from django.db import models
from apps.core.models import TimeStampedModel

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
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    google_maps_url = models.URLField(blank=True, null=True)
    google_place_id = models.CharField(max_length=255, blank=True, null=True)
    
    stall_capacity = models.IntegerField(default=50)
    active_merchants_count = models.IntegerField(default=0)
    operating_hours = models.CharField(max_length=255, blank=True, null=True)
    
    landmarks = models.JSONField(default=list, blank=True, help_text="List of prominent nearby landmarks")
    safety_notices = models.JSONField(default=list, blank=True, help_text="Security and visitor guidelines")

    class Meta:
        ordering = ['province', 'name']
        verbose_name = 'Market / Shopping Centre'
        verbose_name_plural = 'Markets & Shopping Centres'

    def __str__(self):
        return f"{self.name} ({self.province}, {self.country})"
