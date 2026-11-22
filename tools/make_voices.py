"""Synthesizes original 'villager-style' babble voices (formant synthesis) for JJ and Mikey.
JJ = brighter/higher, Mikey = lower/softer. Not recordings of anyone."""
import numpy as np, wave, subprocess, os, sys, random

SR = 22050
VOWELS = {"a": (800, 1200), "e": (500, 1800), "i": (300, 2300), "o": (500, 900), "u": (350, 700), "ae": (650, 1650)}

def resonator(x, f, bw):
    r = np.exp(-np.pi * bw / SR); th = 2 * np.pi * f / SR
    a1, a2 = -2 * r * np.cos(th), r * r
    y = np.zeros_like(x)
    for n in range(len(x)):
        y[n] = x[n] - a1 * (y[n-1] if n > 0 else 0) - a2 * (y[n-2] if n > 1 else 0)
    return y * (1 - r)

def syllable(f0, vowel, dur, rise, rnd, formant_shift):
    n = int(SR * dur); t = np.arange(n) / SR
    f = f0 * (1 + rise * np.linspace(-0.5, 0.5, n)) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    phase = np.cumsum(2 * np.pi * f / SR)
    src = (np.sin(phase) + 0.5 * np.sin(2 * phase) + 0.3 * np.sin(3 * phase)) + 0.04 * rnd.standard_normal(n)
    f1, f2 = VOWELS[vowel]
    y = resonator(src, f1 * formant_shift, 90) + 0.8 * resonator(src, f2 * formant_shift, 130)
    env = np.minimum(1, t / 0.015) * np.minimum(1, (dur - t) / 0.05)
    # tiny consonant burst
    k = int(SR * 0.012); y[:k] += 0.3 * rnd.standard_normal(k) * np.linspace(1, 0, k) * np.abs(y).max()
    return y * env

def clip(seed, f0, shift, path):
    rnd = np.random.default_rng(seed); pr = random.Random(seed)
    parts = []
    nsyl = pr.randint(3, 7)
    for i in range(nsyl):
        v = pr.choice(list(VOWELS)); d = pr.uniform(0.09, 0.2)
        rise = 0.35 if (i == nsyl - 1 and pr.random() < .4) else pr.uniform(-0.15, 0.15)
        parts.append(syllable(f0 * pr.uniform(0.9, 1.15), v, d, rise, rnd, shift))
        parts.append(np.zeros(int(SR * pr.uniform(0.01, 0.05))))
    y = np.concatenate(parts); y = y / (np.abs(y).max() + 1e-9) * 0.85
    wav = path + ".wav"
    with wave.open(wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "libvorbis", "-q:a", "4", path + ".ogg"], check=True)
    os.remove(wav)

if __name__ == "__main__":
    out = sys.argv[1]
    for name, f0, shift in (("jj", 235, 1.12), ("mikey", 165, 0.95)):
        for i in range(1, 7):
            clip(hash((name, i)) % 10_000 if False else i * 97 + len(name), f0, shift, f"{out}/{name}/talk{i}")
