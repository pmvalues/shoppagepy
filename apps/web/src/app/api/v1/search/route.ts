import { NextRequest, NextResponse } from 'next/server';
import { SearchQuerySchema } from '@shoppage/contracts';
import { HybridSearchEngine } from '@shoppage/adapters';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS } from '@shoppage/kernel';

// Initialize hybrid search engine (Typesense when available, with in-process fallback)
const searchEngine = new HybridSearchEngine();
for (const variant of SA_CANONICAL_PRODUCTS) {
  searchEngine.indexVariant(variant);
}
for (const offer of SA_FLAGSHIP_OFFERS) {
  searchEngine.indexOffer(offer);
}

/**
 * Public Search API Endpoint (/api/v1/search)
 * Backed by Typesense 26.0 with automatic SQLite FTS5 fallback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = SearchQuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const results = await searchEngine.search(parseResult.data);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal search engine error', message: String(error) },
      { status: 500 }
    );
  }
}
