'use client';

import { useState } from 'react';
import type { MasterProduct, Offer, Merchant } from '@shoppage/contracts';
import ProductCard from './ProductCard';
import BuyBoxDrawer from './BuyBoxDrawer';
import ProformaInvoiceModal from './ProformaInvoiceModal';
import { SA_KEY_TRADING_HUBS } from '@/lib/geo';

export default function ShoppingBrowseGrid({
  products,
  offersByProduct = {},
  merchants = [],
}: {
  products: MasterProduct[];
  offersByProduct?: Record<string, Offer[]>;
  merchants?: Merchant[];
}) {
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [selectedRadius, setSelectedRadius] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');

  // BuyBox Drawer state
  const [buyBoxProduct, setBuyBoxProduct] = useState<MasterProduct | null>(null);
  const [buyBoxOffers, setBuyBoxOffers] = useState<Offer[]>([]);
  const [isBuyBoxOpen, setIsBuyBoxOpen] = useState(false);

  // Proforma Invoice state
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [proformaData, setProformaData] = useState<any | null>(null);

  const handleOpenBuyBox = (product: MasterProduct, offers: Offer[]) => {
    setBuyBoxProduct(product);
    setBuyBoxOffers(offers.length > 0 ? offers : offersByProduct[product.canonicalId] || []);
    setIsBuyBoxOpen(true);
  };

  const handleGenerateProforma = (item: {
    product: MasterProduct;
    offer?: Offer;
    merchant?: Merchant;
    price: number;
  }) => {
    const generatedNumber = `SP-PRO-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const m = item.merchant;

    const invoicePayload = {
      invoiceNumber: generatedNumber,
      date: now.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil: expiry.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      merchant: {
        name: m?.name || 'Verified South African Distributor',
        cipcNumber: m?.cipcEnterpriseNumber || '2021/489102/07',
        vatNumber: m?.taxCompliancePin || '4910294812',
        address: m?.addressText || 'Crown Mines Commercial Precinct',
        suburb: m?.province || 'Crown Mines, Johannesburg',
        bankName: 'Standard Bank South Africa',
        accountNumber: '0012948102',
        branchCode: '051001',
      },
      buyer: {
        name: 'Shopper / Customer Account',
        phone: '+27 11 000 0000',
      },
      items: [
        {
          id: item.product.canonicalId,
          title: item.product.title,
          sku: item.product.identifiers?.gtin13 || `SKU-${item.product.canonicalId.slice(0, 8)}`,
          gtin13: item.product.identifiers?.gtin13,
          quantity: 1,
          unitPriceZar: item.price,
        },
      ],
    };
    setProformaData(invoicePayload);
    setShowProformaModal(true);
  };

  const handleAddToCart = (item: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('shoppage_cart_items') || '[]');
      const updated = [...existing, item];
      localStorage.setItem('shoppage_cart_items', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('shoppage-cart-sync', { detail: { count: updated.length } }));
    } catch {
      /* ignore */
    }
  };

  // Derive unique brands for filters
  const availableBrands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  // Filter & Sort products
  const filteredProducts = products
    .filter((p) => {
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      const price = (p.attributes?.estimatedPriceZar as number) || 0;
      if (priceMin && price < parseFloat(priceMin)) return false;
      if (priceMax && price > parseFloat(priceMax)) return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = (a.attributes?.estimatedPriceZar as number) || 0;
      const priceB = (b.attributes?.estimatedPriceZar as number) || 0;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      return 0;
    });

  const pillBase =
    'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition duration-200 ease-out-expo';

  return (
    <div>
      {/* Geolocal precinct & distance ribbon */}
      <div className="mb-5 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            Shopping area / mall
          </span>
          <button
            type="button"
            onClick={() => setSelectedHub('all')}
            className={[
              pillBase,
              selectedHub === 'all'
                ? 'border-transparent bg-content text-content-inverse'
                : 'border-line bg-surface text-content-secondary hover:border-line-strong',
            ].join(' ')}
          >
            All South Africa (3,296 malls &amp; stores)
          </button>
          {SA_KEY_TRADING_HUBS.map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => setSelectedHub(hub.id)}
              className={[
                pillBase,
                selectedHub === hub.id
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-line bg-surface text-content-secondary hover:border-line-strong',
              ].join(' ')}
            >
              {hub.name.split('&')[0].trim()}
            </button>
          ))}
        </div>

        {/* Distance radius filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-content-muted">Proximity radius</span>
          {['all', '10km', '25km', '50km'].map((rad) => (
            <button
              key={rad}
              type="button"
              onClick={() => setSelectedRadius(rad)}
              className={[
                'rounded-lg border px-2 py-0.5 text-xs font-semibold transition duration-200 ease-out-expo',
                selectedRadius === rad
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-line bg-surface text-content-muted hover:border-line-strong',
              ].join(' ')}
            >
              {rad === 'all' ? 'National grid' : `< ${rad}`}
            </button>
          ))}
        </div>
      </div>

      {/* Refine sidebar + product grid */}
      <div className="grid items-start gap-7 [grid-template-columns:220px_1fr]">
        <aside className="border-r border-line pr-5">
          <h3 className="mb-3.5 text-base font-semibold text-content">Refine results</h3>

          {/* Availability */}
          <div className="mb-5 text-sm text-content-secondary">
            <div className="mb-1.5 flex items-center gap-1.5">
              <input type="checkbox" id="instock_cb" defaultChecked />
              <label htmlFor="instock_cb" className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
                In stock (store pickup today)
              </label>
            </div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <input type="checkbox" id="verified_cb" defaultChecked />
              <label htmlFor="verified_cb">Verified SA retailers &amp; stores</label>
            </div>
            <div className="flex items-center gap-1.5">
              <input type="checkbox" id="sabs_cb" />
              <label htmlFor="sabs_cb">SABS / NRS 097 approved</label>
            </div>
          </div>

          {/* Price range */}
          <div className="mb-5 border-t border-line-subtle pt-3.5">
            <p className="mb-1.5 text-sm font-semibold text-content">Price (ZAR)</p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="R Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-16 rounded border border-line bg-surface px-1.5 py-1 text-xs text-content outline-none transition-colors focus:border-brand-400"
              />
              <span className="text-content-muted">–</span>
              <input
                type="number"
                placeholder="R Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-16 rounded border border-line bg-surface px-1.5 py-1 text-xs text-content outline-none transition-colors focus:border-brand-400"
              />
            </div>
          </div>

          {/* Brands */}
          {availableBrands.length > 0 && (
            <div className="border-t border-line-subtle pt-3.5">
              <p className="mb-1.5 text-sm font-semibold text-content">Brand</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    id="brand_all"
                    name="brand_filter"
                    checked={selectedBrand === 'all'}
                    onChange={() => setSelectedBrand('all')}
                  />
                  <label htmlFor="brand_all">All brands</label>
                </div>
                {availableBrands.slice(0, 8).map((brand) => (
                  <div key={brand} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      id={`brand_${brand}`}
                      name="brand_filter"
                      checked={selectedBrand === brand}
                      onChange={() => setSelectedBrand(brand)}
                    />
                    <label htmlFor={`brand_${brand}`}>{brand}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-content">
              {filteredProducts.length} verified products &amp; retail deals
            </h2>
            <div className="flex items-center gap-2 text-sm text-content-muted">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-sm font-medium text-content outline-none transition-colors focus:border-brand-400"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {filteredProducts.map((product, idx) => {
              const offers = offersByProduct[product.canonicalId] || [];
              const isSponsored = idx === 0 || idx === 4;
              return (
                <ProductCard
                  key={product.canonicalId}
                  product={product}
                  offers={offers}
                  isSponsored={isSponsored}
                  onOpenBuyBox={handleOpenBuyBox}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Instant BuyBox comparison drawer */}
      <BuyBoxDrawer
        isOpen={isBuyBoxOpen}
        onClose={() => setIsBuyBoxOpen(false)}
        product={buyBoxProduct}
        offers={buyBoxOffers}
        merchants={merchants}
        onAddToCart={handleAddToCart}
        onGenerateProforma={handleGenerateProforma}
      />

      {/* SARS B2B proforma tax invoice modal */}
      {showProformaModal && proformaData && (
        <ProformaInvoiceModal
          isOpen={showProformaModal}
          onClose={() => setShowProformaModal(false)}
          invoiceData={proformaData}
        />
      )}
    </div>
  );
}
