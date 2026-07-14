import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import {
  PLAYBACK_RATE_MAX,
  PLAYBACK_RATE_MIN,
  REPETITIONS_MAX,
  REPETITIONS_MIN,
} from '../../domain/rules';
import { I18nService } from '../i18n/i18n.service';
import { PracticeStore } from '../practice/practice.store';

/** Bottom-sheet of practice settings. Visibility is controlled by the parent. */
@Component({
  selector: 'app-settings-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-sheet.html',
  styleUrl: './settings-sheet.css',
})
export class SettingsSheet {
  protected readonly store = inject(PracticeStore);
  protected readonly i18n = inject(I18nService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly rateMin = PLAYBACK_RATE_MIN;
  protected readonly rateMax = PLAYBACK_RATE_MAX;
  protected readonly repsMin = REPETITIONS_MIN;
  protected readonly repsMax = REPETITIONS_MAX;

  protected onRate(event: Event): void {
    this.store.setPlaybackRate(Number((event.target as HTMLInputElement).value));
  }

  protected onReps(event: Event): void {
    this.store.setRepetitions(Number((event.target as HTMLInputElement).value));
  }

  protected onLang(event: Event): void {
    this.store.setTranslationLang((event.target as HTMLSelectElement).value);
  }
}
