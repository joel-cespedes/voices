# ADR 0004 — PWA instalable y offline (service worker)

- **Estado**: aceptada
- **Fecha**: 2026-06-17

## Contexto

Se requiere una app **instalable** y **funcional offline** tras la primera carga:
cachear el `index.csv` y los audios ya visitados, y poder precargar un rango.

## Decisión

Usar **`@angular/service-worker`** (`ngsw`) con `provideServiceWorker` (activo solo
en producción) + `manifest.webmanifest` e iconos PNG (192/512 + maskable, generados
por `scripts/generate-icons.mjs`).

`ngsw-config.json`:

- **assetGroups**: app shell (`prefetch`) e iconos/media (`lazy`).
- **dataGroups**:
  - `index.csv` → estrategia `freshness` (datos frescos cuando hay red).
  - `audios/**` (cross-origin al CDN) → estrategia `performance` con caché grande
    y larga: los audios visitados quedan disponibles offline.

Precarga de rango: `PracticeStore.prefetchRange(from, to)` hace `fetch` de las URLs
de audio para que el service worker las cachee.

## Consecuencias

- **+** Instalable; uso offline real de lo ya visitado o precargado.
- **+** `freshness` evita servir un índice obsoleto cuando hay conexión.
- **−** La caché de audio puede crecer; se acota con `maxSize`/`maxAge`.
- **−** El service worker solo opera en build de producción (por diseño); en `dev`
  está desactivado para no interferir con el *hot reload*.
