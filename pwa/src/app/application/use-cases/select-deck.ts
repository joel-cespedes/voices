import type { DeckId } from '../../domain/deck';
import type { ProgressStoragePort } from '../ports/progress-storage.port';

/**
 * Use case: the user picks a deck to practice. Remembers the choice so the app
 * reopens on that deck. The position within it is restored by the caller via
 * `ProgressStoragePort.load(deckId)`.
 */
export class SelectDeck {
  constructor(private readonly progress: ProgressStoragePort) {}

  execute(deckId: DeckId): void {
    this.progress.saveActiveDeck(deckId);
  }
}
