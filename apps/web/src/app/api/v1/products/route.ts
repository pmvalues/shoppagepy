import { NextRequest, NextResponse } from 'next/server';
import { SA_CANONICAL_PRODUCTS } from '@shoppage/kernel';

/**
 * Public Products API Endpoint (/api/v1/products)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const status = searchParams.get('status');

  let filtered = [...SA_CANONICAL_PRODUCTS];

  if (category) {
    filtered = filtered.filter((p) => p.categoryRef === category);
  }
  if (brand) {
    filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
  }
  if (status) {
    filtered = filtered.filter((p) => p.status === status);
  }

  return NextResponse.json({
    products: filtered,
    totalCount: filtered.length,
  });
}
