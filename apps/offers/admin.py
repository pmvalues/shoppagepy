from django.contrib import admin
from django.utils.html import format_html
from .models import Offer, DiscoveredOffer
from apps.core.paginator import LargeTablePaginator

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'canonical_id',
        'variant_link',
        'merchant_link',
        'price_display',
        'destination_type',
        'availability_badge',
        'sla_badge',
        'test_resolver'
    )
    list_filter = ('availability_state', 'sla_class', 'destination_type', 'currency')
    search_fields = ('canonical_id', 'variant__title', 'merchant__name', 'stall_ref')
    autocomplete_fields = ('variant', 'merchant')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')

    def variant_link(self, obj):
        if obj.variant:
            return format_html('<a href="/p/{}/" target="_blank">{}</a>', obj.variant.canonical_id, obj.variant.title)
        return "-"
    variant_link.short_description = "Product"

    def merchant_link(self, obj):
        if obj.merchant:
            return format_html('<a href="/m/{}/" target="_blank">{}</a>', obj.merchant.canonical_id, obj.merchant.name)
        return "-"
    merchant_link.short_description = "Merchant"

    def price_display(self, obj):
        val = f"R {float(obj.price_amount):,.2f}" if obj.price_amount is not None else "R 0.00"
        return format_html('<span style="font-weight: bold; color: #059669;">{}</span>', val)
    price_display.short_description = "Price"

    def availability_badge(self, obj):
        color = '#059669' if obj.availability_state == 'FRESH' else '#D97706'
        return format_html('<span style="color: {}; font-weight: 600;">{}</span>', color, obj.get_availability_state_display())
    availability_badge.short_description = "Availability"

    def sla_badge(self, obj):
        return format_html('<span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">{}</span>', obj.get_sla_class_display())
    sla_badge.short_description = "SLA"

    def test_resolver(self, obj):
        return format_html('<a href="/l/{}/" target="_blank" style="color: #059669; font-weight: bold;">💬 Test /l/ Link &nearr;</a>', obj.canonical_id)
    test_resolver.short_description = "Universal Link"

@admin.register(DiscoveredOffer)
class DiscoveredOfferAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'merchant_name',
        'source_website',
        'product_link',
        'discovered_price_display',
        'confidence_score',
        'location_hint',
        'view_source'
    )
    list_filter = ('source_website', 'discovery_source')
    search_fields = ('canonical_id', 'master_product__title', 'merchant_name', 'sku')
    autocomplete_fields = ('master_product',)
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')

    def product_link(self, obj):
        if obj.master_product:
            return format_html('<a href="/p/{}/" target="_blank">{}</a>', obj.master_product.canonical_id, obj.master_product.title)
        return "-"
    product_link.short_description = "Master Product"

    def discovered_price_display(self, obj):
        val = f"R {float(obj.discovered_price_amount):,.2f}" if obj.discovered_price_amount is not None else "R 0.00"
        return format_html('<span style="font-weight: bold; color: #334155;">{}</span>', val)
    discovered_price_display.short_description = "Swept Price"

    def view_source(self, obj):
        if obj.source_url:
            return format_html('<a href="{}" target="_blank">View External &nearr;</a>', obj.source_url)
        return "-"
    view_source.short_description = "Source"
