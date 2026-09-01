import type { Metadata } from 'next';
import './globals.css';
import AppNavbar from '@/components/AppNavbar';

export const metadata: Metadata = {
  title: 'Shoppage South Africa · 1M+ Products, 3.1M Stores, 3,296 Malls',
  description:
    'The South African Commercial Grid. 1-click price discovery, verified SABS & NRS 097 grid compliance, and direct multi-channel merchant inquiries (Phone, Web, In-Store, Chat).',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://shoppage.co.za'),
  openGraph: {
    title: 'Shoppage — National Commerce Intelligence Grid',
    description: '3.1M verified merchants, 3,296 malls, 1M+ GS1 products. 0% take-rate direct trade.',
    type: 'website',
    locale: 'en_ZA',
  },
  twitter: { card: 'summary_large_image', title: 'Shoppage South Africa' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F172A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AppNavbar>
          <div id="main-content">{children}</div>
        </AppNavbar>
      </body>
    </html>
  );
}
