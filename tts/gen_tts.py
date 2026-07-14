import os, sys, time, struct
from google import genai
from google.genai import types

# El lector del Excel es compartido con regen_index.py a proposito: la numeracion
# de los audios (0001.mp3...) tiene que salir del mismo filtro de filas que el
# index.csv, o el audio no correspondera con la frase.
from phrases import HERE, ROOT, load

KEYFILE = HERE / "key.txt"                 # API key (gitignored)
VOICE  = "Callirrhoe"
MODEL  = "gemini-3.1-flash-tts-preview"
TEMP   = 0.6
# Salida PUBLICADA (la sirve el CDN y la consume la PWA), no vive en tts/.
# Carpeta versionada: al cambiar de mazo hay que subir la version (v2 -> v3) y
# reflejarla en pwa/src/environments/*.ts (audioPath). Asi las URLs son nuevas y
# ni el CDN ni el service worker sirven el audio del mazo anterior.
OUTDIR = ROOT / "audios" / "v2"
PAUSE  = 7
PROMPT_TMPL = """Read the following transcript based on the audio profile and director's note.

# Audio Profile
A patient and encouraging language teacher.

# Director's note
Style: Empathetic. Pace: Natural. Accent: American (Gen).

## Scene:
A friendly, bright classroom setting.

## Sample Context:
Clear pronunciation, encouraging tone, patient pacing, English only.

## Transcript:
{frase}"""

if not KEYFILE.exists():
    sys.exit(f"Falta {KEYFILE}: pega ahi tu API key de Google AI Studio (no se sube al repo).")
API_KEY = KEYFILE.read_text().strip()
client = genai.Client(api_key=API_KEY)
os.makedirs(OUTDIR, exist_ok=True)

def parse_mime(m):
    bits, rate = 16, 24000
    for p in m.split(";"):
        p = p.strip()
        if p.lower().startswith("rate="):
            try: rate = int(p.split("=",1)[1])
            except: pass
        elif p.startswith("audio/L"):
            try: bits = int(p.split("L",1)[1])
            except: pass
    return bits, rate

def to_wav(audio, m):
    bits, rate = parse_mime(m); ch=1; bs=bits//8; block=ch*bs; br=rate*block; sz=len(audio)
    h = struct.pack("<4sI4s4sIHHIIHH4sI", b"RIFF",36+sz,b"WAVE",b"fmt ",16,1,ch,rate,br,block,bits,b"data",sz)
    return h+audio

frases = [en for en, _ in load()]   # solo el ingles: es lo unico que se sintetiza

faltan = [i for i,_ in enumerate(frases,1)
          if not (os.path.exists(f"{OUTDIR}/{i:04d}.wav") or os.path.exists(f"{OUTDIR}/{i:04d}.mp3"))]
print(f"{len(frases)} frases en total, faltan {len(faltan)} por generar.")

cfg = types.GenerateContentConfig(temperature=TEMP, response_modalities=["audio"],
    speech_config=types.SpeechConfig(voice_config=types.VoiceConfig(
        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE))))

for i, fr in enumerate(frases, 1):
    out = f"{OUTDIR}/{i:04d}.wav"
    if os.path.exists(out) or os.path.exists(out[:-4]+".mp3"):
        continue
    contents=[types.Content(role="user",parts=[types.Part.from_text(text=PROMPT_TMPL.format(frase=fr))])]
    for intento in range(3):
        try:
            audio, mime = b"", "audio/L16;rate=24000"
            for chunk in client.models.generate_content_stream(model=MODEL, contents=contents, config=cfg):
                cand=(chunk.candidates or [None])[0]
                if not cand or not cand.content or not cand.content.parts: continue
                for p in cand.content.parts:
                    if p.inline_data and p.inline_data.data:
                        audio += p.inline_data.data; mime = p.inline_data.mime_type or mime
            if not audio: raise RuntimeError("sin audio")
            open(out,"wb").write(to_wav(audio,mime))
            print(f"{i:04d}/{len(frases)}  {fr[:45]}")
            time.sleep(PAUSE); break
        except Exception as e:
            msg = str(e)
            if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
                print("\n>> Cupo diario agotado. Vuelve a correr el mismo comando manana; sigue donde quedo.")
                sys.exit(0)
            print(f"  reintento {intento+1} ({e})"); time.sleep(5*(intento+1))
print("Listo: no falta ninguno.")
