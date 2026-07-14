import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
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
export class App {
  private readonly updates = inject(SwUpdate);

  constructor() {
    // Sin esto, una app ya instalada se queda con el bundle cacheado hasta que
    // el usuario la cierra del todo. Si ese bundle viejo apunta a una ruta de
    // audios que ya no existe, la practica se queda muda sin avisar de nada.
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          document.location.reload();
        }
      });
    }
  }
}
