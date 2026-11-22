"""Generates the original music bed and sound effects for the explainer (no samples, no licences needed).

Usage: python3 tools/gen_audio.py   -> public/audio/*.wav + public/audio/music.mp3

Music: 30 s at 120 BPM (one beat = 15 frames at 30 fps, so every scene cut lands on a beat).
  0-5 s   pad + arp only (hook)
  4-5 s   riser into the intro
  5-28 s  kick, clap, hats and bass join
  28-30 s final chord rings out
"""
import os, subprocess, wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def t_(d): return np.arange(int(d * SR)) / SR

def onepole_lp(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR); y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s = (1 - a) * v + a * s; y[i] = s
    return y

def env_ad(n, attack, decay_tau):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay_tau)

def write_wav(name, x, peak_db=-3.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)
    if x.ndim == 1: x = np.stack([x, x], 1)
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())

# ---------------- instruments ----------------
def pluck(f, dur=0.45):
    t = t_(dur)
    x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 9 * k)) / k for k in (1, 2, 3, 4))
    return x * np.minimum(1, t / 0.003)

def pad_note(f, dur):
    t = t_(dur)
    x = sum(np.sin(2 * np.pi * f * d * t + p) for d, p in ((0.998, 0), (1.0, 1.1), (1.002, 2.3)))
    x += 0.25 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.4)
    return x * env / 3.3

def kick():
    t = t_(0.4); f = 45 + 85 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)

def clap():
    n = rng.standard_normal(int(0.18 * SR)); x = n - onepole_lp(n, 900); x = onepole_lp(x, 5000)
    e = env_ad(len(x), 0.001, 0.05)
    for off in (0.0, 0.011, 0.022): e[int(off * SR):] += 0.6 * env_ad(len(x) - int(off * SR), 0.001, 0.008)
    return x * e

def hat():
    n = rng.standard_normal(int(0.06 * SR)); x = n - onepole_lp(n, 7000)
    return x * env_ad(len(x), 0.0005, 0.012)

def bass(f, dur):
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.1 * np.sin(2 * np.pi * 3 * f * t)
    return x * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.05) * np.exp(-t * 1.2)

def echo(x, delay=0.375, fb=0.32, taps=4):
    y = x.copy(); d = int(delay * SR)
    for k in range(1, taps + 1):
        y[k * d:] += x[:len(x) - k * d] * fb ** k
    return y

# ---------------- music ----------------
DUR, BEAT = 30.0, 0.5
N = int(DUR * SR)
pads, arps, drums, low = (np.zeros(N) for _ in range(4))
def add(buf, x, at, g=1.0):
    i = int(at * SR); j = min(N, i + len(x))
    if i < N: buf[i:j] += g * x[:j - i]

# C maj9, A m7, F maj7, G6 : one chord per bar (2 s)
CHORDS = [([52, 55, 59, 62], 36), ([52, 55, 60, 64], 33), ([53, 57, 60, 64], 29), ([55, 59, 62, 64], 31)]
for bar in range(15):
    t0 = bar * 2.0
    notes, root = CHORDS[bar % 4] if t0 < 28 else CHORDS[0]
    if t0 >= 28:  # final ringing C chord
        for m in [48, 52, 55, 59, 62]: add(pads, pad_note(mtof(m), 2.0), 28.0, 1.1)
        add(low, bass(mtof(36), 2.0), 28.0, 1.0)
        add(arps, pluck(mtof(72), 1.6), 28.0, 0.9)
        break
    for m in notes: add(pads, pad_note(mtof(m), 2.05), t0)
    seq = [notes[0] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 12]
    for k, m in enumerate(seq):
        g = 0.5 if t0 < 5 else 0.75
        add(arps, pluck(mtof(m)), t0 + k * BEAT / 2, g * (1.0 if k % 2 == 0 else 0.7))
    if t0 + 2 > 5:
        for b in range(4):
            tb = t0 + b * BEAT
            if tb < 5: continue
            add(drums, kick(), tb, 1.0 if b in (0, 2) else 0.0)
            if b in (1, 3): add(drums, clap(), tb, 0.32)
            if tb >= 8: add(drums, hat(), tb + BEAT / 2, 0.22)
            add(low, bass(mtof(root + 12), BEAT * 0.9), tb, 0.55 if b in (0, 2) else 0.35)

# riser 4 -> 5 s into the intro
t = t_(1.0); n = rng.standard_normal(len(t))
riser = (n - onepole_lp(n, 2500)) * (t ** 2) * 0.5 + np.sin(2 * np.pi * np.cumsum(300 + 900 * t ** 2) / SR) * t ** 2 * 0.25
add(drums, riser, 4.0)

mix = 0.55 * echo(pads, 0.375, 0.25) + 0.42 * echo(arps) + 0.8 * drums + 0.6 * low
mix *= np.minimum(1, (DUR - np.arange(N) / SR) / 1.2).clip(0, 1)  # tail fade
L = mix.copy(); R = mix.copy(); d = int(0.012 * SR)
R[d:] = 0.85 * mix[d:] + 0.15 * mix[:-d]  # slight width
write_wav('music.wav', np.stack([L, R], 1), -1.0)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(OUT, 'music.wav'), '-b:a', '192k', os.path.join(OUT, 'music.mp3')], check=True)
os.remove(os.path.join(OUT, 'music.wav'))

# ---------------- sound effects ----------------
def pop():
    tt = t_(0.12); f = 380 + 600 * np.exp(-tt * 45)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(len(tt), 0.002, 0.03)
def key():
    n = rng.standard_normal(int(0.03 * SR)); x = n - onepole_lp(n, 2000); x = onepole_lp(x, 6000)
    return x * env_ad(len(x), 0.0005, 0.004)
def tick():
    tt = t_(0.15); f = 1320
    return (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)) * env_ad(len(tt), 0.001, 0.03)
def click():
    a = key() * 1.2; b = key(); x = np.zeros(int(0.08 * SR)); x[:len(a)] += a; x[int(0.03 * SR):int(0.03 * SR) + len(b)] += 0.7 * b
    return x
def whoosh():
    tt = t_(0.5); n = rng.standard_normal(len(tt)); x = n - onepole_lp(n, 600); x = onepole_lp(x, 3500)
    return x * np.sin(np.pi * tt / 0.5) ** 2
def rise():  # matches the 1.6 s score count-up
    tt = t_(1.6); f = 330 + 660 * (tt / 1.6) ** 1.5
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.2 * np.sin(2 * np.pi * 2 * np.cumsum(f) / SR)
    return x * np.minimum(1, tt / 0.1) * (0.3 + 0.7 * tt / 1.6) * np.minimum(1, (1.6 - tt) / 0.05)
def chime():
    tt = t_(1.2); x = np.zeros(len(tt))
    for k, (m, at) in enumerate(((84, 0.0), (91, 0.09))):
        i = int(at * SR); u = tt[:len(tt) - i]
        x[i:] += sum(np.sin(2 * np.pi * mtof(m) * h * u) * np.exp(-u * (3 + 4 * h)) / h for h in (1, 2.76, 5.4))
    return echo(x, 0.25, 0.25, 3)
def shimmer():
    tt = t_(1.0); x = np.zeros(len(tt))
    for k, m in enumerate((79, 84, 88, 91)):
        i = int(k * 0.06 * SR); u = tt[:len(tt) - i]
        x[i:] += np.sin(2 * np.pi * mtof(m) * u) * np.exp(-u * 5)
    return x

for name, fn in [('pop', pop), ('key', key), ('tick', tick), ('click', click), ('whoosh', whoosh),
                 ('rise', rise), ('chime', chime), ('shimmer', shimmer)]:
    write_wav(f'{name}.wav', fn())
print('ok', sorted(os.listdir(OUT)))
