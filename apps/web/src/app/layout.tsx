import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/400.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/500.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/700.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/800.css" />
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
