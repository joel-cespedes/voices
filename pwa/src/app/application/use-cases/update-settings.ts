import { clampPlaybackRate, clampRepetitions } from '../../domain/rules';
import type { Settings } from '../../domain/settings';
import type { SettingsPort } from '../ports/settings.port';

/**
 * Use case: apply a partial settings change, enforce the domain invariants
 * (clamping rate and repetitions) and persist the result.
 */
export class UpdateSettings {
  constructor(private readonly settings: SettingsPort) {}

  execute(current: Settings, patch: Partial<Settings>): Settings {
    const merged: Settings = { ...current, ...patch };
    const next: Settings = {
      ...merged,
      playbackRate: clampPlaybackRate(merged.playbackRate),
      repetitions: clampRepetitions(merged.repetitions),
    };
    this.settings.save(next);
    return next;
  }
}
