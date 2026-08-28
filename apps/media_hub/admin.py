from django.contrib import admin
from django.utils.html import format_html

from .models import Short, ShortComment, Show


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = ('title', 'series_name', 'category', 'duration', 'views', 'status', 'view_episode')
    list_filter = ('series_name', 'category', 'status')
    search_fields = ('title', 'slug', 'description', 'market_name')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')

    def view_episode(self, obj):
        return format_html('<a href="/shows/{}/" target="_blank">Play &nearr;</a>', obj.slug)
    view_episode.short_description = "Watch"

@admin.register(Short)
class ShortAdmin(admin.ModelAdmin):
    list_display = ('title', 'product_title', 'merchant_name', 'views', 'likes', 'moderation_state', 'is_sponsored')
    list_filter = ('moderation_state', 'is_sponsored')
    search_fields = ('title', 'product_title', 'merchant_name', 'summary')
    readonly_fields = ('canonical_id', 'created_at', 'updated_at')


@admin.register(ShortComment)
class ShortCommentAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'short', 'state', 'created_at')
    list_filter = ('state',)
    search_fields = ('author_name', 'comment', 'short__title')
    autocomplete_fields = ('short',)
    readonly_fields = ('created_at', 'updated_at')
