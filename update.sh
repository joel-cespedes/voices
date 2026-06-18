#!/bin/bash
cd "$(dirname "$0")"
echo "-> Regenerando index.csv..."
python3 regen_index.py || exit 1
echo "-> Generando audios que falten..."
python3 gen_tts.py
echo "-> Convirtiendo a mp3..."
shopt -s nullglob
for f in audios/*.wav; do ffmpeg -y -loglevel error -i "$f" -b:a 96k "${f%.wav}.mp3"; done
find audios -name '*.wav' -delete 2>/dev/null
echo "-> Subiendo al repo..."
git add -A
git commit -m "update $(date +%F)" && git push
echo "Hecho."
