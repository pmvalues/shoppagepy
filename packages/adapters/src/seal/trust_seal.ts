import { TrustPassport } from '@shoppage/contracts';

/**
 * Generates dynamic, cacheable Live Trust Seal SVG badge
 * Defaults to light theme with high contrast crisp typography
 */
export function generateLiveTrustSealSvg(passport: TrustPassport, theme: 'light' | 'dark' = 'light'): string {
  const isFresh = passport.freshOffersTodayCount > 0;
  const statusColor = isFresh ? '#059669' : '#64748B'; // Emerald Green if fresh, slate if stale
  const statusText = isFresh
    ? `Verified Active · ${passport.freshOffersTodayCount} Offers Confirmed Today`
    : `Phone Verified · Response Time: ${passport.medianResponseMinutes || 30}m`;

  const bgColor = theme === 'light' ? '#FFFFFF' : '#0F172A';
  const strokeColor = theme === 'light' ? '#CBD5E1' : '#334155';
  const titleColor = theme === 'light' ? '#0F172A' : '#F8FAFC';
  const subtextColor = theme === 'light' ? '#475569' : '#94A3B8';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="48" viewBox="0 0 340 48" fill="none">
  <rect width="340" height="48" rx="8" fill="${bgColor}"/>
  <rect x="0.5" y="0.5" width="339" height="47" rx="7.5" stroke="${strokeColor}"/>
  
  <!-- Shield Icon -->
  <g transform="translate(12, 12)">
    <path d="M12 2L4 5V11.09C4 16.14 7.41 20.85 12 22C16.59 20.85 20 16.14 20 11.09V5L12 2Z" fill="${statusColor}" fill-opacity="0.15" stroke="${statusColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke="${statusColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Text Details -->
  <text x="44" y="20" fill="${titleColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600">
    ${passport.merchantName} · Score: ${passport.score}/100
  </text>
  <text x="44" y="34" fill="${subtextColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10">
    ${statusText}
  </text>

  <!-- Live Pulse Dot -->
  <circle cx="318" cy="24" r="4" fill="${statusColor}"/>
</svg>`;
}
