import type { CdnConfig } from '../app/core/config/cdn-config';

/**
 * Development environment. The CDN base is configurable here (and overridden by
 * environment.prod.ts in production builds via angular.json fileReplacements).
 */
export const environment: { production: boolean; cdn: CdnConfig } = {
  production: false,
  cdn: {
    baseUrl: 'https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main',
    indexPath: 'index.csv',
    // Versionado: al regenerar el mazo se sube la version aqui y en gen_tts.py
    // (OUTDIR), para que las URLs sean nuevas y no se sirva el audio cacheado
    // del mazo anterior.
    audioPath: 'audios/v2',
    audioFormat: 'mp3',
  },
};
