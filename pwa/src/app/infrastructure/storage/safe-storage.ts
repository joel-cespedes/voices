/**
 * Thin guard around localStorage. Returns null / no-ops when storage is
 * unavailable (SSR, private mode, quota errors) so adapters never throw.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJson<T>(key: string, value: T): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore: storage is best-effort.
  }
}
