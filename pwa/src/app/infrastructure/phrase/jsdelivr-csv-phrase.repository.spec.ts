import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CdnConfig } from '../../core/config/cdn-config';
import { CDN_CONFIG } from '../../core/di/tokens';
import { JsDelivrCsvPhraseRepository } from './jsdelivr-csv-phrase.repository';

const cfg: CdnConfig = {
  baseUrl: 'https://cdn.example/gh/x@main',
  indexPath: 'index.csv',
  audioPath: 'audios',
  audioFormat: 'mp3',
};

function mockFetch(body: string, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status, text: async () => body }) as Response),
  );
}

function repo(): JsDelivrCsvPhraseRepository {
  TestBed.configureTestingModule({
    providers: [JsDelivrCsvPhraseRepository, { provide: CDN_CONFIG, useValue: cfg }],
  });
  return TestBed.inject(JsDelivrCsvPhraseRepository);
}

afterEach(() => {
  vi.unstubAllGlobals();
  TestBed.resetTestingModule();
});

describe('JsDelivrCsvPhraseRepository', () => {
  it('parses the real "texto" schema and normalizes .wav -> .mp3', async () => {
    mockFetch('numero,archivo,texto\n1,0001.wav,Hello\n2,0002.wav,World');
    const phrases = await repo().loadAll();
    expect(phrases).toHaveLength(2);
    expect(phrases[0]).toEqual({ numero: 1, archivo: '0001.mp3', en: 'Hello', es: null });
  });

  it('supports an en/es schema when present', async () => {
    mockFetch('numero,archivo,en,es\n1,0001.mp3,Hello,Hola\n2,0002.mp3,Bye,');
    const phrases = await repo().loadAll();
    expect(phrases[0].es).toBe('Hola');
    expect(phrases[1].es).toBeNull();
  });

  it('drops rows with missing number, file or English text', async () => {
    mockFetch('numero,archivo,texto\n,0001.wav,Hello\n2,,World\n3,0003.wav,\n4,0004.wav,Ok');
    const phrases = await repo().loadAll();
    expect(phrases.map((p) => p.numero)).toEqual([4]);
  });

  it('throws on a non-OK response', async () => {
    mockFetch('', false, 404);
    await expect(repo().loadAll()).rejects.toThrow(/HTTP 404/);
  });
});
