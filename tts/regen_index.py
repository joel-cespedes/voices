"""Excel de cada mazo -> su CSV (en la raiz: es lo que la PWA lee via CDN)."""
import csv

from phrases import DECKS, load

for deck in DECKS:
    filas = load(deck.excel)   # [(ingles, espanol), ...]; la posicion es el numero de audio
    with open(deck.index, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["numero", "archivo", "en", "es"])
        for i, (en, es) in enumerate(filas, 1):
            w.writerow([i, f"{i:04d}.mp3", en, es])
    print(f"{deck.index.name}: {len(filas)} frases ({deck.id})")
