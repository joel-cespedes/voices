import type { Deck, DeckId } from '../../domain/deck';

/**
 * Configuration for the CDN that serves the phrase indexes and audio files.
 * Provided per-environment via the CDN_CONFIG injection token so it is never
 * hardcoded inside components or adapters.
 *
 * Each deck has its own CSV index and audio folder. The ids and paths mirror
 * `DECKS` in tts/phrases.py: adding a deck means adding it in both places.
 */
export interface DeckSource extends Deck {
  /** Path (relative to baseUrl) of the CSV index, e.g. 'index.csv'. */
  readonly indexPath: string;
  /**
   * Path (relative to baseUrl) of the audio folder, e.g. 'audios/v2'. It is
   * versioned: regenerating a whole deck bumps it so neither the CDN nor the
   * service worker keep serving the old audio.
   */
  readonly audioPath: string;
}

export interface CdnConfig {
  /** Base URL, e.g. https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main */
  readonly baseUrl: string;
  /** Audio format/extension actually served, e.g. 'mp3'. */
  readonly audioFormat: string;
  /** Available decks, in menu order. The first one is the fallback. */
  readonly decks: readonly DeckSource[];
}

/**
 * Deck source for an id. An unknown id (e.g. a deck removed after the user had
 * it saved) falls back to the first configured deck rather than failing.
 */
export function resolveDeck(cfg: CdnConfig, deckId: DeckId): DeckSource {
  const found = cfg.decks.find((deck) => deck.id === deckId);
  if (found) return found;
  const first = cfg.decks[0];
  if (!first) throw new Error('CdnConfig.decks must contain at least one deck');
  return first;
}

/** Full URL of a deck's CSV index. */
export function indexUrl(cfg: CdnConfig, deckId: DeckId): string {
  return `${cfg.baseUrl}/${resolveDeck(cfg, deckId).indexPath}`;
}

/** Full URL of a given audio file name within a deck. */
export function audioUrl(cfg: CdnConfig, deckId: DeckId, archivo: string): string {
  return `${cfg.baseUrl}/${resolveDeck(cfg, deckId).audioPath}/${archivo}`;
}

/**
 * Normalize an audio file name from the index to the configured format,
 * e.g. '0001.wav' -> '0001.mp3'. Tolerates names with or without extension.
 */
export function normalizeArchivo(cfg: CdnConfig, rawArchivo: string): string {
  const stem = rawArchivo.replace(/\.[^./\\]+$/, '');
  return `${stem}.${cfg.audioFormat}`;
}
