# Shadow

PWA móvil-first para practicar **shadowing** de inglés: una frase por pantalla en
formato *stories*, con audio pregenerado que se reproduce solo, pensada para
repetir en voz alta.

> Angular 21 (standalone + signals) · arquitectura hexagonal · TypeScript strict ·
> instalable y offline.

## Setup en < 5 minutos

Requisitos: **Node ≥ 20.19 / 22.12** (probado con 22.18) y npm.

```bash
cd pwa
npm install
npm start            # dev server en http://localhost:4200
```

La app descarga el índice de frases y los audios desde un CDN (jsDelivr sobre
GitHub). No necesitas servir los audios localmente.

## Comandos

| Comando            | Qué hace                                              |
| ------------------ | ----------------------------------------------------- |
| `npm start`        | Servidor de desarrollo (`http://localhost:4200`)      |
| `npm run build`    | Build de producción (genera el service worker)        |
| `npm test`         | Tests unitarios (Vitest) — dominio, casos de uso, infra |
| `npm run lint`     | ESLint (angular-eslint)                               |
| `npm run e2e`      | Tests e2e (Playwright) del flujo principal            |
| `npm run format`   | Prettier                                              |
| `npm run icons`    | Regenera los iconos PWA                               |

> Para e2e la primera vez: `npx playwright install chromium`.

## Cómo se usa

- **Listas** (☰, arriba a la izquierda): Home y Commons. Misma pantalla, otras
  frases; cada lista recuerda por dónde ibas.
- **Swipe** izquierda/derecha o **tap** en los laterales para avanzar/retroceder.
- Botones inferiores: anterior, repetir audio, play/pausa, traducción, siguiente.
- **Teclado**: `←`/`→` navegan, `Espacio` play/pausa, `R` repite, `Esc` cierra ajustes.
- **Ajustes** (⚙): velocidad (0.5–1.25×), repeticiones (1–3), pausa de shadowing
  (corta / media / = a la frase), auto-avance, mostrar traducción e idioma.
- La posición y los ajustes se **guardan**; al reabrir, retoma donde estabas.

## Datos

Los índices (`index.csv` para Home, `commons.csv` para Commons) y los audios viven en el repo
[`joel-cespedes/voices`](https://github.com/joel-cespedes/voices) y se sirven por
CDN. La base del CDN es **configurable por entorno** en
`src/environments/environment.ts` (token de DI `CDN_CONFIG`), nunca hardcodeada en
componentes. El parser tolera el esquema real (`numero,archivo,texto`) y uno con
`en,es`; oculta el español cuando falta y normaliza la extensión de audio (p.ej.
`.wav` → `.mp3`).

## Arquitectura

Hexagonal (puertos y adaptadores). Ver [`AGENTS.md`](./AGENTS.md) para el mapa de
capas, invariantes y recetas, y [`docs/adr/`](./docs/adr) para las decisiones.

```
domain/         entidades + reglas puras (cero Angular)
application/    casos de uso + puertos (interfaces)
infrastructure/ adaptadores (CSV/CDN, HTMLAudio, localStorage)
ui/             componentes Angular (signals), sin lógica de negocio
```
