from django.contrib import admin
from django.utils.html import format_html
from .models import MasterProduct, ProductStatusChoices
from apps.offers.models import Offer, DiscoveredOffer
from apps.core.paginator import LargeTablePaginator

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

class OfferInline(admin.TabularInline):
    model = Offer
    extra = 0
    fields = ('merchant', 'price_amount', 'currency', 'stall_ref', 'availability_state', 'sla_class')
    autocomplete_fields = ('merchant',)

class DiscoveredOfferInline(admin.TabularInline):
    model = DiscoveredOffer
    extra = 0
    fields = ('merchant_name', 'source_website', 'discovered_price_amount', 'confidence_score', 'location_hint')
    readonly_fields = ('source_url',)

@admin.register(MasterProduct)
class MasterProductAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'title',
        'brand_badge',
        'category_ref',
        'gtin13',
        'status_badge',
        'view_on_site'
    )
    list_filter = (ProductCategoryFilter, ProductStatusFilter)
    search_fields = ('title', 'canonical_id', 'gtin13', 'mpn', 'model_number', 'brand')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')
    inlines = [OfferInline, DiscoveredOfferInline]

    fieldsets = (
        ('Product Identification', {
            'fields': ('canonical_id', 'title', 'brand', 'model_number', 'family_ref', 'category_ref', 'status')
        }),
        ('Standard Codes & Barcodes', {
            'fields': ('gtin13', 'gtin14', 'mpn')
        }),
        ('Specifications & Compliance (JSON)', {
            'fields': ('attributes', 'compliance', 'aliases', 'reviews_summary')
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
        color = '#059669' if obj.status == 'ACTIVE' else '#64748B'
        return format_html('<span style="color: {}; font-weight: 800;">{}</span>', color, obj.status)
    status_badge.short_description = "Status"

    def view_on_site(self, obj):
        return format_html('<a href="/p/{}/" target="_blank" style="color: #1D4ED8; font-weight: 600;">View Page &nearr;</a>', obj.canonical_id)
    view_on_site.short_description = "Storefront"
