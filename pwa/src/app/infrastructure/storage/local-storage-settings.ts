import { Injectable } from '@angular/core';
import { DEFAULT_SETTINGS, type Settings } from '../../domain/settings';
import type { SettingsPort } from '../../application/ports/settings.port';
import { readJson, writeJson } from './safe-storage';

// v3: showTranslation cambia de sentido (ahora revela el ingles) y pasa a false
// por defecto. Sin subir la version, un `true` guardado dejaria el ingles visible.
const KEY = 'shadow.settings.v3';

/** Adapter: persists Settings in localStorage, merging onto defaults. */
@Injectable()
export class LocalStorageSettings implements SettingsPort {
  load(): Settings | null {
    const value = readJson<Partial<Settings>>(KEY);
    if (!value) return null;
    // Merge onto defaults so older/partial payloads stay valid.
    return { ...DEFAULT_SETTINGS, ...value };
  }

  save(settings: Settings): void {
    writeJson(KEY, settings);
  }
}
