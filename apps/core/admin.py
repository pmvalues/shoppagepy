"""
Behavioural signal ledgers (append-only). These tables are written by the
platform's own instrumentation — staff never hand-edits rows, hence the
read-only, no-add/no-delete administration.
"""

from django.contrib import admin

from .models import SearchClick, SearchQueryLog


@admin.register(SearchQueryLog)
class SearchQueryLogAdmin(admin.ModelAdmin):
    list_display = ('query', 'normalized', 'result_count', 'source', 'province', 'created_at')
    list_filter = ('source',)
    search_fields = ('query', 'normalized')
    date_hierarchy = 'created_at'
    readonly_fields = [field.name for field in SearchQueryLog._meta.fields]
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SearchClick)
class SearchClickAdmin(admin.ModelAdmin):
    list_display = ('query', 'product_id', 'position', 'source', 'created_at')
    search_fields = ('query', 'product_id')
    date_hierarchy = 'created_at'
    readonly_fields = [field.name for field in SearchClick._meta.fields]
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
