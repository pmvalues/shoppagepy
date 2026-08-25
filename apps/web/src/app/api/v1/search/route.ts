import { NextRequest, NextResponse } from 'next/server';
import { SearchQuerySchema } from '@shoppage/contracts';
import { InMemorySearchEngine } from '@shoppage/adapters';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_OFFERS } from '@shoppage/kernel';

// Initialize search engine with seed data
const searchEngine = new InMemorySearchEngine();
for (const variant of SA_CANONICAL_PRODUCTS) {
  searchEngine.indexVariant(variant);
}
for (const offer of SA_FLAGSHIP_OFFERS) {
  searchEngine.indexOffer(offer);
}

/**
 * Public Search API Endpoint (/api/v1/search)
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

    const results = searchEngine.search(parseResult.data);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal search engine error', message: String(error) },
      { status: 500 }
    );
  }
}
