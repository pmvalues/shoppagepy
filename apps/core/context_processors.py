def shoppage_global_context(request):
    """
    Global context processor providing baseline counters, search placeholders,
    and platform metadata across all Django templates without slow table scans.
    """
    return {
        'total_products_count': 1000000,
        'total_merchants_count': 3100000,
        'total_malls_count': 3296,
        'provinces_count': 9,
        'site_title': 'Shoppage — South Africa National Commerce Grid',
    }
