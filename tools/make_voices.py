"""Generates one short 'animalese'-style voice clip per dialogue line (soft sine blips, one per syllable).
Original synthesized sounds - not recordings of anyone. Replace the .ogg files with real recordings any time."""
import numpy as np, wave, subprocess, os, sys, re, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, CATS

SR = 22050
VOW = {"a": 0, "e": 2, "i": 5, "o": -3, "u": -5, "y": 3}

def blip(freq_start, freq, dur):
    n = int(SR * dur); t = np.arange(n) / SR
    f = np.where(t < 0.018, freq_start + (freq - freq_start) * t / 0.018, freq)
    ph = np.cumsum(2 * np.pi * f / SR)
    y = np.sin(ph) + 0.30 * np.sin(2 * ph) + 0.10 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.008) * np.exp(-3.2 * t / dur) * np.minimum(1, (dur - t) / 0.012)
    return y * env

def render(text, base, speed, seed):
    rnd = random.Random(seed)
    words = re.findall(r"[A-Za-z']+|[.,!?]", text)
    out, n_total = [], sum(1 for w in words if w[0].isalpha())
    wi = 0
    for w in words:
        if not w[0].isalpha():
            out.append(np.zeros(int(SR * (0.22 if w in ".!?" else 0.12)))); continue
        sylls = re.findall(r"[^aeiouy']*[aeiouy]+(?:[^aeiouy']+(?![aeiouy]))?|[^aeiouy']+", w.lower()) or [w.lower()]
        for s in sylls:
            v = next((c for c in s if c in VOW), "a")
            semi = VOW[v] + (ord(s[0]) % 5) - 2 + rnd.uniform(-0.6, 0.6)
            semi += 2.5 * np.sin(np.pi * wi / max(1, n_total))          # gentle phrase arch
            if text.rstrip().endswith("?") and wi >= n_total - 2: semi += 3
            if text.rstrip().endswith("!"): semi += 1
            if text.rstrip().endswith(".") and wi >= n_total - 1: semi -= 2
            f = base * 2 ** (semi / 12)
            out.append(blip(f * 0.94, f, rnd.uniform(0.075, 0.105) / speed))
            out.append(np.zeros(int(SR * 0.012)))
        out.append(np.zeros(int(SR * 0.05)))
        wi += 1
    y = np.concatenate(out)
    return y / (np.abs(y).max() + 1e-9) * 0.55

def save(y, path):
    wav = path + ".wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "libvorbis", "-q:a", "5", path + ".ogg"], check=True)
    os.remove(wav)

if __name__ == "__main__":
    out = sys.argv[1]
    for key, c in LINES.items():
        os.makedirs(f"{out}/{key}", exist_ok=True)
        for f in os.listdir(f"{out}/{key}"): os.remove(f"{out}/{key}/{f}")
        for cat in CATS:
            for (lid, text, _) in c[cat]:
                save(render(text, c["voice"]["base"], c["voice"]["speed"], hash(lid) % 1000 if False else sum(map(ord, key + lid))),
                     f"{out}/{key}/{lid}")
    print("voices done")
