import { NextRequest, NextResponse } from 'next/server';
import { PayloadMerchantCmsService } from '@/cms';

export async function GET(req: NextRequest, { params }: { params: { collection: string } }) {
  const { searchParams } = new URL(req.url);
  const collection = params.collection;
  const merchantId = searchParams.get('merchantId') || 'loc_mitrend_midrand';
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const id = searchParams.get('id');

  try {
    switch (collection) {
      case 'merchants': {
        if (id) {
          const doc = PayloadMerchantCmsService.getMerchant(id);
          return NextResponse.json({ doc });
        }
        const doc = PayloadMerchantCmsService.getMerchant(merchantId);
        return NextResponse.json({ doc });
      }

      case 'products': {
        if (id) {
          const doc = PayloadMerchantCmsService.getProductById(id);
          return NextResponse.json({ doc });
        }
        const docs = PayloadMerchantCmsService.getProducts(merchantId, query);
        return NextResponse.json({ docs, total: docs.length });
      }

      case 'media': {
        const docs = PayloadMerchantCmsService.getMedia(merchantId);
        return NextResponse.json({ docs, total: docs.length });
      }

      case 'shorts':
      case 'shows':
      case 'shorts-and-shows': {
        const docs = PayloadMerchantCmsService.getShortsAndShows(merchantId);
        return NextResponse.json({ docs, total: docs.length });
      }

      case 'orders': {
        const docs = PayloadMerchantCmsService.getOrders(merchantId);
        return NextResponse.json({ docs, total: docs.length });
      }

      case 'customers': {
        const docs = PayloadMerchantCmsService.getCustomers(merchantId);
        return NextResponse.json({ docs, total: docs.length });
      }

      default:
        return NextResponse.json({ error: `Unknown collection '${collection}'` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CMS internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { collection: string } }) {
  const collection = params.collection;

  try {
    const body = await req.json();

    switch (collection) {
      case 'products': {
        const created = PayloadMerchantCmsService.createProduct(body);
        return NextResponse.json({ doc: created, status: 'created' }, { status: 201 });
      }

      case 'merchants': {
        const updated = PayloadMerchantCmsService.updateMerchant(body.id, body);
        return NextResponse.json({ doc: updated, status: 'saved' });
      }

      default:
        return NextResponse.json({ error: `Cannot POST to collection '${collection}'` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CMS write error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { collection: string } }) {
  const collection = params.collection;

  try {
    const body = await req.json();

    switch (collection) {
      case 'products': {
        const updated = PayloadMerchantCmsService.updateProduct(body.id, body);
        return NextResponse.json({ doc: updated, status: 'updated' });
      }

      case 'merchants': {
        const updated = PayloadMerchantCmsService.updateMerchant(body.id, body);
        return NextResponse.json({ doc: updated, status: 'updated' });
      }

      case 'orders': {
        const updated = PayloadMerchantCmsService.updateOrderStatus(body.id, body.orderStatus);
        return NextResponse.json({ doc: updated, status: 'updated' });
      }

      default:
        return NextResponse.json({ error: `Cannot PUT to collection '${collection}'` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CMS update error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { collection: string } }) {
  const collection = params.collection;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
  }

  try {
    switch (collection) {
      case 'products': {
        const success = PayloadMerchantCmsService.deleteProduct(id);
        return NextResponse.json({ success, id });
      }

      default:
        return NextResponse.json({ error: `Cannot DELETE from collection '${collection}'` }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CMS delete error' }, { status: 500 });
  }
}
