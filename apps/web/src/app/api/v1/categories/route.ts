import { NextRequest, NextResponse } from 'next/server';
import { GoogleTaxonomyEngine } from '@shoppage/kernel';

const taxonomyEngine = new GoogleTaxonomyEngine();

/**
 * Public Categories & Google Product Taxonomy API Endpoint (/api/v1/categories)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const parentId = searchParams.get('parentId');
  const slug = searchParams.get('slug');

  if (slug) {
    const category = taxonomyEngine.getCategoryBySlug(slug);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const breadcrumbs = taxonomyEngine.getBreadcrumbs(category.id);
    const children = taxonomyEngine.getChildren(category.id);
    return NextResponse.json({ category, breadcrumbs, children });
  }

  if (query) {
    const results = taxonomyEngine.searchCategories(query);
    return NextResponse.json({ categories: results, totalCount: results.length });
  }

  // Otherwise return child categories for parentId (or root level if parentId is not provided)
  const parentNum = parentId ? parseInt(parentId, 10) : undefined;
  const categories = taxonomyEngine.getChildren(parentNum);

  return NextResponse.json({
    categories,
    totalCount: categories.length,
    isRoot: parentNum === undefined,
  });
}
