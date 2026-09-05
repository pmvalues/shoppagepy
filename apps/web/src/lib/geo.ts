/**
 * South African Geolocal Proximity & Spatial Engine
 * Handles Haversine distance, trading hub matching, and proximity scoring.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface SouthAfricanHub {
  id: string;
  name: string;
  suburb: string;
  metro: string;
  province: string;
  coordinates: GeoPoint;
  tradeType: 'wholesale_market' | 'mega_mall' | 'industrial_park' | 'commercial_hub';
}

/**
 * Key South African Commercial Trading Hubs
 */
export const SA_KEY_TRADING_HUBS: SouthAfricanHub[] = [
  {
    id: 'hub_crown_mines',
    name: 'Crown Mines & Amalgam Wholesale Precinct',
    suburb: 'Crown Mines',
    metro: 'City of Johannesburg',
    province: 'Gauteng',
    coordinates: { lat: -26.2225, lng: 27.9947 },
    tradeType: 'wholesale_market',
  },
  {
    id: 'hub_midrand',
    name: 'President Park & Midrand Commercial Corridor',
    suburb: 'President Park AH',
    metro: 'City of Johannesburg',
    province: 'Gauteng',
    coordinates: { lat: -25.9983, lng: 28.1263 },
    tradeType: 'commercial_hub',
  },
  {
    id: 'hub_sandton_kramerville',
    name: 'Kramerville & Sandton Design / Trade District',
    suburb: 'Kramerville',
    metro: 'City of Johannesburg',
    province: 'Gauteng',
    coordinates: { lat: -26.0967, lng: 28.0792 },
    tradeType: 'commercial_hub',
  },
  {
    id: 'hub_woodmead',
    name: 'Woodmead Commercial & Retail Hub',
    suburb: 'Woodmead',
    metro: 'City of Johannesburg',
    province: 'Gauteng',
    coordinates: { lat: -26.0569, lng: 28.0772 },
    tradeType: 'mega_mall',
  },
  {
    id: 'hub_stikland_bellville',
    name: 'Stikland & Bellville Industrial Precinct',
    suburb: 'Bellville',
    metro: 'City of Cape Town',
    province: 'Western Cape',
    coordinates: { lat: -33.9056, lng: 18.6534 },
    tradeType: 'industrial_park',
  },
  {
    id: 'hub_umhlanga_durban',
    name: 'Umhlanga Gateway Commercial District',
    suburb: 'Umhlanga',
    metro: 'eThekwini',
    province: 'KwaZulu-Natal',
    coordinates: { lat: -29.7247, lng: 31.0667 },
    tradeType: 'mega_mall',
  },
];

export const DEFAULT_USER_LOCATION: GeoPoint = {
  lat: -25.9983,
  lng: 28.1263, // President Park AH, Midrand (Shoppage Default Highveld Context)
};

/**
 * Calculates great-circle distance between two points using the Haversine formula (in kilometers)
 */
export function calculateHaversineDistanceKm(p1: GeoPoint, p2: GeoPoint): number {
  if (!p1 || !p2 || typeof p1.lat !== 'number' || typeof p2.lat !== 'number') {
    return Infinity;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Formats a distance in km for consumer display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm === Infinity || isNaN(distanceKm)) return 'Nearby';
  if (distanceKm < 1) return 'Under 1 km';
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  if (distanceKm < 100) return `${Math.round(distanceKm)} km away`;
  return `${Math.round(distanceKm)} km`;
}

/**
 * Calculates a normalized proximity score (1.0 = adjacent, 0.0 = >60km away)
 */
export function calculateProximityScore(distanceKm: number, maxRadiusKm: number = 60): number {
  if (distanceKm === Infinity || isNaN(distanceKm)) return 0.2;
  const score = 1 - Math.min(distanceKm, maxRadiusKm) / maxRadiusKm;
  return Number(Math.max(0, score).toFixed(2));
}

/**
 * Finds the nearest South African trading hub for given coordinates
 */
export function findNearestTradingHub(point: GeoPoint): { hub: SouthAfricanHub; distanceKm: number } {
  let nearest = SA_KEY_TRADING_HUBS[0];
  let minDistance = Infinity;

  for (const hub of SA_KEY_TRADING_HUBS) {
    const d = calculateHaversineDistanceKm(point, hub.coordinates);
    if (d < minDistance) {
      minDistance = d;
      nearest = hub;
    }
  }

  return { hub: nearest, distanceKm: minDistance };
}
