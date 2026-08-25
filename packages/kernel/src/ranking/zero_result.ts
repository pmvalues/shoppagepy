/**
 * Zero-Result Demand Reason Classifier
 */

export type ZeroResultReasonCode =
  | 'NO_LOCAL_SUPPLY'
  | 'STALE_SUPPLY_EXPIRED'
  | 'UNMATCHED_LANGUAGE_ALIAS'
  | 'CATALOGUE_SPEC_GAP'
  | 'RESTRICTED_PROHIBITED_CATEGORY'
  | 'LOCATION_AMBIGUITY'
  | 'SEARCH_SYNTAX_DEFECT';

export interface ZeroResultClassification {
  reasonCode: ZeroResultReasonCode;
  actionableStep: string;
  autoCreateRequestSuggested: boolean;
  suggestedBroaderQuery?: string;
}

export function classifyZeroResult(params: {
  rawQuery: string;
  hasCatalogMatch: boolean;
  hasMerchantInArea: boolean;
  hasExpiredOffers: boolean;
  isRestrictedCategory?: boolean;
}): ZeroResultClassification {
  if (params.isRestrictedCategory) {
    return {
      reasonCode: 'RESTRICTED_PROHIBITED_CATEGORY',
      actionableStep: 'Query matches regulated or prohibited goods. Suppressed by policy.',
      autoCreateRequestSuggested: false,
    };
  }

  if (!params.hasCatalogMatch) {
    return {
      reasonCode: 'CATALOGUE_SPEC_GAP',
      actionableStep: 'Create structured request to prompt merchant responses and catalogue ingestion.',
      autoCreateRequestSuggested: true,
      suggestedBroaderQuery: params.rawQuery.split(/\s+/).slice(0, 2).join(' '),
    };
  }

  if (params.hasExpiredOffers) {
    return {
      reasonCode: 'STALE_SUPPLY_EXPIRED',
      actionableStep: 'Offers exist but are expired. Dispatch quick freshness ping to local merchants.',
      autoCreateRequestSuggested: true,
    };
  }

  if (!params.hasMerchantInArea) {
    return {
      reasonCode: 'NO_LOCAL_SUPPLY',
      actionableStep: 'Product recognized but no active merchant in corridor. Broaden search radius.',
      autoCreateRequestSuggested: true,
    };
  }

  return {
    reasonCode: 'LOCATION_AMBIGUITY',
    actionableStep: 'Clarify target city, corridor, or marketplace.',
    autoCreateRequestSuggested: false,
  };
}
