import { describe, expect, it } from 'vitest';
import {
  clampPlaybackRate,
  clampRepetitions,
  computeShadowingPauseMs,
  MEDIUM_PAUSE_MS,
  progressRatio,
  SHORT_PAUSE_MS,
} from './rules';

describe('rules.clampPlaybackRate', () => {
  it('clamps below the minimum', () => {
    expect(clampPlaybackRate(0.1)).toBe(0.5);
  });
  it('clamps above the maximum', () => {
    expect(clampPlaybackRate(3)).toBe(1.25);
  });
  it('keeps in-range values', () => {
    expect(clampPlaybackRate(0.9)).toBe(0.9);
  });
  it('falls back to min on NaN', () => {
    expect(clampPlaybackRate(Number.NaN)).toBe(0.5);
  });
});

describe('rules.clampRepetitions', () => {
  it('clamps and rounds to an integer', () => {
    expect(clampRepetitions(0)).toBe(1);
    expect(clampRepetitions(9)).toBe(3);
    expect(clampRepetitions(2.4)).toBe(2);
  });
});

describe('rules.computeShadowingPauseMs', () => {
  it('returns fixed durations for short/medium', () => {
    expect(computeShadowingPauseMs('short', 9999)).toBe(SHORT_PAUSE_MS);
    expect(computeShadowingPauseMs('medium', 9999)).toBe(MEDIUM_PAUSE_MS);
  });
  it('returns the audio duration in phrase mode', () => {
    expect(computeShadowingPauseMs('phrase', 4200)).toBe(4200);
  });
  it('falls back when phrase duration is unknown', () => {
    expect(computeShadowingPauseMs('phrase', null)).toBe(MEDIUM_PAUSE_MS);
    expect(computeShadowingPauseMs('phrase', 0)).toBe(MEDIUM_PAUSE_MS);
  });
});

describe('rules.progressRatio', () => {
  it('is 0 for an empty deck', () => {
    expect(progressRatio(0, 0)).toBe(0);
  });
  it('reflects 1-based position', () => {
    expect(progressRatio(0, 4)).toBe(0.25);
    expect(progressRatio(3, 4)).toBe(1);
  });
});
