import { Injectable } from '@angular/core';
import type { Progress } from '../../domain/progress';
import type { ProgressStoragePort } from '../../application/ports/progress-storage.port';
import { readJson, writeJson } from './safe-storage';

const KEY = 'shadow.progress.v1';

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
