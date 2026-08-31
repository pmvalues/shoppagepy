import type { Metadata } from 'next';
import './globals.css';
import AppNavbar from '@/components/AppNavbar';

export const metadata: Metadata = {
  title: 'Shoppage South Africa · 1M+ Products, 3.1M Stores, 3,296 Malls',
  description:
    'The South African Commercial Grid. 1-click price discovery, verified SABS & NRS 097 grid compliance, and direct multi-channel merchant inquiries (Phone, Web, In-Store, Chat).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppNavbar>{children}</AppNavbar>
      </body>
    </html>
  );
}
