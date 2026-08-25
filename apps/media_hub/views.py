from django.shortcuts import render, get_object_or_404
from .models import Show, Short

def shows_directory_view(request):
    category_filter = request.GET.get('category')
    shows_qs = Show.objects.filter(status='active')
    if category_filter:
        shows_qs = shows_qs.filter(category=category_filter)

    context = {
        'shows': shows_qs,
        'selected_category': category_filter,
    }
    return render(request, 'media_hub/shows_page.html', context)

def show_detail_view(request, slug):
    show = get_object_or_404(Show, slug=slug)
    related_shows = Show.objects.filter(status='active').exclude(id=show.id)[:4]

    context = {
        'show': show,
        'related_shows': related_shows,
    }
    return render(request, 'media_hub/show_detail.html', context)

def shorts_directory_view(request):
    shorts = Short.objects.filter(moderation_state='approved')

    context = {
        'shorts': shorts,
    }
    return render(request, 'media_hub/shorts_page.html', context)
