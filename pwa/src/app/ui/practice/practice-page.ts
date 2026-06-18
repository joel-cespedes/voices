import {
  ChangeDetectionStrategy,
  Component,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
} from '@angular/core';

import { ProgressBar } from '../components/progress-bar';
import { SettingsSheet } from '../settings-sheet/settings-sheet';
import { I18nService } from '../i18n/i18n.service';
import { PracticeStore } from './practice.store';

const SWIPE_THRESHOLD_PX = 48;

/**
 * Stories-style practice view: one phrase per screen, audio autoplay, swipe /
 * side-tap / keyboard navigation. Holds no business rules — it delegates every
 * action to the PracticeStore.
 */
@Component({
  selector: 'app-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressBar, SettingsSheet],
  templateUrl: './practice-page.html',
  styleUrl: './practice-page.css',
  host: {
    '(window:keydown)': 'onKey($event)',
  },
})
export class PracticePage implements OnInit, OnDestroy {
  protected readonly store = inject(PracticeStore);
  protected readonly i18n = inject(I18nService);
  protected readonly settingsOpen = signal(false);

  private touchStartX: number | null = null;
  private touchStartY: number | null = null;

  ngOnInit(): void {
    void this.store.init();
  }

  ngOnDestroy(): void {
    this.store.dispose();
  }

  protected openSettings(): void {
    this.settingsOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsOpen.set(false);
  }

  // --- Touch (swipe) -------------------------------------------------------
  protected onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  protected onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null || this.touchStartY === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    this.touchStartX = null;
    this.touchStartY = null;
    // Horizontal intent only.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) this.store.next();
    else this.store.previous();
  }

  // --- Keyboard ------------------------------------------------------------
  protected onKey(event: KeyboardEvent): void {
    if (this.settingsOpen()) {
      if (event.key === 'Escape') this.closeSettings();
      return;
    }
    switch (event.key) {
      case 'ArrowRight':
        this.store.next();
        break;
      case 'ArrowLeft':
        this.store.previous();
        break;
      case ' ':
        event.preventDefault();
        this.store.togglePlay();
        break;
      case 'r':
      case 'R':
        this.store.repeat();
        break;
      default:
        return;
    }
  }
}
