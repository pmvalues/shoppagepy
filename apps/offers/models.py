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


class Offer(TimeStampedModel):
    """
    Confirmed Offer: Direct first-party commercial proposition from a verified merchant.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, help_text="e.g. ofr_01")
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
