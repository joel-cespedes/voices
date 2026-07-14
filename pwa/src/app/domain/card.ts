/**
 * Domain value object: a phrase is shown as one or two *cards*.
 *
 *   [ es ] -> [ en ] -> [ es ] -> [ en ] ...
 *     phrase 1           phrase 2
 *
 * You read the Spanish, say it out loud in English, and swipe right to check
 * against the English. The audio is the same on both cards — it is always the
 * English recording, because that is the pronunciation being practised.
 *
 * A phrase with no translation has a single card (the English one), so the deck
 * never shows a blank screen.
 */
import { hasTranslation, type Phrase } from './phrase';
import { currentPhrase, type PracticeSession } from './practice-session';

/** Which side of the phrase a card shows. */
export type Face = 'es' | 'en';

/** Where we are: which phrase, and which of its cards. */
export interface CardPosition {
  readonly index: number;
  readonly face: Face;
}

export const INITIAL_CARD: CardPosition = { index: 0, face: 'es' };

/** The cards a phrase has, in order. */
export function faces(phrase: Phrase | null): readonly Face[] {
  if (phrase === null) return ['en'];
  return hasTranslation(phrase) ? ['es', 'en'] : ['en'];
}

/** The text a given card shows. */
export function cardText(phrase: Phrase | null, face: Face): string {
  if (phrase === null) return '';
  if (face === 'es' && hasTranslation(phrase)) return phrase.es ?? phrase.en;
  return phrase.en;
}

function phraseAt(session: PracticeSession, index: number): Phrase | null {
  return session.phrases[index] ?? null;
}

/** Normalize a position: snap `face` to one the phrase actually has. */
export function normalize(
  session: PracticeSession,
  position: CardPosition,
): CardPosition {
  const available = faces(phraseAt(session, position.index));
  return available.includes(position.face)
    ? position
    : { index: position.index, face: available[0] };
}

/** Next card: the other face of this phrase, or the first face of the next one. */
export function nextCard(
  session: PracticeSession,
  position: CardPosition,
): CardPosition {
  const here = normalize(session, position);
  const available = faces(phraseAt(session, here.index));
  const at = available.indexOf(here.face);

  if (at < available.length - 1) {
    return { index: here.index, face: available[at + 1] };
  }
  if (here.index >= session.phrases.length - 1) {
    return here; // end of the deck
  }
  const next = here.index + 1;
  return { index: next, face: faces(phraseAt(session, next))[0] };
}

/** Previous card: the face before this one, or the LAST face of the previous phrase. */
export function previousCard(
  session: PracticeSession,
  position: CardPosition,
): CardPosition {
  const here = normalize(session, position);
  const available = faces(phraseAt(session, here.index));
  const at = available.indexOf(here.face);

  if (at > 0) {
    return { index: here.index, face: available[at - 1] };
  }
  if (here.index <= 0) {
    return here; // start of the deck
  }
  const prev = here.index - 1;
  const prevFaces = faces(phraseAt(session, prev));
  return { index: prev, face: prevFaces[prevFaces.length - 1] };
}

/** Flip to the other card of the SAME phrase (no-op when there is only one). */
export function flip(session: PracticeSession, position: CardPosition): CardPosition {
  const here = normalize(session, position);
  const available = faces(phraseAt(session, here.index));
  if (available.length < 2) return here;
  return { index: here.index, face: here.face === 'es' ? 'en' : 'es' };
}

/** True when the card currently shown is the English one. */
export function isEnglish(position: CardPosition): boolean {
  return position.face === 'en';
}

/** The phrase whose audio should play — the same on both cards. */
export function audioPhrase(session: PracticeSession): Phrase | null {
  return currentPhrase(session);
}
