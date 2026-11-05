/**
 * Common contract for AI providers (Gemini, Claude, OpenAI).
 *
 * Phase 1 only defines the types. Concrete implementations arrive in Phase 4.
 * Providers do not support identical features, so capabilities are declared explicitly
 * and callers must check them instead of assuming parity.
 */

export type ProviderId = 'gemini' | 'claude' | 'openai';

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

export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; usage: TokenUsage }
  | { type: 'error'; message: string; retryable: boolean };

export interface AIProvider {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;
  listModels(): Promise<string[]>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncIterable<StreamEvent>;
}
