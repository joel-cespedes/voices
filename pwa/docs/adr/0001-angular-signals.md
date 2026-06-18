# ADR 0001 — Angular 21 (standalone + signals) como stack de UI

- **Estado**: aceptada
- **Fecha**: 2026-06-17

## Contexto

Necesitamos una PWA móvil-first, instalable y con arranque rápido, mantenible por
agentes de IA. Se pide explícitamente Angular 21 standalone + signals, TypeScript
strict y sin librerías de estado pesadas.

## Decisión

Usar **Angular 21** con componentes **standalone**, **signals** para todo el
estado reactivo y el nuevo control flow (`@if`/`@for`/`@switch`). Detección de
cambios **zoneless** (`provideZonelessChangeDetection`) — el scaffold de Angular 21
ya no incluye `zone.js`. Componentes con `OnPush`.

El estado de la vista vive en un *facade* de presentación (`PracticeStore`) basado
en signals; no se añade NgRx ni similares.

## Consecuencias

- **+** Bundle inicial pequeño (~150 kB), sin runtime de zone.js.
- **+** Estado reactivo simple y testeable; los `computed` derivan la UI.
- **+** Menos dependencias que mantener.
- **−** Zoneless es relativamente nuevo: hay que actualizar signals desde callbacks
  asíncronos (timers, eventos de audio) — ya contemplado en `PracticeStore`.
