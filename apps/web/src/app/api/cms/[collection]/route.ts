import { NextRequest, NextResponse } from 'next/server';
import { PayloadMerchantCmsService } from '@/cms';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const { searchParams } = new URL(req.url);
  const resolvedParams = await params;
  const collection = resolvedParams.collection;
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
      case 'shows': {
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
        return NextResponse.json({ error: `Unknown collection '${collection}'` }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CMS operation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const resolvedParams = await params;
  const collection = resolvedParams.collection;

  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication session required' }, { status: 401 });
  }

  try {
    const data = await req.json();

    switch (collection) {
      case 'products': {
        const effectiveMerchantId =
          session.role === 'superadmin'
            ? data.merchantId || session.merchantId || 'loc_mitrend_midrand'
            : session.merchantId;

        if (!effectiveMerchantId) {
          return NextResponse.json(
            { error: 'Forbidden: No merchant tenant associated with session' },
            { status: 403 }
          );
        }

        if (session.role !== 'superadmin' && data.merchantId && data.merchantId !== session.merchantId) {
          return NextResponse.json(
            { error: 'Forbidden: Cross-tenant product creation blocked' },
            { status: 403 }
          );
        }

        const doc = PayloadMerchantCmsService.createProduct({
          ...data,
          merchantId: effectiveMerchantId,
        });
        return NextResponse.json({ success: true, doc }, { status: 201 });
      }

      default:
        return NextResponse.json({ error: `POST not supported for '${collection}'` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CMS create failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const resolvedParams = await params;
  const collection = resolvedParams.collection;

  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication session required' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const effectiveMerchantId =
      session.role === 'superadmin'
        ? data.merchantId || session.merchantId || 'loc_mitrend_midrand'
        : session.merchantId;

    if (!effectiveMerchantId) {
      return NextResponse.json(
        { error: 'Forbidden: No merchant tenant associated with session' },
        { status: 403 }
      );
    }

    if (session.role !== 'superadmin' && data.merchantId && data.merchantId !== session.merchantId) {
      return NextResponse.json(
        { error: 'Forbidden: Cross-tenant modification blocked' },
        { status: 403 }
      );
    }

    switch (collection) {
      case 'merchants': {
        const doc = PayloadMerchantCmsService.updateMerchant(effectiveMerchantId, data);
        return NextResponse.json({ success: true, doc });
      }

      case 'products': {
        if (!data.id) return NextResponse.json({ error: 'Product id required' }, { status: 400 });

        // Verify product ownership if not superadmin
        if (session.role !== 'superadmin') {
          const existing = PayloadMerchantCmsService.getProductById(data.id);
          if (existing && existing.merchantId !== session.merchantId) {
            return NextResponse.json(
              { error: 'Forbidden: Cross-tenant product update blocked' },
              { status: 403 }
            );
          }
        }

        const doc = PayloadMerchantCmsService.updateProduct(data.id, data);
        return NextResponse.json({ success: true, doc });
      }

      case 'orders': {
        if (!data.id || !data.orderStatus) {
          return NextResponse.json({ error: 'Order id and orderStatus required' }, { status: 400 });
        }
        const doc = PayloadMerchantCmsService.updateOrderStatus(data.id, data.orderStatus);
        return NextResponse.json({ success: true, doc });
      }

      default:
        return NextResponse.json({ error: `PUT not supported for '${collection}'` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CMS update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  const resolvedParams = await params;
  const collection = resolvedParams.collection;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id param required' }, { status: 400 });

  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication session required' }, { status: 401 });
  }

  try {
    switch (collection) {
      case 'products': {
        if (session.role !== 'superadmin') {
          const existing = PayloadMerchantCmsService.getProductById(id);
          if (existing && existing.merchantId !== session.merchantId) {
            return NextResponse.json(
              { error: 'Forbidden: Cross-tenant product deletion blocked' },
              { status: 403 }
            );
          }
        }

        const success = PayloadMerchantCmsService.deleteProduct(id);
        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json({ error: `DELETE not supported for '${collection}'` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'CMS delete failed' }, { status: 500 });
  }
}

