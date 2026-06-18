import type { Phrase } from '../../domain/phrase';

/**
 * Port: source of phrases. Implemented by infrastructure adapters (e.g. a CSV
 * file served over a CDN). The domain/application layers depend only on this
 * contract, never on how or where the data lives.
 */
export interface PhraseRepositoryPort {
  /** Load the full, ordered deck of phrases. */
  loadAll(): Promise<readonly Phrase[]>;
}
