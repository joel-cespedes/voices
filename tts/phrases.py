"""Lectura de los Excel de frases y definicion de los mazos.

UNICA definicion de que es una frase valida y de como se numera. Tanto gen_tts.py
(que nombra los audios 0001.mp3, 0002.mp3...) como regen_index.py (que escribe el
CSV que lee la app) llaman aqui: si cada uno filtrase las filas a su manera,
el audio dejaria de corresponder con el texto.

Formato del Excel, SIN fila de cabecera (si la trae, se salta):
    columna A = frase en ingles  (obligatoria; fila sin ella = fila descartada)
    columna B = traduccion       (opcional; el Excel puede no traer esta columna)

Cada mazo ("lista" en la app) tiene su Excel, su CSV y su carpeta de audios.
La app los conoce por `id`: los mismos ids y rutas estan en
pwa/src/environments/*.ts (decks). Si anades un mazo aqui, anadelo alli.
"""
import sys
from dataclasses import dataclass
from pathlib import Path
import pandas as pd

HERE  = Path(__file__).resolve().parent   # tts/
ROOT  = HERE.parent                       # raiz del repo


@dataclass(frozen=True)
class Deck:
    id: str
    excel: Path       # fuente (en tts/, no la sirve el CDN)
    index: Path       # CSV que lee la PWA (en la raiz: lo sirve el CDN)
    audio_dir: Path   # mp3 publicados. Carpeta VERSIONADA: si regeneras el
                      # mazo entero sube la version (v2 -> v3) aqui y en la app.


DECKS = [
    Deck("home",    HERE / "voices.xlsx",  ROOT / "index.csv",   ROOT / "audios" / "v2"),
    Deck("commons", HERE / "commons.xlsx", ROOT / "commons.csv", ROOT / "audios" / "commons" / "v1"),
]

COL_EN = 0
COL_ES = 1

# Si la primera fila es una cabecera, se salta: si no, acabariamos generando un
# audio que dice "English".
_CABECERAS = {
    "a", "en", "ingles", "inglés", "english", "frase", "frases", "texto",
    "phrase", "sentence", "es", "espanol", "español", "spanish", "traduccion",
    "traducción", "translation",
}


def load(excel: Path):
    """Devuelve [(ingles, espanol), ...] ya filtrado.

    La POSICION en la lista (1-based) es el numero de audio: la 1a frase es
    0001.mp3, la 2a 0002.mp3, etc. `espanol` es "" cuando no hay traduccion.
    """
    if not excel.exists():
        sys.exit(f"Falta {excel}. Crealo con: A=ingles (obligatoria), B=espanol (opcional).")

    df = pd.read_excel(excel, header=None)
    if df.empty or df.shape[1] <= COL_EN:
        sys.exit(f"{excel} esta vacio. Formato sin cabecera: A=ingles (obligatoria), B=espanol (opcional).")

    tiene_es = df.shape[1] > COL_ES

    filas = []
    for n, (_, row) in enumerate(df.iterrows()):
        en = str(row[COL_EN]).strip() if pd.notna(row[COL_EN]) else ""
        if not en:
            continue
        if n == 0 and en.lower() in _CABECERAS:
            continue  # fila de cabecera
        es = str(row[COL_ES]).strip() if tiene_es and pd.notna(row[COL_ES]) else ""
        filas.append((en, es))

    if not filas:
        sys.exit(f"{excel}: no hay ninguna frase en la columna A. Rellenalo antes de generar.")

    return filas
