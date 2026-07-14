import { computed, inject, Injectable, signal } from '@angular/core';

import type { Phrase } from '../../domain/phrase';
import {
  cardText,
  flip,
  nextCard,
  normalize,
  previousCard,
  type CardPosition,
  type Face,
} from '../../domain/card';
import {
  createSession,
  currentPhrase as domainCurrent,
  type PracticeSession,
} from '../../domain/practice-session';
import {
  DEFAULT_SETTINGS,
  type Settings,
  type ShadowingPauseMode,
} from '../../domain/settings';
import type { PlaybackStatus } from '../../domain/playback-state';
import { computeShadowingPauseMs, progressRatio } from '../../domain/rules';

import { LoadPhrases } from '../../application/use-cases/load-phrases';
import { GoToPhrase } from '../../application/use-cases/navigate-session';
import { RepeatCurrent } from '../../application/use-cases/repeat-current';
import { UpdateSettings } from '../../application/use-cases/update-settings';

import {
  AUDIO_PLAYER,
  CDN_CONFIG,
  PHRASE_REPOSITORY,
  PROGRESS_STORAGE,
  SETTINGS_STORAGE,
} from '../../core/di/tokens';
import { audioUrl } from '../../core/config/cdn-config';

export type LoadPhase = 'loading' | 'ready' | 'error';

/**
 * Presentation facade for the practice view. Holds reactive UI state (signals)
 * and orchestrates the application use cases, ports and domain rules. It carries
 * NO business rules of its own — clamping, pause length and navigation all live
 * in the domain.
 */
@Injectable({ providedIn: 'root' })
export class PracticeStore {
  private readonly repository = inject(PHRASE_REPOSITORY);
  private readonly audio = inject(AUDIO_PLAYER);
  private readonly progressStore = inject(PROGRESS_STORAGE);
  private readonly settingsStore = inject(SETTINGS_STORAGE);
  private readonly cdn = inject(CDN_CONFIG);

  // Use cases (wired with their ports).
  private readonly loadPhrases = new LoadPhrases(this.repository);
  private readonly gotoUC = new GoToPhrase(this.progressStore);
  private readonly repeatUC = new RepeatCurrent();
  private readonly updateUC = new UpdateSettings(this.settingsStore);

  // --- State ---------------------------------------------------------------
  private readonly _phrases = signal<readonly Phrase[]>([]);
  private readonly _index = signal(0);
  /** Cara visible de la frase actual: 'es' la lees, 'en' la compruebas. */
  private readonly _face = signal<Face>('es');
  private readonly _settings = signal<Settings>(DEFAULT_SETTINGS);
  private readonly _loadPhase = signal<LoadPhase>('loading');
  private readonly _status = signal<PlaybackStatus>('idle');
  private readonly _repetition = signal(0);
  /** True when the browser blocked autoplay and a user gesture is required. */
  private readonly _blocked = signal(false);

  // --- Public read models --------------------------------------------------
  readonly settings = this._settings.asReadonly();
  readonly loadPhase = this._loadPhase.asReadonly();
  readonly status = this._status.asReadonly();
  readonly repetition = this._repetition.asReadonly();
  readonly blocked = this._blocked.asReadonly();
  readonly index = this._index.asReadonly();
  readonly total = computed(() => this._phrases().length);

  readonly current = computed<Phrase | null>(() =>
    domainCurrent(createSession(this._phrases(), this._index())),
  );
  readonly progress = computed(() => progressRatio(this._index(), this.total()));
  readonly isPlaying = computed(() => this._status() === 'playing');
  readonly isShadowing = computed(() => this._status() === 'shadowing');
  /** Cara visible ('es' o 'en'). */
  readonly face = this._face.asReadonly();

  /** El único texto en pantalla: el español, o el inglés en la carta siguiente. */
  readonly text = computed(() => cardText(this.current(), this._face()));

  /** True cuando la carta visible es la inglesa (la de comprobar). */
  readonly isEnglishCard = computed(() => this._face() === 'en');

  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private disposeEnded: (() => void) | null = null;
  private disposeError: (() => void) | null = null;

  constructor() {
    this.disposeEnded = this.audio.onEnded(() => this.handleEnded());
    this.disposeError = this.audio.onError(() => this.handleError());
  }

  // --- Lifecycle -----------------------------------------------------------

  /** Load settings + progress + phrases, then autoplay the current phrase. */
  async init(): Promise<void> {
    this._settings.set(this.settingsStore.load() ?? DEFAULT_SETTINGS);
    this.audio.setPlaybackRate(this._settings().playbackRate);

    this._loadPhase.set('loading');
    try {
      const phrases = await this.loadPhrases.execute();
      this._phrases.set(phrases);
      const saved = this.progressStore.load();
      this.setIndex(saved?.currentIndex ?? 0);
      // Se retoma siempre por la carta española; si la frase no tiene
      // traducción, normalize() la coloca en la inglesa (su única carta).
      this._face.set(normalize(this.session(), { index: this._index(), face: 'es' }).face);
      this._loadPhase.set('ready');
      // No autoplay on load: audio starts when the user navigates (swipe/tap)
      // or presses play. This also avoids the mobile autoplay block.
      this._status.set('idle');
    } catch {
      this._loadPhase.set('error');
    }
  }

  dispose(): void {
    this.clearTimer();
    this.audio.stop();
    this.disposeEnded?.();
    this.disposeError?.();
  }

  // --- Playback ------------------------------------------------------------

  /** Load and play the current phrase from the first repetition. */
  async playCurrent(): Promise<void> {
    const phrase = this.current();
    if (!phrase) return;
    this.clearTimer();
    this._repetition.set(1);
    this._status.set('loading');
    this.audio.setPlaybackRate(this._settings().playbackRate);
    try {
      await this.audio.load(phrase.archivo);
      await this.audio.play();
      this._blocked.set(false);
      this._status.set('playing');
    } catch (error) {
      if (this.isAutoplayBlock(error)) {
        this._blocked.set(true);
        this._status.set('paused');
        return;
      }
      // Missing/broken audio: surface the error but keep auto mode flowing.
      this._status.set('error');
      this.scheduleShadowing();
    }
  }

  /** Replay the current phrase's audio (resets repetitions). */
  repeat(): void {
    const phrase = this.repeatUC.execute(
      createSession(this._phrases(), this._index()),
    );
    if (!phrase) return;
    void this.playCurrent();
  }

  /** Toggle global play/pause (also pauses the auto-advance flow). */
  togglePlay(): void {
    const status = this._status();
    if (status === 'playing') {
      this.audio.pause();
      this._status.set('paused');
      this.clearTimer();
      return;
    }
    if (status === 'paused' && !this._blocked()) {
      void this.audio
        .play()
        .then(() => this._status.set('playing'))
        .catch(() => this._status.set('paused'));
      return;
    }
    // idle / shadowing / error / blocked → (re)start the current phrase.
    void this.playCurrent();
  }

  // --- Navigation ----------------------------------------------------------

  /** Siguiente carta: el inglés de esta frase, o el español de la siguiente. */
  next(): void {
    this.moveToCard(nextCard(this.session(), this.position()));
  }

  /** Carta anterior (simétrico de `next`). */
  previous(): void {
    this.moveToCard(previousCard(this.session(), this.position()));
  }

  /** Salta directamente a una frase, empezando por su primera carta. */
  goTo(index: number): void {
    this.moveToCard({ index, face: 'es' });
  }

  /** Salta entre el español y el inglés de la MISMA frase. */
  flipCard(): void {
    this.moveToCard(flip(this.session(), this.position()));
  }

  // --- Settings ------------------------------------------------------------

  setPlaybackRate(rate: number): void {
    this._settings.set(this.updateUC.execute(this._settings(), { playbackRate: rate }));
    this.audio.setPlaybackRate(this._settings().playbackRate);
  }

  setRepetitions(repetitions: number): void {
    this._settings.set(this.updateUC.execute(this._settings(), { repetitions }));
  }

  setPauseMode(pauseMode: ShadowingPauseMode): void {
    this._settings.set(this.updateUC.execute(this._settings(), { pauseMode }));
  }

  setAutoAdvance(autoAdvance: boolean): void {
    this._settings.set(this.updateUC.execute(this._settings(), { autoAdvance }));
  }

  setTranslationLang(translationLang: string): void {
    this._settings.set(this.updateUC.execute(this._settings(), { translationLang }));
  }


  // --- Offline prefetch ----------------------------------------------------

  /**
   * Warm the cache (service worker) for a range of phrases by fetching their
   * audio URLs. Best-effort: failures are ignored. Indices are inclusive and
   * clamped to the deck.
   */
  async prefetchRange(from: number, to: number): Promise<void> {
    const phrases = this._phrases();
    const start = Math.max(0, Math.min(from, to));
    const end = Math.min(phrases.length - 1, Math.max(from, to));
    for (let i = start; i <= end; i++) {
      const phrase = phrases[i];
      if (!phrase) continue;
      try {
        await fetch(audioUrl(this.cdn, phrase.archivo), { cache: 'force-cache' });
      } catch {
        // Ignore individual failures.
      }
    }
  }

  // --- Internals -----------------------------------------------------------

  /** La sesión de dominio correspondiente al estado actual. */
  private session(): PracticeSession {
    return createSession(this._phrases(), this._index());
  }

  /** Dónde estamos: frase + cara. */
  private position(): CardPosition {
    return { index: this._index(), face: this._face() };
  }

  /**
   * Mueve a una carta. NO reproduce nada: el audio suena solo cuando el usuario
   * pulsa play (o repetir). Al llegar a la carta se corta lo que estuviera
   * sonando y se queda en silencio, esperando.
   *
   * Cuando suene, será el MISMO audio en las dos caras —siempre la grabación en
   * inglés—, porque es la pronunciación que se practica.
   */
  private moveToCard(position: CardPosition): void {
    this.clearTimer();
    this.audio.stop();
    // El caso de uso persiste la posición y aplica el clamp del dominio.
    const session = this.gotoUC.execute(this.session(), position.index);
    this.setIndex(session.index);
    this._face.set(position.face);
    this._repetition.set(0);
    this._status.set('idle');
  }

  private setIndex(index: number): void {
    const max = Math.max(0, this._phrases().length - 1);
    this._index.set(Math.min(max, Math.max(0, index)));
  }

  private handleEnded(): void {
    if (this._repetition() < this._settings().repetitions) {
      this._repetition.update((r) => r + 1);
      void this.audio.play().catch(() => this.scheduleShadowing());
      return;
    }
    this.scheduleShadowing();
  }

  private handleError(): void {
    if (this._status() === 'loading') return; // load() handles its own rejection
    this._status.set('error');
  }

  /** Enter the silent shadowing pause, then auto-advance if enabled. */
  private scheduleShadowing(): void {
    this.clearTimer();
    this._status.set('shadowing');
    const ms = computeShadowingPauseMs(
      this._settings().pauseMode,
      this.audio.durationMs(),
    );
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      if (this._settings().autoAdvance) {
        this.next();
      } else {
        this._status.set('idle');
      }
    }, ms);
  }

  private clearTimer(): void {
    if (this.pauseTimer !== null) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }
  }

  private isAutoplayBlock(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'NotAllowedError';
  }
}
