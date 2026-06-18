/**
 * Port: audio playback. Implemented by infrastructure (e.g. HTMLAudioElement).
 *
 * The contract speaks in terms of an audio file name (`archivo`); resolving that
 * to a concrete URL is the adapter's concern, keeping the CDN out of the domain.
 */
export interface AudioPlayerPort {
  /**
   * Point the player at the given audio file and resolve once it is ready to
   * play (or reject if it cannot be loaded). Does not start playback.
   */
  load(archivo: string): Promise<void>;

  /** Start (or resume) playback. Resolves when playback has begun. */
  play(): Promise<void>;

  /** Pause playback, keeping the current position. */
  pause(): void;

  /** Stop playback and reset to the beginning. */
  stop(): void;

  /** Set the playback rate (already clamped by the caller). */
  setPlaybackRate(rate: number): void;

  /** Duration of the loaded audio in milliseconds, or null if unknown. */
  durationMs(): number | null;

  /** Subscribe to the "playback finished" event. Returns an unsubscribe fn. */
  onEnded(handler: () => void): () => void;

  /** Subscribe to load/playback errors. Returns an unsubscribe fn. */
  onError(handler: (error: unknown) => void): () => void;
}
