/**
 * Domain value object: the user's position within the practice deck.
 * Persisted so the session can be resumed where it was left.
 */
export interface Progress {
  /** Zero-based index of the current phrase. */
  readonly currentIndex: number;
}

export const INITIAL_PROGRESS: Progress = { currentIndex: 0 };
