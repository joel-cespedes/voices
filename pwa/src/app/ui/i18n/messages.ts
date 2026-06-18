/**
 * Externalized UI strings. i18n-ready: add a locale by adding a map here.
 * Kept dependency-free; consumed via the I18nService signal in the UI.
 */
export type UiLocale = 'es' | 'en';

export type MessageKey =
  | 'appTitle'
  | 'loading'
  | 'errorLoad'
  | 'retry'
  | 'empty'
  | 'previous'
  | 'next'
  | 'repeat'
  | 'play'
  | 'pause'
  | 'settings'
  | 'close'
  | 'shadowingNow'
  | 'showTranslation'
  | 'speed'
  | 'repetitions'
  | 'pauseMode'
  | 'pauseShort'
  | 'pauseMedium'
  | 'pausePhrase'
  | 'autoAdvance'
  | 'translationLang'
  | 'counter';

type Catalog = Record<MessageKey, string>;

export const MESSAGES: Record<UiLocale, Catalog> = {
  es: {
    appTitle: 'Shadow',
    loading: 'Cargando frases…',
    errorLoad: 'No se pudieron cargar las frases.',
    retry: 'Reintentar',
    empty: 'No hay frases disponibles.',
    previous: 'Anterior',
    next: 'Siguiente',
    repeat: 'Repetir audio',
    play: 'Reproducir',
    pause: 'Pausar',
    settings: 'Ajustes',
    close: 'Cerrar',
    shadowingNow: 'Repite en voz alta',
    showTranslation: 'Mostrar traducción',
    speed: 'Velocidad',
    repetitions: 'Repeticiones',
    pauseMode: 'Pausa de shadowing',
    pauseShort: 'Corta',
    pauseMedium: 'Media',
    pausePhrase: 'Igual a la frase',
    autoAdvance: 'Auto-avance',
    translationLang: 'Idioma de traducción',
    counter: 'Frase',
  },
  en: {
    appTitle: 'Shadow',
    loading: 'Loading phrases…',
    errorLoad: 'Could not load phrases.',
    retry: 'Retry',
    empty: 'No phrases available.',
    previous: 'Previous',
    next: 'Next',
    repeat: 'Repeat audio',
    play: 'Play',
    pause: 'Pause',
    settings: 'Settings',
    close: 'Close',
    shadowingNow: 'Repeat out loud',
    showTranslation: 'Show translation',
    speed: 'Speed',
    repetitions: 'Repetitions',
    pauseMode: 'Shadowing pause',
    pauseShort: 'Short',
    pauseMedium: 'Medium',
    pausePhrase: 'Same as phrase',
    autoAdvance: 'Auto-advance',
    translationLang: 'Translation language',
    counter: 'Phrase',
  },
};
