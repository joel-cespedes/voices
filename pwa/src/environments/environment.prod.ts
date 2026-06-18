import type { CdnConfig } from '../app/core/config/cdn-config';

/** Production environment. Swap the CDN base/ref here for releases. */
export const environment: { production: boolean; cdn: CdnConfig } = {
  production: true,
  cdn: {
    baseUrl: 'https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main',
    indexPath: 'index.csv',
    audioPath: 'audios',
    audioFormat: 'mp3',
  },
};
