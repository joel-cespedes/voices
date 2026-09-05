# tts — generación de audios

Todo lo necesario para convertir frases en audio. La app (`pwa/`) no vive aquí:
esta carpeta solo **produce** los ficheros que la app consume desde el CDN.

## Mazos (las "listas" de la app)

Cada lista de la app es un **mazo**: un Excel de origen, un CSV que lee la PWA y
una carpeta de audios. Se definen en `phrases.py` (`DECKS`) y tienen que coincidir
con `decks` en `pwa/src/environments/*.ts` (mismo `id`, mismo CSV, misma carpeta):

| id        | Excel (aquí)   | CSV (raíz)    | Audios (raíz)        |
| --------- | -------------- | ------------- | -------------------- |
| `home`    | `voices.xlsx`  | `index.csv`   | `audios/v2/`         |
| `commons` | `commons.xlsx` | `commons.csv` | `audios/commons/v1/` |

Para añadir una lista: nuevo Excel aquí, una línea más en `DECKS` y otra en los
`environments` de la app. Nada más cambia.

## El formato de cada Excel

**Sin fila de cabecera** — la primera fila ya es una frase. (Si trae una cabecera
tipo `English / Español`, se salta sola.)

| Columna | Contenido | Regla |
| ------- | --------- | ----- |
| **A** | frase en inglés | **Obligatoria.** Es lo que se sintetiza. Fila sin A = fila descartada. |
| **B** | traducción al español | Opcional. Si está vacía, la app no muestra traducción en esa frase. |

> El número del audio (`0001.mp3`) sale de la **posición** de la fila, no de
> ninguna columna. Añade frases nuevas **al final**: si las insertas en medio,
> las de abajo se corren un número y el audio deja de coincidir con el texto.

> No partas el inglés y el español en dos ficheros distintos. El nombre del audio
> (`0001.mp3`) sale de la **posición** de la fila, igual que el CSV que lee la
> app. Dos fuentes = en cuanto añadas o borres una línea en una de ellas, el
> audio deja de corresponder con el texto.

## Uso

```bash
./update.sh          # desde la raíz del repo: hace todo, para todos los mazos
```

Regenera los CSV, sintetiza los audios que falten, los pasa a MP3, sube al repo
y purga la caché del CDN. Es **reanudable**: si la API corta por cuota diaria, vuelve
a lanzarlo mañana y sigue donde lo dejó.

Los scripts sueltos, si quieres ir paso a paso:

```bash
python3 tts/regen_index.py   # Excel de cada mazo -> su CSV (raíz)
python3 tts/gen_tts.py       # Excel de cada mazo -> sus audios .wav (raíz)
python3 tts/status.py        # cuántos audios hay listos por mazo
```

## Config

- `key.txt` (en esta carpeta, **gitignored**): la API key de
  [Google AI Studio](https://aistudio.google.com).
- En `gen_tts.py`: `MODEL` (Gemini TTS), `VOICE` (`Callirrhoe`), `TEMP`, `PAUSE`
  (segundos entre llamadas) y el `PROMPT_TMPL` que fija el tono de la locución.

## Dónde acaba cada cosa

Las salidas **no** viven aquí, viven en la raíz porque las sirve el CDN:

- `index.csv`, `commons.csv` — índices que lee la PWA (uno por mazo).
- `audios/v2/`, `audios/commons/v1/` — los MP3 (una carpeta por mazo).

Las carpetas de audios están **versionadas**. Si algún día regeneras un mazo
entero, sube su versión (`v2` → `v3`) en `phrases.py` (`DECKS`) **y** en
`pwa/src/environments/*.ts` (`audioPath` de ese mazo). Si reutilizas los mismos
nombres de fichero, el service worker y el CDN seguirán sirviendo el audio
antiguo durante meses.
