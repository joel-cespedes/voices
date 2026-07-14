/**
 * Pure business rules. Zero dependencies — the single source of truth for the
 * numeric constraints and derived calculations used across the app.
 */
import type { ShadowingPauseMode } from './settings';

export const PLAYBACK_RATE_MIN = 0.5;
export const PLAYBACK_RATE_MAX = 1.25;

export const REPETITIONS_MIN = 1;
export const REPETITIONS_MAX = 3;

/** Fixed shadowing pauses (ms) for the non-phrase-relative modes. */
export const SHORT_PAUSE_MS = 1200;
export const MEDIUM_PAUSE_MS = 3000;

/** Fallback pause when the audio duration is unknown and mode is 'phrase'. */
export const FALLBACK_PHRASE_PAUSE_MS = MEDIUM_PAUSE_MS;

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

/**
 * Compute the shadowing pause duration (ms) for a given mode.
 * In 'phrase' mode the pause equals the audio duration so the user gets roughly
 * the same time to repeat as the sentence took to play.
 */
export function computeShadowingPauseMs(
  mode: ShadowingPauseMode,
  audioDurationMs: number | null,
): number {
  switch (mode) {
    case 'short':
      return SHORT_PAUSE_MS;
    case 'medium':
      return MEDIUM_PAUSE_MS;
    case 'phrase':
      return audioDurationMs && audioDurationMs > 0
        ? Math.round(audioDurationMs)
        : FALLBACK_PHRASE_PAUSE_MS;
  }
}

/** Progress ratio in [0, 1] for a 0-based index over `total` items. */
export function progressRatio(index: number, total: number): number {
  if (total <= 0) return 0;
  return clamp((index + 1) / total, 0, 1);
}
