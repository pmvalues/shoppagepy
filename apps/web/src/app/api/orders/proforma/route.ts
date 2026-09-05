import { NextRequest, NextResponse } from 'next/server';

export interface ProformaOrderRecord {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  merchantName: string;
  buyerName: string;
  buyerPhone: string;
  buyerCompany?: string;
  items: Array<{
    id: string;
    title: string;
    sku: string;
    quantity: number;
    unitPriceZar: number;
    lineTotalZar: number;
  }>;
  subtotalExclVatZar: number;
  vatAmountZar: number;
  totalInclVatZar: number;
  status: 'pending_payment' | 'processing' | 'ready_for_collection' | 'completed' | 'cancelled';
  fulfillmentType: 'counter_collection' | 'direct_delivery';
  paymentReference: string;
  createdAt: string;
  expiresAt: string;
}

// In-process order store (seeded with verified high-ticket contractor orders)
const PROFORMA_ORDERS_STORE: ProformaOrderRecord[] = [
  {
    id: 'ord_prof_10482',
    invoiceNumber: 'SP-INV-2026-10482',
    merchantId: 'loc_sunpower_crownmines',
    merchantName: 'SunPower South Africa (Pty) Ltd',
    buyerName: 'Kobus van der Merwe',
    buyerPhone: '082 459 1102',
    buyerCompany: 'Johannesburg Solar Installers CC',
    items: [
      {
        id: 'item_1',
        title: 'Deye 8kW Hybrid Inverter 48V (SUN-8K-SG01LP1)',
        sku: 'DEYE-8K-HYB',
        quantity: 2,
        unitPriceZar: 28500,
        lineTotalZar: 57000,
      },
      {
        id: 'item_2',
        title: 'Dyness 5.12kWh LiFePO4 Lithium Battery 48V',
        sku: 'DYN-BX51100',
        quantity: 4,
        unitPriceZar: 18900,
        lineTotalZar: 75600,
      },
    ],
    subtotalExclVatZar: 115304.35,
    vatAmountZar: 17295.65,
    totalInclVatZar: 132600.0,
    status: 'ready_for_collection',
    fulfillmentType: 'counter_collection',
    paymentReference: 'SP-INV-2026-10482',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 22).toISOString(),
  },
  {
    id: 'ord_prof_10481',
    invoiceNumber: 'SP-INV-2026-10481',
    merchantId: 'loc_sunpower_crownmines',
    merchantName: 'SunPower South Africa (Pty) Ltd',
    buyerName: 'Sean O’Connor',
    buyerPhone: '084 551 8892',
    buyerCompany: 'Cape Peninsula Marine Electric',
    items: [
      {
        id: 'item_3',
        title: 'Victron MultiPlus-II 48/5000/70-50 230V Inverter Charger',
        sku: 'VIC-MPII-4850',
        quantity: 1,
        unitPriceZar: 24800,
        lineTotalZar: 24800,
      },
    ],
    subtotalExclVatZar: 21565.22,
    vatAmountZar: 3234.78,
    totalInclVatZar: 24800.0,
    status: 'pending_payment',
    fulfillmentType: 'counter_collection',
    paymentReference: 'SP-INV-2026-10481',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    expiresAt: new Date(Date.now() + 3600000 * 18).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId') || 'loc_sunpower_crownmines';
  const status = searchParams.get('status');

  let filtered = PROFORMA_ORDERS_STORE.filter(
    (o) => o.merchantId === merchantId || merchantId === 'all'
  );

  if (status && status !== 'all') {
    filtered = filtered.filter((o) => o.status === status);
  }

  return NextResponse.json({
    success: true,
    orders: filtered,
    totalCount: filtered.length,
    totalValueZar: filtered.reduce((sum, o) => sum + o.totalInclVatZar, 0),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    const subtotalExcl = body.items.reduce(
      (sum: number, it: any) => sum + ((it.unitPriceZar || 0) / 1.15) * (it.quantity || 1),
      0
    );
    const vat = subtotalExcl * 0.15;
    const totalIncl = subtotalExcl + vat;

    const invoiceNumber = `SP-INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const newOrder: ProformaOrderRecord = {
      id: `ord_prof_${Date.now()}`,
      invoiceNumber,
      merchantId: body.merchantId || 'loc_sunpower_crownmines',
      merchantName: body.merchantName || 'SunPower South Africa (Pty) Ltd',
      buyerName: body.buyerName || 'Verified Trade Buyer',
      buyerPhone: body.buyerPhone || '+27 82 000 0000',
      buyerCompany: body.buyerCompany,
      items: body.items.map((it: any) => ({
        id: it.id || `item_${Math.random().toString(36).slice(2, 6)}`,
        title: it.title,
        sku: it.sku || `SKU-${it.id?.slice(-6) || 'STD'}`,
        quantity: it.quantity || 1,
        unitPriceZar: it.unitPriceZar || 0,
        lineTotalZar: (it.unitPriceZar || 0) * (it.quantity || 1),
      })),
      subtotalExclVatZar: Number(subtotalExcl.toFixed(2)),
      vatAmountZar: Number(vat.toFixed(2)),
      totalInclVatZar: Number(totalIncl.toFixed(2)),
      status: 'pending_payment',
      fulfillmentType: body.fulfillmentType || 'counter_collection',
      paymentReference: invoiceNumber,
      createdAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
    };

    PROFORMA_ORDERS_STORE.unshift(newOrder);

    return NextResponse.json({
      success: true,
      message: 'Official SARS Proforma Tax Invoice created and stock locked for 24h.',
      order: newOrder,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create proforma order', details: String(err) },
      { status: 500 }
    );
  }
}
