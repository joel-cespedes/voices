import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv-parser';

describe('parseCsv', () => {
  it('parses a simple file with a header row', () => {
    const rows = parseCsv('numero,archivo,texto\n1,0001.wav,Hello\n2,0002.wav,World');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ numero: '1', archivo: '0001.wav', texto: 'Hello' });
  });

  it('handles quoted fields with embedded commas', () => {
    const rows = parseCsv('numero,texto\n1,"I\'m in a rush, hurry up."');
    expect(rows[0]['texto']).toBe("I'm in a rush, hurry up.");
  });

  it('handles escaped quotes', () => {
    const rows = parseCsv('a\n"she said ""hi"""');
    expect(rows[0]['a']).toBe('she said "hi"');
  });

  it('handles CRLF line endings', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n3,4\r\n');
    expect(rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('lower-cases headers and skips blank trailing lines', () => {
    const rows = parseCsv('Numero,Texto\n1,hi\n\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ numero: '1', texto: 'hi' });
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});
