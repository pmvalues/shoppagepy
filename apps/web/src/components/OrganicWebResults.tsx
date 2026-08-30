'use client';

import Link from 'next/link';

interface OrganicResult {
  url: string;
  domain: string;
  title: string;
  snippet: string;
  date?: string;
  thumbnailEmoji?: string;
}

export default function OrganicWebResults({ query = 'solar' }: { query?: string }) {
  const organicResults: OrganicResult[] = [
    {
      url: 'https://mall.yep.co.za/solar-panel/services',
      domain: 'mall.yep.co.za › solar-panel › services',
      title: 'Go Off-Grid with Yep Solar Solutions',
      snippet: 'Affordable Solar Setups | Connect high-output solar panels to your DB board. Book accredited solar pros across Gauteng and Western Cape with 0% middleman markups.',
      thumbnailEmoji: '☀️',
    },
    {
      url: 'https://www.sinetech.co.za',
      domain: 'sinetech.co.za',
      title: 'Sinetech – The Power of Choice (Official Supply & Distribution)',
      snippet: 'Sinetech are specialists in the supply and installation of PV Solar Power Systems, UPS Systems, DC & AC Power Backup Systems, Solar Components, Inverters & LiFePO4 batteries.',
      date: '10 Aug 2026',
      thumbnailEmoji: '⚡',
    },
    {
      url: 'https://approvedsolar.co.za',
      domain: 'approvedsolar.co.za',
      title: 'Approved Solar: Leading Solar Power Solutions Provider',
      snippet: 'Experts in Solar Power and Renewable Energy Solutions for homes and businesses in Gauteng with quality solar products at competitive counter prices.',
      thumbnailEmoji: '🔋',
    },
    {
      url: 'https://gcsolar.co.za',
      domain: 'gcsolar.co.za',
      title: 'GC Solar – Bringing Green Energy To Life',
      snippet: 'GC Solar is your one-stop destination for finding and shopping the best solar products across South Africa. With a commitment to providing high-quality Tier-1 panels and certified inverters.',
      thumbnailEmoji: '🏬',
    },
    {
      url: 'https://ember-energy.org/insights',
      domain: 'ember-energy.org › Latest Insights',
      title: 'The take-off in African solar that official statistics can’t yet see',
      snippet: 'South Africa installs a record 17 GW of rooftop and commercial solar in 2026 — three-quarters of it is distributed solar on factories, malls, and residences.',
      date: '4 days ago',
      thumbnailEmoji: '📈',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
      {organicResults.map((res, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Domain Breadcrumb */}
            <div style={{ fontSize: '0.8rem', color: '#202124', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#F1F5F9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🌐</span>
              <span style={{ color: '#202124' }}>{res.domain}</span>
              <span style={{ color: '#70757A' }}>⋮</span>
            </div>

            {/* Clickable Blue Link Title */}
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1A0DAB', margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
              <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1A0DAB', textDecoration: 'none' }} className="hover-underline">
                {res.title}
              </a>
            </h3>

            {/* Snippet Description */}
            <p style={{ fontSize: '0.875rem', color: '#4D5156', lineHeight: 1.55, margin: 0 }}>
              {res.date && <span style={{ color: '#70757A' }}>{res.date} — </span>}
              {res.snippet}
            </p>
          </div>

          {/* Right Thumbnail Image Stage */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '8px',
              border: '1px solid #DADCE0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              flexShrink: 0,
            }}
          >
            {res.thumbnailEmoji || '📦'}
          </div>
        </div>
      ))}
    </div>
  );
}
