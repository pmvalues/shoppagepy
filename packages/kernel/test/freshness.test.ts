import { describe, it, expect } from 'vitest';
import { evaluateOfferFreshness, detectPriceAnomaly } from '../src/offers/freshness.js';
import { SA_FLAGSHIP_OFFERS } from '../src/seed/sa_flagship_seed.js';

describe('Freshness State Machine & Anomaly Detector', () => {
  it('identifies an offer as fresh when within SLA window', () => {
    const offer = { ...SA_FLAGSHIP_OFFERS[0] };
    const now = new Date(offer.freshness.lastConfirmedAt);
    const evaluation = evaluateOfferFreshness(offer, now);

    expect(evaluation.nextState).toBe('fresh');
    expect(evaluation.stateChanged).toBe(false);
  });

  it('transitions offer to confirm_required when age exceeds SLA limit', () => {
    const offer = { ...SA_FLAGSHIP_OFFERS[0] }; // SLA = retail_72h
    const now = new Date(new Date(offer.freshness.lastConfirmedAt).getTime() + 75 * 3600 * 1000); // 75h later

    const evaluation = evaluateOfferFreshness(offer, now);
    expect(evaluation.nextState).toBe('confirm_required');
    expect(evaluation.stateChanged).toBe(true);
  });

  it('demotes offer to expired when age exceeds 2x SLA limit', () => {
    const offer = { ...SA_FLAGSHIP_OFFERS[0] }; // SLA = retail_72h (144h max)
    const now = new Date(new Date(offer.freshness.lastConfirmedAt).getTime() + 150 * 3600 * 1000); // 150h later

    const evaluation = evaluateOfferFreshness(offer, now);
    expect(evaluation.nextState).toBe('expired');
  });

  it('detects extreme price anomaly', () => {
    // Mean = R20,000, StdDev = R2,000. Price = R500 (suspiciously low)
    const res = detectPriceAnomaly(500, 20000, 2000);
    expect(res.isAnomaly).toBe(true);
    expect(res.severity).toBe('critical');
  });
});
