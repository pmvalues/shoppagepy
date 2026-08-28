from django.contrib import admin
from django.utils.html import format_html

from .models import EvidenceArtifact, EvidenceClaim, EvidenceObservation


class EvidenceObservationInline(admin.TabularInline):
    model = EvidenceObservation
    extra = 0
    readonly_fields = ('observation_id', 'artifact', 'observed_value', 'observer_identity', 'observed_at')

@admin.register(EvidenceArtifact)
class EvidenceArtifactAdmin(admin.ModelAdmin):
    list_display = ('artifact_id', 'source_type', 'source_identifier', 'artifact_hash_short', 'rights_source', 'captured_at')
    list_filter = ('source_type', 'rights_source', 'captured_at')
    search_fields = ('source_identifier', 'artifact_hash')
    readonly_fields = ('artifact_id', 'artifact_hash', 'captured_at', 'created_at', 'updated_at')

    def artifact_hash_short(self, obj):
        return obj.artifact_hash[:12] if obj.artifact_hash else '-'
    artifact_hash_short.short_description = "Hash"


@admin.register(EvidenceClaim)
class EvidenceClaimAdmin(admin.ModelAdmin):
    list_display = ('claim_key', 'claim_type', 'subject_entity_type', 'subject_entity_id', 'state_badge', 'confidence_pct', 'verified_by', 'verified_at')
    list_filter = ('claim_type', 'state', 'subject_entity_type', 'verified_at')
    search_fields = ('subject_entity_id', 'claim_key', 'verified_by')
    inlines = [EvidenceObservationInline]
    readonly_fields = ('claim_id', 'created_at', 'updated_at')

    def state_badge(self, obj):
        colors = {
            'verified': '#10B981',
            'candidate': '#F59E0B',
            'disputed': '#EF4444',
            'expired': '#94A3B8',
            'rejected': '#DC2626',
        }
        color = colors.get(obj.state, '#64748B')
        return format_html(
            '<span style="background:{}; color:#FFFFFF; padding:3px 8px; border-radius:4px; font-weight:600; font-size:11px;">{}</span>',
            color, obj.get_state_display()
        )
    state_badge.short_description = "Verification State"

    def confidence_pct(self, obj):
        return f"{float(obj.confidence_score) * 100:.1f}%"
    confidence_pct.short_description = "Confidence"


@admin.register(EvidenceObservation)
class EvidenceObservationAdmin(admin.ModelAdmin):
    list_display = ('observation_id', 'claim', 'artifact', 'observer_identity', 'observed_at')
    list_filter = ('observed_at', 'observer_identity')
    readonly_fields = ('observation_id', 'observed_at', 'created_at', 'updated_at')
