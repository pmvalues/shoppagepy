from apps.core.models import TimeStampedModel
from django.db import models


class ShowCategoryChoices(models.TextChoices):
    MARKET_WALK = 'market_walk', 'Market Walk (Physical Market Tours)'
    WHATS_TRENDING = 'whats_trending', "What's Trending (Real-Time Radar)"
    PRODUCT_BATTLES = 'product_battles', 'Product Battles (Side-by-side Teardowns)'
    BUDGET_FINDS = 'budget_finds', 'Under R500 / Budget Finds'

class ShowStatusChoices(models.TextChoices):
    DRAFT = 'draft', 'Draft Series'
    ACTIVE = 'active', 'Active Franchise'
    ARCHIVED = 'archived', 'Archived'

class ModerationStateChoices(models.TextChoices):
    PENDING = 'pending', 'Pending Review'
    APPROVED = 'approved', 'Approved & Published'
    REJECTED = 'rejected', 'Rejected (Misleading / Prohibited)'

class Show(TimeStampedModel):
    """
    Product discovery media series & long-form teardown episodes.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(
        max_length=50,
        choices=ShowCategoryChoices.choices,
        default=ShowCategoryChoices.MARKET_WALK,
        db_index=True
    )
    series_name = models.CharField(max_length=200, default='Market Walk South Africa')
    duration = models.CharField(max_length=30, default='15:00')
    views = models.IntegerField(default=1000)
    featured_products_count = models.IntegerField(default=5)
    thumbnail_url = models.URLField()
    video_url = models.URLField()
    market_name = models.CharField(max_length=255, blank=True, null=True)
    market = models.ForeignKey('markets.Market', on_delete=models.SET_NULL, null=True, blank=True, related_name='shows')
    status = models.CharField(max_length=30, choices=ShowStatusChoices.choices, default=ShowStatusChoices.ACTIVE)
    published_episodes_count = models.IntegerField(default=1)

    class Meta:
        ordering = ['-views', 'title']
        verbose_name = 'Show Series & Episode'
        verbose_name_plural = 'Shows & Episodes'

    def __str__(self):
        return f"{self.series_name}: {self.title}"


class Short(TimeStampedModel):
    """
    High-utility proof videos tethered directly to canonical products, offers, and verified merchants.
    """
    canonical_id = models.CharField(max_length=120, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    video_url = models.URLField()
    thumbnail_url = models.URLField()
    duration = models.CharField(max_length=30, default='0:59')
    views = models.IntegerField(default=5000, db_index=True)
    likes = models.IntegerField(default=100)
    shares = models.IntegerField(default=20)
    summary = models.TextField(blank=True, null=True)

    product_title = models.CharField(max_length=255, blank=True, null=True)
    master_product = models.ForeignKey('catalog.MasterProduct', on_delete=models.SET_NULL, null=True, blank=True, related_name='shorts')

    merchant_name = models.CharField(max_length=255, blank=True, null=True)
    merchant_whatsapp = models.CharField(max_length=50, blank=True, null=True)
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.SET_NULL, null=True, blank=True, related_name='shorts')
    market = models.ForeignKey('markets.Market', on_delete=models.SET_NULL, null=True, blank=True, related_name='shorts')

    moderation_state = models.CharField(
        max_length=30,
        choices=ModerationStateChoices.choices,
        default=ModerationStateChoices.APPROVED,
        db_index=True
    )
    is_sponsored = models.BooleanField(default=False, help_text="Mandatory visible sponsorship disclosure flag")

    class Meta:
        ordering = ['-views']
        verbose_name = 'Proof Short Video'
        verbose_name_plural = 'Proof Short Videos'

    def __str__(self):
        return f"Short: {self.title} ({self.views:,} views)"
