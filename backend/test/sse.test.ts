import { describe, expect, it } from 'vitest';
import { parseSseData } from '../src/providers/sse.js';

async function* chunks(...parts: string[]): AsyncGenerator<string> {
  for (const part of parts) yield part;
}

async function collect(stream: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const payload of parseSseData(stream)) out.push(payload);
  return out;
}

describe('parseSseData', () => {
  it('yields each data event', async () => {
    expect(await collect(chunks('data: one\n\ndata: two\n\n'))).toEqual(['one', 'two']);
  });

  it('reassembles events split across chunks', async () => {
    expect(await collect(chunks('da', 'ta: hel', 'lo\n', '\ndata: wor', 'ld\n\n'))).toEqual([
      'hello',
      'world',
    ]);
  });

  it('ignores comments and other fields, and handles CRLF', async () => {
    expect(
      await collect(chunks(': keep-alive\r\n\r\nevent: x\r\ndata: kept\r\n\r\n')),
    ).toEqual(['kept']);
  });

  it('joins multi-line data and flushes a final event without a blank line', async () => {
    expect(await collect(chunks('data: a\ndata: b\n\ndata: tail'))).toEqual(['a\nb', 'tail']);
  });
});
