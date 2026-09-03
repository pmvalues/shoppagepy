import { NextRequest, NextResponse } from 'next/server';
import { PayloadMerchantCmsService } from '@/cms';
import {
  parseCsv,
  validateMerchantRows,
  validateProductRows,
  MERCHANT_CSV_TEMPLATE,
  PRODUCT_CSV_TEMPLATE,
  type ImportCollection,
} from '@/lib/csv-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const expected = (process.env.SHOPPAGE_ADMIN_TOKEN || '').trim();
  if (!expected) return false;
  const provided = (req.headers.get('x-admin-token') || '').trim();
  return provided.length > 0 && provided === expected;
}

export async function GET(req: NextRequest) {
  const kind = new URL(req.url).searchParams.get('collection');
  if (kind === 'products') {
    return new NextResponse(PRODUCT_CSV_TEMPLATE, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="products-template.csv"' },
    });
  }
  if (kind === 'merchants') {
    return new NextResponse(MERCHANT_CSV_TEMPLATE, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="merchants-template.csv"' },
    });
  }
  return NextResponse.json({ error: 'Use ?collection=products or ?collection=merchants' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    const configured = Boolean((process.env.SHOPPAGE_ADMIN_TOKEN || '').trim());
    return NextResponse.json(
      { error: configured ? 'Invalid admin token' : 'Import is not configured yet' },
      { status: configured ? 401 : 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const collection = String(form.get('collection') || '') as ImportCollection;
  if (collection !== 'merchants' && collection !== 'products') {
    return NextResponse.json({ error: "collection must be 'merchants' or 'products'" }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing CSV file field' }, { status: 400 });
  }
  const dryRun = String(form.get('dryRun') || 'true').toLowerCase() !== 'false';

  let text: string;
  try {
    text = await file.text();
  } catch {
    return NextResponse.json({ error: 'Could not read uploaded file' }, { status: 400 });
  }
  if (text.length > 5_000_000) {
    return NextResponse.json({ error: 'File too large (5MB max)' }, { status: 413 });
  }

  const rows = parseCsv(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV needs a header row plus at least one data row' }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (collection === 'merchants') {
    const result = validateMerchantRows(rows);
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        collection,
        total: result.total,
        valid: result.valid.length,
        errors: result.errors,
        sample: result.valid.slice(0, 5),
      });
    }
    let imported = 0;
    const failures: Array<{ row: string; message: string }> = [];
    result.valid.forEach((m, i) => {
      try {
        PayloadMerchantCmsService.upsertMerchant({
          id: `cms_mer_${Date.now()}_${i}`,
          name: m.name,
          addressText: m.addressText,
          province: m.province,
          category: m.category,
          googleRating: 0,
          googleReviewsCount: 0,
          operatingHours: '',
          medianResponseMinutes: 0,
          verificationState: 'unverified',
          contacts: {
            telephone: m.telephone,
            whatsapp: m.whatsapp,
            email: m.email,
            website: m.website,
          },
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      } catch (err) {
        failures.push({ row: m.name, message: err instanceof Error ? err.message : 'Insert failed' });
      }
    });
    return NextResponse.json({
      dryRun: false,
      collection,
      total: result.total,
      imported,
      failed: failures,
      errors: result.errors,
    });
  }

  const result = validateProductRows(rows, (id) => PayloadMerchantCmsService.getMerchant(id) !== null);
  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      collection,
      total: result.total,
      valid: result.valid.length,
      errors: result.errors,
      sample: result.valid.slice(0, 5),
    });
  }
  let imported = 0;
  const failures: Array<{ row: string; message: string }> = [];
  result.valid.forEach((p, i) => {
    try {
      PayloadMerchantCmsService.upsertProduct({
        id: `cms_prd_${Date.now()}_${i}`,
        merchantId: p.merchantId,
        sku: p.sku || `CMS-${Date.now()}-${i}`,
        title: p.title,
        brand: p.brand,
        category: p.category,
        price: p.price,
        regularPrice: p.price,
        salePrice: null,
        taxStatus: 'taxable',
        taxClass: 'standard',
        inStock: p.stockQty > 0,
        stockQty: p.stockQty,
        lowStockThreshold: 2,
        backorders: 'notify',
        warranty: p.warranty,
        specs: p.specs,
        description: p.description,
        featuredImage: p.featuredImage,
        galleryImages: p.featuredImage ? [p.featuredImage] : [],
        compliance: { sabsApproved: false, warrantyYears: 1 },
        feedStatus: 'Active',
        viewsCount: 0,
        salesCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      imported++;
    } catch (err) {
      failures.push({ row: p.title, message: err instanceof Error ? err.message : 'Insert failed' });
    }
  });
  return NextResponse.json({
    dryRun: false,
    collection,
    total: result.total,
    imported,
    failed: failures,
    errors: result.errors,
  });
}
