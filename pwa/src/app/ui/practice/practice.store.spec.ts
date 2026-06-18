import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SETTINGS } from '../../domain/settings';
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
}): {
  store: PracticeStore;
  audio: FakeAudioPlayer;
  progress: FakeProgressStorage;
} {
  const audio = opts.audio ?? new FakeAudioPlayer();
  const progress = opts.progress ?? new FakeProgressStorage();
  const settings = opts.settings ?? new FakeSettingsStorage();
  TestBed.configureTestingModule({
    providers: [
      { provide: PHRASE_REPOSITORY, useValue: new FakePhraseRepository(phrases) },
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
  it('loads phrases and autoplays the first one', async () => {
    const { store, audio } = setup({});
    await store.init();
    await flush();
    expect(store.loadPhase()).toBe('ready');
    expect(store.total()).toBe(3);
    expect(audio.loaded).toEqual(['0001.mp3']);
    expect(audio.playCount).toBe(1);
    expect(store.status()).toBe('playing');
  });

  it('replays per repetitions then enters the shadowing pause and auto-advances', async () => {
    vi.useFakeTimers();
    const settings = new FakeSettingsStorage({
      ...DEFAULT_SETTINGS,
      repetitions: 2,
      autoAdvance: true,
      pauseMode: 'medium',
    });
    const { store, audio, progress } = setup({ settings });
    await store.init();
    await flush();
    expect(audio.playCount).toBe(1);

    audio.emitEnded(); // repetition 1 -> replay (2nd play)
    expect(audio.playCount).toBe(2);

    audio.emitEnded(); // repetition 2 done -> shadowing
    expect(store.status()).toBe('shadowing');

    vi.advanceTimersByTime(2500); // medium pause elapses -> auto-advance
    expect(store.index()).toBe(1);
    expect(progress.saved).toEqual({ currentIndex: 1 });
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
});
