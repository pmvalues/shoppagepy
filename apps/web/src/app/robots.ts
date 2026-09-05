import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'https://shoppage.co.za';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/merchant/dashboard', '/api/', '/merchant/os'],
      },
    ],
    sitemap: base + '/sitemap.xml',
    host: base,
  };
}
