"""Generates one voice clip per dialogue line with Piper (neural text-to-speech). Not recordings of anyone.
JJ = en_US-ryan-high, Mikey = en_US-joe-medium (both are open Piper voices from rhasspy/piper-voices).
Setup:  pip install --target <libdir> piper-tts     and download the .onnx + .onnx.json voice files into <voicedir>.
Usage:  python3 -I tools/make_voices.py <RP/sounds dir> <libdir> <voicedir>"""
import os, sys, re, wave, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, CATS
out, lib, vdir = sys.argv[1], sys.argv[2], sys.argv[3]
sys.path.insert(0, lib)
from piper import PiperVoice, SynthesisConfig

VOICES = {  # model, length_scale (<1 = faster), noise_scale, noise_w_scale
    "jj":    ("en_US-ryan-high", 0.95, 0.70, 0.85),
    "mikey": ("en_US-joe-medium", 0.88, 0.70, 0.85),
}

def clean(t):  # make the text read naturally
    t = t.replace("JJ", "J J").replace("...", ", ").replace("ssside", "side")
    return re.sub(r"\s+", " ", t)

def save(wavpath, oggpath):
    # gentle clean-up: roll off rumble/hiss, even out the volume
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wavpath, "-af",
                    "highpass=f=70,lowpass=f=9000,acompressor=threshold=-20dB:ratio=2.5,loudnorm=I=-18:TP=-2",
                    "-ar", "22050", "-c:a", "libvorbis", "-q:a", "5", oggpath], check=True)
    os.remove(wavpath)

if __name__ == "__main__":
    only = os.environ.get("ONLY")
    for key, c in LINES.items():
        if os.environ.get("ONLYCHAR") and key != os.environ["ONLYCHAR"]: continue
        name, ls, ns, nw = VOICES[key]
        voice = PiperVoice.load(f"{vdir}/{name}.onnx")
        cfg = SynthesisConfig(length_scale=ls, noise_scale=ns, noise_w_scale=nw)
        os.makedirs(f"{out}/{key}", exist_ok=True)
        n = 0
        for cat in CATS:
            for (lid, text, _) in c[cat]:
                if only and lid != only: continue
                if os.environ.get("ONLYPREFIX") and not lid.startswith(os.environ["ONLYPREFIX"]): continue
                p = f"{out}/{key}/{lid}"
                with wave.open(p + ".wav", "wb") as w:
                    voice.synthesize_wav(clean(text), w, syn_config=cfg)
                save(p + ".wav", p + ".ogg"); n += 1
        print(key, name, n, "clips", flush=True)
    print("voices done")
