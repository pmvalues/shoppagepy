import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from 'next/font/google';
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

/**
 * Fonts.
 *
 * Self-hosted through next/font so the three families named by the design
 * system (--font-sans, --font-display, --font-mono) are preloaded at build
 * time, inlined as optimised woff2, and given metric-compatible fallbacks.
 * Previously layout.tsx linked eleven per-weight stylesheets from a CDN with
 * no preload, which blocked first paint and shifted text on swap.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const display = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// Applies the stored theme before first paint, defaulting to light mode.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('shoppage_theme')||'light';document.documentElement.setAttribute('data-theme',t);if(document.body){document.body.setAttribute('data-theme',t);}if(t==='dark'||t==='dim'){document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
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
