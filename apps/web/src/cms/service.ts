// Payload CMS Merchant OS Local Service & In-Memory Store
import { MITREND_MERCHANT, MITREND_PRODUCTS, SA_FLAGSHIP_MERCHANTS } from '@shoppage/kernel';
import type {
  CmsMerchantDocument,
  CmsProductDocument,
  CmsMediaDocument,
  CmsShortOrShowDocument,
  CmsOrderDocument,
  CmsCustomerDocument,
} from './types';

// In-Memory Documents Stores initialized with seed data
const merchantsStore = new Map<string, CmsMerchantDocument>();
const productsStore = new Map<string, CmsProductDocument>();
const mediaStore = new Map<string, CmsMediaDocument>();
const shortsStore = new Map<string, CmsShortOrShowDocument>();
const ordersStore = new Map<string, CmsOrderDocument>();
const customersStore = new Map<string, CmsCustomerDocument>();

let isInitialized = false;

function ensureInitialized() {
  if (isInitialized) return;

  // 1. Initialize Mitrend Merchant Document
  const mitDoc: CmsMerchantDocument = {
    id: MITREND_MERCHANT.id,
    name: MITREND_MERCHANT.name,
    legalName: 'Mitrend Products (Pty) Ltd',
    category: MITREND_MERCHANT.category || 'packaging_catering',
    addressText: MITREND_MERCHANT.addressText,
    province: MITREND_MERCHANT.province || 'Gauteng',
    locality: 'Midrand Commercial Industrial Park',
    stallIdentifier: 'Warehouse ERF710',
    googleRating: MITREND_MERCHANT.googleRating || 4.9,
    googleReviewsCount: MITREND_MERCHANT.googleReviewsCount || 48,
    operatingHours: MITREND_MERCHANT.operatingHours || 'Mon-Fri 08:00 - 16:30',
    medianResponseMinutes: MITREND_MERCHANT.medianResponseMinutes || 5,
    verificationState: MITREND_MERCHANT.verificationState,
    contacts: {
      telephone: MITREND_MERCHANT.contacts.telephone || '+27105007670',
      whatsapp: MITREND_MERCHANT.contacts.whatsapp || '+27105007670',
      email: MITREND_MERCHANT.contacts.email || 'sales@mitrend.co.za',
      website: MITREND_MERCHANT.contacts.website || 'https://mitrend.co.za',
    },
    branding: {
      primaryColor: '#7F54B3',
      bannerUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1400&h=450&fit=crop',
      logoUrl: 'https://mitrend.co.za/wp-content/uploads/2021/04/mitrend-logo.png',
      tagline: 'Leading South African Hospitality, Packaging & Catering Equipment Wholesaler',
    },
    settings: {
      currency: 'ZAR',
      taxRate: 15,
      enableWhatsappCart: true,
      enableDirectEft: true,
      enablePayfast: false,
      shippingFlatRateZar: 150,
      freeShippingThresholdZar: 2500,
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  };
  merchantsStore.set(mitDoc.id, mitDoc);

  // 2. Initialize Other Flagship Merchants
  for (const m of SA_FLAGSHIP_MERCHANTS) {
    if (m.id === mitDoc.id) continue;
    merchantsStore.set(m.id, {
      id: m.id,
      name: m.name,
      legalName: m.name,
      category: m.category || 'solar_energy',
      addressText: m.addressText,
      province: m.province || 'Gauteng',
      stallIdentifier: m.stallIdentifier || 'Showroom Suite 1',
      googleRating: m.googleRating || 4.8,
      googleReviewsCount: m.googleReviewsCount || 32,
      operatingHours: m.operatingHours || 'Mon-Fri 08:30 - 17:00',
      medianResponseMinutes: m.medianResponseMinutes || 10,
      verificationState: m.verificationState,
      contacts: {
        telephone: m.contacts.telephone || '+27105007670',
        whatsapp: m.contacts.whatsapp || '+27105007670',
        email: m.contacts.email || 'info@shoppage.co.za',
        website: m.contacts.website || 'https://shoppage.co.za',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    });
  }

  // 3. Initialize Mitrend 157 Products in Payload Collection
  for (const p of MITREND_PRODUCTS) {
    const pDoc: CmsProductDocument = {
      id: p.id,
      merchantId: MITREND_MERCHANT.id,
      sku: p.sku,
      title: p.title,
      brand: p.brand,
      category: p.category,
      price: p.salePrice || p.price,
      regularPrice: p.price,
      salePrice: p.salePrice,
      taxStatus: 'taxable',
      taxClass: 'standard',
      inStock: p.inStock,
      stockQty: p.stockQty,
      lowStockThreshold: 10,
      backorders: 'notify',
      warranty: p.warranty,
      specs: p.specs,
      description: p.description,
      featuredImage: p.image,
      galleryImages: [p.image],
      compliance: {
        sabsApproved: true,
        nrs097Certified: false,
        warrantyYears: 1,
      },
      feedStatus: 'Active',
      viewsCount: 140 + Math.floor(Math.random() * 800),
      salesCount: 12 + Math.floor(Math.random() * 60),
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };
    productsStore.set(pDoc.id, pDoc);

    // Also populate media
    mediaStore.set(`med_${p.id}`, {
      id: `med_${p.id}`,
      merchantId: MITREND_MERCHANT.id,
      filename: `${p.sku.toLowerCase()}.jpg`,
      mimeType: 'image/jpeg',
      filesize: 145000,
      url: p.image,
      altText: p.title,
      mediaType: 'image',
      createdAt: '2026-01-01T00:00:00Z',
    });
  }

  // 4. Initialize Video Shorts and Shows
  const sampleShorts: CmsShortOrShowDocument[] = [
    {
      id: 'v_mit_1',
      merchantId: MITREND_MERCHANT.id,
      type: 'short',
      title: 'Commercial Anti-Theft Security Hotel Hangers Unboxing & Weight Test',
      description: 'Review of heavy-duty security ring hotel hangers with locking collar for guest rooms.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-kitchen-worker-preparing-food-in-a-restaurant-41480-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&h=800&fit=crop',
      durationSeconds: 45,
      viewsCount: 14820,
      likesCount: 924,
      taggedProductIds: ['mit_3361', 'mit_2088'],
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'v_mit_2',
      merchantId: MITREND_MERCHANT.id,
      type: 'show',
      title: 'Complete Commercial Kitchen Setup: Smallwares, Dosage Spoons & Packaging',
      description: 'Masterclass walk-through on standardizing commercial portion sizes with Food Safe SABS scoops.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-dish-with-care-41483-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=500&fit=crop',
      durationSeconds: 780,
      viewsCount: 6540,
      likesCount: 412,
      taggedProductIds: ['mit_8610', 'mit_8603', 'mit_8609'],
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const s of sampleShorts) {
    shortsStore.set(s.id, s);
  }

  // 5. Initialize Orders & CRM Customers
  const sampleOrders: CmsOrderDocument[] = [
    {
      id: 'ord_101',
      merchantId: MITREND_MERCHANT.id,
      orderNumber: '#ORD-9824',
      customerName: 'Protea Hotel Balalaika Sandton',
      customerPhone: '+27824419988',
      customerEmail: 'purchasing@balalaika.co.za',
      deliveryAddress: 'Maude St, Sandown, Sandton, 2196',
      items: [
        { productId: 'mit_3361', title: 'Anti-Theft Plastic Hotel Hanger - White', sku: 'MIT-3361', qty: 200, unitPrice: 22.88, totalPrice: 4576 },
        { productId: 'mit_2088', title: 'Anti-Theft Security Replacement Ring', sku: 'MIT-2088', qty: 50, unitPrice: 6.85, totalPrice: 342.50 },
      ],
      itemCount: 250,
      subtotal: 4918.50,
      taxTotal: 737.78,
      shippingTotal: 0,
      grandTotal: 5656.28,
      paymentMethod: 'Instant EFT Bank Transfer',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      notes: 'Deliver to rear loading bay at 09:00 AM sharp.',
      createdAt: '2026-08-30T14:20:00Z',
      updatedAt: '2026-08-30T14:25:00Z',
    },
    {
      id: 'ord_102',
      merchantId: MITREND_MERCHANT.id,
      orderNumber: '#ORD-9825',
      customerName: 'Gauteng Catering & Bakery Solutions',
      customerPhone: '+27835520011',
      customerEmail: 'orders@gtgcatering.co.za',
      deliveryAddress: 'ERF 12 Commercial Way, Midrand',
      items: [
        { productId: 'mit_8609', title: '101mm Silicone Clip-On-Lid', sku: 'MIT-8609', qty: 500, unitPrice: 1.50, totalPrice: 750 },
        { productId: 'mit_8610', title: 'Measuring Teaspoon 1ml', sku: 'MIT-8610', qty: 200, unitPrice: 0.50, totalPrice: 100 },
      ],
      itemCount: 700,
      subtotal: 850.00,
      taxTotal: 127.50,
      shippingTotal: 150.00,
      grandTotal: 1127.50,
      paymentMethod: 'WhatsApp Direct & EFT',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      notes: 'Customer requested WhatsApp tracking pin upon dispatch.',
      createdAt: '2026-08-31T08:15:00Z',
      updatedAt: '2026-08-31T08:15:00Z',
    },
  ];

  for (const o of sampleOrders) {
    ordersStore.set(o.id, o);
  }

  const sampleCustomers: CmsCustomerDocument[] = [
    {
      id: 'cust_1',
      merchantId: MITREND_MERCHANT.id,
      name: 'Protea Hotel Balalaika Sandton',
      contactPerson: 'David Khumalo',
      email: 'purchasing@balalaika.co.za',
      phone: '+27824419988',
      city: 'Sandton, Johannesburg',
      segment: 'VIP Gold Contractor',
      totalOrdersCount: 8,
      lifetimeValueZar: 68400,
      lastOrderDate: '2026-08-30',
      notes: ['Prefers wooden hangers for suites, plastic for standard rooms', 'Prompt EFT payment on 30-day term.'],
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-08-30T14:20:00Z',
    },
    {
      id: 'cust_2',
      merchantId: MITREND_MERCHANT.id,
      name: 'Gauteng Catering & Bakery Solutions',
      contactPerson: 'Sarah Pretorius',
      email: 'orders@gtgcatering.co.za',
      phone: '+27835520011',
      city: 'Midrand, Gauteng',
      segment: 'Commercial Wholesale',
      totalOrdersCount: 14,
      lifetimeValueZar: 42900,
      lastOrderDate: '2026-08-31',
      notes: ['Regular buyer of silicone lids and dosage measuring spoons.', 'Collects from warehouse counter.'],
      createdAt: '2026-02-10T00:00:00Z',
      updatedAt: '2026-08-31T08:15:00Z',
    },
  ];

  for (const c of sampleCustomers) {
    customersStore.set(c.id, c);
  }

  isInitialized = true;
}

/**
 * Payload CMS Local Service for Merchant OS
 */
export class PayloadMerchantCmsService {
  // Merchant Profile Operations
  public static getMerchant(merchantId: string): CmsMerchantDocument | null {
    ensureInitialized();
    return merchantsStore.get(merchantId) || null;
  }

  public static updateMerchant(merchantId: string, updates: Partial<CmsMerchantDocument>): CmsMerchantDocument {
    ensureInitialized();
    const existing = merchantsStore.get(merchantId) || {
      id: merchantId,
      name: updates.name || 'My Store',
      category: updates.category || 'wholesale',
      addressText: updates.addressText || 'South Africa',
      province: updates.province || 'Gauteng',
      googleRating: 4.8,
      googleReviewsCount: 1,
      operatingHours: 'Mon-Fri 08:30 - 17:00',
      medianResponseMinutes: 10,
      verificationState: 'fully_verified' as const,
      contacts: {
        telephone: updates.contacts?.telephone || '+27105007670',
        whatsapp: updates.contacts?.whatsapp || '+27105007670',
        email: updates.contacts?.email || 'store@shoppage.co.za',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const merged: CmsMerchantDocument = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    merchantsStore.set(merchantId, merged);
    return merged;
  }

  // Product Operations
  public static getProducts(merchantId: string, query?: string): CmsProductDocument[] {
    ensureInitialized();
    let all = Array.from(productsStore.values()).filter((p) => p.merchantId === merchantId);
    if (query) {
      const q = query.toLowerCase();
      all = all.filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return all;
  }

  public static getProductById(productId: string): CmsProductDocument | null {
    ensureInitialized();
    return productsStore.get(productId) || null;
  }

  public static createProduct(doc: Omit<CmsProductDocument, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'salesCount'>): CmsProductDocument {
    ensureInitialized();
    const id = `mit_cms_${Date.now()}`;
    const newDoc: CmsProductDocument = {
      ...doc,
      id,
      viewsCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    productsStore.set(id, newDoc);
    return newDoc;
  }

  public static updateProduct(productId: string, updates: Partial<CmsProductDocument>): CmsProductDocument | null {
    ensureInitialized();
    const existing = productsStore.get(productId);
    if (!existing) return null;

    const merged: CmsProductDocument = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    productsStore.set(productId, merged);
    return merged;
  }

  public static deleteProduct(productId: string): boolean {
    ensureInitialized();
    return productsStore.delete(productId);
  }

  // Media Operations
  public static getMedia(merchantId: string): CmsMediaDocument[] {
    ensureInitialized();
    return Array.from(mediaStore.values()).filter((m) => m.merchantId === merchantId);
  }

  // Video Shorts and Shows Operations
  public static getShortsAndShows(merchantId: string): CmsShortOrShowDocument[] {
    ensureInitialized();
    return Array.from(shortsStore.values()).filter((s) => s.merchantId === merchantId);
  }

  // Orders Operations
  public static getOrders(merchantId: string): CmsOrderDocument[] {
    ensureInitialized();
    return Array.from(ordersStore.values()).filter((o) => o.merchantId === merchantId);
  }

  public static updateOrderStatus(orderId: string, status: CmsOrderDocument['orderStatus']): CmsOrderDocument | null {
    ensureInitialized();
    const order = ordersStore.get(orderId);
    if (!order) return null;
    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();
    ordersStore.set(orderId, order);
    return order;
  }

  // CRM Customer Operations
  public static getCustomers(merchantId: string): CmsCustomerDocument[] {
    ensureInitialized();
    return Array.from(customersStore.values()).filter((c) => c.merchantId === merchantId);
  }
}
