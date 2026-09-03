export const dynamic = 'force-dynamic';

import { semanticSearch } from '@/lib/intelligence';
import GoogleHeader from '@/components/GoogleHeader';
import SponsoredCarousel from '@/components/SponsoredCarousel';
import CollapsibleLocalMap from '@/components/CollapsibleLocalMap';
import OrganicWebResults from '@/components/OrganicWebResults';
import PeopleAlsoSearch from '@/components/PeopleAlsoSearch';
import GooglePagination from '@/components/GooglePagination';
import ShoppingBrowseGrid from '@/components/ShoppingBrowseGrid';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; brand?: string; page?: string; tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || resolvedSearchParams.category || 'solar';
  const currentTab = resolvedSearchParams.tab || 'all';
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 24;

  const searchResults = await semanticSearch(query, {
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const isShoppingMode = currentTab === 'shopping';

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', color: '#202124' }}>
      {/* Top Google/Shoppage SERP Header Bar */}
      <GoogleHeader currentQuery={resolvedSearchParams.q || ''} currentTab={currentTab} />

      <main className="container" style={{ paddingTop: '1.75rem', paddingBottom: '4rem' }}>
        {/* Top Sponsored Products Row (Present in both All and Shopping mode) */}
        <SponsoredCarousel products={searchResults.products} />

        {isShoppingMode ? (
          /* Google Shopping Mode: 5-Column Grid with Refine Left Drawer */
          <>
            <div className="shop-toolbar">
              <div className="shop-toolbar-count">
                Showing <strong>{searchResults.products.length}</strong> products
                {query ? <> for “<strong>{query}</strong>”</> : null}
              </div>
              <div className="shop-toolbar-right">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort:</span>
                <select
                  defaultValue="relevance"
                  onChange={(e) => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('sort', e.target.value);
                    window.location.href = url.toString();
                  }}
                >
                  <option value="relevance">Relevance / Rank</option>
                  <option value="price_asc">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                  <option value="rating">Top Rated</option>
                </select>
                <div className="shop-view-toggle" role="group" aria-label="View mode">
                  <button type="button" className="is-active" title="Grid view" aria-label="Grid view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  </button>
                  <button type="button" title="List view" aria-label="List view">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <ShoppingBrowseGrid products={searchResults.products} />
          </>
        ) : (
          /* Clean Organic Search Stream */
          <div style={{ maxWidth: '840px', width: '100%' }}>
            {/* Collapsible Local Places / Map Component (DEFAULT CLOSED) */}
            <div style={{ minHeight: '44px' }}>
              <CollapsibleLocalMap merchants={searchResults.merchants} />
            </div>

            {/* Organic Web Search Listings */}
            <OrganicWebResults
              query={query}
              products={searchResults.products}
              merchants={searchResults.merchants}
            />

            {/* 2-Column People Also Search For Grid */}
            <PeopleAlsoSearch query={query} />
          </div>
        )}

        {/* ShoppageTime Pagination Footer */}
        <GooglePagination currentPage={currentPage} query={query} />
      </main>
    </div>
  );
}
