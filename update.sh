#!/bin/bash
cd "$(dirname "$0")"

# Debe coincidir con OUTDIR en gen_tts.py y con audioPath en pwa/src/environments/*.ts
AUDIO_DIR="audios/v2"

echo "-> Regenerando index.csv..."
python3 tts/regen_index.py || exit 1

echo "-> Generando audios que falten..."
python3 tts/gen_tts.py

echo "-> Convirtiendo a mp3..."
shopt -s nullglob
for f in "$AUDIO_DIR"/*.wav; do ffmpeg -y -loglevel error -i "$f" -b:a 96k "${f%.wav}.mp3"; done
find "$AUDIO_DIR" -name '*.wav' -delete 2>/dev/null

frases=$(( $(wc -l < index.csv) - 1 ))
audios=$(find "$AUDIO_DIR" -name '*.mp3' | wc -l | tr -d ' ')
echo "-> $audios/$frases audios listos."
if [ "$audios" -lt "$frases" ]; then
  echo "   Faltan $((frases - audios)) (cuota diaria de la API). Vuelve a correr ./update.sh manana: sigue donde quedo."
fi

echo "-> Subiendo al repo..."
git add -A
git commit -m "update $(date +%F)" && git push

# El CDN cachea la rama @main unas horas; purgar el indice para que la app vea
# las frases nuevas ya. Los audios no hace falta: al versionar la carpeta, su URL
# es nueva y nadie la tiene cacheada.
echo "-> Purgando index.csv en jsDelivr..."
curl -s "https://purge.jsdelivr.net/gh/joel-cespedes/voices@main/index.csv" > /dev/null

echo "Hecho."
