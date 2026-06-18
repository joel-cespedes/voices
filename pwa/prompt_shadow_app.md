# Prompt — Construir "Shadow", app de shadowing (PWA)

---

## Rol

Actúa como ingeniero front-end senior especializado en **Angular moderno (v21, standalone + signals)** y **arquitectura hexagonal (puertos y adaptadores)**. Escribes código tipado estricto, modular y cubierto por tests, y dejas el proyecto preparado para que otros agentes de IA lo extiendan sin romperlo.

## Objetivo

Construye una **PWA móvil-first** llamada **Shadow** para practicar *shadowing* de inglés: una frase por pantalla en formato "stories", con audio pregenerado que se reproduce solo, pensada para repetir en voz alta.

## Datos de entrada (ya existen, no los generes)

- Repo público con los recursos: `github.com/joel-cespedes/voices`
- **Audios**: `audios/0001.mp3` … `0615.mp3` (voz natural pregenerada, ~5 s cada uno).
- **Índice**: `index.csv` con cabeceras `numero,archivo,en,es`
  - `numero`: correlativo (1…615)
  - `archivo`: nombre del mp3 (`0001.mp3`)
  - `en`: frase en inglés (la que se oye)
  - `es`: traducción al español (puede venir vacía en algunas filas → la UI debe tolerarlo)
- **Sirve los recursos vía CDN sobre GitHub (jsDelivr)**, no por raw:
  - Índice: `https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main/index.csv`
  - Audio: `https://cdn.jsdelivr.net/gh/joel-cespedes/voices@main/audios/{archivo}`
  - La base del CDN debe ser **configurable por entorno** (environment/token de DI), no hardcodeada en componentes.

## Requisitos funcionales

1. **Carga**: al iniciar, descarga y parsea el `index.csv` en memoria como lista de frases.
2. **Vista práctica (stories)**: una frase a pantalla completa.
   - Inglés en grande, español debajo en menor jerarquía (oculto si `es` está vacío).
   - Barra de progreso superior + contador `N / total`.
   - Indicador visual mientras suena el audio.
3. **Audio**: al entrar en una frase, reproduce su mp3 automáticamente. Controles: repetir audio, velocidad de reproducción (`playbackRate` 0.5–1.25), número de repeticiones por frase (1–3).
4. **Navegación**: swipe izquierda/derecha y tap en los laterales para avanzar/retroceder (como stories). Botones también.
5. **Modo auto-avance**: tras reproducir (× repeticiones) hace una **pausa de shadowing** configurable (corta / media / = duración de la frase) para que el usuario repita, y pasa a la siguiente. Pausable.
6. **Mostrar/ocultar traducción** con un toggle persistente.
7. **Persistencia**: guarda la posición actual y los ajustes; al reabrir, retoma donde se quedó.
8. **Ajustes** accesibles (hoja inferior): velocidad, repeticiones, pausa, modo auto, idioma de la traducción visible.

## Requisitos no funcionales

- **PWA instalable** (manifest + service worker). **Offline**: cachea el `index.csv` y los audios ya visitados; permite precargar un rango.
- **Móvil-first** (diseño a 380 px), pero usable en desktop.
- **Accesibilidad**: navegable por teclado, roles ARIA, respeta `prefers-reduced-motion`.
- **Rendimiento**: arranque rápido, lazy-loading, sin librerías de estado pesadas (usa **signals**).
- **i18n-ready**: textos de UI externalizados.

## Stack

- **Angular 21** standalone components, **signals** para estado, nuevo control flow (`@if`/`@for`).
- **TypeScript strict** (`strict: true`, sin `any`).
- Tests: **unit** (Vitest o Jest) + **e2e** (Playwright) del flujo principal.
- **ESLint + Prettier**, **Conventional Commits**.
- Sin dependencias innecesarias; justifica cada una que añadas.

## Arquitectura — hexagonal (puertos y adaptadores)

Cuatro capas con dependencias apuntando solo hacia el dominio:

- **domain/**: entidades y lógica pura, **cero** dependencias de Angular ni de infraestructura.
  - `Phrase`, `PracticeSession`, `PlaybackState`, `Progress`, reglas (ej. cálculo de pausa).
- **application/**: casos de uso + **puertos** (interfaces).
  - Casos de uso: `LoadPhrases`, `AdvanceSession`, `RepeatCurrent`, `ToggleTranslation`…
  - Puertos: `PhraseRepositoryPort`, `AudioPlayerPort`, `ProgressStoragePort`, `SettingsPort`.
- **infrastructure/**: adaptadores que implementan los puertos.
  - `JsDelivrCsvPhraseRepository` (descarga + parsea el CSV), `HtmlAudioPlayer` (HTMLAudioElement), `LocalStorageProgress`, `LocalStorageSettings`.
- **ui/**: componentes Angular que consumen los casos de uso por **inyección de dependencias**; sin lógica de negocio dentro.

**Invariantes** (documéntalas y respétalas):
- `domain` y `application` no importan Angular ni nada de `infrastructure`/`ui`.
- La única frontera entre lógica e infraestructura son los **puertos**. Cambiar la fuente de datos o el reproductor = nuevo adaptador, sin tocar dominio.
- La UI no contiene reglas de negocio.

Propón y crea una estructura de carpetas coherente con lo anterior y un mapa de wiring de DI (tokens de inyección por puerto).

## AI Harness (dejarlo listo para iterar con IA)

Esto es tan importante como la app. Genera:

1. **`AGENTS.md`** y **`CLAUDE.md`** en la raíz, con:
   - Visión del producto y resumen de arquitectura.
   - Mapa de carpetas y responsabilidad de cada capa.
   - Convenciones de código y de commits.
   - Comandos: instalar, dev, build, test, lint, e2e.
   - **Invariantes que no se deben romper** (las de arriba).
   - **Recetas** paso a paso: "cómo añadir un nuevo modo de práctica", "cómo cambiar la fuente de audio", "cómo añadir un idioma de traducción".
2. **`docs/adr/`**: un ADR (Architecture Decision Record) por decisión clave (Angular+signals, hexagonal, CSV vía CDN, PWA offline).
3. **Tests** que sirvan de red de seguridad para futuros cambios: alta cobertura de `domain` y `application`; e2e del flujo "cargar → reproducir → avanzar → retomar".
4. **Contratos explícitos** (los puertos) y dobles de test (fakes/mocks) reutilizables.
5. **README** con setup en < 5 minutos.

## Criterios de aceptación

- [ ] `npm run build` y `npm test` pasan sin errores ni warnings de TS.
- [ ] La app carga las 615 frases desde el `index.csv` del repo vía CDN.
- [ ] Reproduce el audio correcto por frase, autoplay, swipe, repetir, velocidad y pausa de shadowing funcionan.
- [ ] Oculta el español cuando `es` está vacío.
- [ ] Instalable como PWA y funcional offline tras la primera carga.
- [ ] `domain`/`application` no tienen ningún import de Angular.
- [ ] `AGENTS.md`, `CLAUDE.md`, ADRs y README presentes y correctos.

## Forma de trabajo

1. Primero propón estructura de carpetas y los puertos (interfaces) y espera nada — impleméntalo.
2. Construye dominio → casos de uso → adaptadores → UI, con tests por capa.
3. Termina con PWA, documentación y AI harness.
4. Trabaja en commits pequeños con mensajes convencionales.
