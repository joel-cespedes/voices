import type { DeckId } from '../../domain/deck';
import type { Progress } from '../../domain/progress';

/**
 * Port: persistence of the user's position. Implemented by infrastructure
 * (e.g. localStorage). Synchronous by design — the adapter must not block.
 *
 * The position is kept PER DECK, so switching lists and coming back resumes
 * where that list was left. The active deck is stored alongside.
 */
export interface ProgressStoragePort {
  /** Load the persisted progress of a deck, or null if none was saved. */
  load(deckId: DeckId): Progress | null;
  /** Persist the progress of a deck. */
  save(deckId: DeckId, progress: Progress): void;
  /** Deck the user was practicing last, or null if none was saved. */
  loadActiveDeck(): DeckId | null;
  /** Remember which deck the user is practicing. */
  saveActiveDeck(deckId: DeckId): void;
}
