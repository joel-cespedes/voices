/**
 * Domain entity: a practice session over an ordered deck of phrases.
 *
 * Immutable. All navigation returns a new session; the index is always clamped
 * to a valid range so the UI can never point outside the deck. The session
 * remembers WHICH deck it runs on, so progress is persisted per deck.
 */
import { DEFAULT_DECK_ID, type DeckId } from './deck';
import type { Phrase } from './phrase';

export interface PracticeSession {
  readonly deckId: DeckId;
  readonly phrases: readonly Phrase[];
  readonly index: number;
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (Number.isNaN(index)) return 0;
  return Math.min(length - 1, Math.max(0, Math.trunc(index)));
}

export function createSession(
  phrases: readonly Phrase[],
  startIndex = 0,
  deckId: DeckId = DEFAULT_DECK_ID,
): PracticeSession {
  return { deckId, phrases, index: clampIndex(startIndex, phrases.length) };
}

export function total(session: PracticeSession): number {
  return session.phrases.length;
}

export function currentPhrase(session: PracticeSession): Phrase | null {
  return session.phrases[session.index] ?? null;
}

export function isFirst(session: PracticeSession): boolean {
  return session.index <= 0;
}

export function isLast(session: PracticeSession): boolean {
  return session.index >= session.phrases.length - 1;
}

export function advance(session: PracticeSession): PracticeSession {
  if (isLast(session)) return session;
  return { ...session, index: session.index + 1 };
}

export function rewind(session: PracticeSession): PracticeSession {
  if (isFirst(session)) return session;
  return { ...session, index: session.index - 1 };
}

export function goTo(session: PracticeSession, index: number): PracticeSession {
  return { ...session, index: clampIndex(index, session.phrases.length) };
}
