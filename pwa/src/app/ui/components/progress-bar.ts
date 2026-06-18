import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Presentational top progress bar. Ratio is 0..1. */
@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="track"
      role="progressbar"
      aria-label="progress"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="100"
      [attr.aria-valuenow]="percent()"
    >
      <div class="fill" [style.width.%]="percent()"></div>
    </div>
  `,
  styles: [
    `
      .track {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        background: var(--accent, #7c83ff);
        transition: width 240ms ease;
      }
      @media (prefers-reduced-motion: reduce) {
        .fill {
          transition: none;
        }
      }
    `,
  ],
})
export class ProgressBar {
  readonly ratio = input(0);
  percent(): number {
    return Math.round(Math.min(1, Math.max(0, this.ratio())) * 100);
  }
}
