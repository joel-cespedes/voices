/**
 * Configuration for the CDN that serves the phrase index and audio files.
 * Provided per-environment via the CDN_CONFIG injection token so it is never
 * hardcoded inside components or adapters.
 */
export interface CdnConfig {
  /** Base URL, e.g. https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main */
  readonly baseUrl: string;
  /** Path (relative to baseUrl) of the CSV index, e.g. 'index.csv'. */
  readonly indexPath: string;
  /** Path (relative to baseUrl) of the audio folder, e.g. 'audios'. */
  readonly audioPath: string;
  /** Audio format/extension actually served, e.g. 'mp3'. */
  readonly audioFormat: string;
}

/** Full URL of the CSV index. */
export function indexUrl(cfg: CdnConfig): string {
  return `${cfg.baseUrl}/${cfg.indexPath}`;
}

/** Full URL of a given audio file name. */
export function audioUrl(cfg: CdnConfig, archivo: string): string {
  return `${cfg.baseUrl}/${cfg.audioPath}/${archivo}`;
}

/**
 * Normalize an audio file name from the index to the configured format,
 * e.g. '0001.wav' -> '0001.mp3'. Tolerates names with or without extension.
 */
export function normalizeArchivo(cfg: CdnConfig, rawArchivo: string): string {
  const stem = rawArchivo.replace(/\.[^./\\]+$/, '');
  return `${stem}.${cfg.audioFormat}`;
}
