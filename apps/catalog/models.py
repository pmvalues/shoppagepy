from django.db import models
from apps.core.models import TimeStampedModel

class ProductStatusChoices(models.TextChoices):
    DRAFT = 'draft', 'Draft Variant'
    ACTIVE = 'active', 'Active in Master Catalogue'
    REFERENCE_ONLY = 'reference_only', 'Reference Only (No Local Stock Claim)'

class MasterProduct(TimeStampedModel):
    """
    Canonical Master Product Graph entity. Standardized across GS1 GTIN barcodes,
    multilingual aliases, manufacturer specs, SABS/NRS compliance certifications,
    and verified reviews.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True, help_text="e.g. var_deye_5kw_hybrid")
    family_ref = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    category_ref = models.CharField(max_length=100, db_index=True, help_text="e.g. solar_energy, smartphones, hardware")
    title = models.CharField(max_length=255, db_index=True)
    brand = models.CharField(max_length=150, db_index=True)
    model_number = models.CharField(max_length=150, blank=True, null=True)
    
    # Identifiers
    gtin13 = models.CharField(max_length=14, blank=True, null=True, db_index=True, help_text="GS1 EAN-13 Checksum Barcode")
    gtin14 = models.CharField(max_length=15, blank=True, null=True)
    mpn = models.CharField(max_length=100, blank=True, null=True, help_text="Manufacturer Part Number")
    asin = models.CharField(max_length=50, blank=True, null=True)
    
    status = models.CharField(max_length=30, choices=ProductStatusChoices.choices, default=ProductStatusChoices.ACTIVE, db_index=True)
    
    # Technical specs JSON-B
    attributes = models.JSONField(default=dict, blank=True, help_text="Structured technical specifications")
    
    # Multilingual search aliases (Zulu, Xhosa, Afrikaans, Shona, Swahili, etc.)
    aliases = models.JSONField(default=list, blank=True, help_text="List of {phrase, locale, confidence}")
    
    # Certification & Compliance
    compliance = models.JSONField(default=dict, blank=True, help_text="SABS, NRS 097-2-1, ICASA, warrantyYears")
    
    # Verified Reviews & Guides
    reviews_summary = models.JSONField(default=dict, blank=True, help_text="Rating distribution, pros, cons, buyer reviews")
    guides = models.JSONField(default=dict, blank=True, help_text="Troubleshooting, CoC advice, FAQs")
    media_items = models.JSONField(default=dict, blank=True, help_text="Gallery, videos, PDF datasheets")

    compatibility_edge_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['brand', 'title']
        verbose_name = 'Master Product'
        verbose_name_plural = 'Master Products'

    def __str__(self):
        return f"{self.brand} — {self.title}"

    @property
    def estimated_price_zar(self):
        return self.attributes.get('estimatedPriceZar', 0) if isinstance(self.attributes, dict) else 0

# Backward compatible alias
ProductVariant = MasterProduct
