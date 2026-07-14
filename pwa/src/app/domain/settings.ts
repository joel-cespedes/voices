/**
 * Domain value object: user-tunable practice settings.
 *
 * Pure data + invariants. Clamping rules live in `./rules` so that both the
 * UI and the persistence adapters reuse the same definition of "valid".
 *
 * La sesión NUNCA avanza sola: cambiar de pantalla es siempre decisión del
 * usuario, así que no hay ajuste de auto-avance. Y el silencio entre
 * repeticiones es fijo (`REPEAT_GAP_MS` en `./rules`), no configurable.
 */

export interface Settings {
  /** Audio playback speed. Constrained to [0.5, 1.25]. */
  readonly playbackRate: number;
  /** Times the audio repeats per phrase. Constrained to [1, 3]. */
  readonly repetitions: number;
  /** Language code of the visible translation (e.g. 'es'). */
  readonly translationLang: string;
}

export const DEFAULT_SETTINGS: Settings = {
  playbackRate: 1,
  repetitions: 2,
  translationLang: 'es',
};
