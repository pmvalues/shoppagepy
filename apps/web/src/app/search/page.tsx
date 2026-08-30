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

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; brand?: string; page?: string; tab?: string };
}) {
  const query = searchParams.q || searchParams.category || 'solar';
  const currentTab = searchParams.tab || 'all';
  const currentPage = parseInt(searchParams.page || '1', 10);
  const pageSize = 24;

  const searchResults = semanticSearch(query, {
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const isShoppingMode = currentTab === 'shopping';

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', color: '#202124' }}>
      {/* Top Google/Shoppage SERP Header Bar */}
      <GoogleHeader currentQuery={searchParams.q || ''} currentTab={currentTab} />

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
            <div>
              {/* Collapsible Local Places / Map Component (DEFAULT CLOSED) */}
              <CollapsibleLocalMap merchants={searchResults.merchants} />

              {/* Organic Web Search Listings */}
              <OrganicWebResults query={query} />

              {/* 2-Column People Also Search For Grid */}
              <PeopleAlsoSearch query={query} />
            </div>

            {/* Right-Hand Knowledge Panel / Entity Box */}
            <aside style={{ position: 'sticky', top: '100px' }}>
              <KnowledgePanel query={query} />
            </aside>
          </div>
        )}

        {/* Shooooooooppage Google-Style Pagination Footer */}
        <GooglePagination currentPage={currentPage} query={query} />
      </main>
    </div>
  );
}
