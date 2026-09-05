import type { DeckId } from '../../domain/deck';
import type { Phrase } from '../../domain/phrase';
import type { PhraseRepositoryPort } from '../ports/phrase-repository.port';

/** Use case: load the full phrases of a deck from the repository. */
export class LoadPhrases {
  constructor(private readonly repository: PhraseRepositoryPort) {}

  execute(deckId: DeckId): Promise<readonly Phrase[]> {
    return this.repository.loadAll(deckId);
  }
}
