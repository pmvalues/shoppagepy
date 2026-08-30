import csv

from apps.core.paginator import LargeTablePaginator
from apps.offers.models import DiscoveredOffer, Offer
from django.contrib import admin
from django.http import HttpResponse
from django.utils.html import format_html

from .models import Category, CategoryPath, MasterProduct, ProductImage, ProductStatusChoices


class ProductCategoryFilter(admin.SimpleListFilter):
    title = 'Category'
    parameter_name = 'category_ref'

    def lookups(self, request, model_admin):
        return [
            ('solar_energy', 'Solar & Backup Power'),
            ('hardware_tools', 'Power Tools & Hardware'),
            ('building_materials', 'Building Materials'),
            ('smartphones_electronics', 'Smartphones & Electronics'),
            ('appliances_home', 'Appliances & Cold Chain'),
            ('automotive_tyres', 'Automotive & Tyres'),
        ]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(category_ref=self.value())
        return queryset

class ProductStatusFilter(admin.SimpleListFilter):
    title = 'Status'
    parameter_name = 'status'

    def lookups(self, request, model_admin):
        return ProductStatusChoices.choices

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset

class ProductPublishableFilter(admin.SimpleListFilter):
    title = 'Feed eligibility'
    parameter_name = 'publishable'

    def lookups(self, request, model_admin):
        return [('yes', 'Publishable (image + description)'), ('no', 'Missing image or description')]

    def queryset(self, request, queryset):
        from django.db.models import Q

        incomplete = Q(description='') | Q(images__isnull=True)
        if self.value() == 'yes':
            return queryset.filter(images__isnull=False).exclude(description='').distinct()
        if self.value() == 'no':
            return queryset.filter(incomplete).distinct()
        return queryset

class OfferInline(admin.TabularInline):
    model = Offer
    extra = 0
    fields = ('merchant', 'price_amount', 'currency', 'stall_ref', 'availability_state', 'sla_class', 'expires_at')
    readonly_fields = ('last_confirmed_at',)
    autocomplete_fields = ('merchant',)

class DiscoveredOfferInline(admin.TabularInline):
    model = DiscoveredOffer
    extra = 0
    fields = ('merchant_name', 'source_website', 'discovered_price_amount', 'confidence_score', 'location_hint')
    readonly_fields = ('source_url',)

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('url', 'alt_text', 'width', 'height', 'source', 'sort_order')
    ordering = ('sort_order', 'id')


class TaxonomyFilter(admin.SimpleListFilter):
    """Filter products by their level-0 Google taxonomy branch."""
    title = 'Taxonomy branch'
    parameter_name = 'taxonomy'

    def lookups(self, request, model_admin):
        try:
            return list(
                Category.objects.filter(level=0).values_list('google_id', 'name')[:40]
            )
        except Exception:
            return []

    def queryset(self, request, queryset):
        value = self.value()
        if not value:
            return queryset
        try:
            root = Category.objects.get(google_id=int(value))
            descendant_ids = CategoryPath.objects.filter(ancestor=root).values_list('descendant_id', flat=True)
            return queryset.filter(master_category_id__in=descendant_ids)
        except Exception:
            return queryset


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('google_id', 'path', 'level', 'sector', 'product_count')
    list_filter = ('level', 'sector')
    search_fields = ('name', 'path')
    ordering = ('path',)
    readonly_fields = ('google_id', 'level', 'slug', 'path')
    list_per_page = 100

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'


@admin.register(CategoryPath)
class CategoryPathAdmin(admin.ModelAdmin):
    list_display = ('ancestor', 'descendant', 'depth')
    search_fields = ('ancestor__path', 'descendant__path')
    list_filter = ('depth',)
    list_per_page = 100


@admin.register(MasterProduct)
class MasterProductAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'title',
        'brand_badge',
        'category_ref',
        'gtin_state',
        'publishable_state',
        'status_badge',
        'view_on_site'
    )
    list_filter = (ProductCategoryFilter, TaxonomyFilter, ProductStatusFilter, ProductPublishableFilter)
    search_fields = ('title', 'canonical_id', 'gtin13', 'mpn', 'model_number', 'brand')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')
    autocomplete_fields = ('master_category',)
    inlines = [ProductImageInline, OfferInline, DiscoveredOfferInline]
    actions = ('activate_selected', 'unpublish_selected', 'export_csv')

    fieldsets = (
        ('Product Identification', {
            'fields': ('canonical_id', 'handle', 'title', 'brand', 'model_number', 'family_ref', 'category_ref', 'master_category', 'status', 'condition_type')
        }),
        ('Description', {
            'fields': ('description', 'bullet_points', 'tags')
        }),
        ('Standard Codes & Barcodes', {
            'fields': ('gtin8', 'gtin12', 'gtin13', 'gtin14', 'mpn', 'asin')
        }),
        ('Logistics', {
            'fields': ('unit_weight_grams', 'unit_dimensions_mm', 'country_of_origin')
        }),
        ('Specifications & Compliance (JSON)', {
            'fields': ('attributes', 'compliance', 'aliases', 'reviews_summary', 'guides', 'media_items')
        }),
        ('Search & Social Snippets', {
            'fields': ('search_terms', 'meta_title', 'meta_description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def brand_badge(self, obj):
        return format_html('<span style="background: #F1F5F9; color: #1E293B; border: 1px solid #CBD5E1; padding: 2px 8px; border-radius: 4px; font-weight: 700;">{}</span>', obj.brand)
    brand_badge.short_description = "Brand"

    def status_badge(self, obj):
        color = '#059669' if obj.status == ProductStatusChoices.ACTIVE else '#64748B'
        return format_html('<span style="color: {}; font-weight: 800;">{}</span>', color, obj.get_status_display())
    status_badge.short_description = "Status"

    def gtin_state(self, obj):
        """Which barcode will actually be published — an invalid one never is."""
        pairs = obj.gtin_pairs
        held = [obj.gtin8, obj.gtin12, obj.gtin13, obj.gtin14]
        if pairs:
            return format_html('<span style="color:#059669;font-weight:700;">✓ {}</span>', pairs[0][1])
        if any(held):
            return format_html('<span style="color:#B45309;font-weight:700;">check digit fails</span>')
        return format_html('<span style="color:#94A3B8;">none</span>')
    gtin_state.short_description = 'GTIN'

    def publishable_state(self, obj):
        has_image = obj.images.exists()
        has_copy = bool((obj.description or '').strip())
        if has_image and has_copy:
            return format_html('<span style="color:#059669;font-weight:700;">feed-ready</span>')
        missing = []
        if not has_image:
            missing.append('image')
        if not has_copy:
            missing.append('description')
        return format_html('<span style="color:#B45309;">needs {}</span>', ' + '.join(missing))
    publishable_state.short_description = 'Publishing'

    def view_on_site(self, obj):
        return format_html('<a href="/p/{}/" target="_blank" style="color: #1D4ED8; font-weight: 600;">View Page &nearr;</a>', obj.seo_handle)
    view_on_site.short_description = "Storefront"

    @admin.action(description='Publish selected products (status → active)')
    def activate_selected(self, request, queryset):
        updated = queryset.update(status=ProductStatusChoices.ACTIVE)
        self.message_user(request, f'{updated} product(s) set to active.')

    @admin.action(description='Unpublish selected products (status → draft)')
    def unpublish_selected(self, request, queryset):
        updated = queryset.update(status=ProductStatusChoices.DRAFT)
        self.message_user(request, f'{updated} product(s) set to draft.')

    @admin.action(description='Export selected products as CSV (max 5,000 rows)')
    def export_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="shoppage-products.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'canonical_id', 'handle', 'title', 'brand', 'model_number', 'category_ref',
            'gtin_valid', 'mpn', 'status', 'price_min', 'currency', 'offer_count',
            'has_image', 'description',
        ])
        for product in queryset.select_related().prefetch_related('images', 'offers')[:5000]:
            priced_offers = [o for o in product.offers.all() if o.price_amount]
            prices = [float(o.price_amount) for o in priced_offers]
            pairs = product.gtin_pairs
            writer.writerow([
                product.canonical_id, product.seo_handle, product.title, product.brand,
                product.model_number or '', product.category_ref,
                pairs[0][1] if pairs else '', product.mpn or '', product.status,
                min(prices) if prices else '',
                priced_offers[0].currency if priced_offers else '',
                len(priced_offers), product.images.exists(), (product.description or '')[:300],
            ])
        return response


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'url', 'alt_text', 'source', 'sort_order')
    list_filter = ('source',)
    search_fields = ('url', 'alt_text', 'product__title', 'product__canonical_id')
    autocomplete_fields = ('product',)
