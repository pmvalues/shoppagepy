import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceKm,
  formatDistance,
  calculateProximityScore,
  findNearestTradingHub,
  SA_KEY_TRADING_HUBS,
  DEFAULT_USER_LOCATION,
} from '../src/lib/geo';

describe('South African Geolocal Proximity Engine', () => {
  it('calculates accurate Haversine distance between Midrand and Crown Mines', () => {
    const midrand = { lat: -25.9983, lng: 28.1263 };
    const crownMines = { lat: -26.2225, lng: 27.9947 };

    const distance = calculateHaversineDistanceKm(midrand, crownMines);
    // Great circle distance between Midrand and Crown Mines is ~28 km
    expect(distance).toBeGreaterThan(24);
    expect(distance).toBeLessThan(32);
  });

  it('formats distance correctly across display tiers', () => {
    expect(formatDistance(0.4)).toBe('Under 1 km');
    expect(formatDistance(4.2)).toBe('4.2 km away');
    expect(formatDistance(28.4)).toBe('28 km away');
    expect(formatDistance(140)).toBe('140 km');
    expect(formatDistance(Infinity)).toBe('Nearby');
  });

  it('calculates normalized proximity score', () => {
    // 0km -> 1.0
    expect(calculateProximityScore(0)).toBe(1.0);
    // 30km with max radius 60km -> 0.5
    expect(calculateProximityScore(30, 60)).toBe(0.5);
    // >60km -> 0.0
    expect(calculateProximityScore(70, 60)).toBe(0.0);
  });

  it('finds the nearest South African trading hub for given coordinates', () => {
    // A point right in Crown Mines
    const nearCrownMines = { lat: -26.22, lng: 27.99 };
    const result = findNearestTradingHub(nearCrownMines);

    expect(result.hub.id).toBe('hub_crown_mines');
    expect(result.distanceKm).toBeLessThan(5);
  });
});
