'use client';

import { useState, FormEvent } from 'react';
import type { ProductVariant, Merchant, Offer } from '@shoppage/contracts';
import ProductCard from './ProductCard';
import MerchantCard from './MerchantCard';

const SEEDS = ['solar inverter', 'samsung smartphone', 'building hardware', 'wholesale groceries', 'automotive spares', 'pharmacy'];

export default function ForYouRail({
  initialProducts,
  initialMerchants,
  initialOffers,
}: {
  initialProducts: ProductVariant[];
  initialMerchants: Merchant[];
  initialOffers: Record<string, Offer[]>;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [merchants, setMerchants] = useState(initialMerchants);
  const [offers, setOffers] = useState(initialOffers);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const q = SEEDS[Math.floor(Math.random() * SEEDS.length)];
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProducts(data.products || []);
      setMerchants(data.merchants || []);
      setOffers(data.offersByProduct || {});
    } catch {
      /* keep current */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <h2 className="section-title">🤖 Picked For You</h2>
          <p className="section-desc">AI-ranked from your local commerce graph — tap refresh to re-rank.</p>
        </div>
        <button onClick={refresh} className="btn btn-primary" style={{ fontSize: '0.8rem' }} disabled={loading}>
          {loading ? 'Thinking…' : '🔄 Surprise me'}
        </button>
      </div>
      <div className="rail-track">
        {products.map((p) => (
          <div key={p.canonicalId} style={{ width: 260, flex: '0 0 auto' }}>
            <ProductCard product={p} offers={offers[p.canonicalId] || []} />
          </div>
        ))}
        {merchants.map((m) => (
          <div key={m.id} style={{ width: 260, flex: '0 0 auto' }}>
            <MerchantCard merchant={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
