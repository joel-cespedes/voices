/**
 * Domain entity: a single shadowing phrase.
 *
 * Pure data — no Angular, no infrastructure. The `es` translation is optional:
 * the source data may not provide it, and the UI must tolerate its absence.
 */
export interface Phrase {
  /** Correlative number (1..N) as found in the source index. */
  readonly numero: number;
  /** Audio file name to play (already normalized to the configured format). */
  readonly archivo: string;
  /** English text — the sentence that is heard. Never empty for a valid phrase. */
  readonly en: string;
  /** Spanish translation, or `null` when the source provides none. */
  readonly es: string | null;
}

/** Returns true when the phrase has a non-empty Spanish translation. */
export function hasTranslation(phrase: Phrase): boolean {
  return phrase.es !== null && phrase.es.trim().length > 0;
}
