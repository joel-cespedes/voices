import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../domain/settings';
import { LocalStorageProgress } from './local-storage-progress';
import { LocalStorageSettings } from './local-storage-settings';

beforeEach(() => {
  globalThis.localStorage?.clear();
});

describe('LocalStorageProgress', () => {
  it('round-trips progress per deck', () => {
    const store = new LocalStorageProgress();
    expect(store.load('home')).toBeNull();
    store.save('home', { currentIndex: 42 });
    store.save('commons', { currentIndex: 7 });
    expect(store.load('home')).toEqual({ currentIndex: 42 });
    expect(store.load('commons')).toEqual({ currentIndex: 7 });
  });

  it('round-trips the active deck without touching positions', () => {
    const store = new LocalStorageProgress();
    expect(store.loadActiveDeck()).toBeNull();
    store.save('home', { currentIndex: 3 });
    store.saveActiveDeck('commons');
    expect(store.loadActiveDeck()).toBe('commons');
    expect(store.load('home')).toEqual({ currentIndex: 3 });
  });

  it('falls back to the v2 (single-deck) position for Home only', () => {
    globalThis.localStorage.setItem('shadow.progress.v2', '{"currentIndex":12}');
    const store = new LocalStorageProgress();
    expect(store.load('home')).toEqual({ currentIndex: 12 });
    expect(store.load('commons')).toBeNull();
  });

  it('ignores malformed data', () => {
    globalThis.localStorage.setItem(
      'shadow.progress.v3',
      '{"activeDeck":5,"decks":{"home":{"currentIndex":"nope"}}}',
    );
    const store = new LocalStorageProgress();
    expect(store.load('home')).toBeNull();
    expect(store.loadActiveDeck()).toBeNull();
  });
});

describe('LocalStorageSettings', () => {
  it('round-trips settings merged onto defaults', () => {
    const store = new LocalStorageSettings();
    expect(store.load()).toBeNull();
    store.save({ ...DEFAULT_SETTINGS, playbackRate: 0.75 });
    const loaded = store.load();
    expect(loaded?.playbackRate).toBe(0.75);
    expect(loaded?.translationLang).toBe(DEFAULT_SETTINGS.translationLang);
  });

  it('fills missing keys from defaults for partial payloads', () => {
    globalThis.localStorage.setItem('shadow.settings.v3', '{"repetitions":3}');
    const loaded = new LocalStorageSettings().load();
    expect(loaded?.repetitions).toBe(3);
    expect(loaded?.playbackRate).toBe(DEFAULT_SETTINGS.playbackRate);
  });
});
