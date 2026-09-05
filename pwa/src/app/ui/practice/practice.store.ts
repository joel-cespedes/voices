import { computed, inject, Injectable, signal } from '@angular/core';

import { DEFAULT_DECK_ID, type Deck, type DeckId } from '../../domain/deck';
import type { Phrase } from '../../domain/phrase';
import { nextIndex, previousIndex } from '../../domain/card';
import {
  createSession,
  currentPhrase as domainCurrent,
  type PracticeSession,
} from '../../domain/practice-session';
import { DEFAULT_SETTINGS, type Settings } from '../../domain/settings';
import type { PlaybackStatus } from '../../domain/playback-state';
import { progressRatio, REPEAT_GAP_MS } from '../../domain/rules';

import { LoadPhrases } from '../../application/use-cases/load-phrases';
import { GoToPhrase } from '../../application/use-cases/navigate-session';
import { RepeatCurrent } from '../../application/use-cases/repeat-current';
import { SelectDeck } from '../../application/use-cases/select-deck';
import { UpdateSettings } from '../../application/use-cases/update-settings';

import {
  AUDIO_PLAYER,
  CDN_CONFIG,
  PHRASE_REPOSITORY,
  PROGRESS_STORAGE,
  SETTINGS_STORAGE,
} from '../../core/di/tokens';
import { audioUrl, resolveDeck } from '../../core/config/cdn-config';

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
  private readonly selectDeckUC = new SelectDeck(this.progressStore);

  // --- State ---------------------------------------------------------------
  private readonly _deckId = signal<DeckId>(DEFAULT_DECK_ID);
  private readonly _phrases = signal<readonly Phrase[]>([]);
  private readonly _index = signal(0);
  private readonly _settings = signal<Settings>(DEFAULT_SETTINGS);
  private readonly _loadPhase = signal<LoadPhase>('loading');
  private readonly _status = signal<PlaybackStatus>('idle');
  private readonly _repetition = signal(0);
  /** True when the browser blocked autoplay and a user gesture is required. */
  private readonly _blocked = signal(false);

  // --- Public read models --------------------------------------------------
  /** Listas disponibles, en el orden del menú. */
  readonly decks: readonly Deck[] = this.cdn.decks;
  readonly deckId = this._deckId.asReadonly();
  /** Lista que se está practicando. */
  readonly deck = computed<Deck>(() => resolveDeck(this.cdn, this._deckId()));

  readonly settings = this._settings.asReadonly();
  readonly loadPhase = this._loadPhase.asReadonly();
  readonly status = this._status.asReadonly();
  readonly repetition = this._repetition.asReadonly();
  readonly blocked = this._blocked.asReadonly();
  readonly index = this._index.asReadonly();
  readonly total = computed(() => this._phrases().length);

  readonly current = computed<Phrase | null>(() =>
    domainCurrent(createSession(this._phrases(), this._index(), this._deckId())),
  );
  readonly progress = computed(() => progressRatio(this._index(), this.total()));
  readonly isPlaying = computed(() => this._status() === 'playing');
  readonly isShadowing = computed(() => this._status() === 'shadowing');

  /** Texto principal: la frase en inglés (grande). */
  readonly text = computed(() => this.current()?.en ?? '');

  /** Traducción al español (pequeña, debajo). Vacía si la frase no la trae. */
  readonly translation = computed(() => this.current()?.es ?? '');

  private pauseTimer: ReturnType<typeof setTimeout> | null = null;
  private disposeEnded: (() => void) | null = null;
  private disposeError: (() => void) | null = null;
  /** Descarta la respuesta de una carga que ya no es la última pedida. */
  private loadSeq = 0;

  constructor() {
    this.disposeEnded = this.audio.onEnded(() => this.handleEnded());
    this.disposeError = this.audio.onError(() => this.handleError());
  }

  // --- Lifecycle -----------------------------------------------------------

  /** Load settings, then the last practiced deck with its saved position. */
  async init(): Promise<void> {
    this._settings.set(this.settingsStore.load() ?? DEFAULT_SETTINGS);
    this.audio.setPlaybackRate(this._settings().playbackRate);

    // Un mazo guardado que ya no exista cae al primero configurado.
    const wanted = this.progressStore.loadActiveDeck() ?? DEFAULT_DECK_ID;
    await this.loadDeck(resolveDeck(this.cdn, wanted).id);
  }

  dispose(): void {
    this.clearTimer();
    this.audio.stop();
    this.disposeEnded?.();
    this.disposeError?.();
  }

  // --- Decks ---------------------------------------------------------------

  /**
   * Cambia de lista. Se corta lo que suene, se recuerda la elección y se
   * retoma esa lista en la frase donde se dejó. Como al abrir la app, no suena
   * sola: el audio arranca al cambiar de frase o pulsar play.
   */
  async selectDeck(deckId: DeckId): Promise<void> {
    const id = resolveDeck(this.cdn, deckId).id;
    if (id === this._deckId() && this._loadPhase() === 'ready') return;
    this.clearTimer();
    this.audio.stop();
    this._repetition.set(0);
    this.selectDeckUC.execute(id);
    await this.loadDeck(id);
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
      await this.audio.load(phrase.archivo, this._deckId());
      await this.audio.play();
      this._blocked.set(false);
      this._status.set('playing');
    } catch (error) {
      if (this.isAutoplayBlock(error)) {
        this._blocked.set(true);
        this._status.set('paused');
        return;
      }
      // Audio que falta o no carga: se marca el error y se queda parado.
      this.clearTimer();
      this._repetition.set(0);
      this._status.set('error');
    }
  }

  /** Replay the current phrase's audio (resets repetitions). */
  repeat(): void {
    const phrase = this.repeatUC.execute(this.session());
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

  /** Frase siguiente (circular). Al llegar suena el audio solo. */
  next(): void {
    this.moveTo(nextIndex(this.session()));
  }

  /** Frase anterior (circular). */
  previous(): void {
    this.moveTo(previousIndex(this.session()));
  }

  /** Salta directamente a una frase. */
  goTo(index: number): void {
    this.moveTo(index);
  }

  // --- Settings ------------------------------------------------------------

  setPlaybackRate(rate: number): void {
    this._settings.set(this.updateUC.execute(this._settings(), { playbackRate: rate }));
    this.audio.setPlaybackRate(this._settings().playbackRate);
  }

  setRepetitions(repetitions: number): void {
    this._settings.set(this.updateUC.execute(this._settings(), { repetitions }));
  }

  setTranslationLang(translationLang: string): void {
    this._settings.set(this.updateUC.execute(this._settings(), { translationLang }));
  }

  // --- Offline prefetch ----------------------------------------------------

  /**
   * Warm the cache (service worker) for a range of phrases of the current deck
   * by fetching their audio URLs. Best-effort: failures are ignored. Indices
   * are inclusive and clamped to the deck.
   */
  async prefetchRange(from: number, to: number): Promise<void> {
    const phrases = this._phrases();
    const deckId = this._deckId();
    const start = Math.max(0, Math.min(from, to));
    const end = Math.min(phrases.length - 1, Math.max(from, to));
    for (let i = start; i <= end; i++) {
      const phrase = phrases[i];
      if (!phrase) continue;
      try {
        await fetch(audioUrl(this.cdn, deckId, phrase.archivo), { cache: 'force-cache' });
      } catch {
        // Ignore individual failures.
      }
    }
  }

  // --- Internals -----------------------------------------------------------

  /** La sesión de dominio correspondiente al estado actual. */
  private session(): PracticeSession {
    return createSession(this._phrases(), this._index(), this._deckId());
  }

  /** Carga las frases de un mazo y retoma la posición guardada en él. */
  private async loadDeck(deckId: DeckId): Promise<void> {
    const seq = ++this.loadSeq;
    this._deckId.set(deckId);
    this._loadPhase.set('loading');
    try {
      const phrases = await this.loadPhrases.execute(deckId);
      if (seq !== this.loadSeq) return; // el usuario ya pidió otro mazo
      this._phrases.set(phrases);
      this.setIndex(this.progressStore.load(deckId)?.currentIndex ?? 0);
      this._loadPhase.set('ready');
      // Al abrir no suena solo: el navegador bloquea el autoplay sin un gesto.
      // El audio arranca cuando el usuario cambia de frase o pulsa play.
      this._status.set('idle');
    } catch {
      if (seq !== this.loadSeq) return;
      this._loadPhase.set('error');
    }
  }

  /**
   * Mueve a una frase y reproduce su audio de inmediato. Se llama desde gestos
   * del usuario (tap, swipe, teclado, botones), así que el navegador permite el
   * autoplay. Antes de sonar se corta lo que hubiera y se reinician repeticiones.
   */
  private moveTo(index: number): void {
    this.clearTimer();
    this.audio.stop();
    // El caso de uso persiste la posición (en el mazo actual) y aplica el clamp.
    const session = this.gotoUC.execute(this.session(), index);
    this.setIndex(session.index);
    void this.playCurrent();
  }

  private setIndex(index: number): void {
    const max = Math.max(0, this._phrases().length - 1);
    this._index.set(Math.min(max, Math.max(0, index)));
  }

  private handleEnded(): void {
    if (this._repetition() < this._settings().repetitions) {
      this.scheduleRepeat();
      return;
    }
    this.finish();
  }

  /**
   * Espera en silencio antes de encadenar la siguiente repetición. Ese hueco es
   * el que usas para repetir en voz alta; sin él, el audio sonaría de corrido.
   */
  private scheduleRepeat(): void {
    this.clearTimer();
    this._status.set('shadowing');
    this.pauseTimer = setTimeout(() => {
      this.pauseTimer = null;
      this._repetition.update((r) => r + 1);
      this._status.set('playing');
      void this.audio.play().catch(() => this.finish());
    }, REPEAT_GAP_MS);
  }

  /**
   * Fin de las repeticiones: se para y ahí se queda. NO avanza de pantalla —
   * eso lo decides tú— ni vuelve a sonar hasta que pulses play otra vez.
   */
  private finish(): void {
    this.clearTimer();
    this._repetition.set(0);
    this._status.set('idle');
  }

  private handleError(): void {
    if (this._status() === 'loading') return; // load() handles its own rejection
    this._status.set('error');
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
