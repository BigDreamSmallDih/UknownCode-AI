import { ProviderError, errorFromStatus, publicMessage } from './errors.js';
import type {
  AIProvider,
  ChatRequest,
  ChatResponse,
  ModelInfo,
  ProviderCapabilities,
  StreamEvent,
  TokenUsage,
} from './provider.interface.js';
import { parseSseData } from './sse.js';

export interface OpenRouterOptions {
  apiKey: string;
  baseUrl?: string;
  /** Sent as HTTP-Referer so usage is attributed to this app on OpenRouter. */
  referer?: string;
  title?: string;
  fetchImpl?: typeof fetch;
  /** Retries for non-streaming calls on 429/5xx. Streaming is never retried mid-way. */
  maxRetries?: number;
  retryDelayMs?: number;
  defaultTimeoutMs?: number;
  modelsTtlMs?: number;
}

interface UsageWire {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface ModelWire {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';

function toUsage(wire: UsageWire | undefined): TokenUsage {
  const usage: TokenUsage = {};
  if (typeof wire?.prompt_tokens === 'number') usage.inputTokens = wire.prompt_tokens;
  if (typeof wire?.completion_tokens === 'number') usage.outputTokens = wire.completion_tokens;
  return usage;
}

export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter' as const;
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    systemPrompt: true,
    toolCalling: false,
    reportsTokenUsage: true,
  };

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly referer: string | undefined;
  private readonly title: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly defaultTimeoutMs: number;
  private readonly modelsTtlMs: number;
  private modelsCache: { at: number; models: ModelInfo[] } | null = null;

  constructor(options: OpenRouterOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.referer = options.referer;
    this.title = options.title ?? 'UknownCode AI';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 500;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 60_000;
    this.modelsTtlMs = options.modelsTtlMs ?? 10 * 60_000;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': this.title,
    };
    if (this.referer) headers['HTTP-Referer'] = this.referer;
    return headers;
  }

  private signalFor(request: ChatRequest): AbortSignal {
    const timeout = AbortSignal.timeout(request.timeoutMs ?? this.defaultTimeoutMs);
    return request.signal ? AbortSignal.any([request.signal, timeout]) : timeout;
  }

  private body(request: ChatRequest, stream: boolean): string {
    return JSON.stringify({
      model: request.model,
      messages: request.messages,
      stream,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.maxOutputTokens !== undefined ? { max_tokens: request.maxOutputTokens } : {}),
    });
  }

  async listModels(): Promise<ModelInfo[]> {
    const now = Date.now();
    if (this.modelsCache && now - this.modelsCache.at < this.modelsTtlMs) {
      return this.modelsCache.models;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/models`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });
    } catch {
      throw new ProviderError('UPSTREAM', true);
    }
    if (!response.ok) throw errorFromStatus(response.status);

    const json = (await response.json()) as { data?: ModelWire[] };
    const models: ModelInfo[] = [];
    for (const item of json.data ?? []) {
      if (typeof item.id !== 'string' || item.id.length === 0) continue;
      const free =
        item.id.endsWith(':free') ||
        (Number(item.pricing?.prompt) === 0 &&
          Number(item.pricing?.completion) === 0 &&
          item.pricing?.prompt !== undefined);
      const model: ModelInfo = { id: item.id, name: item.name ?? item.id, free };
      if (typeof item.context_length === 'number') model.contextLength = item.context_length;
      models.push(model);
    }

    this.modelsCache = { at: now, models };
    return models;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    let lastError: ProviderError = new ProviderError('UPSTREAM', true);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await sleep(this.retryDelayMs * 2 ** (attempt - 1), request.signal);

      let response: Response;
      try {
        response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.headers(),
          body: this.body(request, false),
          signal: this.signalFor(request),
        });
      } catch (error) {
        if (request.signal?.aborted) throw error;
        lastError = new ProviderError(isTimeout(error) ? 'TIMEOUT' : 'UPSTREAM', true);
        continue;
      }

      if (!response.ok) {
        lastError = errorFromStatus(response.status);
        if (lastError.retryable) continue;
        throw lastError;
      }

      const json = (await response.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string | null } }>;
        usage?: UsageWire;
      };
      return {
        content: json.choices?.[0]?.message?.content ?? '',
        usage: toUsage(json.usage),
        model: json.model ?? request.model,
      };
    }
    throw lastError;
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<StreamEvent> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: this.body(request, true),
        signal: this.signalFor(request),
      });
    } catch (error) {
      if (request.signal?.aborted) return;
      yield errorEvent(new ProviderError(isTimeout(error) ? 'TIMEOUT' : 'UPSTREAM', true));
      return;
    }

    if (!response.ok || !response.body) {
      yield errorEvent(errorFromStatus(response.ok ? 502 : response.status));
      return;
    }

    let usage: TokenUsage = {};
    try {
      for await (const payload of parseSseData(
        response.body as unknown as AsyncIterable<Uint8Array>,
      )) {
        if (payload === '[DONE]') break;

        let chunk: {
          error?: unknown;
          choices?: Array<{ delta?: { content?: string | null } }>;
          usage?: UsageWire;
        };
        try {
          chunk = JSON.parse(payload) as typeof chunk;
        } catch {
          continue; // Ignore malformed keep-alive style payloads.
        }

        if (chunk.error) {
          yield errorEvent(new ProviderError('UPSTREAM', false));
          return;
        }
        if (chunk.usage) usage = toUsage(chunk.usage);
        const text = chunk.choices?.[0]?.delta?.content;
        if (typeof text === 'string' && text.length > 0) yield { type: 'delta', text };
      }
    } catch (error) {
      if (request.signal?.aborted) return;
      yield errorEvent(new ProviderError(isTimeout(error) ? 'TIMEOUT' : 'UPSTREAM', true));
      return;
    }

    yield { type: 'done', usage };
  }
}

function errorEvent(error: ProviderError): StreamEvent {
  return {
    type: 'error',
    code: error.code,
    message: publicMessage(error.code),
    retryable: error.retryable,
  };
}

function isTimeout(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError');
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
