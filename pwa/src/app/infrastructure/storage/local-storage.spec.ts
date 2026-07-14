import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../domain/settings';
import { LocalStorageProgress } from './local-storage-progress';
import { LocalStorageSettings } from './local-storage-settings';

beforeEach(() => {
  globalThis.localStorage?.clear();
});

describe('LocalStorageProgress', () => {
  it('round-trips progress', () => {
    const store = new LocalStorageProgress();
    expect(store.load()).toBeNull();
    store.save({ currentIndex: 42 });
    expect(store.load()).toEqual({ currentIndex: 42 });
  });

  it('ignores malformed data', () => {
    globalThis.localStorage.setItem('shadow.progress.v2', '{"currentIndex":"nope"}');
    expect(new LocalStorageProgress().load()).toBeNull();
  });
});

describe('LocalStorageSettings', () => {
  it('round-trips settings merged onto defaults', () => {
    const store = new LocalStorageSettings();
    expect(store.load()).toBeNull();
    store.save({ ...DEFAULT_SETTINGS, playbackRate: 0.75 });
    const loaded = store.load();
    expect(loaded?.playbackRate).toBe(0.75);
    expect(loaded?.pauseMode).toBe(DEFAULT_SETTINGS.pauseMode);
  });

  it('fills missing keys from defaults for partial payloads', () => {
    globalThis.localStorage.setItem('shadow.settings.v3', '{"repetitions":3}');
    const loaded = new LocalStorageSettings().load();
    expect(loaded?.repetitions).toBe(3);
    expect(loaded?.playbackRate).toBe(DEFAULT_SETTINGS.playbackRate);
  });
});
