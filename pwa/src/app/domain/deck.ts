/**
 * Domain: a deck ("lista" en la app) is a named, ordered collection of phrases
 * with its own audio. The app holds several (Home, Commons…); the user practices
 * one at a time and keeps an independent position in each.
 *
 * Pure data — where a deck's index and audio live is an infrastructure concern
 * (see `core/config/cdn-config.ts`).
 */
export type DeckId = string;

export interface Deck {
  readonly id: DeckId;
  /** Nombre visible en el menú. Es un nombre propio, no se traduce. */
  readonly label: string;
}

/** Mazo con el que arranca la app cuando no hay ninguno guardado. */
export const DEFAULT_DECK_ID: DeckId = 'home';
