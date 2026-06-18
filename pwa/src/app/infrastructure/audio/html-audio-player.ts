import { inject, Injectable } from '@angular/core';
import type { AudioPlayerPort } from '../../application/ports/audio-player.port';
import { CDN_CONFIG } from '../../core/di/tokens';
import { audioUrl, type CdnConfig } from '../../core/config/cdn-config';

/**
 * Adapter: AudioPlayerPort backed by a single HTMLAudioElement.
 *
 * Resolves an `archivo` name to a CDN URL using the injected config, so the
 * port stays unaware of where audio is hosted.
 */
@Injectable()
export class HtmlAudioPlayer implements AudioPlayerPort {
  private readonly cfg = inject<CdnConfig>(CDN_CONFIG);
  private readonly audio = new Audio();
  private readonly endedHandlers = new Set<() => void>();
  private readonly errorHandlers = new Set<(error: unknown) => void>();

  constructor() {
    this.audio.preload = 'auto';
    this.audio.addEventListener('ended', () => {
      this.endedHandlers.forEach((h) => h());
    });
    this.audio.addEventListener('error', () => {
      this.errorHandlers.forEach((h) => h(this.audio.error));
    });
  }

  load(archivo: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onReady = (): void => {
        cleanup();
        resolve();
      };
      const onError = (): void => {
        cleanup();
        reject(this.audio.error ?? new Error(`Cannot load audio: ${archivo}`));
      };
      const cleanup = (): void => {
        this.audio.removeEventListener('canplaythrough', onReady);
        this.audio.removeEventListener('loadeddata', onReady);
        this.audio.removeEventListener('error', onError);
      };
      this.audio.addEventListener('canplaythrough', onReady, { once: true });
      this.audio.addEventListener('loadeddata', onReady, { once: true });
      this.audio.addEventListener('error', onError, { once: true });
      this.audio.src = audioUrl(this.cfg, archivo);
      this.audio.load();
    });
  }

  async play(): Promise<void> {
    this.audio.currentTime = 0;
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = rate;
  }

  durationMs(): number | null {
    const seconds = this.audio.duration;
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
  }

  onEnded(handler: () => void): () => void {
    this.endedHandlers.add(handler);
    return () => this.endedHandlers.delete(handler);
  }

  onError(handler: (error: unknown) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }
}
