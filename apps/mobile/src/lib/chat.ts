import type { MessageKey } from '../i18n';

export interface ModelOption {
  id: string;
  name: string;
  free: boolean;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Free models first, then alphabetical by display name. */
export function sortModels(models: readonly ModelOption[]): ModelOption[] {
  return [...models].sort((a, b) => {
    if (a.free !== b.free) return a.free ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/** Picks the model to preselect: the saved one if it still exists, else the first free one. */
export function pickModel(models: readonly ModelOption[], saved: string): string {
  if (saved && models.some((model) => model.id === saved)) return saved;
  return models.find((model) => model.free)?.id ?? models[0]?.id ?? '';
}

/**
 * Incremental parser for Server-Sent Events. Feed it text as it arrives and it returns the
 * payloads of every complete `data:` event so far, keeping any partial event for later.
 */
export function createSseParser(): { feed: (text: string) => string[] } {
  let buffer = '';
  return {
    feed(text: string): string[] {
      buffer += text;
      const payloads: string[] = [];
      let boundary = buffer.search(/\r?\n\r?\n/);
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        const separator = /^\r?\n\r?\n/.exec(buffer.slice(boundary));
        buffer = buffer.slice(boundary + (separator?.[0].length ?? 2));

        const data = rawEvent
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).replace(/^ /, ''))
          .join('\n');
        if (data !== '') payloads.push(data);

        boundary = buffer.search(/\r?\n\r?\n/);
      }
      return payloads;
    },
  };
}

export function messageKeyForHttpError(status: number, code: string | undefined): MessageKey {
  if (status === 401) return 'chat.errUnauthorized';
  if (status === 429) return 'chat.errRate';
  if (status === 503 && code === 'PROVIDER_NOT_CONFIGURED') return 'chat.errNotConfigured';
  return 'chat.errGeneric';
}

export function messageKeyForStreamError(code: string | undefined): MessageKey {
  if (code === 'RATE_LIMITED') return 'chat.errRate';
  if (code === 'MODEL') return 'chat.errModel';
  return 'chat.errGeneric';
}

export type ChatOutcome = { ok: true } | { ok: false; key: MessageKey };

interface StreamParams {
  baseUrl: string;
  token: string;
  model: string;
  messages: readonly ChatTurn[];
  signal: AbortSignal;
  onDelta: (text: string) => void;
}

async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { code?: string } };
    return body.error?.code;
  } catch {
    return undefined;
  }
}

/** Sends the conversation and streams the reply. Never throws; returns the outcome. */
export async function streamChat(params: StreamParams): Promise<ChatOutcome> {
  try {
    const response = await fetch(`${params.baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({ model: params.model, messages: params.messages }),
      signal: params.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        key: messageKeyForHttpError(response.status, await readErrorCode(response)),
      };
    }
    if (!response.body) return { ok: false, key: 'chat.errGeneric' };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = createSseParser();
    let failed: MessageKey | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const payload of parser.feed(decoder.decode(value, { stream: true }))) {
        let event: { type?: string; text?: string; code?: string };
        try {
          event = JSON.parse(payload) as typeof event;
        } catch {
          continue;
        }
        if (event.type === 'delta' && typeof event.text === 'string') params.onDelta(event.text);
        if (event.type === 'error') failed = messageKeyForStreamError(event.code);
      }
    }
    return failed ? { ok: false, key: failed } : { ok: true };
  } catch (error) {
    // Pressing "Stop" aborts the request on purpose; that is not an error.
    if (params.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return { ok: true };
    }
    return { ok: false, key: 'chat.errGeneric' };
  }
}

/** Loads the OpenRouter model list through the backend. */
export async function fetchModels(
  baseUrl: string,
  token: string,
  signal: AbortSignal,
): Promise<ModelOption[]> {
  const response = await fetch(`${baseUrl}/ai/models`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { models?: ModelOption[] };
  return sortModels(body.models ?? []);
}
