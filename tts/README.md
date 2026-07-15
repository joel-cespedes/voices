# tts — generación de audios

Todo lo necesario para convertir frases en audio. La app (`pwa/`) no vive aquí:
esta carpeta solo **produce** los ficheros que la app consume desde el CDN.

## La única fuente: `voices.xlsx`

**Sin fila de cabecera** — la primera fila ya es una frase.

| Columna | Contenido | Regla |
| ------- | --------- | ----- |
| **A** | frase en inglés | **Obligatoria.** Es lo que se sintetiza. Fila sin A = fila descartada. |
| **B** | traducción al español | Opcional. Si está vacía, la app no muestra traducción en esa frase. |

> El número del audio (`0001.mp3`) sale de la **posición** de la fila, no de
> ninguna columna. Añade frases nuevas **al final**: si las insertas en medio,
> las de abajo se corren un número y el audio deja de coincidir con el texto.

> No partas el inglés y el español en dos ficheros distintos. El nombre del audio
> (`0001.mp3`) sale de la **posición** de la fila, igual que el `index.csv` que lee
> la app. Dos fuentes = en cuanto añadas o borres una línea en una de ellas, el
> audio deja de corresponder con el texto.

## Uso

```bash
./update.sh          # desde la raíz del repo: hace todo
```

Regenera `index.csv`, sintetiza los audios que falten, los pasa a MP3, sube al repo
y purga la caché del CDN. Es **reanudable**: si la API corta por cuota diaria, vuelve
a lanzarlo mañana y sigue donde lo dejó.

Los scripts sueltos, si quieres ir paso a paso:

```bash
python3 tts/regen_index.py   # voices.xlsx -> index.csv (raíz)
python3 tts/gen_tts.py       # voices.xlsx -> audios/v2/*.wav (raíz)
```

## Config

- `key.txt` (en esta carpeta, **gitignored**): la API key de
  [Google AI Studio](https://aistudio.google.com).
- En `gen_tts.py`: `MODEL` (Gemini TTS), `VOICE` (`Callirrhoe`), `TEMP`, `PAUSE`
  (segundos entre llamadas) y el `PROMPT_TMPL` que fija el tono de la locución.

## Dónde acaba cada cosa

Las salidas **no** viven aquí, viven en la raíz porque las sirve el CDN:

- `index.csv` — índice que lee la PWA.
- `audios/v2/` — los MP3.

La carpeta de audios está **versionada** (`v2`). Si algún día regeneras el mazo
entero, sube la versión (`v3`) en `gen_tts.py` (`OUTDIR`) **y** en
`pwa/src/environments/*.ts` (`audioPath`). Si reutilizas los mismos nombres de
fichero, el service worker y el CDN seguirán sirviendo el audio antiguo durante
meses.
