from apps.core.paginator import LargeTablePaginator
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    AvailabilityStateChoices,
    CrawlRun,
    DiscoveredOffer,
    Offer,
    PriceAlert,
    PriceObservation,
    Promotion,
    UrlHealthRecord,
    UrlImpression,
    VendorProduct,
)


class VendorOfferInline(admin.TabularInline):
    """Price-state rows hanging off one vendor listing."""
    model = Offer
    extra = 0
    fields = ('price_amount', 'currency', 'availability_state', 'sla_class', 'expires_at')
    readonly_fields = ('last_confirmed_at',)
    show_change_link = True


@admin.register(VendorProduct)
class VendorProductAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'merchant',
        'master_product',
        'vendor_sku',
        'condition',
        'stock_state',
        'status_badge',
        'match_source',
        'match_confidence',
        'updated_at',
    )
    list_filter = ('condition', 'stock_state', 'status', 'match_source')
    search_fields = ('canonical_id', 'vendor_sku', 'vendor_gtin', 'mpn', 'merchant__name', 'master_product__title')
    autocomplete_fields = ('master_product', 'merchant')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')
    inlines = [VendorOfferInline]
    ordering = ('-updated_at',)

    fieldsets = (
        ('Listing Identity', {
            'fields': ('canonical_id', 'master_product', 'merchant', 'vendor_sku', 'vendor_gtin', 'mpn')
        }),
        ('Merchant Listing Details', {
            'fields': ('condition', 'unit_descriptor', 'stock_state', 'stall_ref', 'status')
        }),
        ('Match Provenance', {
            'fields': ('match_source', 'match_confidence')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        color = {
            'active': '#059669',
            'draft': '#D97706',
            'offboarded': '#DC2626',
        }.get(obj.status, '#64748B')
        return format_html('<span style="color: {}; font-weight: 800;">{}</span>', color, obj.get_status_display())
    status_badge.short_description = 'Status'


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50
    actions = ('confirm_selected',)

    list_display = (
        'canonical_id',
        'variant_link',
        'merchant_link',
        'price_display',
        'availability_badge',
        'sla_badge',
        'confirmed_display',
        'expires_display',
        'test_resolver'
    )
    list_filter = ('availability_state', 'sla_class', 'destination_type', 'currency')
    search_fields = ('canonical_id', 'variant__title', 'merchant__name', 'stall_ref')
    autocomplete_fields = ('vendor_product', 'variant', 'merchant')
    readonly_fields = ('canonical_id', 'last_confirmed_at', 'expires_at', 'created_at', 'updated_at')

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
        live = obj.availability_state in (
            AvailabilityStateChoices.FRESH,
            AvailabilityStateChoices.CONFIRM_REQUIRED,
            AvailabilityStateChoices.QUOTE_REQUIRED,
        )
        color = '#059669' if live else '#D97706'
        return format_html('<span style="color: {}; font-weight: 600;">{}</span>', color, obj.get_availability_state_display())
    availability_badge.short_description = "Availability"

    def sla_badge(self, obj):
        return format_html('<span style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">{}</span>', obj.get_sla_class_display())
    sla_badge.short_description = "SLA"

    def confirmed_display(self, obj):
        if not obj.last_confirmed_at:
            return format_html('<span style="color:#94A3B8;">never</span>')
        return format_html('{}', obj.last_confirmed_at.strftime('%d %b %Y %H:%M'))
    confirmed_display.short_description = "Confirmed"

    def expires_display(self, obj):
        if not obj.expires_at:
            return format_html('<span style="color:#94A3B8;">—</span>')
        if obj.is_expired:
            return format_html('<span style="color:#B45309;font-weight:700;">lapsed {}</span>', obj.expires_at.strftime('%d %b %Y'))
        return format_html('{}', obj.expires_at.strftime('%d %b %Y'))
    expires_display.short_description = "Valid until"

    def test_resolver(self, obj):
        return format_html('<a href="/l/{}/" target="_blank" style="color: #059669; font-weight: bold;">💬 Test /l/ Link &nearr;</a>', obj.canonical_id)
    test_resolver.short_description = "Universal Link"

    @admin.action(description='Re-confirm selected offers (refresh price validity)')
    def confirm_selected(self, request, queryset):
        for offer in queryset.select_related('merchant')[:500]:
            offer.confirm()
        self.message_user(request, 'Re-confirmed the selected offers and rolled their validity windows forward.')

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


@admin.register(PriceObservation)
class PriceObservationAdmin(admin.ModelAdmin):
    """Append-only history: recorded by the platform, never hand-edited."""
    list_display = ('offer', 'price_amount', 'currency', 'source', 'recorded_at')
    list_filter = ('source', 'currency')
    date_hierarchy = 'recorded_at'
    search_fields = ('offer__canonical_id',)
    readonly_fields = [f.name for f in PriceObservation._meta.fields]

    def has_add_permission(self, request):
        return False

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('canonical_id', 'title', 'merchant_link', 'discount_label', 'state', 'valid_from', 'valid_until')
    list_filter = ('state', 'valid_from')
    search_fields = ('canonical_id', 'title', 'merchant__name', 'variant__title')
    autocomplete_fields = ('vendor_product', 'merchant', 'variant')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')

    def merchant_link(self, obj):
        if obj.merchant:
            return format_html('<a href="/m/{}/" target="_blank">{}</a>', obj.merchant.canonical_id, obj.merchant.name)
        return "-"
    merchant_link.short_description = "Merchant"

    def discount_label(self, obj):
        return obj.discount_label
    discount_label.short_description = "Discount"


@admin.register(PriceAlert)
class PriceAlertAdmin(admin.ModelAdmin):
    list_display = ('product_link', 'channel', 'contact', 'threshold_price', 'active', 'triggered_at', 'created_at')
    list_filter = ('channel', 'active')
    search_fields = ('contact', 'product__title', 'product__canonical_id')
    autocomplete_fields = ('product',)
    readonly_fields = ('created_at', 'updated_at')

    def product_link(self, obj):
        if obj.product:
            return format_html('<a href="/p/{}/" target="_blank">{}</a>', obj.product.canonical_id, obj.product.title[:60])
        return "-"
    product_link.short_description = "Product"


@admin.register(UrlHealthRecord)
class UrlHealthRecordAdmin(admin.ModelAdmin):
    """Crawl ledger — the merchant-catalog health surface."""

    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'url_short', 'state_badge', 'merchant_link', 'product_link',
        'last_price_amount', 'price_drift', 'last_availability_text',
        'refresh_requested_at', 'last_crawled_at', 'checks_count',
    )
    list_filter = ('state', 'source', 'merchant', 'refresh_requested_at')
    search_fields = ('url', 'final_url', 'last_title', 'canonical_id', 'master_product__title', 'merchant__name')
    autocomplete_fields = ('merchant', 'master_product', 'offer', 'discovered_offer')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')
    ordering = ('-refresh_requested_at', '-last_crawled_at')
    date_hierarchy = 'last_crawled_at'

    fieldsets = (
        ('URL', {
            'fields': ('canonical_id', 'url', 'final_url', 'expected_hostname', 'last_image_url', 'source')
        }),
        ('Links', {
            'fields': ('merchant', 'master_product', 'offer', 'discovered_offer')
        }),
        ('Latest Observation', {
            'fields': (
                'state', 'last_title', 'last_price_amount', 'previous_price_amount',
                'price_drift_amount', 'last_availability_text', 'last_http_status',
                'last_crawled_at', 'last_success_at', 'checks_count', 'error_text',
            )
        }),
        ('Refresh Signals', {
            'fields': ('refresh_requested_at', 'refresh_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def url_short(self, obj):
        return format_html('<a href="{}" target="_blank">{}</a>', obj.url, obj.url[:70])
    url_short.short_description = 'URL'

    def state_badge(self, obj):
        colors = {
            'healthy': '#059669', 'stale': '#F59E0B', 'failed': '#EF4444',
            'off_domain': '#B45309', 'unknown': '#94A3B8',
        }
        color = colors.get(obj.effective_state, '#94A3B8')
        return format_html('<span style="color: {}; font-weight: 700;">● {}</span>', color, obj.effective_state)
    state_badge.short_description = 'State'

    def merchant_link(self, obj):
        if obj.merchant_id:
            return format_html('<a href="/merchant/dashboard/?merchantId={}">{}</a>', obj.merchant.canonical_id, obj.merchant.name[:40])
        return '-'
    merchant_link.short_description = 'Merchant'

    def product_link(self, obj):
        if obj.master_product_id:
            return format_html('<a href="/p/{}/" target="_blank">{}</a>', obj.master_product.canonical_id, obj.master_product.title[:40])
        return '-'
    product_link.short_description = 'Product'

    def price_drift(self, obj):
        if obj.price_drift_amount is None:
            return '-'
        color = '#059669' if obj.price_drift_amount < 0 else '#DC2626'
        return format_html('<span style="color: {};">{:+.2f}</span>', color, obj.price_drift_amount)
    price_drift.short_description = 'Drift'


@admin.register(UrlImpression)
class UrlImpressionAdmin(admin.ModelAdmin):
    """Append-only impression ledger — staff never edits rows."""

    list_display = ('url', 'source', 'merchant', 'product', 'seen_at')
    list_filter = ('source', 'seen_at')
    search_fields = ('url',)
    autocomplete_fields = ('merchant', 'product')
    readonly_fields = [field.name for field in UrlImpression._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(CrawlRun)
class CrawlRunAdmin(admin.ModelAdmin):
    """Bounded crawler executions — diagnostics only."""

    list_display = ('run_id', 'trigger', 'merchant', 'status', 'urls_attempted', 'urls_ok', 'urls_failed', 'started_at', 'finished_at')
    list_filter = ('trigger', 'status', 'merchant')
    autocomplete_fields = ('merchant',)
    readonly_fields = [field.name for field in CrawlRun._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
