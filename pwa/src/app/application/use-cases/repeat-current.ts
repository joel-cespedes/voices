import {
  currentPhrase,
  type PracticeSession,
} from '../../domain/practice-session';
import type { Phrase } from '../../domain/phrase';

/**
 * Use case: obtain the current phrase so its audio can be replayed.
 * Returns null when the deck is empty.
 */
export class RepeatCurrent {
  execute(session: PracticeSession): Phrase | null {
    return currentPhrase(session);
  }
}
