from django.contrib import admin

from .models import RightsSource


@admin.register(RightsSource)
class RightsSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'rights_class', 'status', 'ai_use_permitted', 'suppression_sla_hours', 'created_at')
    list_filter = ('rights_class', 'status', 'ai_use_permitted')
    search_fields = ('name', 'legal_entity', 'source_url')
    readonly_fields = ('created_at', 'updated_at')
