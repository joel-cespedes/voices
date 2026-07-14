"""voices.xlsx -> index.csv (en la raiz: es lo que la PWA lee via CDN)."""
import csv

from phrases import ROOT, load

OUTCSV = ROOT / "index.csv"

filas = load()   # [(ingles, espanol), ...]; la posicion es el numero de audio

with open(OUTCSV, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["numero", "archivo", "en", "es"])
    for i, (en, es) in enumerate(filas, 1):
        w.writerow([i, f"{i:04d}.mp3", en, es])

print(f"index.csv: {len(filas)} frases")
