import type { CdnConfig } from '../app/core/config/cdn-config';

/**
 * Development environment. The CDN base is configurable here (and overridden by
 * environment.prod.ts in production builds via angular.json fileReplacements).
 *
 * Los mazos (decks) espejan DECKS en tts/phrases.py: mismo id, mismo CSV y
 * misma carpeta de audios. Anadir una lista = anadirla en los dos sitios.
 */
export const environment: { production: boolean; cdn: CdnConfig } = {
  production: false,
  cdn: {
    baseUrl: 'https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main',
    audioFormat: 'mp3',
    decks: [
      // audioPath versionado: al regenerar un mazo se sube la version aqui y en
      // gen_tts.py/phrases.py, para que las URLs sean nuevas y no se sirva el
      // audio cacheado del mazo anterior.
      { id: 'home', label: 'Home', indexPath: 'index.csv', audioPath: 'audios/v2' },
      { id: 'commons', label: 'Commons', indexPath: 'commons.csv', audioPath: 'audios/commons/v1' },
    ],
  },
};
