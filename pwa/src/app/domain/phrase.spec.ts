import { describe, expect, it } from 'vitest';
import { hasTranslation, type Phrase } from './phrase';

function phrase(es: string | null): Phrase {
  return { numero: 1, archivo: '0001.mp3', en: 'hello', es };
}

describe('phrase.hasTranslation', () => {
  it('is false when es is null', () => {
    expect(hasTranslation(phrase(null))).toBe(false);
  });
  it('is false when es is blank', () => {
    expect(hasTranslation(phrase('   '))).toBe(false);
  });
  it('is true when es has content', () => {
    expect(hasTranslation(phrase('hola'))).toBe(true);
  });
});
