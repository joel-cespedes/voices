import { Injectable } from '@angular/core';
import { DEFAULT_DECK_ID, type DeckId } from '../../domain/deck';
import type { Progress } from '../../domain/progress';
import type { ProgressStoragePort } from '../../application/ports/progress-storage.port';
import { readJson, writeJson } from './safe-storage';

// v3: la posicion se guarda POR MAZO (Home, Commons...) junto al mazo activo.
const KEY = 'shadow.progress.v3';
// v2 solo conocia un mazo, el que hoy es Home. Se lee una vez como respaldo
// para no perder la posicion al actualizar la app.
const LEGACY_KEY = 'shadow.progress.v2';

interface Stored {
  readonly activeDeck?: unknown;
  readonly decks?: Record<DeckId, unknown>;
}

function asProgress(value: unknown): Progress | null {
  if (!value || typeof value !== 'object') return null;
  const index = (value as { currentIndex?: unknown }).currentIndex;
  return typeof index === 'number' ? { currentIndex: index } : null;
}

/** Adapter: persists per-deck Progress and the active deck in localStorage. */
@Injectable()
export class LocalStorageProgress implements ProgressStoragePort {
  load(deckId: DeckId): Progress | null {
    const stored = this.read();
    const progress = asProgress(stored.decks?.[deckId]);
    if (progress) return progress;
    return deckId === DEFAULT_DECK_ID ? asProgress(readJson<unknown>(LEGACY_KEY)) : null;
  }

  save(deckId: DeckId, progress: Progress): void {
    const stored = this.read();
    writeJson<Stored>(KEY, { ...stored, decks: { ...stored.decks, [deckId]: progress } });
  }

  loadActiveDeck(): DeckId | null {
    const active = this.read().activeDeck;
    return typeof active === 'string' && active !== '' ? active : null;
  }

  saveActiveDeck(deckId: DeckId): void {
    writeJson<Stored>(KEY, { ...this.read(), activeDeck: deckId });
  }

  private read(): Stored {
    const value = readJson<Stored>(KEY);
    return value && typeof value === 'object' ? value : {};
  }
}
