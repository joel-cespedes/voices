import {
  type ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

import { environment } from '../environments/environment';
import {
  AUDIO_PLAYER,
  CDN_CONFIG,
  PHRASE_REPOSITORY,
  PROGRESS_STORAGE,
  SETTINGS_STORAGE,
} from './core/di/tokens';
import { JsDelivrCsvPhraseRepository } from './infrastructure/phrase/jsdelivr-csv-phrase.repository';
import { HtmlAudioPlayer } from './infrastructure/audio/html-audio-player';
import { LocalStorageProgress } from './infrastructure/storage/local-storage-progress';
import { LocalStorageSettings } from './infrastructure/storage/local-storage-settings';

/**
 * Composition root: the ONLY place where ports are bound to concrete adapters.
 * Swapping a data source or player means changing one line here.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    { provide: CDN_CONFIG, useValue: environment.cdn },
    { provide: PHRASE_REPOSITORY, useClass: JsDelivrCsvPhraseRepository },
    { provide: AUDIO_PLAYER, useClass: HtmlAudioPlayer },
    { provide: PROGRESS_STORAGE, useClass: LocalStorageProgress },
    { provide: SETTINGS_STORAGE, useClass: LocalStorageSettings },

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
