/**
 * Domain value object: the lifecycle of audio playback for the current phrase.
 *
 *  idle      → nothing loaded yet
 *  loading   → audio is being fetched/decoded
 *  playing   → audio is currently sounding
 *  paused    → playback was paused by the user
 *  shadowing → audio finished; the user is repeating out loud (silent pause)
 *  error     → the audio could not be loaded/played (e.g. missing file)
 */
export type PlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'shadowing'
  | 'error';

export interface PlaybackState {
  readonly status: PlaybackStatus;
  /** Which repetition is sounding (1-based), 0 when not playing. */
  readonly repetition: number;
  /** Audio duration in milliseconds, or null when unknown. */
  readonly durationMs: number | null;
}

export const INITIAL_PLAYBACK: PlaybackState = {
  status: 'idle',
  repetition: 0,
  durationMs: null,
};

/** True while the audio is actively sounding. */
export function isSounding(state: PlaybackState): boolean {
  return state.status === 'playing';
}
