// Payload CMS Merchant OS TypeScript Domain Types
import type { Merchant, ProductVariant, Offer } from '@shoppage/contracts';

export interface CmsMerchantDocument {
  id: string;
  name: string;
  legalName?: string;
  category: string;
  addressText: string;
  province: string;
  locality?: string;
  stallIdentifier?: string;
  googleRating: number;
  googleReviewsCount: number;
  operatingHours: string;
  medianResponseMinutes: number;
  verificationState: 'unverified' | 'phone_verified' | 'fully_verified';
  contacts: {
    telephone: string;
    whatsapp: string;
    email: string;
    website?: string;
  };
  branding?: {
    primaryColor?: string;
    bannerUrl?: string;
    logoUrl?: string;
    tagline?: string;
  };
  settings?: {
    currency: 'ZAR';
    taxRate: number; // e.g. 15%
    enableWhatsappCart: boolean;
    enableDirectEft: boolean;
    enablePayfast: boolean;
    shippingFlatRateZar?: number;
    freeShippingThresholdZar?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CmsProductDocument {
  id: string;
  merchantId: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  taxStatus: 'taxable' | 'none';
  taxClass: 'standard' | 'reduced' | 'zero';
  inStock: boolean;
  stockQty: number;
  lowStockThreshold: number;
  backorders: 'no' | 'notify' | 'yes';
  weightKg?: number;
  dimensionsCm?: string;
  shippingClass?: string;
  warranty: string;
  specs: string;
  description: string;
  featuredImage: string;
  galleryImages: string[];
  compliance: {
    sabsApproved: boolean;
    nrs097Certified?: boolean;
    warrantyYears: number;
  };
  feedStatus: 'Active' | 'Draft' | 'Needs Action';
  viewsCount: number;
  salesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CmsMediaDocument {
  id: string;
  merchantId: string;
  filename: string;
  mimeType: string;
  filesize: number;
  url: string;
  altText: string;
  mediaType: 'image' | 'video' | 'datasheet_pdf';
  createdAt: string;
}

export interface CmsShortOrShowDocument {
  id: string;
  merchantId: string;
  type: 'short' | 'show' | 'live';
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  viewsCount: number;
  likesCount: number;
  taggedProductIds: string[];
  isPublished: boolean;
  scheduledLiveAt?: string;
  createdAt: string;
}

export interface CmsOrderDocument {
  id: string;
  merchantId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  items: Array<{
    productId: string;
    title: string;
    sku: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderStatus: 'processing' | 'completed' | 'on_hold' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsCustomerDocument {
  id: string;
  merchantId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  segment: 'VIP Gold Contractor' | 'Commercial Wholesale' | 'Residential Retail' | 'Trade Buyer';
  totalOrdersCount: number;
  lifetimeValueZar: number;
  lastOrderDate: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}
