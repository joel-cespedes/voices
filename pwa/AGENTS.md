# AGENTS.md — guía para humanos y agentes de IA

Este documento es el contrato de trabajo del proyecto **Shadow**. Léelo antes de
tocar código. Su objetivo es que cualquier agente extienda la app **sin romper la
arquitectura**.

## Visión del producto

PWA móvil-first para practicar *shadowing* de inglés. Una frase por pantalla
(formato *stories*), audio pregenerado que se reproduce solo, y una pausa para
que el usuario repita en voz alta antes de pasar a la siguiente. Datos (índice
CSV + audios) servidos por CDN (jsDelivr sobre GitHub).

Las frases se agrupan en **listas** (`Deck`: Home, Commons…), cada una con su
CSV y su carpeta de audios. Se cambia de lista desde el menú ☰; la posición se
guarda **por lista**.

## Arquitectura: hexagonal (puertos y adaptadores)

Las dependencias **apuntan solo hacia el dominio**:

```
ui ──▶ application ──▶ domain ◀── infrastructure
       (puertos)                  (adaptadores implementan los puertos)
```

### Mapa de carpetas (`src/app/`)

| Capa              | Carpeta            | Responsabilidad                                                        | Puede importar             |
| ----------------- | ------------------ | ---------------------------------------------------------------------- | -------------------------- |
| **domain**        | `domain/`          | Entidades y reglas puras: `Deck`, `Phrase`, `PracticeSession`, `PlaybackState`, `Progress`, `Settings`, `rules` (clamp, cálculo de pausa, ratio). | nada (TS puro)             |
| **application**   | `application/`     | Casos de uso (`use-cases/`) + **puertos** (`ports/`) + dobles de test (`testing/`). | solo `domain`              |
| **infrastructure**| `infrastructure/`  | Adaptadores que implementan los puertos: `JsDelivrCsvPhraseRepository`, `HtmlAudioPlayer`, `LocalStorageProgress`, `LocalStorageSettings`, `csv-parser`. | `domain`, `application`, Angular `@Injectable`, `core/` |
| **ui**            | `ui/`              | Componentes Angular (standalone + signals): `practice/` (vista stories + `PracticeStore`), `deck-menu/` (menú de listas), `settings-sheet/`, `components/`, `i18n/`. | `application`, `domain` (tipos), `core/di` (tokens) |
| **core**          | `core/`            | `config/` (`CdnConfig`: base del CDN + lista de `decks` con su CSV y carpeta de audios) y `di/tokens.ts` (un token por puerto). | `domain`, `application`    |

### Wiring de DI (composición)

El **único** lugar donde los puertos se atan a adaptadores es
`src/app/app.config.ts`:

| Token (`core/di/tokens.ts`) | Adaptador                       |
| --------------------------- | ------------------------------- |
| `CDN_CONFIG`                | `environment.cdn`               |
| `PHRASE_REPOSITORY`         | `JsDelivrCsvPhraseRepository`   |
| `AUDIO_PLAYER`              | `HtmlAudioPlayer`               |
| `PROGRESS_STORAGE`          | `LocalStorageProgress`          |
| `SETTINGS_STORAGE`          | `LocalStorageSettings`          |

La UI inyecta **tokens**, nunca clases concretas. `PracticeStore`
(`ui/practice/practice.store.ts`) es el *facade* de presentación: mantiene el
estado reactivo (signals) y orquesta casos de uso + puertos + reglas de dominio.
**No contiene reglas de negocio** (clamp, pausas y navegación viven en `domain`).

## Invariantes (NO romper)

1. `domain` y `application` **no importan Angular** ni nada de `infrastructure`/`ui`.
2. La única frontera entre lógica e infraestructura son los **puertos**
   (`application/ports`). Cambiar la fuente de datos o el reproductor = **nuevo
   adaptador**, sin tocar dominio.
3. La **UI no contiene reglas de negocio**; delega en casos de uso y dominio.
4. Todo el estado reactivo de UI vive en **signals**; sin librerías de estado.
5. TypeScript **strict**, sin `any`. Textos de UI **externalizados** (`ui/i18n`).

Verificación rápida (debe no devolver nada):

```bash
grep -rn "@angular" src/app/domain src/app/application
grep -rnE "from '.*(infrastructure|ui)/" src/app/domain src/app/application
```

## Comandos

```bash
npm install        # instalar
npm start          # dev server :4200
npm run build      # build de producción (+ service worker)
npm test           # unit (Vitest)
npm run lint       # ESLint
npm run e2e        # e2e (Playwright) — requiere: npx playwright install chromium
npm run format     # Prettier
```

## Convenciones

- **Código**: Angular standalone, `ChangeDetectionStrategy.OnPush`, nuevo control
  flow (`@if`/`@for`/`@switch`), `input()`/`output()` y `signal()`/`computed()`.
  Ficheros en `kebab-case`; clases en `PascalCase`. Puertos terminan en `.port.ts`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Pequeños y enfocados.
- **Tests**: cada capa con su red de seguridad. Reutiliza los fakes de
  `application/testing/fakes.ts`. Alta cobertura en `domain` y `application`.

## Recetas

### Añadir un nuevo modo de práctica

1. Si necesita una regla nueva (p.ej. otra pausa), añádela en `domain/rules.ts`
   con su test en `rules.spec.ts`.
2. Modela el estado/opción en `domain/settings.ts` (y `UpdateSettings` si aplica).
3. Expón la acción en `ui/practice/practice.store.ts` (signals + orquestación).
4. Añade el control en `ui/settings-sheet/` o `practice-page.html` y su texto en
   `ui/i18n/messages.ts`.
5. Tests: dominio (regla) + store (flujo).

### Cambiar la fuente de audio

1. Crea un adaptador en `infrastructure/audio/` que implemente `AudioPlayerPort`.
2. Cámbialo en `app.config.ts`: `{ provide: AUDIO_PLAYER, useClass: TuAdaptador }`.
3. **No toques** `domain`, `application` ni `ui`. Añade un test del adaptador.

### Cambiar la fuente de datos (p.ej. API en vez de CSV)

1. Implementa `PhraseRepositoryPort` en `infrastructure/phrase/`.
2. Reasigna `PHRASE_REPOSITORY` en `app.config.ts`.

### Añadir un idioma de traducción / de UI

- **Traducción visible** (la `es` de cada frase): proviene de los datos. Para más
  idiomas, amplía el esquema del CSV y el mapeo en
  `infrastructure/phrase/jsdelivr-csv-phrase.repository.ts`, y el selector en
  `settings-sheet`.
- **Textos de la interfaz**: añade un locale en `ui/i18n/messages.ts` (`MESSAGES`)
  y selecciónalo con `I18nService.setLocale()`.

### Añadir una lista de frases (deck)

1. En el repo de datos: nuevo Excel en `tts/` y una entrada en `DECKS`
   (`tts/phrases.py`). `./update.sh` genera su CSV y sus audios.
2. Aquí: una entrada más en `decks` de `src/environments/environment.ts` y
   `environment.prod.ts` con el **mismo `id`**, su `indexPath` y su `audioPath`.
3. Añade su CSV a `dataGroups.phrase-index` en `ngsw-config.json` (offline).
4. Nada más cambia: el menú, el progreso por lista y la reproducción salen solos
   de la config. `label` es un nombre propio (no pasa por i18n).

### Cambiar el CDN / entorno

Edita `src/environments/environment.ts` (dev) y `environment.prod.ts` (prod):
`baseUrl`, `audioFormat` y, por cada deck, `indexPath` y `audioPath`. Nada más
cambia.

## Decisiones de arquitectura

Ver [`docs/adr/`](./docs/adr): Angular+signals, hexagonal, CSV vía CDN, PWA offline.
