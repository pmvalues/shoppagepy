from django.contrib import admin
from django.utils.html import format_html
from .models import Merchant, TrustPassport, Draft, AgentRun, ClaimStateChoices, VerificationStateChoices
from apps.offers.models import Offer
from apps.core.paginator import LargeTablePaginator

class ProvinceFilter(admin.SimpleListFilter):
    title = 'Province'
    parameter_name = 'province'

    def lookups(self, request, model_admin):
        return [
            ('Gauteng', 'Gauteng'),
            ('Western Cape', 'Western Cape'),
            ('KwaZulu-Natal', 'KwaZulu-Natal'),
            ('Eastern Cape', 'Eastern Cape'),
            ('Limpopo', 'Limpopo'),
            ('Mpumalanga', 'Mpumalanga'),
            ('Free State', 'Free State'),
            ('North West', 'North West'),
            ('Northern Cape', 'Northern Cape'),
        ]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(province=self.value())
        return queryset

class CategoryFilter(admin.SimpleListFilter):
    title = 'Category'
    parameter_name = 'category'

    def lookups(self, request, model_admin):
        return [
            ('solar_energy', 'Solar & Energy Solutions'),
            ('hardware_tools', 'Industrial Tools & Hardware'),
            ('building_materials', 'Building & Construction'),
            ('smartphones_electronics', 'Smartphones & Electronics'),
            ('appliances_home', 'Appliances & Home'),
            ('automotive_tyres', 'Automotive & Commercial Tyres'),
        ]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(category=self.value())
        return queryset

class ClaimStateFilter(admin.SimpleListFilter):
    title = 'Claim State'
    parameter_name = 'claim_state'

    def lookups(self, request, model_admin):
        return ClaimStateChoices.choices

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(claim_state=self.value())
        return queryset

class VerificationStateFilter(admin.SimpleListFilter):
    title = 'Verification State'
    parameter_name = 'verification_state'

    def lookups(self, request, model_admin):
        return VerificationStateChoices.choices

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(verification_state=self.value())
        return queryset

class TrustPassportInline(admin.StackedInline):
    model = TrustPassport
    can_delete = False
    extra = 0
    fields = ('score', 'state', 'median_response_minutes', 'fresh_offers_today_count', 'badge_url')
    readonly_fields = ('badge_url',)

    def badge_url(self, instance):
        if instance.merchant_id:
            return format_html('<a href="/api/seal/{}/" target="_blank">View Live SVG Badge &nearr;</a>', instance.merchant.canonical_id)
        return "-"

class OfferInline(admin.TabularInline):
    model = Offer
    extra = 0
    fields = ('variant', 'price_amount', 'currency', 'stall_ref', 'availability_state', 'sla_class')
    autocomplete_fields = ('variant',)

@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50

    list_display = (
        'name',
        'category',
        'province',
        'trust_score_badge',
        'claim_state_badge',
        'verification_state_badge',
        'whatsapp_link',
        'updated_at'
    )
    list_filter = (ProvinceFilter, CategoryFilter, ClaimStateFilter, VerificationStateFilter)
    search_fields = ('name', 'canonical_id', 'cipc_enterprise_number', 'whatsapp_number')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')
    inlines = [TrustPassportInline, OfferInline]

    fieldsets = (
        ('Store Identity', {
            'fields': ('canonical_id', 'name', 'category', 'claim_state', 'verification_state')
        }),
        ('Contact & Direct Channels', {
            'fields': ('whatsapp_number', 'telephone', 'email', 'website_url')
        }),
        ('Spatial Location', {
            'fields': ('market', 'stall_identifier', 'address_text', 'province', 'country')
        }),
        ('Statutory Compliance & Registrations', {
            'fields': ('cipc_enterprise_number', 'bbbee_level', 'tax_compliance_pin', 'cidb_grade', 'years_in_business')
        }),
        ('Reputation & Intelligence', {
            'fields': ('trust_score', 'google_rating', 'google_reviews_count', 'median_response_minutes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def trust_score_badge(self, obj):
        score = obj.trust_score
        color = '#059669' if score >= 90 else ('#D97706' if score >= 70 else '#DC2626')
        return format_html('<span style="color: {}; font-weight: bold;">{}/100</span>', color, score)
    trust_score_badge.short_description = "Trust Score"

    def claim_state_badge(self, obj):
        color = '#2563EB' if obj.claim_state == 'CLAIMED' else '#64748B'
        return format_html('<span style="background: #EFF6FF; color: {}; padding: 2px 8px; border-radius: 4px; font-weight: 600;">{}</span>', color, obj.get_claim_state_display())
    claim_state_badge.short_description = "Claim State"

    def verification_state_badge(self, obj):
        color = '#059669' if obj.verification_state == 'FULLY_VERIFIED' else '#D97706'
        return format_html('<span style="background: #ECFDF5; color: {}; padding: 2px 8px; border-radius: 4px; font-weight: 600;">{}</span>', color, obj.get_verification_state_display())
    verification_state_badge.short_description = "Verification"

    def whatsapp_link(self, obj):
        if obj.whatsapp_number:
            return format_html('<a href="https://wa.me/{}" target="_blank" style="color: #059669; font-weight: bold;">💬 {}</a>', obj.whatsapp_number, obj.whatsapp_number)
        return "-"
    whatsapp_link.short_description = "WhatsApp"

@admin.register(TrustPassport)
class TrustPassportAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50
    list_display = ('merchant', 'score', 'state', 'median_response_minutes', 'fresh_offers_today_count', 'updated_at')
    list_filter = ('state',)
    search_fields = ('merchant__name', 'merchant__canonical_id')

@admin.register(Draft)
class DraftAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50
    list_display = ('draft_id', 'draft_type', 'merchant', 'product', 'confidence_pct', 'review_state_badge', 'created_at')
    list_filter = ('draft_type', 'review_state', 'created_at')
    search_fields = ('draft_id', 'merchant__name', 'product__title')
    readonly_fields = ('draft_id', 'created_at', 'updated_at')

    def confidence_pct(self, obj):
        return f"{obj.confidence * 100:.1f}%"
    confidence_pct.short_description = "Confidence"

    def review_state_badge(self, obj):
        colors = {
            'approved': '#10B981',
            'auto_approved': '#059669',
            'pending': '#F59E0B',
            'rejected': '#EF4444',
            'expired': '#94A3B8',
        }
        color = colors.get(obj.review_state, '#64748B')
        return format_html(
            '<span style="background:{}; color:#FFFFFF; padding:2px 8px; border-radius:4px; font-weight:600; font-size:11px;">{}</span>',
            color, obj.get_review_state_display()
        )
    review_state_badge.short_description = "Review State"

@admin.register(AgentRun)
class AgentRunAdmin(admin.ModelAdmin):
    paginator = LargeTablePaginator
    show_full_result_count = False
    list_per_page = 50
    list_display = ('run_id', 'agent_name', 'merchant', 'status', 'tokens_consumed', 'tool_calls_count', 'created_at')
    list_filter = ('agent_name', 'status', 'created_at')
    search_fields = ('run_id', 'merchant__name', 'agent_name')
    readonly_fields = ('run_id', 'created_at', 'updated_at')
