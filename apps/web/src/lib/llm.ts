// Server-only LLM client for the Shoppage assistant.
// Provider-agnostic interface; Google Gemini is the default provider over plain
// fetch (no SDK dependency). Never import this module from client components:
/// the API key must only ever travel server-side.

export interface LLMToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface LLMResult {
  text: string;
  toolCalls: LLMToolCall[];
}

export interface LLMRequest {
  system: string;
  message: string;
  tools?: LLMToolDef[];
  signal?: AbortSignal;
  maxOutputTokens?: number;
}

export type LLMErrorCode =
  | 'NOT_CONFIGURED'
  | 'AUTH'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PROVIDER'
  | 'BAD_RESPONSE';

export class LLMError extends Error {
  code: LLMErrorCode;
  retryable: boolean;
  constructor(code: LLMErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
    this.retryable = retryable;
  }
}

export interface LLMProvider {
  readonly name: string;
  complete(req: LLMRequest): Promise<LLMResult>;
}

export function getLLMConfig() {
  return {
    apiKey: (process.env.GEMINI_API_KEY || '').trim(),
    model: (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim(),
  };
}

type GeminiPart = {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
};

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message?: string };
};

function toAbortError(err: unknown): LLMError | null {
  if (err instanceof Error && err.name === 'AbortError') {
    return new LLMError('TIMEOUT', 'LLM request timed out');
  }
  return null;
}

async function postGemini(
  model: string,
  apiKey: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<GeminiResponse> {
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(payload),
        signal,
      },
    );
  } catch (err) {
    throw toAbortError(err) || new LLMError('PROVIDER', 'LLM request failed');
  }
  if (res.status === 401 || res.status === 403) {
    throw new LLMError('AUTH', 'LLM provider rejected the API key');
  }
  if (res.status === 429) {
    throw new LLMError('RATE_LIMITED', 'LLM provider rate limit reached', true);
  }
  if (!res.ok) {
    throw new LLMError('PROVIDER', `LLM provider error ${res.status}`, res.status >= 500);
  }
  return (await res.json()) as GeminiResponse;
}

function parseGemini(body: GeminiResponse): LLMResult {
  if (body.error?.message) {
    throw new LLMError('PROVIDER', body.error.message);
  }
  const parts = body.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('')
    .trim();
  const toolCalls = parts
    .filter((p) => typeof p.functionCall?.name === 'string' && p.functionCall.name.length > 0)
    .map((p) => ({
      name: p.functionCall?.name as string,
      args:
        p.functionCall?.args && typeof p.functionCall.args === 'object'
          ? (p.functionCall.args as Record<string, unknown>)
          : {},
    }));
  if (!text && toolCalls.length === 0) {
    throw new LLMError('BAD_RESPONSE', 'LLM returned an empty response');
  }
  return { text, toolCalls };
}

class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  async complete(req: LLMRequest): Promise<LLMResult> {
    const { apiKey, model } = getLLMConfig();
    if (!apiKey) {
      throw new LLMError('NOT_CONFIGURED', 'GEMINI_API_KEY is not set');
    }
    const payload: Record<string, unknown> = {
      system_instruction: { parts: [{ text: req.system }] },
      contents: [{ role: 'user', parts: [{ text: req.message }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: req.maxOutputTokens ?? 1024,
      },
    };
    if (req.tools && req.tools.length > 0) {
      payload.tools = [{ function_declarations: req.tools }];
    }
    try {
      return parseGemini(await postGemini(model, apiKey, payload, req.signal));
    } catch (err) {
      if (err instanceof LLMError && err.retryable) {
        await new Promise((r) => setTimeout(r, 600));
        return parseGemini(await postGemini(model, apiKey, payload, req.signal));
      }
      throw err;
    }
  }
}

export function getProvider(): LLMProvider {
  return new GeminiProvider();
}

export async function completeChat(req: LLMRequest): Promise<LLMResult> {
  return getProvider().complete(req);
}
