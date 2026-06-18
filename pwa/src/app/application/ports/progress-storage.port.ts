import type { Progress } from '../../domain/progress';

/**
 * Port: persistence of the user's position. Implemented by infrastructure
 * (e.g. localStorage). Synchronous by design — the adapter must not block.
 */
export interface ProgressStoragePort {
  /** Load the persisted progress, or null if none was saved. */
  load(): Progress | null;
  /** Persist the given progress. */
  save(progress: Progress): void;
}
