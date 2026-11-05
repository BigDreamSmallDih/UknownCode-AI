/**
 * Minimal Server-Sent Events reader. Yields the payload of each `data:` event.
 * Handles events split across chunks, CRLF line endings, comments (": keep-alive"),
 * and multi-line data fields.
 */
export async function* parseSseData(
  stream: AsyncIterable<Uint8Array | string>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = '';
  let dataLines: string[] = [];

  const flush = (): string | null => {
    if (dataLines.length === 0) return null;
    const payload = dataLines.join('\n');
    dataLines = [];
    return payload;
  };

  for await (const chunk of stream) {
    buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });

    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, '');
      buffer = buffer.slice(newline + 1);

      if (line === '') {
        const payload = flush();
        if (payload !== null) yield payload;
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      // Lines starting with ":" are comments; other fields (event:, id:) are ignored.

      newline = buffer.indexOf('\n');
    }
  }

  // A final event without a trailing blank line.
  if (buffer.startsWith('data:')) dataLines.push(buffer.slice(5).replace(/^ /, '').replace(/\r$/, ''));
  const last = flush();
  if (last !== null) yield last;
}
