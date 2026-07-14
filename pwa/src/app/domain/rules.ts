/**
 * Pure business rules. Zero dependencies — the single source of truth for the
 * numeric constraints and derived calculations used across the app.
 */

export const PLAYBACK_RATE_MIN = 0.5;
export const PLAYBACK_RATE_MAX = 1.25;

export const REPETITIONS_MIN = 1;
export const REPETITIONS_MAX = 3;

/**
 * Silencio entre una repetición y la siguiente. Sin él, el audio se encadena de
 * corrido y no deja hueco para repetir en voz alta, que es el ejercicio.
 *
 * Tras la ÚLTIMA repetición no hay pausa que valga: el audio se para y espera a
 * que el usuario vuelva a pulsar play. La pantalla nunca avanza sola.
 */
export const REPEAT_GAP_MS = 2000;

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Clamp a playback rate into the supported [0.5, 1.25] range. */
export function clampPlaybackRate(rate: number): number {
  return clamp(rate, PLAYBACK_RATE_MIN, PLAYBACK_RATE_MAX);
}

/** Clamp a repetitions count into the supported [1, 3] range (integer). */
export function clampRepetitions(count: number): number {
  return Math.round(clamp(count, REPETITIONS_MIN, REPETITIONS_MAX));
}

/** Progress ratio in [0, 1] for a 0-based index over `total` items. */
export function progressRatio(index: number, total: number): number {
  if (total <= 0) return 0;
  return clamp((index + 1) / total, 0, 1);
}
