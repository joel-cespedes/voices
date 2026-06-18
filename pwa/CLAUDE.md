# CLAUDE.md

Guía para Claude Code (y otros agentes) trabajando en **Shadow**.

> La fuente de verdad completa —visión, mapa de capas, wiring de DI, invariantes,
> convenciones y recetas— está en **[AGENTS.md](./AGENTS.md)**. Este fichero es un
> resumen operativo; ante cualquier duda, AGENTS.md manda.

## Qué es

PWA Angular 21 (standalone + signals) para practicar *shadowing* de inglés, con
**arquitectura hexagonal**. Datos (CSV + audios) servidos por CDN (jsDelivr).

## Reglas de oro (no romper)

1. `domain/` y `application/` **NO** importan Angular ni `infrastructure`/`ui`.
2. La frontera lógica↔infraestructura son los **puertos** (`application/ports`).
   Nueva fuente de datos o reproductor = **nuevo adaptador** + un cambio en
   `app.config.ts`. No se toca el dominio.
3. La **UI no tiene reglas de negocio**: viven en `domain/` (clamp, pausas,
   navegación). El estado reactivo va en **signals**.
4. TypeScript **strict**, sin `any`. Textos de UI en `ui/i18n/messages.ts`.

Comprobación (no debe devolver nada):

```bash
grep -rn "@angular" src/app/domain src/app/application
```

## Comandos

```bash
npm start        # dev :4200
npm run build    # build prod (+ service worker)
npm test         # unit (Vitest)
npm run lint     # ESLint
npm run e2e      # e2e (Playwright)
```

## Mapa rápido

```
src/app/
  domain/         Phrase, PracticeSession, PlaybackState, Progress, Settings, rules
  application/    use-cases/ + ports/ + testing/ (fakes)
  infrastructure/ JsDelivrCsvPhraseRepository, HtmlAudioPlayer, LocalStorage*, csv-parser
  ui/             practice/ (vista + PracticeStore), settings-sheet/, components/, i18n/
  core/           config/ (CdnConfig) + di/tokens.ts
  app.config.ts   composición: puertos → adaptadores (ÚNICO sitio)
```

## Al terminar un cambio

Ejecuta `npm test`, `npm run lint` y `npm run build`. Si tocas el flujo principal,
`npm run e2e`. Commits en Conventional Commits. Recetas paso a paso en AGENTS.md.
