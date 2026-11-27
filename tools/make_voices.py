"""Generates one voice clip per dialogue line using the eSpeak NG speech synthesizer (real synthesized speech).
Not recordings of anyone. Needs:  pip install --target <dir> espeakng-loader   and   ffmpeg.
Usage: python3 tools/make_voices.py <RP/sounds dir> [path to the pip --target dir]"""
import ctypes, os, sys, subprocess, wave, re
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, CATS

if len(sys.argv) > 2: sys.path.insert(0, sys.argv[2])
import espeakng_loader

lib = ctypes.CDLL(espeakng_loader.get_library_path())
data_dir = espeakng_loader.get_data_path()
SR = lib.espeak_Initialize(2, 0, os.path.dirname(data_dir).encode(), 0)   # AUDIO_OUTPUT_SYNCHRONOUS
if SR <= 0:
    SR = lib.espeak_Initialize(2, 0, data_dir.encode(), 0)
assert SR > 0, "espeak init failed"

chunks = []
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
def _cb(wav, n, ev):
    if wav and n > 0: chunks.append(np.ctypeslib.as_array(wav, shape=(n,)).copy())
    return 0
_cb_ref = CB(_cb)
lib.espeak_SetSynthCallback(_cb_ref)

# parameters: 1 rate(wpm), 2 volume, 3 pitch(0-100), 4 range(0-100)
VOICES = {  # name: (espeak voice, wpm, pitch, range)
    "jj":    ("en-us+m3", 185, 66, 70),
    "mikey": ("en-us+m1", 170, 48, 55),
}

def synth(text, voice, wpm, pitch, rng):
    lib.espeak_SetVoiceByName(voice.encode())
    lib.espeak_SetParameter(1, wpm, 0); lib.espeak_SetParameter(3, pitch, 0); lib.espeak_SetParameter(4, rng, 0)
    chunks.clear()
    b = text.encode("utf-8") + b"\0"
    lib.espeak_Synth(b, len(b), 0, 0, 0, 1, None, None)   # flags=espeakCHARS_UTF8
    lib.espeak_Synchronize()
    return np.concatenate(chunks).astype(np.float32) / 32768.0 if chunks else np.zeros(1, np.float32)

def clean(t):  # make the text read naturally
    t = t.replace("JJ", "J J").replace("...", ", ").replace("ssside", "side")
    return re.sub(r"\s+", " ", t)

def save(y, path):
    y = np.concatenate([np.zeros(int(SR * 0.03)), y, np.zeros(int(SR * 0.08))])
    y = y / (np.abs(y).max() + 1e-9) * 0.8
    wav = path + ".wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    # gentle EQ so it sounds less harsh: trim highs, add a little warmth, even out volume
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af",
                    "highpass=f=90,lowpass=f=7500,equalizer=f=250:t=q:w=1:g=2,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-18:TP=-2",
                    "-ar", "22050", "-c:a", "libvorbis", "-q:a", "5", path + ".ogg"], check=True)
    os.remove(wav)

if __name__ == "__main__":
    out = sys.argv[1]
    only = os.environ.get("ONLY")
    for key, c in LINES.items():
        os.makedirs(f"{out}/{key}", exist_ok=True)
        v = VOICES[key]
        for cat in CATS:
            for (lid, text, _) in c[cat]:
                if only and lid != only: continue
                save(synth(clean(text), *v), f"{out}/{key}/{lid}")
    print("voices done, sample rate", SR)
