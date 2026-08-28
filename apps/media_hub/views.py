import time

from apps.catalog.models import MasterProduct
from apps.core.seo import jsonld_script, video_jsonld, video_list_jsonld
from django.contrib import messages
from django.core.cache import cache
from django.db.models import Q
from django.http import Http404, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .models import Short, Show


def shows_directory_view(request):
    category_filter = request.GET.get('category')
    shows_qs = Show.objects.filter(status='active')
    if category_filter:
        shows_qs = shows_qs.filter(category=category_filter)

    context = {
        'shows': shows_qs,
        'selected_category': category_filter,
        'jsonld': jsonld_script(video_list_jsonld(list(shows_qs[:20]), request)),
    }
    return render(request, 'media_hub/shows_page.html', context)

def show_detail_view(request, slug):
    show = get_object_or_404(Show, slug=slug)
    related_shows = Show.objects.filter(status='active').exclude(id=show.id)[:4]

    context = {
        'show': show,
        'related_shows': related_shows,
        'jsonld': jsonld_script(video_jsonld(show, request)),
    }
    return render(request, 'media_hub/show_detail.html', context)

def shorts_directory_view(request):
    category = request.GET.get('category', '')
    query = request.GET.get('q', '')
    sort = request.GET.get('sort', 'trending')

    # Handle short submission from creator studio (moderation-gated, no placeholders).
    if request.method == 'POST':
        title = (request.POST.get('title') or '').strip()
        video_url = (request.POST.get('video_url') or '').strip()
        merchant_name = (request.POST.get('merchant_name') or '').strip() or 'Verified Creator'
        whatsapp = (request.POST.get('whatsapp') or '').strip() or None
        thumbnail_url = (request.POST.get('thumbnail_url') or '').strip()
        product_id = request.POST.get('product_id')

        if not title or not video_url:
            messages.error(request, 'A title and a real video URL are required.')
            return redirect('/shorts')

        product = MasterProduct.objects.filter(canonical_id=product_id).first() if product_id else None
        canonical_id = f"sh_{title.lower()[:20].replace(' ', '_')}_{int(time.time_ns() % 10 ** 8)}"
        Short.objects.create(
            canonical_id=canonical_id,
            title=title,
            video_url=video_url,
            thumbnail_url=thumbnail_url or '',
            merchant_name=merchant_name,
            merchant_whatsapp=whatsapp,
            master_product=product,
            moderation_state='pending',
        )
        messages.success(request, f"Short '{title}' submitted — it appears after verification.")
        return redirect('/shorts')

    from django.db.models import Prefetch

    from .models import ShortComment

    comments_prefetch = Prefetch(
        'comments',
        queryset=ShortComment.objects.filter(state='approved').order_by('-created_at')[:6],
        to_attr='approved_comments',
    )
    shorts_qs = Short.objects.filter(moderation_state='approved').select_related('master_product', 'merchant', 'market').prefetch_related(comments_prefetch)
    if query:
        shorts_qs = shorts_qs.filter(
            Q(title__icontains=query) |
            Q(product_title__icontains=query) |
            Q(summary__icontains=query)
        )

    context = {
        'shorts': list(shorts_qs.order_by('-views' if sort == 'trending' else '-created_at')),
        'selected_category': category,
        'query': query,
        'sort': sort,
        'all_products': list(MasterProduct.objects.all()[:20]),
        'jsonld': jsonld_script(video_list_jsonld(list(shorts_qs[:20]), request)),
    }
    return render(request, 'media_hub/shorts_page.html', context)


@require_POST
def short_like_view(request, canonical_id):
    """Persistent like: +1 once per visitor per short (session-throttled)."""
    short = Short.objects.filter(canonical_id=canonical_id).first()
    if not short:
        return JsonResponse({'error': 'not found'}, status=404)
    visitor_key = request.session.session_key or request.META.get('REMOTE_ADDR', 'anon')
    throttle_key = f'sp:liked:{visitor_key}:{canonical_id}'
    if not cache.get(throttle_key):
        cache.set(throttle_key, 1, 86400)
        Short.objects.filter(pk=short.pk).update(likes=short.likes + 1)
        short.likes += 1
    return JsonResponse({'likes': short.likes})


@require_POST
def short_view_increment_view(request, canonical_id):
    """Persistent view: +1 once per visitor per short per hour (throttled)."""
    short = Short.objects.filter(canonical_id=canonical_id).first()
    if not short:
        return JsonResponse({'error': 'not found'}, status=404)
    visitor_key = request.session.session_key or request.META.get('REMOTE_ADDR', 'anon')
    throttle_key = f'sp:shortview:{visitor_key}:{canonical_id}'
    if not cache.get(throttle_key):
        cache.set(throttle_key, 1, 3600)
        Short.objects.filter(pk=short.pk).update(views=short.views + 1)
        short.views += 1
    return JsonResponse({'views': short.views})


@require_POST
def short_comment_create_view(request, canonical_id):
    """Comment on a short (live, staff can remove via admin)."""
    from .models import ShortComment

    short = Short.objects.filter(canonical_id=canonical_id).first()
    if not short:
        raise Http404('Short not found')
    comment = (request.POST.get('comment') or '').strip()
    if comment:
        author = (request.POST.get('author_name') or '').strip()[:120] or 'Viewer'
        ShortComment.objects.create(short=short, author_name=author, comment=comment)
        messages.success(request, 'Comment posted.')
    return redirect('/shorts')

