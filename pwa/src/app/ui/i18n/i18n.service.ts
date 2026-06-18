import { computed, Injectable, signal } from '@angular/core';
import { MESSAGES, type MessageKey, type UiLocale } from './messages';

/** Tiny signal-based i18n service for UI strings. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _locale = signal<UiLocale>('es');
  readonly locale = this._locale.asReadonly();
  readonly catalog = computed(() => MESSAGES[this._locale()]);

  setLocale(locale: UiLocale): void {
    this._locale.set(locale);
  }

  t(key: MessageKey): string {
    return MESSAGES[this._locale()][key];
  }
}
