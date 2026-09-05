#!/bin/bash
# Uso: ./update.sh ["mensaje de commit"]
#
# Hace TODO de una vez: regenera los CSV, sintetiza los audios que falten, los
# pasa a MP3, sube datos y codigo al repo (jsDelivr los sirve), purga la cache
# del CDN y despliega la app en Cloudflare Pages.
#
# Los mazos (Excel -> CSV -> carpeta de audios) se definen en tts/phrases.py y
# tienen que coincidir con `decks` en pwa/src/environments/*.ts.
cd "$(dirname "$0")"
MSG="${1:-update $(date +%F)}"

echo "-> Regenerando indices..."
python3 tts/regen_index.py || exit 1

echo "-> Generando audios que falten..."
python3 tts/gen_tts.py

echo "-> Convirtiendo a mp3..."
find audios -name '*.wav' -print0 | while IFS= read -r -d '' f; do
  ffmpeg -y -loglevel error -i "$f" -b:a 96k "${f%.wav}.mp3" && rm -f "$f"
done

python3 tts/status.py

echo "-> Subiendo al repo..."
git add -A
git commit -m "$MSG" && git push

# El CDN cachea la rama @main unas horas; purgar los indices para que la app vea
# las frases nuevas ya. Los audios no hace falta: al versionar la carpeta, su URL
# es nueva y nadie la tiene cacheada.
echo "-> Purgando indices en jsDelivr..."
for csv in $(cd tts && python3 -c "from phrases import DECKS, ROOT; print(' '.join(str(d.index.relative_to(ROOT)) for d in DECKS))"); do
  curl -s "https://purge.jsdelivr.net/gh/joel-cespedes/voices@main/$csv" > /dev/null
done

# La app no lleva los audios dentro (los pide al CDN), asi que solo hace falta
# redesplegarla cuando cambia su codigo; hacerlo siempre es barato y no falla.
echo "-> Desplegando la app en Cloudflare Pages..."
(cd pwa && npm run build && npx wrangler pages deploy dist/shadow/browser --project-name shadow --commit-dirty=true) || exit 1

echo "Hecho."
