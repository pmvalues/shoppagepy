"""Static policy pages.

These exist because the site footer links them; the copy states only what the
platform factually does. Final legal wording remains the operator's call.
"""

from __future__ import annotations

from django.http import Http404
from django.shortcuts import render

UPDATED = '2026-08-28'

LEGAL_PAGES: dict[str, dict] = {
    'privacy': {
        'heading': 'Privacy',
        'sections': [
            ('What Shoppage records',
             'Shoppage indexes publicly listed merchant and product data and records the '
             'outbound actions it takes on your behalf: which offer you opened, which merchant '
             'you contacted, and the timestamp of that hand-off. This lets a merchant see that a '
             'conversation started from a Shoppage listing.'),
            ('What Shoppage does not do',
             'Shoppage does not run a cart, take payment, hold funds, store card or banking '
             'details, custody stock, or fulfil orders. Commercial transactions happen directly '
             'between you and the merchant, on the merchant channel you choose.'),
            ('Third parties',
             'Following a listing takes you to a merchant-owned channel (WhatsApp, a retailer '
             'website, or a physical stall). Their own privacy practices apply from that point.'),
            ('Requests',
             'To see, correct or remove data about you or your business, contact the operator '
             'address published for this deployment.'),
        ],
    },
    'terms': {
        'heading': 'Terms of use',
        'sections': [
            ('What the grid shows',
             'Listings describe merchant offers as published or confirmed at a point in time. Each '
             'offer carries the moment it was last confirmed and an expiry window; treat both as '
             'the validity boundary of that price or stock claim.'),
            ('No transaction liability',
             'Shoppage does not sell, deliver, warrant, guarantee or refund the products listed. '
             'Prices, stock and warranties are the responsibility of the merchant you transact with.'),
            ('Verification states',
             'A profile marked claimed and verified has been confirmed with the operator. Preloaded '
             'candidate profiles are unclaimed directory entries and are labelled as such.'),
            ('Acceptable use',
             'Do not scrape the feeds or APIs for purposes that misrepresent merchant data, publish '
             'listings you do not control, or present Shoppage-generated figures as your own '
             'verification.'),
        ],
    },
    'security': {
        'heading': 'Security & disclosure',
        'sections': [
            ('Data integrity controls',
             'Product identifiers are validated against their GS1 check digit before publication, '
             'offer prices carry confirmation and expiry timestamps, and structured data only '
             'publishes attributes a record actually holds.'),
            ('Report a problem',
             'Report vulnerabilities, incorrect listings or impersonating profiles to the operator '
             'contact published for this deployment. Include the affected URL and what you observed.'),
            ('Listing takedown',
             'Businesses that do not want their public listing held in the directory can request '
             'removal; the profile is offboarded and excluded from feeds and structured data.'),
        ],
    },
}


def legal_page_view(request, slug: str):
    page = LEGAL_PAGES.get(slug)
    if not page:
        raise Http404('Page not found')
    return render(request, 'core/legal_page.html', {
        'heading': page['heading'],
        'sections': page['sections'],
        'updated': UPDATED,
        'page_title': f'{page["heading"]} | Shoppage',
        'canonical_path': f'/{slug}/',
        'robots_meta': 'noindex,follow',
    })
