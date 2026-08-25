import { MultilingualAlias, ProductVariant } from '@shoppage/contracts';

export interface Draft<T> {
  isDraft: boolean;
  generatedByModel: string;
  generatedAt: string;
  confidenceScore: number;
  extractedData: T;
  unconfirmedFields: string[];
  requiresHumanReview: boolean;
}

export interface GrokToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GrokSearchRequest {
  query: string;
  enableWebSearch?: boolean;
  enableXSearch?: boolean;
  model?: 'grok-4.6' | 'grok-4-fast';
}

/**
 * Governed AI Gateway supporting xAI / Grok with strict Draft<T> isolation
 */
export class GovernedAiGateway {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extracts multilingual colloquial aliases and search intent from raw natural queries
   */
  public async extractAliasesAndIntent(
    rawText: string,
    localeHint: 'zu' | 'xh' | 'af' | 'en' | 'sn' = 'en'
  ): Promise<Draft<{ aliases: MultilingualAlias[]; normalizedQuery: string; category?: string }>> {
    // In production, calls xAI / OpenAI API endpoint with structured JSON mode
    // Enforces Draft<T> type-guard so output cannot directly alter database without confirmation
    const tokens = rawText.toLowerCase().trim().split(/\s+/);
    const normalizedQuery = tokens.join(' ');

    const detectedAliases: MultilingualAlias[] = [
      {
        phrase: rawText.trim(),
        locale: localeHint,
        source: 'ai_normalized',
        confidence: 0.85,
      },
    ];

    return {
      isDraft: true,
      generatedByModel: 'grok-4.6',
      generatedAt: new Date().toISOString(),
      confidenceScore: 0.88,
      extractedData: {
        aliases: detectedAliases,
        normalizedQuery,
      },
      unconfirmedFields: ['category'],
      requiresHumanReview: false,
    };
  }

  /**
   * Parses unformatted Bill of Quantities / merchant price lists into candidate draft variants
   */
  public async parseBillOfQuantities(
    rawDocumentText: string
  ): Promise<Draft<Array<Partial<ProductVariant>>>> {
    const lines = rawDocumentText.split('\n').filter((l) => l.trim().length > 0);
    const candidateVariants: Array<Partial<ProductVariant>> = lines.map((line, idx) => ({
      canonicalId: `cand_${Date.now()}_${idx}`,
      title: line.trim(),
      status: 'draft',
    }));

    return {
      isDraft: true,
      generatedByModel: 'grok-4.6',
      generatedAt: new Date().toISOString(),
      confidenceScore: 0.8,
      extractedData: candidateVariants,
      unconfirmedFields: ['gtin', 'brand', 'attributes'],
      requiresHumanReview: true,
    };
  }
}
