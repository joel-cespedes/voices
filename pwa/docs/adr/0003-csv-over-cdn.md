# ADR 0003 — Índice CSV y audios servidos por CDN (jsDelivr)

- **Estado**: aceptada
- **Fecha**: 2026-06-17

## Contexto

Los datos ya existen en el repo público `joel-cespedes/voices`: un `index.csv` y
~600 audios. No queremos un backend propio ni empaquetar los audios en la app. El
esquema real del CSV es `numero,archivo,texto` (solo inglés), aunque el diseño
contemplaba `en,es`; además `archivo` apunta a `.wav` mientras el CDN sirve `.mp3`,
y no todos los audios existen aún.

## Decisión

Servir índice y audios vía **jsDelivr sobre GitHub** (no `raw`), con la base del
CDN **configurable por entorno** (`CDN_CONFIG`):

- Índice: `{baseUrl}/index.csv`
- Audio: `{baseUrl}/audios/{archivo}`

El adaptador `JsDelivrCsvPhraseRepository` + `csv-parser` son **tolerantes**:

- Aceptan el esquema `texto` y también `en,es`; `es` ausente/vacío ⇒ `null`.
- Normalizan la extensión de audio al formato configurado (`.wav` → `.mp3`).
- Descartan filas inválidas (sin número, archivo o texto).
- La UI tolera audios faltantes (404): muestra la frase y sigue el flujo.

## Consecuencias

- **+** Sin backend; despliegue estático. jsDelivr aporta caché/CORS.
- **+** Cambiar de rama/ref o de origen = cambiar `environment`.
- **+** Robustez ante datos imperfectos (esquema real, audios incompletos).
- **−** Dependencia de un tercero (jsDelivr) y de la disponibilidad del repo.
- **−** La traducción `es` hoy no viene en los datos; la UI ya la oculta cuando
  falta, listo para cuando se añada.
