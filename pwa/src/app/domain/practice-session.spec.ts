import { describe, expect, it } from 'vitest';
import {
  advance,
  createSession,
  currentPhrase,
  goTo,
  isFirst,
  isLast,
  rewind,
  total,
} from './practice-session';
import type { Phrase } from './phrase';

function deck(n: number): Phrase[] {
  return Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    archivo: `${i + 1}.mp3`,
    en: `phrase ${i + 1}`,
    es: null,
  }));
}

describe('practice-session', () => {
  it('clamps the start index into range', () => {
    expect(createSession(deck(3), 99).index).toBe(2);
    expect(createSession(deck(3), -5).index).toBe(0);
    expect(createSession([], 2).index).toBe(0);
  });

  it('reports the current phrase', () => {
    const s = createSession(deck(3), 1);
    expect(currentPhrase(s)?.numero).toBe(2);
    expect(total(s)).toBe(3);
  });

  it('advances and rewinds without leaving the deck', () => {
    let s = createSession(deck(2), 0);
    expect(isFirst(s)).toBe(true);
    s = advance(s);
    expect(s.index).toBe(1);
    expect(isLast(s)).toBe(true);
    s = advance(s); // no-op at the end
    expect(s.index).toBe(1);
    s = rewind(s);
    expect(s.index).toBe(0);
    s = rewind(s); // no-op at the start
    expect(s.index).toBe(0);
  });

  it('jumps to a clamped index', () => {
    const s = createSession(deck(5), 0);
    expect(goTo(s, 3).index).toBe(3);
    expect(goTo(s, 100).index).toBe(4);
  });

  it('returns null for the current phrase of an empty deck', () => {
    expect(currentPhrase(createSession([], 0))).toBeNull();
  });
});
