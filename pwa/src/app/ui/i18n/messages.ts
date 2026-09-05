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
  | 'lists'
  | 'close'
  | 'shadowingNow'
  | 'speed'
  | 'repetitions'
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
    lists: 'Listas',
    close: 'Cerrar',
    shadowingNow: 'Repite en voz alta',
    speed: 'Velocidad',
    repetitions: 'Repeticiones',
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
    lists: 'Lists',
    close: 'Close',
    shadowingNow: 'Repeat out loud',
    speed: 'Speed',
    repetitions: 'Repetitions',
    translationLang: 'Translation language',
    counter: 'Phrase',
  },
};
