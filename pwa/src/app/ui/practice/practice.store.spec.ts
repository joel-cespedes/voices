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
  audioFormat: 'mp3',
  decks: [
    { id: 'home', label: 'Home', indexPath: 'index.csv', audioPath: 'audios/v2' },
    { id: 'commons', label: 'Commons', indexPath: 'commons.csv', audioPath: 'audios/commons/v1' },
  ],
};

const phrases = [
  makePhrase({ numero: 1, archivo: '0001.mp3' }),
  makePhrase({ numero: 2, archivo: '0002.mp3' }),
  makePhrase({ numero: 3, archivo: '0003.mp3' }),
];

const commons = [
  makePhrase({ numero: 1, en: 'common one' }),
  makePhrase({ numero: 2, en: 'common two' }),
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
  const repository = new FakePhraseRepository({ home: opts.phrases ?? phrases, commons });
  TestBed.configureTestingModule({
    providers: [
      { provide: PHRASE_REPOSITORY, useValue: repository },
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
    expect(progress.load('home')).toEqual({ currentIndex: 1 });
  });

  it('muestra el español en grande y el inglés pequeño debajo', async () => {
    const { store } = setup({
      phrases: [
        makePhrase({ numero: 1, en: 'Who looks after your dog?', es: '¿Quién cuida a tu perro?' }),
      ],
    });
    await store.init();
    await flush();

    // Una sola pantalla: español arriba (grande), inglés debajo (pequeño).
    expect(store.text()).toBe('¿Quién cuida a tu perro?');
    expect(store.translation()).toBe('Who looks after your dog?');
  });

  it('reproduce el audio en inglés de la frase, del mazo actual', async () => {
    const { store, audio } = setup({
      phrases: [makePhrase({ numero: 1, archivo: '0001.mp3', en: 'I can handle it.', es: 'Puedo hacerlo yo.' })],
    });
    await store.init();
    await flush();

    store.togglePlay();
    await flush();
    expect(audio.loaded).toEqual(['0001.mp3']);
    expect(audio.loadedDecks).toEqual(['home']);
  });

  it('frase sin español: el inglés sube a grande y abajo no se repite', async () => {
    const { store } = setup({
      phrases: [makePhrase({ numero: 1, en: 'No translation here.', es: null })],
    });
    await store.init();
    await flush();

    expect(store.text()).toBe('No translation here.');
    expect(store.translation()).toBe('');
  });

  describe('listas (decks)', () => {
    it('arranca en Home y expone las listas del menú', async () => {
      const { store } = setup({});
      await store.init();
      await flush();
      expect(store.deck()).toEqual({ id: 'home', label: 'Home', indexPath: 'index.csv', audioPath: 'audios/v2' });
      expect(store.decks.map((d) => d.label)).toEqual(['Home', 'Commons']);
    });

    it('cambiar de lista corta el audio, carga sus frases y recuerda la elección', async () => {
      const { store, audio, progress } = setup({});
      await store.init();
      await flush();
      store.next(); // suena Home
      await flush();
      const stoppedBefore = audio.stopped;

      await store.selectDeck('commons');
      await flush();

      expect(audio.stopped).toBeGreaterThan(stoppedBefore);
      expect(store.deckId()).toBe('commons');
      expect(store.total()).toBe(2);
      expect(store.text()).toBe('common one');
      expect(store.status()).toBe('idle'); // como al abrir: no suena sola
      expect(progress.activeDeck).toBe('commons');
    });

    it('cada lista guarda su propia posición y se retoma al volver', async () => {
      const { store, audio } = setup({});
      await store.init();
      await flush();
      store.next();
      store.next(); // Home en la 3a
      await flush();

      await store.selectDeck('commons');
      await flush();
      expect(store.index()).toBe(0);
      store.next(); // Commons en la 2a; el audio es el de Commons
      await flush();
      expect(audio.loadedDecks.at(-1)).toBe('commons');

      await store.selectDeck('home');
      await flush();
      expect(store.index()).toBe(2);
      expect(store.current()?.numero).toBe(3);

      await store.selectDeck('commons');
      await flush();
      expect(store.index()).toBe(1);
    });

    it('al abrir vuelve a la última lista practicada', async () => {
      const progress = new FakeProgressStorage({ currentIndex: 1 }, 'commons');
      progress.saveActiveDeck('commons');
      const { store } = setup({ progress });
      await store.init();
      await flush();
      expect(store.deckId()).toBe('commons');
      expect(store.text()).toBe('common two');
    });

    it('una lista guardada que ya no existe cae a la primera', async () => {
      const progress = new FakeProgressStorage();
      progress.saveActiveDeck('borrada');
      const { store } = setup({ progress });
      await store.init();
      await flush();
      expect(store.deckId()).toBe('home');
      expect(store.loadPhase()).toBe('ready');
    });
  });
});
