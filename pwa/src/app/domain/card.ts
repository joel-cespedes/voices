/**
 * Domain: moving the cursor over the deck.
 *
 * Una frase = una pantalla. Se ve el inglés (grande) con su traducción al
 * español debajo; el audio es siempre la grabación en inglés. La navegación es
 * CIRCULAR: al pasar de la última frase se vuelve a la primera, para poder
 * repasar en bucle sin tener que retroceder todo el mazo.
 */
import type { PracticeSession } from './practice-session';

/** Índice de la frase siguiente; desde la última vuelve a la primera. */
export function nextIndex(session: PracticeSession): number {
  const n = session.phrases.length;
  if (n === 0) return 0;
  return session.index >= n - 1 ? 0 : session.index + 1;
}

/** Índice de la frase anterior; desde la primera salta a la última. */
export function previousIndex(session: PracticeSession): number {
  const n = session.phrases.length;
  if (n === 0) return 0;
  return session.index <= 0 ? n - 1 : session.index - 1;
}
