/**
 * Common contract for AI providers.
 *
 * Providers do not support identical features, so capabilities are declared explicitly and
 * callers must check them instead of assuming parity. Implemented so far: OpenRouter.
 * Gemini, Claude, and OpenAI direct providers are still to come.
 */

export type ProviderId = 'gemini' | 'claude' | 'openai' | 'openrouter';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ProviderCapabilities {
  streaming: boolean;
  systemPrompt: boolean;
  toolCalling: boolean;
  reportsTokenUsage: boolean;
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  free: boolean;
  contextLength?: number;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ChatResponse {
  content: string;
  usage: TokenUsage;
  model: string;
}

/** Stable, provider-independent error categories. Raw upstream text is never exposed. */
export type ProviderErrorCode = 'RATE_LIMITED' | 'AUTH' | 'MODEL' | 'TIMEOUT' | 'UPSTREAM';

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: TokenUsage }
  | { type: 'error'; code: ProviderErrorCode; message: string; retryable: boolean };

export interface AIProvider {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;
  listModels(): Promise<ModelInfo[]>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncIterable<StreamEvent>;
}
