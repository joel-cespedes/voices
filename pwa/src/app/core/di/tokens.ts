/**
 * Dependency-injection tokens — one per port plus the CDN configuration.
 *
 * Wiring map (see app.config.ts):
 *   CDN_CONFIG        → environment.cdn
 *   PHRASE_REPOSITORY → JsDelivrCsvPhraseRepository
 *   AUDIO_PLAYER      → HtmlAudioPlayer
 *   PROGRESS_STORAGE  → LocalStorageProgress
 *   SETTINGS_STORAGE  → LocalStorageSettings
 *
 * UI components depend on these tokens, never on the concrete adapters, so a
 * data source or player can be swapped by changing one provider.
 */
import { InjectionToken } from '@angular/core';
import type { CdnConfig } from '../config/cdn-config';
import type { AudioPlayerPort } from '../../application/ports/audio-player.port';
import type { PhraseRepositoryPort } from '../../application/ports/phrase-repository.port';
import type { ProgressStoragePort } from '../../application/ports/progress-storage.port';
import type { SettingsPort } from '../../application/ports/settings.port';

export const CDN_CONFIG = new InjectionToken<CdnConfig>('CDN_CONFIG');

export const PHRASE_REPOSITORY = new InjectionToken<PhraseRepositoryPort>(
  'PHRASE_REPOSITORY',
);

export const AUDIO_PLAYER = new InjectionToken<AudioPlayerPort>('AUDIO_PLAYER');

export const PROGRESS_STORAGE = new InjectionToken<ProgressStoragePort>(
  'PROGRESS_STORAGE',
);

export const SETTINGS_STORAGE = new InjectionToken<SettingsPort>('SETTINGS_STORAGE');
