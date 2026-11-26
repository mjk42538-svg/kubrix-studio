import numpy as np, json, wave
SR = 44100; rng = np.random.default_rng(7)
T = json.load(open('work/timing_v2.json')); W = T['words']; DUR = T['duration'] + 0.5
w = lambda i: W[min(i, len(W) - 1)]['s']
N = int(DUR * SR); mus = np.zeros(N); sfx = np.zeros(N)
def add(buf, t, sig, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(buf) - i); buf[i:i + n] += sig[:n] * g
def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4))
def lp(x, k):
    if k <= 1: return x
    c = np.cumsum(np.concatenate([np.zeros(k), x])); return (c[k:] - c[:-k]) / k
def noise(d): return rng.standard_normal(int(d * SR))
def write(p, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(p, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x * 32767).astype(np.int16).tobytes())
F = lambda m: 440 * 2 ** ((m - 69) / 12)
# ---------- instruments ----------
def zheng(m, dur=1.6, bend=True):
    n = int(dur * SR); t = np.arange(n) / SR; f0 = F(m) * (1 + (0.03 * np.exp(-t * 25) if bend else 0))
    ph = 2 * np.pi * np.cumsum(f0) / SR; y = np.zeros(n)
    for h, a in [(1, 1), (2, 0.5), (3, 0.32), (4, 0.18), (5, 0.12), (6, 0.06)]: y += a * np.sin(h * ph) * np.exp(-t * (2.2 + h * 1.3))
    y[:441] += noise(0.01)[:441] * 0.3
    return y * np.minimum(1, t / 0.002)
def flute(m, dur, vib=True):
    n = int(dur * SR); t = np.arange(n) / SR; f = F(m) * (1 + (0.006 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.4) if vib else 0))
    ph = 2 * np.pi * np.cumsum(f) / SR; y = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    y += lp(noise(dur)[:n], 6) * 0.08
    e = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0); return y * e
def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for m in ms:
        for d in (-0.08, 0, 0.07): ph = 2 * np.pi * F(m + d) * t; y += (2 * ((ph / (2 * np.pi)) % 1) - 1) * 0.15
    y = lp(lp(y, 30), 20)[:n]; return y * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6).clip(0)
def taiko(g=1):
    n = int(0.9 * SR); t = np.arange(n) / SR; f = 45 + 90 * np.exp(-t * 18); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 4.5) + lp(noise(0.9), 8)[:n] * np.exp(-t * 30) * 0.6) * g
def rim(): n = int(0.12 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 900 * t) * 0.5 + noise(0.12)[:n] * 0.5) * np.exp(-t * 60)
def gong(dur=4):
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for f, a, d in [(110, 1, 2.5), (163, 0.7, 2), (231, 0.5, 1.6), (297, 0.4, 1.2), (419, 0.3, 0.9), (612, 0.2, 0.6)]: y += a * np.sin(2 * np.pi * f * t * (1 + 0.002 * np.sin(t * 3))) * np.exp(-t / d)
    return y * np.minimum(1, t / 0.01) * 0.6
def bell(m, d=1.2): n = int(d * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * F(m) * t) + 0.4 * np.sin(2 * np.pi * F(m) * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * 3) * np.minimum(1, t / 0.002)
def sub(f=45, d=1.5): n = int(d * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.05) * np.exp(-t * 1.5)
# pentatonic scale (D minor pentatonic) degrees
SC = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]
def arp(t0, t1, bpm=100, pattern=(0, 2, 4, 2, 5, 4, 2, 1), base=0, g=0.5, oct=0):
    step = 60 / bpm / 2; k = 0; t = t0
    while t < t1: m = SC[(pattern[k % len(pattern)] + base) % len(SC)] + oct; add(mus, t, zheng(m, 1.2), g * (0.85 + 0.3 * (k % 4 == 0))); t += step; k += 1
def drums(t0, t1, bpm=100, g=1, fill=True):
    b = 60 / bpm; t = t0; k = 0
    while t < t1:
        if k % 4 in (0, 3) or (k % 8 == 6): add(mus, t, taiko(), 0.55 * g)
        if k % 2 == 1: add(mus, t, rim(), 0.12 * g)
        t += b / 2 * 2; k += 1
def melody(t0, notes, bpm=100, g=0.35):
    t = t0; b = 60 / bpm
    for m, beats in notes:
        if m: add(mus, t, flute(m, beats * b * 0.95), g)
        t += beats * b
# ---------- score ----------
E = w
# hook: gong + taiko build + tremolo
add(mus, 0.0, gong(4), 0.5); add(mus, 0.0, sub(40, 3), 0.5)
for i in range(8): add(mus, i * 0.24, taiko(), 0.18 + 0.05 * i)
arp(0.2, E(16), 140, (5, 4, 5, 4, 3, 4, 5, 6), g=0.35)
add(mus, E(7), gong(3), 0.4); drums(E(7), E(16), 140, 0.8)
# story intro (light)
arp(E(16), E(60), 96, (0, 2, 4, 5, 4, 2), g=0.32, oct=-12)
add(mus, E(16), pad([50, 57, 62], E(60) - E(16)), 0.25)
melody(E(23), [(74, 2), (77, 1), (79, 1), (81, 3), (79, 1), (77, 2), (74, 2), (72, 2), (74, 4)], 96, 0.22)
add(mus, E(36), gong(3), 0.5); add(mus, E(36), sub(42, 2), 0.6)
# heaven: shimmer bells
for k, t in enumerate(np.arange(E(52), E(84), 0.22)): add(mus, t, bell(SC[(k * 3) % 10] + 12, 0.8), 0.08)
add(mus, E(52), pad([62, 69, 74, 81], E(84) - E(52)), 0.22)
# waterfall adventure
arp(E(84), E(129), 112, (0, 1, 2, 4, 2, 1, 0, 3), g=0.35, oct=-12); drums(E(84), E(101), 112, 0.6)
drums(E(104), E(129), 124, 0.9)
add(mus, E(124), gong(4), 0.6); add(mus, E(127), taiko(), 0.9)
melody(E(124), [(81, 1), (84, 1), (86, 2), (84, 1), (81, 1), (79, 2)], 112, 0.3)
# party: bouncy
arp(E(129), E(139), 132, (0, 4, 2, 5, 4, 7, 5, 2), g=0.4); drums(E(129), E(139), 132, 0.8)
# sad
add(mus, E(139), pad([50, 57, 60, 65], E(168) - E(139)), 0.3)
melody(E(141), [(74, 3), (72, 1), (69, 4), (67, 2), (65, 2), (62, 6)], 70, 0.3)
add(mus, E(158), gong(4), 0.35)
# journey march
arp(E(168), E(214), 104, (0, 2, 4, 2, 0, 3, 5, 3), g=0.32, oct=-12); drums(E(168), E(188), 104, 0.55)
add(mus, E(188), pad([62, 67, 74], E(214) - E(188)), 0.22)
melody(E(188), [(74, 2), (79, 2), (81, 2), (79, 1), (77, 1), (74, 4)], 90, 0.22)
# secrets (mysterious)
for k, t in enumerate(np.arange(E(214), E(240), 0.3)): add(mus, t, bell([86, 89, 91, 93][k % 4], 1.0), 0.06)
add(mus, E(214), pad([50, 57, 63], E(240) - E(214)), 0.28)
# show off: playful
arp(E(240), E(256), 120, (0, 2, 1, 3, 2, 4, 3, 5), g=0.4)
# fury
add(mus, E(256), gong(3), 0.6); drums(E(256), E(268), 150, 1.0); add(mus, E(256), pad([38, 45, 50], E(284) - E(256)), 0.35)
add(mus, E(274), sub(36, 4), 0.7)
# laugh + flight
arp(E(284), E(292), 150, (0, 2, 4, 5, 7, 9, 7, 5), g=0.4); drums(E(286), E(292), 150, 0.8)
# cliffhanger: drone + heartbeat, then sting
add(mus, E(292), pad([38, 45, 51], DUR - E(292)), 0.4)
for t in np.arange(E(296), DUR - 0.3, 0.75): add(mus, t, taiko(), 0.35); add(mus, t + 0.22, taiko(), 0.22)
add(mus, E(304), gong(4), 0.8); add(mus, E(304), sub(34, 3), 0.9)
# ---------- SFX ----------
def whoosh(t, d=0.45, g=1):
    n = int(d * SR); x = noise(d)[:n]; k = np.linspace(40, 4, n).astype(int); y = np.array(lp(x, 6))[:n]
    e = np.sin(np.linspace(0, np.pi, n)) ** 2; add(sfx, t - d * 0.6, y * e, 0.35 * g)
def crack(t, g=1):
    for i in range(6): n = int(0.05 * SR); add(sfx, t + i * 0.03 + rng.random() * 0.02, noise(0.05)[:n] * np.exp(-np.arange(n) / SR * 80), 0.25 * g)
    add(sfx, t, sub(60, 0.8), 0.6 * g)
def rumble(t, d=1.5, g=1): add(sfx, t, lp(noise(d), 120)[:int(d * SR)] * np.sin(np.linspace(0, np.pi, int(d * SR))) * 8, 0.5 * g)
def splash(t, g=1):
    n = int(0.9 * SR); add(sfx, t, lp(noise(0.9), 4)[:n] * np.exp(-np.arange(n) / SR * 4), 0.45 * g)
    for i in range(8): add(sfx, t + 0.1 + rng.random() * 0.5, np.sin(2 * np.pi * (600 + 600 * rng.random()) * np.arange(int(0.05 * SR)) / SR) * np.exp(-np.arange(int(0.05 * SR)) / SR * 60), 0.12 * g)
def poof(t, g=1):
    n = int(0.45 * SR); tt = np.arange(n) / SR; add(sfx, t, lp(noise(0.45), 3)[:n] * np.exp(-tt * 9), 0.5 * g); add(sfx, t, np.sin(2 * np.pi * np.cumsum(300 + 900 * tt) / SR) * np.exp(-tt * 10), 0.15 * g)
def sparkle(t, g=1):
    for i, m in enumerate([96, 100, 103, 108, 105]): add(sfx, t + i * 0.05, bell(m, 0.6), 0.07 * g)
def boom(t, g=1):  # vine-boom-ish
    n = int(1.2 * SR); tt = np.arange(n) / SR; y = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 1.2) + 30) / SR)) * np.exp(-tt * 2.5)
    add(sfx, t, y, 0.55 * g)
def thud(t, g=1): add(sfx, t, taiko(), 0.6 * g)
def knock(t, g=1): n = int(0.08 * SR); tt = np.arange(n) / SR; add(sfx, t, (np.sin(2 * np.pi * 220 * tt) + noise(0.08)[:n] * 0.4) * np.exp(-tt * 50), 0.35 * g)
def clink(t, g=1): add(sfx, t, bell(103, 0.5), 0.2 * g); add(sfx, t + 0.05, bell(98, 0.4), 0.12 * g)
def beam(t, d=1.6, g=1):
    n = int(d * SR); tt = np.arange(n) / SR; f = 200 + 600 * tt / d; y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    add(sfx, t, y * np.minimum(1, tt / 0.1) * np.exp(-np.maximum(0, tt - d * 0.7) * 6) , 0.12 * g)
def wind(t, d, g=1): n = int(d * SR); add(sfx, t, lp(noise(d), 40)[:n] * (0.6 + 0.4 * np.sin(np.arange(n) / SR * 1.3)) * np.sin(np.linspace(0, np.pi, n)) * 4, 0.25 * g)
def waterfall(t, d, g=1): n = int(d * SR); add(sfx, t, lp(noise(d), 3)[:n] * np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.2 * SR)), 0.12 * g)
def boing(t, g=1): n = int(0.5 * SR); tt = np.arange(n) / SR; add(sfx, t, np.sin(2 * np.pi * np.cumsum(200 + 500 * tt + 40 * np.sin(tt * 60)) / SR) * np.exp(-tt * 5), 0.25 * g)
def cheer(t, d=1.5, g=1):
    for i in range(20): add(sfx, t + rng.random() * d * 0.6, np.sin(2 * np.pi * np.cumsum(np.full(int(0.25 * SR), 500 + rng.random() * 500) * (1 + 0.3 * np.linspace(0, 1, int(0.25 * SR)))) / SR) * env(int(0.25 * SR), 0.02, 0.1), 0.05 * g)
# hits
crack(0.05, 0.6); rumble(0.0, 2.2, 0.8); sparkle(0.6)
for i in range(3): knock(E(6) + i * 0.17, 1)
whoosh(E(7), 0.4); boom(E(13), 0.7); cheer(E(7), 1.2, 0.8)
whoosh(E(16), 0.6, 1.3)
whoosh(E(23), 0.8, 0.6)
crack(E(34), 0.4); crack(E(36), 1.2); boom(E(36), 0.6); sparkle(E(36), 1.5)
boing(E(39), 1)
for i in range(3): knock(E(45) + i * 0.22, 1)
beam(E(52), E(60) - E(52) + 0.4, 1); whoosh(E(60), 0.5); sparkle(E(62))
clink(E(69)); add(sfx, E(69) + 0.05, lp(noise(0.3), 5)[:int(0.3 * SR)] * env(int(0.3 * SR), 0.005, 0.1), 0.3); boom(E(69), 0.7)
poof(E(82) + 0.2); sparkle(E(82) + 0.2); boom(E(83), 0.6)
waterfall(E(84), E(107) - E(84)); waterfall(E(107), E(124) - E(107), 0.5)
whoosh(E(105) + 0.2, 0.5, 1.2); splash(E(106) + 0.45, 1.2); splash(E(107), 0.8)
for i in range(3): knock([E(114), E(116), E(118)][i], 0.8)
thud(E(124), 0.5); cheer(E(124), 2.0, 1.2); boom(E(127), 0.6)
cheer(E(129), 3, 0.7); add(sfx, E(137) + 0.15, lp(noise(0.2), 10)[:int(0.2 * SR)], 0.2); splash(E(137) + 0.8, 0.5)
wind(E(149), E(168) - E(149), 0.8)
add(sfx, E(158), bell(50, 2.5), 0.25)
boom(E(166), 0.5)
wind(E(168), E(188) - E(168), 0.5)
wind(E(188), E(214) - E(188), 0.35)
for i in range(4): poof(E(222) + (E(224) - E(222)) * (i + 1) / 4 - 0.02, 0.9)
boing(E(225)); whoosh(E(225) + 0.3, 0.6, 1.3); whoosh(E(229), 1.0, 1.0); sparkle(E(235))
poof(E(248), 1.2); sparkle(E(248)); cheer(E(250), 1.5, 0.9)
boom(E(258), 0.9); poof(E(259), 0.8); thud(E(259) + 0.3, 0.6)
rumble(E(276), 3.0, 1.2); boom(E(281) + 0.2, 1.0)
whoosh(E(286) + 0.1, 0.8, 1.3); whoosh(E(289), 0.6, 1.0)
thud(E(292) + 0.4, 0.9); wind(E(292), DUR - E(292), 1.0)
boom(E(304), 1.0)
write('audio/music.wav', mus); write('audio/sfx.wav', sfx); print('ok', DUR)
