'use client';

import Link from 'next/link';
import type { ProductVariant } from '@shoppage/contracts';

interface EntityKnowledge {
  title: string;
  categoryName: string;
  summary: string;
  sourceUrl?: string;
  sourceName?: string;
  attributes: Array<{ label: string; value: string }>;
  relatedSearches: Array<{ label: string; icon: string }>;
  iconEmoji: string;
}

function getEntityKnowledge(query: string, topProduct?: ProductVariant): EntityKnowledge {
  const q = query.toLowerCase().trim();

  // 1. Cement & Construction
  if (q.includes('cement') || q.includes('ppc') || q.includes('surebuild') || q.includes('afrisam') || q.includes('brick') || q.includes('concrete')) {
    return {
      title: 'Cement & Construction Binders',
      categoryName: 'Building Materials · Hardware',
      summary: 'Cement is a hydraulic binder used in construction that sets, hardens, and adheres to other materials to bind them together. In South Africa, common standards include SABS 50197-1 (CEM II 42.5N and 32.5R) general-purpose cements produced by PPC, AfriSam, and Sephaku.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cement',
      sourceName: 'Wikipedia / SABS Standard',
      attributes: [
        { label: 'Standard Pack', value: '50kg Polypropylene Bag' },
        { label: 'Standard Grade', value: 'CEM II 42.5N / 32.5R' },
        { label: 'SABS Certification', value: 'SANS 50197-1 Approved' },
        { label: 'Applications', value: 'Concrete, Mortar, Plaster, Screed' },
      ],
      relatedSearches: [
        { label: 'PPC Cement 50kg', icon: '🧱' },
        { label: 'AfriSam Cement 50kg', icon: '🏗️' },
        { label: 'Builders Warehouse Cement', icon: '🏬' },
      ],
      iconEmoji: '🧱',
    };
  }

  // 2. Solar & Power Backup
  if (q.includes('solar') || q.includes('inverter') || q.includes('battery') || q.includes('deye') || q.includes('sunsynk') || q.includes('dyness') || q.includes('panel') || q.includes('load shedding')) {
    return {
      title: topProduct?.title || 'Solar PV & Backup Power Systems',
      categoryName: 'Renewable Energy · Solar & Electrical',
      summary: 'Solar photovoltaic and hybrid battery systems convert sunlight into clean electricity and provide seamless grid-tied or off-grid backup during load shedding. In South Africa, inverters must be NRS 097-2-1 certified for grid interconnection by Eskom and municipal distributors.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Solar_power',
      sourceName: 'NRS 097 / Eskom Grid Code',
      attributes: [
        { label: 'Grid Standard', value: 'NRS 097-2-1 Compliant' },
        { label: 'Battery Chemistry', value: 'LiFePO4 Lithium-Ion (6000+ Cycles)' },
        { label: 'Typical Backup', value: '4 to 12 Hours Continuous' },
        { label: 'Major Brands', value: 'Deye, Sunsynk, Dyness, Freedom Won' },
      ],
      relatedSearches: [
        { label: '5kW Hybrid Inverter', icon: '⚡' },
        { label: '5.12kWh Lithium Battery', icon: '🔋' },
        { label: '550W Solar Panel', icon: '☀️' },
      ],
      iconEmoji: '⚡',
    };
  }

  // 3. Smartphones & Electronics
  if (q.includes('phone') || q.includes('samsung') || q.includes('apple') || q.includes('iphone') || q.includes('galaxy') || q.includes('s24') || q.includes('a16') || q.includes('redmi')) {
    return {
      title: topProduct?.title || 'Smartphones & Mobile Devices',
      categoryName: 'Consumer Electronics · Telecommunications',
      summary: 'Mobile cellular smartphones featuring advanced multi-lens cameras, 5G connectivity, and high-capacity lithium batteries certified for South African ICASA spectrum compliance.',
      sourceUrl: 'https://en.wikipedia.org/wiki/Smartphone',
      sourceName: 'ICASA South Africa Registry',
      attributes: [
        { label: 'Connectivity', value: '5G / 4G LTE / Dual SIM' },
        { label: 'Regulatory', value: 'ICASA Type Approved' },
        { label: 'Warranty', value: '12-24 Months Official ZA Support' },
      ],
      relatedSearches: [
        { label: 'Samsung Galaxy Phones', icon: '📱' },
        { label: 'Apple iPhone Specials', icon: '🍎' },
        { label: 'Budget Phones Under 5k', icon: '🏷️' },
      ],
      iconEmoji: '📱',
    };
  }

  // 4. Catering, Packaging & Mitrend
  if (q.includes('catering') || q.includes('packaging') || q.includes('mitrend') || q.includes('hanger') || q.includes('knife') || q.includes('spoon') || q.includes('tub') || q.includes('lid')) {
    return {
      title: 'Commercial Catering & Food Packaging',
      categoryName: 'Hospitality & Commercial Supplies',
      summary: 'Commercial kitchen smallwares, hotel displayware, anti-theft hangers, portioning cutlery, and food-grade packaging manufactured for South African hospitality and retail catering operations.',
      sourceUrl: 'https://mitrend.co.za',
      sourceName: 'Mitrend Commercial Catalog',
      attributes: [
        { label: 'Food Safety', value: 'Food-Grade Certified Polypropylene / Stainless' },
        { label: 'Industry', value: 'Hotels, Catering, Delis, Quick Service' },
        { label: 'Dispatch', value: 'Midrand Distribution Centre' },
      ],
      relatedSearches: [
        { label: 'Hotel Anti-Theft Hangers', icon: '🏨' },
        { label: 'Portioning Spoons & Cutlery', icon: '🥄' },
        { label: 'Commercial Food Tubs', icon: '📦' },
      ],
      iconEmoji: '🍽️',
    };
  }

  // 5. Default Generic Entity
  const formattedTitle = query.charAt(0).toUpperCase() + query.slice(1);
  return {
    title: topProduct?.title || formattedTitle,
    categoryName: topProduct?.categoryRef || 'Commercial Product Index',
    summary: `${formattedTitle} listings and verified suppliers across South African retail superstores, wholesale depots, and regional physical distribution hubs.`,
    sourceUrl: 'https://www.shoppage.co.za',
    sourceName: 'Shoppage Commerce Intelligence Index',
    attributes: [
      { label: 'Availability', value: 'Verified In-Stock Nationwide' },
      { label: 'Market Scope', value: 'South Africa (ZA)' },
      { label: 'Currency', value: 'South African Rand (ZAR)' },
    ],
    relatedSearches: [
      { label: `${formattedTitle} Prices`, icon: '🏷️' },
      { label: `${formattedTitle} Stores Near Me`, icon: '📍' },
      { label: `${formattedTitle} Specials`, icon: '✨' },
    ],
    iconEmoji: '📦',
  };
}

export default function KnowledgePanel({ query = 'Product', products = [] }: { query?: string; products?: ProductVariant[] }) {
  const topProduct = products[0];
  const entity = getEntityKnowledge(query, topProduct);

  return (
    <div
      style={{
        border: '1px solid #DADCE0',
        borderRadius: '12px',
        background: '#FFFFFF',
        padding: '1.25rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top Media Banner */}
      <div
        style={{
          width: '100%',
          height: '110px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '2.75rem',
          marginBottom: '1rem',
        }}
      >
        {entity.iconEmoji}
      </div>

      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
        {entity.categoryName}
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#202124', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {entity.title}
      </h3>

      <p style={{ fontSize: '0.85rem', color: '#4D5156', lineHeight: 1.55, marginBottom: '0.75rem' }}>
        {entity.summary}
      </p>

      {entity.sourceName && (
        <div style={{ fontSize: '0.75rem', color: '#70757A', marginBottom: '1rem' }}>
          Source:{' '}
          <a href={entity.sourceUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#1A0DAB', textDecoration: 'none' }}>
            {entity.sourceName}
          </a>
        </div>
      )}

      {/* Structured Key Attributes */}
      <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #E2E8F0' }}>
        {entity.attributes.map((attr, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.25rem 0', borderBottom: idx < entity.attributes.length - 1 ? '1px solid #EEF2F6' : 'none' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>{attr.label}:</span>
            <span style={{ color: '#1E293B', fontWeight: 700, textAlign: 'right' }}>{attr.value}</span>
          </div>
        ))}
      </div>

      {/* People Also Search For Grid */}
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem' }}>
        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#202124', marginBottom: '0.6rem' }}>
          Related Searches
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
          {entity.relatedSearches.map((item, i) => (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent(item.label)}`}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.5rem 0.25rem',
                textDecoration: 'none',
                background: '#FFFFFF',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.68rem', color: '#202124', fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
