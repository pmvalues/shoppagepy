import type { Metadata } from 'next';
import './theme.css';
import './globals.css';
import './feed.css';
import AppNavbar from '@/components/AppNavbar';
import CommerceRail from '@/components/CommerceRail';

export const metadata: Metadata = {
  title: 'Shoppage South Africa · Live commerce feed, 1M+ products, 3,296 malls',
  description:
    'South Africa’s commercial grid. Live price drops, restocks and video proof from verified merchants — direct trade at 0% commission.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://shoppage.co.za'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Shoppage — National Commerce Intelligence Grid',
    description: 'Live price drops and verified stock from South African trade counters. 0% take-rate.',
    type: 'website',
    locale: 'en_ZA',
  },
  twitter: { card: 'summary_large_image', title: 'Shoppage South Africa' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
};

// Applies the stored theme before first paint, defaulting to light mode.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('shoppage_theme')||'light';document.documentElement.setAttribute('data-theme',t);if(document.body){document.body.setAttribute('data-theme',t);}if(t==='dark'||t==='dim'){document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`;

/**
 * Fonts.
 *
 * These are the faces the design system actually names in --font-sans and
 * --font-display. Previously layout.tsx loaded Inter only, so the declared
 * display face (Outfit) was never fetched and every heading silently fell back
 * to the browser's generic sans-serif. Only the weights in use are requested.
 */
const FONT_CDN = 'https://cdn.jsdelivr.net/npm';
const FONTS: Array<[string, number[]]> = [
  ['@fontsource/plus-jakarta-sans@5.0.8', [400, 500, 600, 700, 800]],
  ['@fontsource/outfit@5.0.8', [500, 600, 700, 800]],
  ['@fontsource/jetbrains-mono@5.0.8', [500, 700]],
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {FONTS.flatMap(([pkg, weights]) =>
          weights.map((w) => (
            <link
              key={`${pkg}-${w}`}
              rel="stylesheet"
              href={`${FONT_CDN}/${pkg}/${w}.css`}
            />
          ))
        )}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppNavbar aside={<CommerceRail />}>
          <div id="main-content">{children}</div>
        </AppNavbar>
      </body>
    </html>
  );
}
