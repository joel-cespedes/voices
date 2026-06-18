import type { Phrase } from '../../domain/phrase';
import type { PhraseRepositoryPort } from '../ports/phrase-repository.port';

/** Use case: load the full deck of phrases from the repository. */
export class LoadPhrases {
  constructor(private readonly repository: PhraseRepositoryPort) {}

  execute(): Promise<readonly Phrase[]> {
    return this.repository.loadAll();
  }
}
