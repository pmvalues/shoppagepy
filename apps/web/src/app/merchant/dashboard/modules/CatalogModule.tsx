'use client';

import { useState } from 'react';
import type { Merchant } from '@shoppage/contracts';

export interface CatalogModuleProps {
  merchant: Merchant;
}

export default function CatalogModule({ merchant }: CatalogModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Seeded live catalog items for the merchant
  const [products, setProducts] = useState([
    {
      id: 'prod_deye_5k_sg03',
      title: 'Deye 5kW Hybrid Inverter 48V Single Phase (SUN-5K-SG03LP1-EU)',
      brand: 'Deye',
      category: 'Solar & Inverters',
      sku: 'DEYE-5K-SG03',
      gtin13: '6009876543210',
      priceZar: 14850,
      inStock: true,
      stockQty: 14,
      nrsCertified: true,
      sabsApproved: true,
    },
    {
      id: 'prod_deye_8k_sg01',
      title: 'Deye 8kW Hybrid Inverter 48V Single Phase (SUN-8K-SG01LP1-EU)',
      brand: 'Deye',
      category: 'Solar & Inverters',
      sku: 'DEYE-8K-SG01',
      gtin13: '6009876543211',
      priceZar: 28500,
      inStock: true,
      stockQty: 6,
      nrsCertified: true,
      sabsApproved: true,
    },
    {
      id: 'prod_dyness_bx51100',
      title: 'Dyness 5.12kWh LiFePO4 Lithium Battery 48V (BX51100)',
      brand: 'Dyness',
      category: 'Household Batteries',
      sku: 'DYN-BX51100',
      gtin13: '6009876543222',
      priceZar: 18900,
      inStock: true,
      stockQty: 22,
      nrsCertified: true,
      sabsApproved: true,
    },
    {
      id: 'prod_ja_solar_550w',
      title: 'JA Solar 550W Deep Blue 3.0 Monocrystalline PV Panel',
      brand: 'JA Solar',
      category: 'Solar Panels',
      sku: 'JA-550W-MB',
      gtin13: '6009876543333',
      priceZar: 1650,
      inStock: true,
      stockQty: 140,
      nrsCertified: true,
      sabsApproved: true,
    },
    {
      id: 'prod_victron_multiplus_5k',
      title: 'Victron MultiPlus-II 48/5000/70-50 230V Inverter Charger',
      brand: 'Victron energy',
      category: 'Solar & Inverters',
      sku: 'VIC-MPII-4850',
      gtin13: '6009876543444',
      priceZar: 24800,
      inStock: false,
      stockQty: 0,
      nrsCertified: true,
      sabsApproved: true,
    },
  ]);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceVal, setNewPriceVal] = useState('');

  const toggleStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock, stockQty: !p.inStock ? 10 : 0 } : p))
    );
  };

  const savePrice = (id: string) => {
    const parsed = parseFloat(newPriceVal);
    if (!isNaN(parsed) && parsed > 0) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, priceZar: parsed } : p))
      );
    }
    setEditingPriceId(null);
  };

  const filtered = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Master Catalog & Local Stock Matrix
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
            Direct inventory control. Prices update across Google Shopping XML feeds and the BuyBox in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search SKU, brand, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.825rem',
              width: '240px',
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.825rem',
              background: '#FFFFFF',
            }}
          >
            <option value="all">All Categories</option>
            <option value="Solar & Inverters">Solar & Inverters</option>
            <option value="Household Batteries">Household Batteries</option>
            <option value="Solar Panels">Solar Panels</option>
          </select>
        </div>
      </div>

      {/* Catalog Table Card */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Product & GS1 GTIN</th>
              <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
              <th style={{ padding: '0.75rem 1rem' }}>Compliance</th>
              <th style={{ padding: '0.75rem 1rem' }}>Store Price (ZAR)</th>
              <th style={{ padding: '0.75rem 1rem' }}>Allocation</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prod) => (
              <tr key={prod.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '1rem', maxWidth: '340px' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{prod.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{prod.brand}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'monospace' }}>GTIN {prod.gtin13}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                  {prod.sku}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {prod.nrsCertified && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '1px 5px', borderRadius: '4px' }}>
                        NRS 097 ✓
                      </span>
                    )}
                    {prod.sabsApproved && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1D4ED8', background: '#DBEAFE', padding: '1px 5px', borderRadius: '4px' }}>
                        SABS
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {editingPriceId === prod.id ? (
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        defaultValue={prod.priceZar}
                        onChange={(e) => setNewPriceVal(e.target.value)}
                        style={{ width: '90px', padding: '0.25rem 0.4rem', fontSize: '0.8rem', border: '1px solid #1A73E8', borderRadius: '4px' }}
                      />
                      <button
                        onClick={() => savePrice(prod.id)}
                        style={{ background: '#1A73E8', color: '#FFFFFF', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>
                        R {prod.priceZar.toLocaleString('en-ZA')}
                      </strong>
                      <button
                        onClick={() => {
                          setEditingPriceId(prod.id);
                          setNewPriceVal(prod.priceZar.toString());
                        }}
                        style={{ background: 'none', border: 'none', color: '#1A73E8', cursor: 'pointer', fontSize: '0.75rem' }}
                        title="Edit price"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleStock(prod.id)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: prod.inStock ? '#DCFCE7' : '#FEE2E2',
                        color: prod.inStock ? '#15803D' : '#B91C1C',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      {prod.inStock ? '🟢 IN STOCK' : '🔴 OUT OF STOCK'}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      ({prod.stockQty} units)
                    </span>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <a
                    href={`/p/${prod.id}`}
                    target="_blank"
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#F8FAFC',
                      color: '#0F172A',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    View PDP ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
