import {
  advance,
  goTo,
  rewind,
  type PracticeSession,
} from '../../domain/practice-session';
import type { ProgressStoragePort } from '../ports/progress-storage.port';

/**
 * Use cases for moving through the deck. Each delegates the (pure) navigation
 * to the domain and persists the resulting position via the progress port,
 * under the deck the session runs on.
 */

export class AdvanceSession {
  constructor(private readonly progress: ProgressStoragePort) {}

  execute(session: PracticeSession): PracticeSession {
    const next = advance(session);
    this.progress.save(next.deckId, { currentIndex: next.index });
    return next;
  }
}

export class RewindSession {
  constructor(private readonly progress: ProgressStoragePort) {}

  execute(session: PracticeSession): PracticeSession {
    const next = rewind(session);
    this.progress.save(next.deckId, { currentIndex: next.index });
    return next;
  }
}

export class GoToPhrase {
  constructor(private readonly progress: ProgressStoragePort) {}

  execute(session: PracticeSession, index: number): PracticeSession {
    const next = goTo(session, index);
    this.progress.save(next.deckId, { currentIndex: next.index });
    return next;
  }
}
