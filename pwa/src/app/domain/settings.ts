/**
 * Domain value object: user-tunable practice settings.
 *
 * Pure data + invariants. Clamping rules live in `./rules` so that both the
 * UI and the persistence adapters reuse the same definition of "valid".
 */

/** How long the shadowing pause lasts after the audio finishes. */
export type ShadowingPauseMode = 'short' | 'medium' | 'phrase';

export interface Settings {
  /** Audio playback speed. Constrained to [0.5, 1.25]. */
  readonly playbackRate: number;
  /** Times the audio repeats per phrase. Constrained to [1, 3]. */
  readonly repetitions: number;
  /** Length of the shadowing pause after playback. */
  readonly pauseMode: ShadowingPauseMode;
  /** When true, the session advances automatically after the shadowing pause. */
  readonly autoAdvance: boolean;
  /** When true, the Spanish translation is shown (if present). */
  readonly showTranslation: boolean;
  /** Language code of the visible translation (e.g. 'es'). */
  readonly translationLang: string;
}

export const DEFAULT_SETTINGS: Settings = {
  playbackRate: 1,
  repetitions: 2,
  pauseMode: 'medium',
  autoAdvance: false,
  showTranslation: true,
  translationLang: 'es',
};
