import { describe, expect, it } from 'vitest';

import { nextIndex, previousIndex } from './card';
import { createSession } from './practice-session';
import type { Phrase } from './phrase';

const p = (numero: number, en: string, es: string | null): Phrase => ({
  numero,
  archivo: `${String(numero).padStart(4, '0')}.mp3`,
  en,
  es,
});

const deck = [
  p(1, 'Who looks after your dog?', '¿Quién cuida a tu perro?'),
  p(2, 'I can handle it.', 'Puedo hacerlo yo.'),
  p(3, 'What are you looking at?', '¿Qué miras?'),
];

describe('nextIndex', () => {
  it('avanza a la frase siguiente', () => {
    expect(nextIndex(createSession(deck, 0))).toBe(1);
    expect(nextIndex(createSession(deck, 1))).toBe(2);
  });

  it('da la vuelta: de la ULTIMA frase pasa a la primera', () => {
    expect(nextIndex(createSession(deck, 2))).toBe(0);
  });

  it('con el mazo vacio se queda en 0', () => {
    expect(nextIndex(createSession([], 0))).toBe(0);
  });
});

describe('previousIndex', () => {
  it('retrocede a la frase anterior', () => {
    expect(previousIndex(createSession(deck, 2))).toBe(1);
    expect(previousIndex(createSession(deck, 1))).toBe(0);
  });

  it('da la vuelta: de la PRIMERA frase salta a la ultima', () => {
    expect(previousIndex(createSession(deck, 0))).toBe(2);
  });

  it('con el mazo vacio se queda en 0', () => {
    expect(previousIndex(createSession([], 0))).toBe(0);
  });
});

describe('mazo circular', () => {
  it('recorrer las 3 frases deja el ciclo cerrado en la inicial', () => {
    let i = 0;
    for (let n = 0; n < 3; n++) i = nextIndex(createSession(deck, i));
    expect(i).toBe(0);
  });

  it('avanzar y retroceder desde el borde vuelve al mismo sitio', () => {
    const next = nextIndex(createSession(deck, 2)); // 2 -> 0
    expect(previousIndex(createSession(deck, next))).toBe(2); // 0 -> 2
  });
});
