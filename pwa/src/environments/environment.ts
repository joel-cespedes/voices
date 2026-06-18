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
    audioPath: 'audios',
    audioFormat: 'mp3',
  },
};
