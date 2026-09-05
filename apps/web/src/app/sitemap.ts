import type { MetadataRoute } from 'next';
import { SA_CANONICAL_PRODUCTS, SA_FLAGSHIP_MERCHANTS } from '@shoppage/kernel';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'https://shoppage.co.za';
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: base + '/', lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: base + '/search', lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: base + '/malls', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: base + '/markets', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: base + '/shorts', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: base + '/shows', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: base + '/requests', lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ];

  for (const p of SA_CANONICAL_PRODUCTS.slice(0, 500)) {
    entries.push({
      url: base + '/p/' + p.canonicalId,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  for (const m of SA_FLAGSHIP_MERCHANTS) {
    entries.push({
      url: base + '/m/' + m.id,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  return entries;
}
