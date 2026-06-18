import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PracticePage } from './ui/practice/practice-page';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PracticePage],
  template: '<app-practice />',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class App {}
