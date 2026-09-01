'use client';

import Link from 'next/link';

export default function PeopleAlsoSearch({ query = 'solar' }: { query?: string }) {
  const q = query.toLowerCase().trim();
  let suggestions: string[] = [];

  if (q.includes('cement') || q.includes('ppc') || q.includes('surebuild') || q.includes('afrisam') || q.includes('hardware')) {
    suggestions = [
      `${query} 50kg price South Africa`,
      `${query} Builders Warehouse`,
      `${query} Cashbuild specials`,
      `${query} Makro prices`,
      `AfriSam vs PPC cement`,
      `Building sand and cement near me`,
      `Cement delivery Gauteng`,
      `Cement specials this week`,
    ];
  } else if (q.includes('solar') || q.includes('inverter') || q.includes('battery')) {
    suggestions = [
      `${query} 5kW hybrid inverter`,
      `${query} lithium battery prices`,
      `${query} load shedding backup`,
      `${query} installation cost South Africa`,
      `${query} Takealot`,
      `${query} Builders Warehouse`,
      `NRS 097 approved solar systems`,
      `Solar advice South Africa`,
    ];
  } else if (q.includes('phone') || q.includes('samsung') || q.includes('apple') || q.includes('iphone')) {
    suggestions = [
      `${query} price South Africa`,
      `${query} 128GB cash deals`,
      `${query} Takealot specials`,
      `${query} Incredible Connection`,
      `${query} Makro`,
      `${query} contract vs cash`,
      `${query} camera and battery specs`,
      `Best smartphones under 5k`,
    ];
  } else if (q.includes('catering') || q.includes('packaging') || q.includes('mitrend')) {
    suggestions = [
      `${query} wholesale South Africa`,
      `${query} Mitrend Products Midrand`,
      `${query} bulk catering supplies`,
      `${query} hotel displayware`,
      `${query} food tubs and lids`,
      `Commercial kitchen smalls Johannesburg`,
    ];
  } else {
    suggestions = [
      `${query} price South Africa`,
      `${query} Takealot`,
      `${query} Builders Warehouse`,
      `${query} Makro specials`,
      `${query} near me`,
      `${query} wholesale bulk`,
      `${query} delivery Gauteng`,
      `Best ${query} brands`,
    ];
  }

  return (
    <section style={{ marginBottom: '3.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#202124', marginBottom: '1rem' }}>
        People also search for
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {suggestions.map((label, idx) => (
          <Link
            key={idx}
            href={`/search?q=${encodeURIComponent(label)}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F1F3F4',
              borderRadius: '24px',
              padding: '0.85rem 1.25rem',
              textDecoration: 'none',
              color: '#202124',
              fontSize: '0.925rem',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
          >
            <span>{label}</span>
            <span style={{ color: '#70757A', fontSize: '0.9rem' }}>🔍</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
