from apps.core.paginator import LargeTablePaginator
from django.contrib import admin
from django.utils.html import format_html

from .models import Market


@admin.register(Market)
class MarketAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'name',
        'market_type_badge',
        'province',
        'metro',
        'verification_state',
        'stall_capacity',
        'view_on_site'
    )
    list_filter = ('province', 'market_type', 'verification_state')
    search_fields = ('name', 'canonical_slug', 'metro', 'street_address')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Market Profile', {
            'fields': ('name', 'canonical_slug', 'market_type', 'parent_market', 'verification_state')
        }),
        ('Geographic Location', {
            'fields': ('province', 'metro', 'locality', 'street_address', 'postal_code', 'country', 'latitude', 'longitude', 'google_maps_url', 'google_place_id')
        }),
        ('Hours & Media', {
            'fields': ('opening_hours', 'operating_hours', 'timezone', 'image_url')
        }),
        ('Capacity & Local Features', {
            'fields': ('stall_capacity', 'active_merchants_count', 'landmarks', 'safety_notices')
        }),
        ('Search Snippets', {
            'fields': ('meta_title', 'meta_description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def market_type_badge(self, obj):
        return format_html('<span style="background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; padding: 2px 8px; border-radius: 4px; font-weight: 700;">{}</span>', obj.get_market_type_display())
    market_type_badge.short_description = "Type"

    def view_on_site(self, obj):
        return format_html('<a href="/markets/{}/" target="_blank" style="color: #1D4ED8; font-weight: 600;">View Mall Page &nearr;</a>', obj.canonical_slug)
    view_on_site.short_description = "Live Roster"
