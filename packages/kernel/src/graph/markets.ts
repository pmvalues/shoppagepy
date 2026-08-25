import { Market } from '@shoppage/contracts';

export interface MarketContainmentEdge {
  parentMarketId: string;
  childMarketId: string;
  containmentType: 'physical_building' | 'zone_section' | 'aisle_floor' | 'designated_precinct';
  evidenceType: 'cadastral_polygon' | 'official_mall_map' | 'operator_lease_record' | 'field_gps_verified';
  evidenceRef: string;
  verifiedAt: string;
}

/**
 * Validates whether a child market/stall is strictly contained inside a parent market
 * REJECTS proximity-only claims without documented spatial/roster evidence.
 */
export function validateMarketContainment(
  parentMarket: Market,
  childMarketId: string,
  evidence?: {
    evidenceType: MarketContainmentEdge['evidenceType'];
    evidenceRef: string;
  }
): { isContained: boolean; reason: string } {
  if (!evidence || !evidence.evidenceRef) {
    return {
      isContained: false,
      reason: 'Proximity alone cannot establish market containment. Missing verified polygon or lease evidence.',
    };
  }

  // Hierarchy validation
  if (parentMarket.id === childMarketId) {
    return {
      isContained: false,
      reason: 'Self-containment cycle detected. A market cannot contain itself.',
    };
  }

  return {
    isContained: true,
    reason: `Containment verified via ${evidence.evidenceType} (ref: ${evidence.evidenceRef}).`,
  };
}

/**
 * Reconstructs the full breadcrumb path for nested markets
 */
export function buildMarketPath(
  currentMarketId: string,
  marketLookup: Map<string, Market>
): Market[] {
  const path: Market[] = [];
  let current = marketLookup.get(currentMarketId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    if (!current.parentMarketId) break;
    current = marketLookup.get(current.parentMarketId);
  }

  return path;
}
