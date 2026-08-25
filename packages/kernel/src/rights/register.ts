import { RightsClass } from '@shoppage/contracts';

export interface SourceRightsRecord {
  sourceId: string;
  name: string;
  rightsClass: RightsClass;
  status: 'BLOCKED' | 'CLEARED' | 'SUSPENDED' | 'TERMINATED';
  permittedFields: string[];
  aiUsePermitted: boolean;
  suppressionSlaHours: number;
  contractValidUntil?: string;
}

export interface RightsCheckResult {
  allowed: boolean;
  rightsClass: RightsClass;
  permittedFields: string[];
  reason?: string;
}

/**
 * Checks whether a data source and specific fields are cleared for public display or ingestion
 */
export function checkSourceRights(
  source: SourceRightsRecord,
  requestedFields: string[],
  isAiProcessing: boolean = false
): RightsCheckResult {
  // Hard constructor rule: BLOCKED / SUSPENDED / TERMINATED sources reject all reads/writes
  if (source.status !== 'CLEARED') {
    return {
      allowed: false,
      rightsClass: source.rightsClass,
      permittedFields: [],
      reason: `Source ${source.sourceId} is ${source.status}. Access denied under default-BLOCKED rule.`,
    };
  }

  if (isAiProcessing && !source.aiUsePermitted) {
    return {
      allowed: false,
      rightsClass: source.rightsClass,
      permittedFields: [],
      reason: `Source ${source.sourceId} does not permit AI training or inference processing.`,
    };
  }

  const allowedFields = requestedFields.filter(
    (f) => source.permittedFields.includes('*') || source.permittedFields.includes(f)
  );

  if (allowedFields.length === 0 && requestedFields.length > 0) {
    return {
      allowed: false,
      rightsClass: source.rightsClass,
      permittedFields: [],
      reason: `None of the requested fields [${requestedFields.join(', ')}] are permitted for display.`,
    };
  }

  return {
    allowed: true,
    rightsClass: source.rightsClass,
    permittedFields: allowedFields,
  };
}
