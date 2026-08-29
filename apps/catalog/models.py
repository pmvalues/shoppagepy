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

    # Fine-grained Google Shopping taxonomy node (the ~5.5k-node en-US tree).
    # category_ref stays as the coarse commerce vertical (solar_energy, ...); this
    # FK carries the precise classification used by GMC feeds and category pages.
    master_category = models.ForeignKey(
        'catalog.Category', null=True, blank=True, on_delete=models.PROTECT,
        related_name='products', help_text='Google product taxonomy leaf',
    )

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

    compatibility_edge_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['id']
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
        ).exclude(pk=self.pk).order_by('id')

# Backward compatible alias
ProductVariant = MasterProduct


class Category(TimeStampedModel):
    """
    Google Shopping product taxonomy node (taxonomy-with-ids.en-US.txt).

    Holds every node of the ~5,500-category tree: level-0 branches through
    leaf categories. Products link via ``MasterProduct.master_category``;
    child-inclusive queries go through :class:`CategoryPath` (closure table).
    ``sector`` records which coarse commerce vertical (``category_ref`` value)
    the node feeds, so ranking/facets can stay on the cheap string path.
    """
    google_id = models.IntegerField(unique=True, help_text='Google taxonomy node id')
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=1000, db_index=True, help_text='e.g. Electronics > Communications > Telephony > Mobile Phones')
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    level = models.PositiveSmallIntegerField(default=0, db_index=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    sector = models.CharField(max_length=100, blank=True, db_index=True, help_text='Coarse vertical (category_ref) this node feeds')

    class Meta:
        ordering = ['path']
        verbose_name = 'Google Taxonomy Category'
        verbose_name_plural = 'Google Taxonomy Categories'

    def __str__(self):
        return self.path


class CategoryPath(TimeStampedModel):
    """Closure rows: every (ancestor, descendant, depth) pair including self (depth 0)."""
    ancestor = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='descendant_links')
    descendant = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='ancestor_links')
    depth = models.PositiveSmallIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['ancestor', 'descendant'], name='uniq_category_path_pair'),
        ]
        indexes = [
            models.Index(fields=['descendant'], name='catpath_descendant_idx'),
        ]
        verbose_name = 'Category Closure Row'
        verbose_name_plural = 'Category Closure Rows'


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
