export const dynamic = 'force-dynamic';

import { semanticSearch } from '@/lib/intelligence';
import GoogleHeader from '@/components/GoogleHeader';
import SponsoredCarousel from '@/components/SponsoredCarousel';
import CollapsibleLocalMap from '@/components/CollapsibleLocalMap';
import KnowledgePanel from '@/components/KnowledgePanel';
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

  const searchResults = semanticSearch(query, {
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
          <ShoppingBrowseGrid products={searchResults.products} />
        ) : (
          /* Google All Mode: Left Organic Results + Nearby Places Map, Right Knowledge Panel */
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '3rem', alignItems: 'flex-start' }}>
            {/* Left Main Stream */}
            <div style={{ minWidth: 0 }}>
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

            {/* Right-Hand Knowledge Panel / Entity Box */}
            <aside style={{ position: 'sticky', top: '100px', minHeight: '380px' }}>
              <KnowledgePanel query={query} products={searchResults.products} />
            </aside>
          </div>
        )}

        {/* ShoppageTime Pagination Footer */}
        <GooglePagination currentPage={currentPage} query={query} />
      </main>
    </div>
  );
}
