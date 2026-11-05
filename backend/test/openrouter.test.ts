import { describe, expect, it } from 'vitest';
import { ProviderError } from '../src/providers/errors.js';
import { OpenRouterProvider } from '../src/providers/openrouter.js';
import type { StreamEvent } from '../src/providers/provider.interface.js';

const encoder = new TextEncoder();

function sseResponse(parts: string[], status = 200): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(encoder.encode(part));
      controller.close();
    },
  });
  return new Response(body, { status });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function provider(fetchImpl: typeof fetch) {
  return new OpenRouterProvider({ apiKey: 'test-key', fetchImpl, retryDelayMs: 0 });
}

async function collect(stream: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

const request = { model: 'vendor/model:free', messages: [{ role: 'user' as const, content: 'hi' }] };

describe('OpenRouterProvider.listModels', () => {
  it('flags free models and caches the result', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return json({
        data: [
          { id: 'a/free-one:free', name: 'Free One', context_length: 8000 },
          { id: 'b/zero', name: 'Zero Priced', pricing: { prompt: '0', completion: '0' } },
          { id: 'c/paid', name: 'Paid', pricing: { prompt: '0.000001', completion: '0.000002' } },
          { name: 'no id' },
        ],
      });
    }) as typeof fetch;

    const openrouter = provider(fetchImpl);
    const models = await openrouter.listModels();
    expect(models.map((m) => [m.id, m.free])).toEqual([
      ['a/free-one:free', true],
      ['b/zero', true],
      ['c/paid', false],
    ]);
    expect(models[0]?.contextLength).toBe(8000);

    await openrouter.listModels();
    expect(calls).toBe(1);
  });
});

describe('OpenRouterProvider.chatStream', () => {
  it('streams deltas and reports usage, sending auth and model', async () => {
    let seen: { url: string; init: RequestInit | undefined } | undefined;
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen = { url, init };
      return sseResponse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        ': OPENROUTER PROCESSING\n\ndata: {"choices":[{"delta":{"con',
        'tent":"lo"}}]}\n\n',
        'data: {"choices":[],"usage":{"prompt_tokens":5,"completion_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ]);
    }) as unknown as typeof fetch;

    const events = await collect(provider(fetchImpl).chatStream(request));

    expect(events).toEqual([
      { type: 'delta', text: 'Hel' },
      { type: 'delta', text: 'lo' },
      { type: 'done', usage: { inputTokens: 5, outputTokens: 2 } },
    ]);
    expect(seen?.url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const headers = seen?.init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-key');
    expect(JSON.parse(String(seen?.init?.body))).toMatchObject({
      model: 'vendor/model:free',
      stream: true,
    });
  });

  it('turns an HTTP 429 into a retryable RATE_LIMITED error event', async () => {
    const fetchImpl = (async () => json({ error: 'slow down' }, 429)) as unknown as typeof fetch;
    const events = await collect(provider(fetchImpl).chatStream(request));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'error', code: 'RATE_LIMITED', retryable: true });
  });

  it('never exposes upstream error text', async () => {
    const fetchImpl = (async () =>
      sseResponse([
        'data: {"error":{"message":"secret upstream detail"}}\n\n',
      ])) as unknown as typeof fetch;
    const events = await collect(provider(fetchImpl).chatStream(request));
    expect(JSON.stringify(events)).not.toMatch(/secret upstream detail/);
    expect(events[0]).toMatchObject({ type: 'error', code: 'UPSTREAM' });
  });

  it('maps a rejected model (400) to MODEL', async () => {
    const fetchImpl = (async () => json({}, 400)) as unknown as typeof fetch;
    const events = await collect(provider(fetchImpl).chatStream(request));
    expect(events[0]).toMatchObject({ type: 'error', code: 'MODEL', retryable: false });
  });
});

describe('OpenRouterProvider.chat', () => {
  it('retries on 5xx and then succeeds', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) return json({}, 500);
      return json({
        model: 'vendor/model:free',
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 1, completion_tokens: 1 },
      });
    }) as unknown as typeof fetch;

    const response = await provider(fetchImpl).chat(request);
    expect(response.content).toBe('ok');
    expect(response.usage).toEqual({ inputTokens: 1, outputTokens: 1 });
    expect(calls).toBe(2);
  });

  it('does not retry a rejected request', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return json({}, 400);
    }) as unknown as typeof fetch;

    await expect(provider(fetchImpl).chat(request)).rejects.toBeInstanceOf(ProviderError);
    expect(calls).toBe(1);
  });
});
