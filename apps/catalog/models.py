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

    # Imagery & Google taxonomy mapping
    image_url = models.URLField(blank=True, null=True, help_text="Primary product image (served as g:image_link in feeds)")
    google_category_id = models.IntegerField(null=True, blank=True, db_index=True, help_text="Override of Google product category id (else resolved from category_ref)")

    compatibility_edge_count = models.IntegerField(default=0)

    def google_category(self):
        """Return (id, name, full_path) for the Google product category, or None."""
        from .taxonomy import resolve_google_category
        return resolve_google_category(self.category_ref, self.google_category_id)

    def refresh_reviews_summary(self):
        """Recompute reviews_summary from approved reviews and persist it."""
        summary = aggregate_reviews(self.reviews.all())
        self.reviews_summary = summary
        type(self).objects.filter(pk=self.pk).update(reviews_summary=summary)

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


class CategoryMapping(models.Model):
    """Admin-editable override mapping a Shoppage category_ref to a Google category id."""
    category_ref = models.CharField(max_length=100, unique=True, db_index=True)
    google_category_id = models.IntegerField(db_index=True)
    is_custom = models.BooleanField(default=False, help_text="True when set by an admin rather than the seed default")

    class Meta:
        verbose_name = 'Category Mapping'
        verbose_name_plural = 'Category Mappings'

    def __str__(self):
        return f"{self.category_ref} -> Google #{self.google_category_id}"


class ReviewModerationChoices(models.TextChoices):
    PENDING = 'pending', 'Pending Moderation'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'


class Review(models.Model):
    """First-class review for a product or a merchant (exactly one must be set)."""
    product = models.ForeignKey(MasterProduct, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    author_name = models.CharField(max_length=120, blank=True, default='Verified Buyer')
    rating = models.PositiveSmallIntegerField(help_text="1-5 stars")
    title = models.CharField(max_length=200, blank=True, default='')
    body = models.TextField(blank=True, default='')
    is_verified_buyer = models.BooleanField(default=False)
    moderation_state = models.CharField(
        max_length=20, choices=ReviewModerationChoices.choices, default=ReviewModerationChoices.APPROVED, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(product__isnull=False, merchant__isnull=True)
                    | models.Q(product__isnull=True, merchant__isnull=False)
                ),
                name='review_targets_exactly_one',
            )
        ]

    def __str__(self):
        target = self.product or self.merchant
        return f"{self.rating}★ {self.author_name} on {target}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.product:
            self.product.refresh_reviews_summary()
        elif self.merchant:
            self.merchant.refresh_reviews_summary()


def aggregate_reviews(reviews):
    """Compute {count, avg, distribution:{1..5}} from an iterable of Review objects."""
    distribution = {str(i): 0 for i in range(1, 6)}
    total = 0
    for r in reviews:
        if r.moderation_state != ReviewModerationChoices.APPROVED:
            continue
        total += r.rating
        distribution[str(r.rating)] += 1
    count = sum(distribution.values())
    avg = round(total / count, 1) if count else 0
    return {'count': count, 'avg': avg, 'distribution': distribution}

