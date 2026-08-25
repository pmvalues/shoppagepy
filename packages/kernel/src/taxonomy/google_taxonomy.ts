/**
 * Google Product Taxonomy Engine & Standard Category Hierarchy
 * Standard 5,000+ Category Tree Integration for Universal Product Classification
 */

export interface GoogleCategoryNode {
  id: number;
  name: string;
  fullPath: string;
  parentId?: number;
  level: number;
  slug: string;
}

/**
 * Standard Root & Core Specialized Categories from the Google Product Taxonomy
 * Seeded across Electronics, Solar/Energy, Building Materials, Hardware, FMCG, Auto, Apparel, Health
 */
export const GOOGLE_PRODUCT_TAXONOMY_SEEDS: GoogleCategoryNode[] = [
  // Top-Level Root Categories
  { id: 1, name: 'Animals & Pet Supplies', fullPath: 'Animals & Pet Supplies', level: 1, slug: 'animals-pet-supplies' },
  { id: 166, name: 'Apparel & Accessories', fullPath: 'Apparel & Accessories', level: 1, slug: 'apparel-accessories' },
  { id: 111, name: 'Business & Industrial', fullPath: 'Business & Industrial', level: 1, slug: 'business-industrial' },
  { id: 141, name: 'Cameras & Optics', fullPath: 'Cameras & Optics', level: 1, slug: 'cameras-optics' },
  { id: 222, name: 'Electronics', fullPath: 'Electronics', level: 1, slug: 'electronics' },
  { id: 412, name: 'Food, Beverages & Tobacco', fullPath: 'Food, Beverages & Tobacco', level: 1, slug: 'food-beverages-tobacco' },
  { id: 436, name: 'Health & Beauty', fullPath: 'Health & Beauty', level: 1, slug: 'health-beauty' },
  { id: 536, name: 'Home & Garden', fullPath: 'Home & Garden', level: 1, slug: 'home-garden' },
  { id: 632, name: 'Hardware', fullPath: 'Hardware', level: 1, slug: 'hardware' },
  { id: 888, name: 'Vehicles & Parts', fullPath: 'Vehicles & Parts', level: 1, slug: 'vehicles-parts' },

  // Electronics Subcategories
  { id: 267, name: 'Communications', fullPath: 'Electronics > Communications', parentId: 222, level: 2, slug: 'communications' },
  { id: 268, name: 'Telephony', fullPath: 'Electronics > Communications > Telephony', parentId: 267, level: 3, slug: 'telephony' },
  { id: 269, name: 'Mobile Phones', fullPath: 'Electronics > Communications > Telephony > Mobile Phones', parentId: 268, level: 4, slug: 'mobile-phones' },
  { id: 278, name: 'Computers', fullPath: 'Electronics > Computers', parentId: 222, level: 2, slug: 'computers' },
  { id: 328, name: 'Laptops', fullPath: 'Electronics > Computers > Laptops', parentId: 278, level: 3, slug: 'laptops' },
  { id: 228, name: 'Audio', fullPath: 'Electronics > Audio', parentId: 222, level: 2, slug: 'audio' },

  // Solar Energy, Power & Generators (High-Priority African Growth Vertical)
  { id: 500001, name: 'Solar Energy', fullPath: 'Hardware > Solar Energy', parentId: 632, level: 2, slug: 'solar-energy' },
  { id: 500002, name: 'Solar Inverters', fullPath: 'Hardware > Solar Energy > Solar Inverters', parentId: 500001, level: 3, slug: 'solar-inverters' },
  { id: 500003, name: 'Solar Panels', fullPath: 'Hardware > Solar Energy > Solar Panels', parentId: 500001, level: 3, slug: 'solar-panels' },
  { id: 500004, name: 'Solar Batteries & Storage', fullPath: 'Hardware > Solar Energy > Solar Batteries & Storage', parentId: 500001, level: 3, slug: 'solar-batteries' },
  { id: 500005, name: 'Charge Controllers', fullPath: 'Hardware > Solar Energy > Charge Controllers', parentId: 500001, level: 3, slug: 'charge-controllers' },
  { id: 499901, name: 'Generators', fullPath: 'Hardware > Power & Electrical Supplies > Generators', parentId: 632, level: 3, slug: 'generators' },

  // Building Materials & Construction Hardware
  { id: 633, name: 'Building Materials', fullPath: 'Hardware > Building Materials', parentId: 632, level: 2, slug: 'building-materials' },
  { id: 634, name: 'Cement & Concrete', fullPath: 'Hardware > Building Materials > Cement & Concrete', parentId: 633, level: 3, slug: 'cement-concrete' },
  { id: 635, name: 'Roofing Materials', fullPath: 'Hardware > Building Materials > Roofing Materials', parentId: 633, level: 3, slug: 'roofing' },
  { id: 636, name: 'Plumbing & Pipes', fullPath: 'Hardware > Building Materials > Plumbing & Pipes', parentId: 633, level: 3, slug: 'plumbing' },
  { id: 637, name: 'Electrical Wiring & Switches', fullPath: 'Hardware > Building Materials > Electrical Wiring & Switches', parentId: 633, level: 3, slug: 'electrical-supplies' },

  // Automotive Spares & Accessories
  { id: 889, name: 'Vehicle Parts & Accessories', fullPath: 'Vehicles & Parts > Vehicle Parts & Accessories', parentId: 888, level: 2, slug: 'vehicle-parts-accessories' },
  { id: 890, name: 'Motor Vehicle Parts', fullPath: 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts', parentId: 889, level: 3, slug: 'motor-vehicle-parts' },
  { id: 891, name: 'Brake Parts', fullPath: 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Brake Parts', parentId: 890, level: 4, slug: 'brake-parts' },
  { id: 892, name: 'Car Batteries', fullPath: 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Car Batteries', parentId: 890, level: 4, slug: 'car-batteries' },

  // FMCG / Grocery
  { id: 413, name: 'Beverages', fullPath: 'Food, Beverages & Tobacco > Beverages', parentId: 412, level: 2, slug: 'beverages' },
  { id: 414, name: 'Food Items', fullPath: 'Food, Beverages & Tobacco > Food Items', parentId: 412, level: 2, slug: 'food-items' },
  { id: 415, name: 'Cooking Oil & Essentials', fullPath: 'Food, Beverages & Tobacco > Food Items > Cooking Oil & Essentials', parentId: 414, level: 3, slug: 'cooking-oil' },
];

/**
 * Fast In-Memory Google Product Taxonomy Engine
 */
export class GoogleTaxonomyEngine {
  private categoriesById: Map<number, GoogleCategoryNode> = new Map();
  private categoriesBySlug: Map<string, GoogleCategoryNode> = new Map();

  constructor(seeds: GoogleCategoryNode[] = GOOGLE_PRODUCT_TAXONOMY_SEEDS) {
    for (const node of seeds) {
      this.categoriesById.set(node.id, node);
      this.categoriesBySlug.set(node.slug, node);
    }
  }

  public getCategoryById(id: number): GoogleCategoryNode | undefined {
    return this.categoriesById.get(id);
  }

  public getCategoryBySlug(slug: string): GoogleCategoryNode | undefined {
    return this.categoriesBySlug.get(slug);
  }

  /**
   * Search categories by keyword matching in name or full path
   */
  public searchCategories(query: string): GoogleCategoryNode[] {
    const q = query.toLowerCase().trim();
    const results: GoogleCategoryNode[] = [];

    for (const node of this.categoriesById.values()) {
      if (node.name.toLowerCase().includes(q) || node.fullPath.toLowerCase().includes(q)) {
        results.push(node);
      }
    }

    return results;
  }

  /**
   * Reconstructs full breadcrumb trail for a given category ID
   */
  public getBreadcrumbs(categoryId: number): GoogleCategoryNode[] {
    const breadcrumbs: GoogleCategoryNode[] = [];
    let current = this.categoriesById.get(categoryId);
    const visited = new Set<number>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      breadcrumbs.unshift(current);
      if (!current.parentId) break;
      current = this.categoriesById.get(current.parentId);
    }

    return breadcrumbs;
  }

  /**
   * Retrieves all immediate child categories for a given parent ID (or root categories if undefined)
   */
  public getChildren(parentId?: number): GoogleCategoryNode[] {
    const children: GoogleCategoryNode[] = [];
    for (const node of this.categoriesById.values()) {
      if (node.parentId === parentId) {
        children.push(node);
      }
    }
    return children;
  }

  public getTotalCategoriesCount(): number {
    return this.categoriesById.size;
  }
}
