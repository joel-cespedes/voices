import { describe, expect, it } from 'vitest';
import { createSession } from '../../domain/practice-session';
import { DEFAULT_SETTINGS } from '../../domain/settings';
import {
  FakePhraseRepository,
  FakeProgressStorage,
  FakeSettingsStorage,
  makePhrase,
} from '../testing/fakes';
import { LoadPhrases } from './load-phrases';
import { AdvanceSession, GoToPhrase, RewindSession } from './navigate-session';
import { RepeatCurrent } from './repeat-current';
import { SelectDeck } from './select-deck';
import { UpdateSettings } from './update-settings';

const phrases = [makePhrase({ numero: 1 }), makePhrase({ numero: 2 }), makePhrase({ numero: 3 })];

describe('LoadPhrases', () => {
  it('delegates to the repository for the given deck', async () => {
    const repo = new FakePhraseRepository({ home: phrases, commons: [phrases[0]] });
    expect(await new LoadPhrases(repo).execute('home')).toHaveLength(3);
    expect(await new LoadPhrases(repo).execute('commons')).toHaveLength(1);
  });
});

describe('navigation use cases', () => {
  it('AdvanceSession moves forward and persists progress', () => {
    const progress = new FakeProgressStorage();
    const next = new AdvanceSession(progress).execute(createSession(phrases, 0));
    expect(next.index).toBe(1);
    expect(progress.load('home')).toEqual({ currentIndex: 1 });
  });

  it('RewindSession moves back and persists progress', () => {
    const progress = new FakeProgressStorage();
    const next = new RewindSession(progress).execute(createSession(phrases, 2));
    expect(next.index).toBe(1);
    expect(progress.load('home')).toEqual({ currentIndex: 1 });
  });

  it('GoToPhrase clamps, jumps and persists', () => {
    const progress = new FakeProgressStorage();
    const next = new GoToPhrase(progress).execute(createSession(phrases, 0), 99);
    expect(next.index).toBe(2);
    expect(progress.load('home')).toEqual({ currentIndex: 2 });
  });

  it('persists under the deck the session runs on', () => {
    const progress = new FakeProgressStorage();
    new GoToPhrase(progress).execute(createSession(phrases, 0, 'commons'), 1);
    expect(progress.load('commons')).toEqual({ currentIndex: 1 });
    expect(progress.load('home')).toBeNull();
  });
});

describe('SelectDeck', () => {
  it('remembers the chosen deck', () => {
    const progress = new FakeProgressStorage();
    new SelectDeck(progress).execute('commons');
    expect(progress.loadActiveDeck()).toBe('commons');
  });
});

describe('RepeatCurrent', () => {
  it('returns the current phrase', () => {
    const phrase = new RepeatCurrent().execute(createSession(phrases, 1));
    expect(phrase?.numero).toBe(2);
  });
});

describe('UpdateSettings', () => {
  it('applies a patch, enforces invariants and persists', () => {
    const settings = new FakeSettingsStorage();
    const next = new UpdateSettings(settings).execute(DEFAULT_SETTINGS, {
      playbackRate: 5,
      repetitions: 9,
      translationLang: 'en',
    });
    expect(next.playbackRate).toBe(1.25);
    expect(next.repetitions).toBe(3);
    expect(next.translationLang).toBe('en');
    expect(settings.saved).toEqual(next);
  });
});
