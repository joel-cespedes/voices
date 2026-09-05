"""Cuantos audios hay listos por mazo. Lo usa update.sh al final."""
from phrases import DECKS, load

pendientes = 0
for deck in DECKS:
    total = len(load(deck.excel))
    listos = sum(1 for i in range(1, total + 1) if (deck.audio_dir / f"{i:04d}.mp3").exists())
    pendientes += total - listos
    print(f"-> {deck.id}: {listos}/{total} audios listos.")

if pendientes:
    print(f"   Faltan {pendientes} (cuota diaria de la API). Vuelve a correr ./update.sh manana: sigue donde quedo.")
