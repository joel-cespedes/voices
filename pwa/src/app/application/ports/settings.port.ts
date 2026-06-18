import type { Settings } from '../../domain/settings';

/**
 * Port: persistence of user settings. Implemented by infrastructure
 * (e.g. localStorage).
 */
export interface SettingsPort {
  /** Load the persisted settings, or null if none were saved. */
  load(): Settings | null;
  /** Persist the given settings. */
  save(settings: Settings): void;
}
