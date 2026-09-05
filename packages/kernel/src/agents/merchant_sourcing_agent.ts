/**
 * Merchant Sourcing & Normalization Agent
 *
 * Sourcing, geofencing, and normalization of South African retail stores,
 * mall branches, and merchant storefronts across all 9 provinces.
 */

import { SouthAfricaMallsStore } from '../graph/sa_all_malls_dataset';

export interface RawMerchantInput {
  name: string;
  tradingName?: string;
  address?: string;
  suburb?: string;
  metro?: string;
  province?: string;
  telephone?: string;
  website?: string;
  email?: string;
  categories?: string[];
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
}

export interface NormalizedMerchant {
  id: string;
  canonicalName: string;
  tradingName: string;
  brandSlug: string;
  retailerTier: 'major_national_chain' | 'regional_specialist' | 'local_independent';
  marketRef?: string;
  mallName?: string;
  geo: {
    streetAddress: string;
    suburb: string;
    metro: string;
    province: string;
    latitude?: number;
    longitude?: number;
  };
  operatingHours: string;
  contacts: {
    telephone?: string;
    website?: string;
    email?: string;
  };
  categories: string[];
  sourcedAt: string;
}

const MAJOR_NATIONAL_CHAINS = new Set([
  'takealot',
  'makro',
  'builders warehouse',
  'builders express',
  'leroy merlin',
  'checkers',
  'shoprite',
  'pick n pay',
  'woolworths',
  'clicks',
  'dis-chem',
  'incredible connection',
  'game',
  'hirschs',
  'totaltools',
  'chamberlains',
  'agrimark',
]);

export class MerchantSourcingAgent {
  /**
   * Normalizes South African phone numbers to standard E.164 / formatted string
   */
  public normalizePhoneNumber(rawPhone?: string): string | undefined {
    if (!rawPhone || typeof rawPhone !== 'string') return undefined;
    const digits = rawPhone.replace(/\D/g, '');

    // Handle 0XX XXX XXXX format (10 digits starting with 0)
    if (digits.length === 10 && digits.startsWith('0')) {
      const area = digits.slice(1, 3);
      const part1 = digits.slice(3, 6);
      const part2 = digits.slice(6);
      return `+27 ${area} ${part1} ${part2}`;
    }

    // Handle 27XX XXX XXXX format (11 digits starting with 27)
    if (digits.length === 11 && digits.startsWith('27')) {
      const area = digits.slice(2, 4);
      const part1 = digits.slice(4, 7);
      const part2 = digits.slice(7);
      return `+27 ${area} ${part1} ${part2}`;
    }

    return rawPhone.trim();
  }

  /**
   * Standardizes consumer retail trading hours
   */
  public normalizeOperatingHours(rawHours?: string): string {
    if (!rawHours || typeof rawHours !== 'string' || rawHours.trim().length === 0) {
      return 'Mon-Sat: 08:30 - 18:00 | Sun: 09:00 - 16:00';
    }
    return rawHours.trim();
  }

  /**
   * Calculates distance between two coordinates in kilometers using Haversine formula
   */
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Matches a merchant address or coordinates to the nearest South African mall
   */
  public matchToNearestMall(
    suburb?: string,
    province?: string,
    lat?: number,
    lng?: number,
  ): { mallId?: string; mallName?: string; distanceKm?: number } {
    if (!suburb && !lat) return {};

    // 1. Search by suburb / query
    const searchRes = SouthAfricaMallsStore.searchMalls({
      suburb: suburb || undefined,
      province: province || undefined,
      limit: 10,
    });

    if (searchRes.items.length > 0) {
      if (lat !== undefined && lng !== undefined) {
        // Find closest by coordinate
        let closest = searchRes.items[0];
        let minDistance = 999999;

        for (const mall of searchRes.items) {
          if (mall.geo?.latitude && mall.geo?.longitude) {
            const dist = this.calculateDistanceKm(lat, lng, mall.geo.latitude, mall.geo.longitude);
            if (dist < minDistance) {
              minDistance = dist;
              closest = mall;
            }
          }
        }

        return {
          mallId: closest.id,
          mallName: closest.name,
          distanceKm: Math.round(minDistance * 10) / 10,
        };
      }

      // Default to first matching mall in suburb
      return {
        mallId: searchRes.items[0].id,
        mallName: searchRes.items[0].name,
      };
    }

    return {};
  }

  /**
   * Sources and normalizes a merchant storefront
   */
  public normalizeMerchant(input: RawMerchantInput): NormalizedMerchant {
    const rawName = input.name.trim();
    const cleanTradingName = input.tradingName?.trim() || rawName;
    const lowerName = cleanTradingName.toLowerCase();

    // Determine retailer tier
    let retailerTier: NormalizedMerchant['retailerTier'] = 'local_independent';
    for (const chain of MAJOR_NATIONAL_CHAINS) {
      if (lowerName.includes(chain)) {
        retailerTier = 'major_national_chain';
        break;
      }
    }

    const brandSlug = cleanTradingName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const safeProvince = input.province || 'Gauteng';
    const safeSuburb = input.suburb || 'Central';
    const safeMetro = input.metro || 'City of Johannesburg';

    // Match to mall if applicable
    const mallMatch = this.matchToNearestMall(
      safeSuburb,
      safeProvince,
      input.latitude,
      input.longitude,
    );

    const safeId = `mer_${brandSlug}_${safeSuburb.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    return {
      id: safeId,
      canonicalName: rawName,
      tradingName: cleanTradingName,
      brandSlug,
      retailerTier,
      marketRef: mallMatch.mallId,
      mallName: mallMatch.mallName,
      geo: {
        streetAddress: input.address || `${cleanTradingName}, ${safeSuburb}, ${safeProvince}`,
        suburb: safeSuburb,
        metro: safeMetro,
        province: safeProvince,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      operatingHours: this.normalizeOperatingHours(input.operatingHours),
      contacts: {
        telephone: this.normalizePhoneNumber(input.telephone),
        website: input.website?.trim(),
        email: input.email?.trim().toLowerCase(),
      },
      categories: input.categories && input.categories.length > 0 ? input.categories : ['general_retail'],
      sourcedAt: new Date().toISOString(),
    };
  }

  /**
   * Normalizes a batch of merchants
   */
  public normalizeBatch(merchants: RawMerchantInput[]): NormalizedMerchant[] {
    return merchants.map((m) => this.normalizeMerchant(m));
  }
}
