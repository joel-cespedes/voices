import { describe, expect, it } from 'vitest';

import { cardText, faces, flip, nextCard, previousCard, type CardPosition } from './card';
import { createSession } from './practice-session';
import type { Phrase } from './phrase';

const p = (numero: number, en: string, es: string | null): Phrase => ({
  numero,
  archivo: `${String(numero).padStart(4, '0')}.mp3`,
  en,
  es,
});

// Frase 2 sin traduccion: solo tiene una carta (la inglesa).
const deck = [
  p(1, 'Who looks after your dog?', '¿Quién cuida a tu perro?'),
  p(2, 'No translation here.', null),
  p(3, 'I can handle it.', 'Puedo hacerlo yo.'),
];
const session = createSession(deck);

const at = (index: number, face: 'es' | 'en'): CardPosition => ({ index, face });

describe('faces', () => {
  it('gives a translated phrase two cards, es first', () => {
    expect(faces(deck[0])).toEqual(['es', 'en']);
  });

  it('gives an untranslated phrase a single english card', () => {
    expect(faces(deck[1])).toEqual(['en']);
  });
});

describe('cardText', () => {
  it('shows the spanish on the es card and the english on the en card', () => {
    expect(cardText(deck[0], 'es')).toBe('¿Quién cuida a tu perro?');
    expect(cardText(deck[0], 'en')).toBe('Who looks after your dog?');
  });

  it('falls back to english when there is no translation', () => {
    expect(cardText(deck[1], 'es')).toBe('No translation here.');
  });
});

describe('nextCard', () => {
  it('goes from the spanish card to the english one of the SAME phrase', () => {
    expect(nextCard(session, at(0, 'es'))).toEqual(at(0, 'en'));
  });

  it('goes from the english card to the next phrase', () => {
    expect(nextCard(session, at(0, 'en'))).toEqual(at(1, 'en')); // frase 2 no tiene es
  });

  it('skips the missing spanish card of an untranslated phrase', () => {
    expect(nextCard(session, at(1, 'en'))).toEqual(at(2, 'es'));
  });

  it('da la vuelta: de la ULTIMA carta se pasa a la primera', () => {
    expect(nextCard(session, at(2, 'en'))).toEqual(at(0, 'es'));
  });
});

describe('previousCard', () => {
  it('goes back from the english card to the spanish one of the same phrase', () => {
    expect(previousCard(session, at(0, 'en'))).toEqual(at(0, 'es'));
  });

  it('goes back to the LAST card of the previous phrase', () => {
    expect(previousCard(session, at(2, 'es'))).toEqual(at(1, 'en'));
  });

  it('da la vuelta: de la PRIMERA carta se salta a la ultima del mazo', () => {
    expect(previousCard(session, at(0, 'es'))).toEqual(at(2, 'en'));
  });
});

describe('mazo circular', () => {
  it('recorrer el mazo entero deja el ciclo cerrado en la carta inicial', () => {
    // 3 frases: la 1a y la 3a tienen 2 cartas, la 2a solo 1 -> 5 cartas.
    let pos = at(0, 'es');
    for (let i = 0; i < 5; i++) pos = nextCard(session, pos);
    expect(pos).toEqual(at(0, 'es'));
  });

  it('vuelve al mismo sitio si avanzas y retrocedes desde el borde', () => {
    const ultima = at(2, 'en');
    expect(previousCard(session, nextCard(session, ultima))).toEqual(ultima);
  });
});

describe('flip', () => {
  it('toggles between the two cards of a phrase', () => {
    expect(flip(session, at(0, 'es'))).toEqual(at(0, 'en'));
    expect(flip(session, at(0, 'en'))).toEqual(at(0, 'es'));
  });

  it('does nothing when the phrase has a single card', () => {
    expect(flip(session, at(1, 'en'))).toEqual(at(1, 'en'));
  });
});
