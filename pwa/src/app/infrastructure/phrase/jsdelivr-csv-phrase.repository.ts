import { inject, Injectable } from '@angular/core';
import type { Phrase } from '../../domain/phrase';
import type { PhraseRepositoryPort } from '../../application/ports/phrase-repository.port';
import { CDN_CONFIG } from '../../core/di/tokens';
import { indexUrl, normalizeArchivo, type CdnConfig } from '../../core/config/cdn-config';
import { parseCsv, type CsvRow } from '../csv/csv-parser';

/**
 * Adapter: loads phrases from a CSV index served over a CDN (jsDelivr).
 *
 * Tolerant to the real-world schema: the English text may live in an `en` or a
 * `texto` column, and the Spanish `es` column may be missing or empty. Audio
 * file names are normalized to the configured format (e.g. .wav -> .mp3).
 */
@Injectable()
export class JsDelivrCsvPhraseRepository implements PhraseRepositoryPort {
  private readonly cfg = inject<CdnConfig>(CDN_CONFIG);

  async loadAll(): Promise<readonly Phrase[]> {
    // Revalidate so translation/index updates propagate; the service worker
    // still provides the cached index when offline.
    const response = await fetch(indexUrl(this.cfg), { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load phrase index: HTTP ${response.status}`);
    }
    const text = await response.text();
    return parseCsv(text)
      .map((row) => this.toPhrase(row))
      .filter((phrase): phrase is Phrase => phrase !== null);
  }

  private toPhrase(row: CsvRow): Phrase | null {
    const numero = Number.parseInt(row['numero'] ?? '', 10);
    const rawArchivo = row['archivo'] ?? '';
    const en = (row['en'] ?? row['texto'] ?? '').trim();
    const esRaw = (row['es'] ?? '').trim();

    if (!Number.isFinite(numero) || rawArchivo === '' || en === '') {
      return null;
    }

    return {
      numero,
      archivo: normalizeArchivo(this.cfg, rawArchivo),
      en,
      es: esRaw === '' ? null : esRaw,
    };
  }
}
