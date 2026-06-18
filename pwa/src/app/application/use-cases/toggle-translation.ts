import type { Settings } from '../../domain/settings';
import type { SettingsPort } from '../ports/settings.port';

/**
 * Use case: flip the "show translation" preference and persist it.
 * Returns the updated settings.
 */
export class ToggleTranslation {
  constructor(private readonly settings: SettingsPort) {}

  execute(current: Settings): Settings {
    const next: Settings = { ...current, showTranslation: !current.showTranslation };
    this.settings.save(next);
    return next;
  }
}
