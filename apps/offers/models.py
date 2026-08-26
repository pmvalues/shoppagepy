from django.db import models
from apps.core.models import TimeStampedModel

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
    last_confirmed_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['price_amount', '-last_confirmed_at']
        verbose_name = 'Confirmed Offer'
        verbose_name_plural = 'Confirmed Offers'

    def __str__(self):
        return f"{self.variant.title} @ {self.merchant.name} - R{self.price_amount}"


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
    availability_text = models.CharField(max_length=100, default='In Stock')
    
    discovery_source = models.CharField(max_length=50, default='retailer_web_sweep')
    confidence_score = models.FloatField(default=0.85)
    location_hint = models.CharField(max_length=255, blank=True, null=True)
    sku = models.CharField(max_length=100, blank=True, null=True)
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['discovered_price_amount']
        verbose_name = 'Discovered Web Offer'
        verbose_name_plural = 'Discovered Web Offers'

    def __str__(self):
        return f"{self.master_product.title} on {self.source_website} (R{self.discovered_price_amount})"
