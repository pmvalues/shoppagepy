from django.contrib import admin

from .models import Affiliate, ReferralEvent


@admin.register(Affiliate)
class AffiliateAdmin(admin.ModelAdmin):
    list_display = ('handle', 'name', 'contact', 'commission_rate', 'active', 'created_at')
    list_filter = ('active',)
    search_fields = ('handle', 'name', 'contact')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')


@admin.register(ReferralEvent)
class ReferralEventAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'action', 'offer', 'merchant', 'market', 'country_code', 'occurred_at')
    list_filter = ('action', 'country_code', 'occurred_at')
    search_fields = ('event_id', 'session_fingerprint', 'offer__canonical_id', 'merchant__name', 'dedupe_key')
    readonly_fields = (
        'event_id', 'occurred_at', 'action', 'offer', 'variant', 'merchant',
        'market', 'stall_ref', 'country_code', 'session_fingerprint',
        'source_campaign', 'source_asset_qr_id', 'confidence_score',
        'dedupe_key', 'payload', 'created_at', 'updated_at'
    )

    def has_add_permission(self, request):
        return False
