import type { CdnConfig } from '../app/core/config/cdn-config';

/** Production environment. Swap the CDN base/ref here for releases. */
export const environment: { production: boolean; cdn: CdnConfig } = {
  production: true,
  cdn: {
    baseUrl: 'https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main',
    audioFormat: 'mp3',
    // Ver environment.ts: los mazos deben coincidir con DECKS en tts/phrases.py.
    decks: [
      { id: 'home', label: 'Home', indexPath: 'index.csv', audioPath: 'audios/v2' },
      { id: 'commons', label: 'Commons', indexPath: 'commons.csv', audioPath: 'audios/commons/v1' },
    ],
  },
};
