import { Injectable } from '@angular/core';
import type { Progress } from '../../domain/progress';
import type { ProgressStoragePort } from '../../application/ports/progress-storage.port';
import { readJson, writeJson } from './safe-storage';

// v2: mazo de frases nuevo. La posicion guardada con el mazo anterior apuntaria
// a una frase distinta, asi que se descarta al subir la version.
const KEY = 'shadow.progress.v2';

/** Adapter: persists Progress in localStorage. */
@Injectable()
export class LocalStorageProgress implements ProgressStoragePort {
  load(): Progress | null {
    const value = readJson<Progress>(KEY);
    if (!value || typeof value.currentIndex !== 'number') return null;
    return { currentIndex: value.currentIndex };
  }

  save(progress: Progress): void {
    writeJson(KEY, progress);
  }
}
