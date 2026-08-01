import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SETTINGS } from '../../domain/settings';
import type { Phrase } from '../../domain/phrase';
import type { CdnConfig } from '../../core/config/cdn-config';
import {
  AUDIO_PLAYER,
  CDN_CONFIG,
  PHRASE_REPOSITORY,
  PROGRESS_STORAGE,
  SETTINGS_STORAGE,
} from '../../core/di/tokens';
import {
  FakeAudioPlayer,
  FakePhraseRepository,
  FakeProgressStorage,
  FakeSettingsStorage,
  makePhrase,
} from '../../application/testing/fakes';
import { PracticeStore } from './practice.store';

const cdn: CdnConfig = {
  baseUrl: 'https://cdn.example/x@main',
  indexPath: 'index.csv',
  audioPath: 'audios',
  audioFormat: 'mp3',
};

const phrases = [
  makePhrase({ numero: 1, archivo: '0001.mp3' }),
  makePhrase({ numero: 2, archivo: '0002.mp3' }),
  makePhrase({ numero: 3, archivo: '0003.mp3' }),
];

const flush = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

function setup(opts: {
  audio?: FakeAudioPlayer;
  progress?: FakeProgressStorage;
  settings?: FakeSettingsStorage;
  phrases?: readonly Phrase[];
}): {
  store: PracticeStore;
  audio: FakeAudioPlayer;
  progress: FakeProgressStorage;
} {
  const audio = opts.audio ?? new FakeAudioPlayer();
  const progress = opts.progress ?? new FakeProgressStorage();
  const settings = opts.settings ?? new FakeSettingsStorage();
  const deck = opts.phrases ?? phrases;
  TestBed.configureTestingModule({
    providers: [
      { provide: PHRASE_REPOSITORY, useValue: new FakePhraseRepository(deck) },
      { provide: AUDIO_PLAYER, useValue: audio },
      { provide: PROGRESS_STORAGE, useValue: progress },
      { provide: SETTINGS_STORAGE, useValue: settings },
      { provide: CDN_CONFIG, useValue: cdn },
    ],
  });
  return { store: TestBed.inject(PracticeStore), audio, progress };
}

afterEach(() => {
  vi.useRealTimers();
  TestBed.resetTestingModule();
});

describe('PracticeStore', () => {
  it('no suena al cargar, pero sí al cambiar de frase', async () => {
    const { store, audio } = setup({});
    await store.init();
    await flush();
    expect(store.loadPhase()).toBe('ready');
    expect(store.total()).toBe(3);

    // Al abrir, silencio (el navegador bloquearía el autoplay sin gesto).
    expect(audio.playCount).toBe(0);
    expect(store.status()).toBe('idle');

    // Apenas se cambia de frase, suena el audio solo.
    store.next();
    await flush();
    expect(store.index()).toBe(1);
    expect(audio.playCount).toBe(1);
    expect(store.status()).toBe('playing');
  });

  it('repite con 2s de silencio, y al acabar se para SIN avanzar de pantalla', async () => {
    vi.useFakeTimers();
    const settings = new FakeSettingsStorage({ ...DEFAULT_SETTINGS, repetitions: 2 });
    const { store, audio } = setup({ settings });
    await store.init();
    await flush();

    store.togglePlay();
    await flush();
    expect(audio.playCount).toBe(1);

    // Fin de la 1a repeticion: NO encadena de corrido, espera 2s en silencio.
    audio.emitEnded();
    expect(audio.playCount).toBe(1);
    expect(store.status()).toBe('shadowing');

    vi.advanceTimersByTime(1999); // un pelo antes: sigue callado
    expect(audio.playCount).toBe(1);

    vi.advanceTimersByTime(1); // a los 2s exactos suena la 2a repeticion
    expect(audio.playCount).toBe(2);
    expect(store.status()).toBe('playing');

    // Fin de la ULTIMA repeticion: se para y ahi se queda.
    audio.emitEnded();
    expect(store.status()).toBe('idle');

    // Por mucho que pase el tiempo: ni suena mas, ni avanza de pantalla.
    vi.advanceTimersByTime(60_000);
    expect(audio.playCount).toBe(2);
    expect(store.index()).toBe(0);

    // Solo vuelve a sonar si el usuario pulsa play.
    store.togglePlay();
    await flush();
    expect(audio.playCount).toBe(3);
  });

  it('resumes from the persisted position', async () => {
    const { store } = setup({ progress: new FakeProgressStorage({ currentIndex: 2 }) });
    await store.init();
    await flush();
    expect(store.index()).toBe(2);
    expect(store.current()?.numero).toBe(3);
  });

  it('persists progress when navigating forward', async () => {
    const { store, progress } = setup({});
    await store.init();
    await flush();
    store.next();
    expect(store.index()).toBe(1);
    expect(progress.saved).toEqual({ currentIndex: 1 });
  });

  it('muestra el inglés en grande y el español como traducción', async () => {
    const { store } = setup({
      phrases: [
        makePhrase({ numero: 1, en: 'Who looks after your dog?', es: '¿Quién cuida a tu perro?' }),
      ],
    });
    await store.init();
    await flush();

    // Una sola pantalla: inglés arriba, español debajo.
    expect(store.text()).toBe('Who looks after your dog?');
    expect(store.translation()).toBe('¿Quién cuida a tu perro?');
  });

  it('reproduce el audio en inglés de la frase', async () => {
    const { store, audio } = setup({
      phrases: [makePhrase({ numero: 1, archivo: '0001.mp3', en: 'I can handle it.', es: 'Puedo hacerlo yo.' })],
    });
    await store.init();
    await flush();

    store.togglePlay();
    await flush();
    expect(audio.loaded).toEqual(['0001.mp3']);
  });

  it('frase sin traducción: se muestra el inglés y la traducción queda vacía', async () => {
    const { store } = setup({
      phrases: [makePhrase({ numero: 1, en: 'No translation here.', es: null })],
    });
    await store.init();
    await flush();

    expect(store.text()).toBe('No translation here.');
    expect(store.translation()).toBe('');
  });
});
