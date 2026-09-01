import Link from 'next/link';
import type { ProductVariant, Merchant } from '@shoppage/contracts';
import { buildDirectProductUrl, DiscoveredOffersStore } from '@shoppage/kernel';

interface OrganicResult {
  url: string;
  domain: string;
  title: string;
  snippet: string;
  date?: string;
  thumbnailEmoji?: string;
  isInternal?: boolean;
  priceText?: string;
  retailerBadge?: string;
}

export default function OrganicWebResults({
  query = 'all',
  products = [],
  merchants = [],
}: {
  query?: string;
  products?: ProductVariant[];
  merchants?: Merchant[];
}) {
  const qClean = query.trim();
  const qLower = qClean.toLowerCase();

  const organicResults: OrganicResult[] = [];

  // 1. Matched Canonical / Master Products
  products.slice(0, 4).forEach((p) => {
    const priceEst = (p.attributes as any)?.estimatedPriceZar;
    const priceText = priceEst ? `From R ${Number(priceEst).toLocaleString()} · ` : '';
    const brand = p.brand ? `${p.brand} · ` : '';

    organicResults.push({
      url: `/p/${p.canonicalId}`,
      domain: `shoppage.co.za › catalog › ${p.categoryRef}`,
      title: p.title,
      snippet: `${brand}${priceText}Verified specifications, local supplier stock, and SABS / compliance passport. Compare quotes and order via WhatsApp or direct counter dispatch.`,
      thumbnailEmoji: p.categoryRef === 'solar_energy' ? '⚡' : p.categoryRef === 'smartphones' ? '📱' : p.categoryRef === 'hardware' ? '🧱' : '📦',
      isInternal: true,
    });
  });

  // 2. Matched Merchants & Suppliers
  merchants.slice(0, 2).forEach((m) => {
    organicResults.push({
      url: `/m/${m.id}`,
      domain: `shoppage.co.za › merchants › ${m.id}`,
      title: `${m.name} · Verified Physical Storefront`,
      snippet: `Official counter location: ${m.addressText || 'Gauteng, South Africa'}. Contact directly via WhatsApp (${m.contacts.whatsapp || m.contacts.telephone || 'Verified'}) for live counter quotes and stock confirmation.`,
      thumbnailEmoji: '🏪',
      isInternal: true,
    });
  });

  // 3. Genuine Discovered Offers from Database (Takealot, Builders Warehouse, Leroy Merlin, SolarAdvice, Mitrend, etc.)
  const matchedDiscoveredOffers = DiscoveredOffersStore.searchDiscoveredOffers(qClean);

  if (matchedDiscoveredOffers && matchedDiscoveredOffers.length > 0) {
    matchedDiscoveredOffers.slice(0, 4).forEach((disc) => {
      const isSolar = disc.masterProductRef.includes('solar') || disc.masterProductRef.includes('deye') || disc.masterProductRef.includes('sunsynk') || disc.masterProductRef.includes('victron') || disc.masterProductRef.includes('dyness') || disc.masterProductRef.includes('pylontech');
      const isHard = disc.masterProductRef.includes('cement') || disc.masterProductRef.includes('ppc') || disc.masterProductRef.includes('surebuild');
      const isTech = disc.masterProductRef.includes('samsung') || disc.masterProductRef.includes('iphone') || disc.masterProductRef.includes('a16');
      const emoji = isSolar ? '⚡' : isHard ? '🧱' : isTech ? '📱' : '🛒';

      const domainPath = disc.sourceWebsite.replace(/^https?:\/\//, '');
      const prodName = disc.masterProductRef.replace(/^(?:var_|za_hard_|za_fmcg_|disc_)/, '').replace(/_/g, ' ');

      organicResults.push({
        url: disc.sourceUrl,
        domain: `${domainPath} › product › ${disc.sku || 'live'}`,
        title: `${disc.merchantName} — ${disc.discoveredPrice.rawPriceText} (${disc.availabilityText || 'In Stock'})`,
        snippet: `Verified South African retailer live listing for ${prodName.toUpperCase()}. Stock dispatched from ${disc.locationHint || 'National Distribution Centres'}. Genuine direct store checkout link.`,
        thumbnailEmoji: emoji,
        isInternal: false,
        priceText: disc.discoveredPrice.rawPriceText,
        retailerBadge: disc.merchantName,
      });
    });
  } else {
    // Fallback verified major retailer live channels
    const isCementOrHardware = qLower.includes('cement') || qLower.includes('hardware') || qLower.includes('tool') || qLower.includes('brick') || qLower.includes('drill');
    const isSolar = qLower.includes('solar') || qLower.includes('inverter') || qLower.includes('battery');
    const isTech = qLower.includes('phone') || qLower.includes('samsung') || qLower.includes('iphone') || qLower.includes('laptop');

    const retailerEntries = [
      {
        name: 'Takealot Marketplace',
        website: 'takealot.com',
        snippet: `Buy ${qClean} online at Takealot.com. Fast, reliable delivery to your door across South Africa or collect from nationwide pickup points.`,
        emoji: '🛒',
      },
      {
        name: isCementOrHardware ? 'Builders Warehouse South Africa' : isSolar ? 'SolarAdvice South Africa' : isTech ? 'Incredible Connection' : 'Makro South Africa',
        website: isCementOrHardware ? 'builders.co.za' : isSolar ? 'solaradvice.co.za' : isTech ? 'incredible.co.za' : 'makro.co.za',
        snippet: `Find live prices, specifications, and in-store stock for ${qClean} at official South African distribution outlets.`,
        emoji: isCementOrHardware ? '🧱' : isSolar ? '☀️' : '🏬',
      },
      {
        name: isCementOrHardware ? 'Leroy Merlin South Africa' : 'Makro Commercial',
        website: isCementOrHardware ? 'leroymerlin.co.za' : 'makro.co.za',
        snippet: `Explore genuine ${qClean} deals and commercial bulk supply options with SABS quality assurance.`,
        emoji: '🏷️',
      },
    ];

    retailerEntries.forEach((ret) => {
      organicResults.push({
        url: buildDirectProductUrl(ret.website, qClean, qClean),
        domain: `${ret.website} › catalog › ${qLower.replace(/\s+/g, '-')}`,
        title: `${qClean} — ${ret.name} (Official Live Stock)`,
        snippet: ret.snippet,
        thumbnailEmoji: ret.emoji,
        isInternal: false,
      });
    });
  }


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
              {res.isInternal ? (
                <Link href={res.url} style={{ color: '#1A0DAB', textDecoration: 'none' }} className="hover-underline">
                  {res.title}
                </Link>
              ) : (
                <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1A0DAB', textDecoration: 'none' }} className="hover-underline">
                  {res.title}
                </a>
              )}
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
