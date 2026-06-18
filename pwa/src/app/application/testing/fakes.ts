/**
 * Reusable in-memory test doubles for every port. Shared by unit tests so the
 * contracts have a single, consistent fake implementation.
 */
import type { Phrase } from '../../domain/phrase';
import type { Progress } from '../../domain/progress';
import type { Settings } from '../../domain/settings';
import type { AudioPlayerPort } from '../ports/audio-player.port';
import type { PhraseRepositoryPort } from '../ports/phrase-repository.port';
import type { ProgressStoragePort } from '../ports/progress-storage.port';
import type { SettingsPort } from '../ports/settings.port';

export function makePhrase(partial: Partial<Phrase> & { numero: number }): Phrase {
  return {
    numero: partial.numero,
    archivo: partial.archivo ?? `${String(partial.numero).padStart(4, '0')}.mp3`,
    en: partial.en ?? `phrase ${partial.numero}`,
    es: partial.es ?? null,
  };
}

export class FakePhraseRepository implements PhraseRepositoryPort {
  constructor(private readonly phrases: readonly Phrase[] = []) {}
  loadAll(): Promise<readonly Phrase[]> {
    return Promise.resolve(this.phrases);
  }
}

export class FakeProgressStorage implements ProgressStoragePort {
  saved: Progress | null = null;
  constructor(initial: Progress | null = null) {
    this.saved = initial;
  }
  load(): Progress | null {
    return this.saved;
  }
  save(progress: Progress): void {
    this.saved = progress;
  }
}

export class FakeSettingsStorage implements SettingsPort {
  saved: Settings | null = null;
  constructor(initial: Settings | null = null) {
    this.saved = initial;
  }
  load(): Settings | null {
    return this.saved;
  }
  save(settings: Settings): void {
    this.saved = settings;
  }
}

/**
 * Controllable fake audio player: tests can drive `emitEnded` / `emitError`
 * and inspect which files were loaded/played.
 */
export class FakeAudioPlayer implements AudioPlayerPort {
  loaded: string[] = [];
  playCount = 0;
  stopped = 0;
  paused = 0;
  rate = 1;
  private duration: number | null = 3000;
  private endedHandlers = new Set<() => void>();
  private errorHandlers = new Set<(error: unknown) => void>();

  setDuration(ms: number | null): void {
    this.duration = ms;
  }
  load(archivo: string): Promise<void> {
    this.loaded.push(archivo);
    return Promise.resolve();
  }
  play(): Promise<void> {
    this.playCount += 1;
    return Promise.resolve();
  }
  pause(): void {
    this.paused += 1;
  }
  stop(): void {
    this.stopped += 1;
  }
  setPlaybackRate(rate: number): void {
    this.rate = rate;
  }
  durationMs(): number | null {
    return this.duration;
  }
  onEnded(handler: () => void): () => void {
    this.endedHandlers.add(handler);
    return () => this.endedHandlers.delete(handler);
  }
  onError(handler: (error: unknown) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }
  emitEnded(): void {
    this.endedHandlers.forEach((h) => h());
  }
  emitError(error: unknown): void {
    this.errorHandlers.forEach((h) => h(error));
  }
}
