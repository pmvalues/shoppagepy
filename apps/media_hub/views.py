from apps.catalog.models import MasterProduct
from apps.core.seo import jsonld_script, video_jsonld, video_list_jsonld
from django.contrib import messages
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

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

    shorts_qs = Short.objects.filter(moderation_state='approved').select_related('master_product', 'merchant', 'market')
    if query:
        shorts_qs = shorts_qs.filter(
            Q(title__icontains=query) |
            Q(product_title__icontains=query) |
            Q(summary__icontains=query)
        )

    # Handle short submission from creator studio
    if request.method == 'POST':
        title = request.POST.get('title')
        video_url = request.POST.get('video_url')
        merchant_name = request.POST.get('merchant_name', 'Verified Creator')
        whatsapp = request.POST.get('whatsapp')
        product_id = request.POST.get('product_id')

        product = MasterProduct.objects.filter(canonical_id=product_id).first() if product_id else None

        canonical_id = f"sh_{title.lower().replace(' ', '_')[:20]}"
        Short.objects.create(
            canonical_id=canonical_id,
            title=title,
            video_url=video_url or "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1508873696983-2df57046475a",
            merchant_name=merchant_name,
            merchant_whatsapp=whatsapp,
            master_product=product,
            moderation_state='approved',
        )
        messages.success(request, f"Proof short '{title}' published successfully!")
        return redirect('/shorts')

    context = {
        'shorts': list(shorts_qs),
        'selected_category': category,
        'query': query,
        'all_products': list(MasterProduct.objects.all()[:20]),
        'jsonld': jsonld_script(video_list_jsonld(list(shorts_qs[:20]), request)),
    }
    return render(request, 'media_hub/shorts_page.html', context)

