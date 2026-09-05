/**
 * Change Detector & Differential Audit Agent
 *
 * Compares incoming scraped product offers against existing records to detect
 * price drops, price increases, stock transitions, and canonical URL changes.
 */

import { DiscoveredOffer } from '@shoppage/contracts';

export type ProductChangeType =
  | 'PRICE_DROP'
  | 'PRICE_INCREASE'
  | 'OUT_OF_STOCK'
  | 'RESTOCKED'
  | 'URL_UPDATED'
  | 'IMAGE_UPDATED'
  | 'NO_CHANGE';

export interface ProductChangeEvent {
  eventId: string;
  offerId: string;
  masterProductRef: string;
  productTitle: string;
  merchantName: string;
  changeType: ProductChangeType;
  oldPriceZar?: number;
  newPriceZar?: number;
  priceDiffZar?: number;
  pctChange?: number;
  oldAvailability?: string;
  newAvailability?: string;
  oldUrl?: string;
  newUrl?: string;
  detectedAt: string;
  summary: string;
}

const OUT_OF_STOCK_KEYWORDS = [
  'out of stock',
  'sold out',
  'currently unavailable',
  'temporarily out of stock',
  'discontinued',
  'backorder',
  'no stock',
];

export class ChangeDetectorAgent {
  private auditHistory: ProductChangeEvent[] = [];

  /**
   * Evaluates if availability text represents an out-of-stock state
   */
  public isOutOfStock(text?: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return OUT_OF_STOCK_KEYWORDS.some((kw) => lower.includes(kw));
  }

  /**
   * Compares an incoming offer with an existing stored offer and identifies changes
   */
  public detectChanges(
    existingOffer: DiscoveredOffer,
    incomingOffer: {
      id?: string;
      masterProductRef: string;
      productTitle?: string;
      merchantName: string;
      priceZar: number;
      availabilityText?: string;
      sourceUrl?: string;
      imageUrl?: string;
    },
  ): ProductChangeEvent[] {
    const changes: ProductChangeEvent[] = [];
    const now = new Date().toISOString();
    const offerId = existingOffer.id;
    const productRef = existingOffer.masterProductRef;
    const title = incomingOffer.productTitle || existingOffer.productTitle || existingOffer.masterProductRef;
    const merchant = incomingOffer.merchantName || existingOffer.merchantName;

    const existingPrice = existingOffer.discoveredPrice?.amount ?? 0;
    const incomingPrice = incomingOffer.priceZar;

    // 1. Price Differential
    if (existingPrice > 0 && incomingPrice > 0 && existingPrice !== incomingPrice) {
      const diff = Math.round((incomingPrice - existingPrice) * 100) / 100;
      const pct = Math.round(Math.abs(diff / existingPrice) * 100);

      if (incomingPrice < existingPrice) {
        changes.push({
          eventId: `evt_drop_${offerId}_${Date.now()}`,
          offerId,
          masterProductRef: productRef,
          productTitle: title,
          merchantName: merchant,
          changeType: 'PRICE_DROP',
          oldPriceZar: existingPrice,
          newPriceZar: incomingPrice,
          priceDiffZar: Math.abs(diff),
          pctChange: pct,
          detectedAt: now,
          summary: `Price drop from R ${existingPrice.toLocaleString('en-ZA')} to R ${incomingPrice.toLocaleString('en-ZA')} (${pct}% discount) at ${merchant}`,
        });
      } else {
        changes.push({
          eventId: `evt_inc_${offerId}_${Date.now()}`,
          offerId,
          masterProductRef: productRef,
          productTitle: title,
          merchantName: merchant,
          changeType: 'PRICE_INCREASE',
          oldPriceZar: existingPrice,
          newPriceZar: incomingPrice,
          priceDiffZar: diff,
          pctChange: pct,
          detectedAt: now,
          summary: `Price increased from R ${existingPrice.toLocaleString('en-ZA')} to R ${incomingPrice.toLocaleString('en-ZA')} (+${pct}%) at ${merchant}`,
        });
      }
    }

    // 2. Stock Availability Shift
    const existingWasOos = this.isOutOfStock(existingOffer.availabilityText);
    const incomingIsOos = this.isOutOfStock(incomingOffer.availabilityText);

    if (!existingWasOos && incomingIsOos) {
      changes.push({
        eventId: `evt_oos_${offerId}_${Date.now()}`,
        offerId,
        masterProductRef: productRef,
        productTitle: title,
        merchantName: merchant,
        changeType: 'OUT_OF_STOCK',
        oldAvailability: existingOffer.availabilityText,
        newAvailability: incomingOffer.availabilityText || 'Out of Stock',
        detectedAt: now,
        summary: `Product is now Out of Stock at ${merchant} (previously: "${existingOffer.availabilityText}")`,
      });
    } else if (existingWasOos && !incomingIsOos) {
      changes.push({
        eventId: `evt_restock_${offerId}_${Date.now()}`,
        offerId,
        masterProductRef: productRef,
        productTitle: title,
        merchantName: merchant,
        changeType: 'RESTOCKED',
        oldAvailability: existingOffer.availabilityText,
        newAvailability: incomingOffer.availabilityText || 'In Stock',
        detectedAt: now,
        summary: `Product restocked and available at ${merchant}`,
      });
    }

    // 3. Direct URL Canonical Update
    if (
      incomingOffer.sourceUrl &&
      existingOffer.sourceUrl &&
      incomingOffer.sourceUrl !== existingOffer.sourceUrl
    ) {
      changes.push({
        eventId: `evt_url_${offerId}_${Date.now()}`,
        offerId,
        masterProductRef: productRef,
        productTitle: title,
        merchantName: merchant,
        changeType: 'URL_UPDATED',
        oldUrl: existingOffer.sourceUrl,
        newUrl: incomingOffer.sourceUrl,
        detectedAt: now,
        summary: `Product link updated to canonical retailer URL for ${title}`,
      });
    }

    // Record to audit trail
    for (const change of changes) {
      this.auditHistory.push(change);
    }

    return changes;
  }

  /**
   * Retrieves the historical audit log of detected changes
   */
  public getAuditHistory(limit: number = 100): ProductChangeEvent[] {
    return this.auditHistory.slice(-limit).reverse();
  }

  /**
   * Clears in-memory audit history
   */
  public clearAuditHistory(): void {
    this.auditHistory = [];
  }
}
