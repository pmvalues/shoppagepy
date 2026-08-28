import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model providing self-updating created_at and updated_at fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SearchQueryLog(models.Model):
    """
    Behavioral signal: every served search (web + API). Powers "related
    searches", query refinement stats and popularity priors. Kept append-only.
    """
    SOURCE_CHOICES = [('web', 'Web'), ('api', 'API'), ('assistant', 'Assistant')]

    query = models.CharField(max_length=255, db_index=True)
    normalized = models.CharField(max_length=255, blank=True, db_index=True)
    result_count = models.IntegerField(default=0)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='web')
    province = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['normalized', '-created_at'], name='sql_norm_created_idx')]

    def __str__(self):
        return f'{self.query} ({self.source})'


class SearchClick(models.Model):
    """
    Search result click: which product a user opened from which query.
    Feeds the popularity component of ranking and the zero-query suggestions.
    """
    query = models.CharField(max_length=255, blank=True, db_index=True)
    product_id = models.CharField(max_length=64, db_index=True)
    position = models.IntegerField(default=0, help_text='1-based rank the product held when clicked')
    source = models.CharField(max_length=20, default='web')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['product_id', '-created_at'], name='sclk_product_created_idx')]

    def __str__(self):
        return f'click {self.product_id} <- {self.query}'


def log_search_query(query: str, source: str = 'web', result_count: int = 0, province: str = ''):
    """
    Append a throttled search signal row (one write per normalized query+source
    per minute). Best-effort: never breaks the page it instruments.
    """
    import contextlib
    import hashlib

    from django.core.cache import cache

    query = (query or '').strip()[:255]
    if not query:
        return
    normalized = ' '.join(query.lower().split())[:255]
    throttle = f"sp:qlog:{hashlib.md5(f'{normalized}|{source}'.encode()).hexdigest()}"
    if cache.get(throttle):
        return
    with contextlib.suppress(Exception):
        cache.set(throttle, 1, 60)
        SearchQueryLog.objects.create(
            query=query,
            normalized=normalized,
            result_count=result_count,
            source=source,
            province=(province or '')[:100],
        )
