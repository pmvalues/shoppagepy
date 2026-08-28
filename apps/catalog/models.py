from apps.catalog.identifiers import valid_gtin_pairs
from apps.core.models import TimeStampedModel
from django.db import models


class ProductStatusChoices(models.TextChoices):
    DRAFT = 'draft', 'Draft Variant'
    ACTIVE = 'active', 'Active in Master Catalogue'
    REFERENCE_ONLY = 'reference_only', 'Reference Only (No Local Stock Claim)'


class ConditionChoices(models.TextChoices):
    NEW = 'new', 'New'
    REFURBISHED = 'refurbished', 'Refurbished'
    USED = 'used', 'Used'
    OPEN_BOX = 'open_box', 'Open Box'


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
    handle = models.SlugField(max_length=255, blank=True, db_index=True, help_text="SEO URL handle; falls back to canonical_id")
    brand = models.CharField(max_length=150, db_index=True)
    model_number = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True, help_text="Factual, merchant-neutral description of what the product is")

    # Identifiers
    gtin8 = models.CharField(max_length=8, blank=True, null=True, help_text="GS1 GTIN-8")
    gtin12 = models.CharField(max_length=12, blank=True, null=True, help_text="GS1 UPC-A / GTIN-12")
    gtin13 = models.CharField(max_length=14, blank=True, null=True, db_index=True, help_text="GS1 EAN-13 Checksum Barcode")
    gtin14 = models.CharField(max_length=15, blank=True, null=True)
    mpn = models.CharField(max_length=100, blank=True, null=True, help_text="Manufacturer Part Number")
    asin = models.CharField(max_length=50, blank=True, null=True, help_text="Amazon ASIN")

    status = models.CharField(max_length=30, choices=ProductStatusChoices.choices, default=ProductStatusChoices.ACTIVE, db_index=True)
    condition_type = models.CharField(max_length=20, choices=ConditionChoices.choices, default=ConditionChoices.NEW)

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

    # Marketplace listing attributes
    tags = models.JSONField(default=list, blank=True, help_text="Free-form discovery tags")
    bullet_points = models.JSONField(default=list, blank=True, help_text="Key feature bullets")
    search_terms = models.CharField(max_length=255, blank=True, help_text="Backend search terms, not rendered on page")
    unit_weight_grams = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    unit_dimensions_mm = models.JSONField(default=dict, blank=True, help_text="{length, width, height} in millimetres")
    country_of_origin = models.CharField(max_length=2, blank=True)

    # Per-page SEO overrides
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.CharField(max_length=320, blank=True)
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

    @property
    def seo_handle(self) -> str:
        return self.handle or self.canonical_id

    @property
    def gtin_pairs(self) -> list[tuple[str, str]]:
        """Only identifiers surviving the GS1 check digit — feeds and JSON-LD gate on this."""
        return valid_gtin_pairs([
            ('gtin8', self.gtin8), ('gtin12', self.gtin12),
            ('gtin13', self.gtin13), ('gtin14', self.gtin14),
        ])

    @property
    def primary_image(self):
        return self.images.first()

    @property
    def image_urls(self) -> list[str]:
        return [img.url for img in self.images.all()[:10]]

    @property
    def listing_description(self) -> str:
        text = (self.description or '').strip()
        if text:
            return text
        specs = ', '.join(f'{k} {v}' for k, v in list((self.attributes or {}).items())[:4]) if isinstance(self.attributes, dict) else ''
        return ' '.join(part for part in (self.title, specs) if part).strip()

    def variation_group(self):
        """Active siblings in the same product family (variation-listing parity)."""
        if not self.family_ref:
            return MasterProduct.objects.none()
        return MasterProduct.objects.filter(
            family_ref=self.family_ref, status=ProductStatusChoices.ACTIVE
        ).exclude(pk=self.pk).order_by('title')

# Backward compatible alias
ProductVariant = MasterProduct


class ProductImage(TimeStampedModel):
    """Real image assets so Product rich results and Merchant Center feeds can qualify."""

    class SourceChoices(models.TextChoices):
        MANUFACTURER = 'manufacturer', 'Manufacturer / Brand Asset'
        MERCHANT = 'merchant', 'Merchant Uploaded'
        EVIDENCE = 'evidence', 'Field Evidence Capture'

    product = models.ForeignKey(MasterProduct, on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=255, blank=True)
    width = models.PositiveIntegerField(blank=True, null=True)
    height = models.PositiveIntegerField(blank=True, null=True)
    source = models.CharField(max_length=20, choices=SourceChoices.choices, default=SourceChoices.MANUFACTURER)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ['sort_order', 'id']
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'

    def __str__(self):
        return f"{self.product_id}: {self.url[:60]}"

    @property
    def effective_alt(self) -> str:
        return self.alt_text or f"{self.product.brand} {self.product.title}"
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

