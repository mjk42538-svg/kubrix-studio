import numpy as np, wave, json
SR = 44100
T = json.load(open('work/timing_v2.json'))
DUR = T['duration'] + 0.3
N = int(DUR * SR)
W = {w['i']: w['s'] for w in T['words']}
rng = np.random.default_rng(7)

def write(path, x):
    x = np.clip(x, -1, 1)
    st = np.stack([x, x], 1) if x.ndim == 1 else x
    with wave.open(path, 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((st * 32767).astype(np.int16).tobytes())

def add(buf, t, sig, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), len(buf) - i); buf[i:i + n] += sig[:n] * g

def env(n, a=0.005, d=0.3, curve=1.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d * curve)

def tone(f, dur, kind='sine', a=0.005, d=0.4):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'sine': s = np.sin(2 * np.pi * f * t)
    elif kind == 'bell': s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    elif kind == 'pluck': s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) * np.exp(-t * 10) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 18)
    elif kind == 'pad': s = sum(np.sin(2 * np.pi * f * (1 + dt) * t + p) for dt, p in [(0, 0), (0.004, 1), (-0.005, 2)]) / 3 + 0.25 * np.sin(4 * np.pi * f * t)
    elif kind == 'brass': s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in range(1, 7))
    return s * env(n, a, d)

def noise(dur): return rng.standard_normal(int(dur * SR))
def lp(x, a):  # one-pole lowpass, a in 0..1 (smaller = darker)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def lp_fast(x, k):
    # moving-average lowpass (vectorised)
    c = np.cumsum(np.concatenate([[0], x])); return (c[k:] - c[:-k]) / k
def hp(x, k): return x - np.concatenate([lp_fast(x, k), np.zeros(k - 1)])[:len(x)]

NOTE = lambda m: 440 * 2 ** ((m - 69) / 12)



# ---------------- music (loopable) ----------------
mus = np.zeros(N); sfx = np.zeros(N)
w = lambda i: W[min(i, max(W))]
def thud(t, g=1, f0=80):
    n = int(0.14 * SR); tt = np.arange(n) / SR; f = f0 + 90 * np.exp(-tt * 40)
    add(sfx, t, (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 26) + lp_fast(np.concatenate([noise(0.14), np.zeros(10)]), 6)[:n] * np.exp(-tt * 45)), 0.35 * g)
def whoosh(t, dur=0.4, g=1):
    n = int(dur * SR); x = noise(dur); tt = np.arange(n) / SR
    add(sfx, t, (hp(x, 3) * 0.3 + lp_fast(np.concatenate([x, np.zeros(40)]), 6)[:n]) * np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5, 0.3 * g)
def pop(t, g=1, f=600):
    n = int(0.12 * SR); tt = np.arange(n) / SR; fr = f * (1 + 2 * np.exp(-tt * 40)); add(sfx, t, np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 30), 0.4 * g)
def beep(t, g=1):
    for k in range(3): add(sfx, t + k * 0.18, np.sign(np.sin(2 * np.pi * 1760 * np.arange(int(0.09 * SR)) / SR)) * 0.5, 0.12 * g)
def splat(t, g=1): add(sfx, t, lp_fast(np.concatenate([noise(0.35), np.zeros(20)]), 14)[:int(0.35 * SR)] * env(int(0.35 * SR), 0.002, 0.08) * 4, 0.3 * g)
def flap(t, g=1):
    for k in range(6): add(sfx, t + k * 0.09, hp(noise(0.06), 3) * env(int(0.06 * SR), 0.003, 0.02), 0.15 * g)
def bell(t, g=1):
    for m, a in [(45, 1), (57, 0.5), (64, 0.3), (69, 0.2)]: add(sfx, t, tone(NOTE(m), 4, 'bell', 0.003, 1.6), 0.25 * g * a)
def glass(t, g=1):
    for i in range(14): add(sfx, t + rng.random() * 0.35, tone(2200 + rng.random() * 2800, 0.4, 'bell', 0.001, 0.12), 0.06 * g)
    add(sfx, t, hp(noise(0.6), 2) * env(int(0.6 * SR), 0.002, 0.2), 0.25 * g)
def tape(t, dur=2.5, g=1):
    n = int(dur * SR); tt = np.arange(n) / SR; f = 300 + 900 * (tt / dur)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.2 + hp(noise(dur), 3) * 0.3
    add(sfx, t, s * np.minimum(1, tt / 0.1) * np.minimum(1, (dur - tt) / 0.2), 0.18 * g)
def sub(t, g=1):
    n = int(1.8 * SR); tt = np.arange(n) / SR; f = 50 + 20 * np.exp(-tt * 4)
    add(sfx, t, np.tanh(2.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 1.6), 0.6 * g)
def ting(t, g=1): add(sfx, t, tone(NOTE(96), 0.9, 'bell', 0.001, 0.35), 0.18 * g)
# ---------- instruments ----------
def kick(t, g=1):
    n = int(0.3 * SR); tt = np.arange(n) / SR; f = 48 + 100 * np.exp(-tt * 35)
    add(mus, t, np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 9), 0.42 * g)
def taiko(t, g=1):
    n = int(0.6 * SR); tt = np.arange(n) / SR; f = 70 + 60 * np.exp(-tt * 20)
    add(mus, t, (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6) + 0.3 * lp_fast(np.concatenate([noise(0.6), np.zeros(10)]), 8)[:n] * np.exp(-tt * 30)), 0.5 * g)
def wood(t, g=1): add(mus, t, tone(1200, 0.08, 'sine', 0.001, 0.02) + tone(1900, 0.08, 'sine', 0.001, 0.015), 0.12 * g)
def hat(t, g=1): add(mus, t, hp(noise(0.05), 2) * env(int(0.05 * SR), 0.001, 0.015), 0.05 * g)
def zheng(m, t, g=1, d=0.5):  # guzheng-like pluck with slight bend
    n = int(1.2 * SR); tt = np.arange(n) / SR; f = NOTE(m) * (1 + 0.012 * np.exp(-tt * 18))
    ph = 2 * np.pi * np.cumsum(f) / SR; s = np.sin(ph) + 0.45 * np.sin(2 * ph) * np.exp(-tt * 6) + 0.2 * np.sin(3 * ph) * np.exp(-tt * 10)
    add(mus, t, s * env(n, 0.002, d), 0.11 * g)
def erhu(m, t, dur, g=1):
    n = int(dur * SR); tt = np.arange(n) / SR; f = NOTE(m) * (1 + 0.007 * np.sin(2 * np.pi * 5.5 * tt) * np.minimum(1, tt / 0.3))
    ph = 2 * np.pi * np.cumsum(f) / SR; s = sum(np.sin(k * ph) / k ** 1.6 for k in range(1, 6))
    add(mus, t, s * np.minimum(1, tt / 0.12) * np.minimum(1, (dur - tt) / 0.2), 0.07 * g)
def pad(m, t, dur, g=1):
    n = int(dur * SR); tt = np.arange(n) / SR; s = tone(NOTE(m), dur, 'pad', 0.5, 99)
    add(mus, t, s * np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 0.6), 0.05 * g)
def bass(m, t, g=1): add(mus, t, tone(NOTE(m), 0.4, 'pluck', 0.004, 0.18), 0.22 * g)
def gong(t, g=1):
    n = int(4 * SR); tt = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * tt * (1 + 0.02 * np.exp(-tt))) * np.exp(-tt * d) * a for f, d, a in [(110, 0.6, 1), (164, 0.8, 0.6), (231, 1.1, 0.4), (347, 1.5, 0.3), (523, 2.2, 0.2)])
    add(sfx, t, s * np.minimum(1, tt / 0.01), 0.35 * g)
PENT = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83]  # D major pentatonic
def section(t0, t1, kind):
    bpm = {'epic': 120, 'adv': 112, 'party': 128, 'sad': 70, 'journey': 96, 'mystic': 84, 'tense': 100, 'storm': 60}[kind]; b = 60 / bpm; t = t0; i = 0
    while t < t1:
        bi = i % 16
        if kind in ('epic',):
            if bi % 2 == 0: taiko(t, 1 if bi % 4 == 0 else 0.6)
            if bi in (3, 7, 11, 14, 15): taiko(t + b / 2, 0.5)
            zheng(PENT[(i * 3) % 10] + 12, t, 0.8); zheng(PENT[(i * 3 + 2) % 10] + 12, t + b / 2, 0.6)
            if bi % 8 == 0: bass(50, t); pad(62, t, b * 8, 0.8)
        elif kind in ('adv', 'party'):
            if bi % 4 == 0: kick(t)
            if bi % 4 == 2: wood(t); taiko(t, 0.35)
            hat(t + b / 2)
            mel = [74, 76, 78, 81, 78, 76, 74, 71, 69, 71, 74, 76, 74, 71, 69, 66]
            zheng(mel[bi], t, 0.9 if kind == 'adv' else 1.0)
            if kind == 'party': zheng(mel[(bi + 4) % 16] + 12, t + b / 2, 0.5); wood(t + b / 2, 0.6)
            if bi % 4 == 0: bass([50, 47, 45, 43][(i // 4) % 4], t)
            if bi % 16 == 0: pad([62, 59, 57, 55][(i // 16) % 4], t, b * 16, 0.7)
        elif kind == 'sad':
            if bi % 8 == 0: pad([62, 57, 59, 54][(i // 8) % 4], t, b * 8, 1.2); bass([38, 33, 35, 30][(i // 8) % 4], t, 0.6)
            if bi % 4 == 0: erhu([74, 71, 69, 66, 69, 71, 66, 64][(i // 4) % 8], t, b * 3.8, 1.1)
        elif kind in ('journey', 'mystic'):
            zheng(PENT[[0, 3, 5, 3, 1, 4, 6, 4][bi % 8]] + (12 if kind == 'mystic' else 0), t, 0.7)
            if bi % 4 == 0: kick(t, 0.6 if kind == 'journey' else 0); taiko(t, 0.25)
            if bi % 16 == 0: pad([62, 57][(i // 16) % 2], t, b * 16, 1.0)
            if kind == 'mystic' and bi % 8 == 4: erhu(PENT[(i // 8) % 6 + 3], t, b * 3, 0.8)
        elif kind == 'tense':
            if bi % 2 == 0: taiko(t, 0.7)
            if bi % 4 == 0: pad(50, t, b * 4, 1.3)
            if bi % 2 == 1: zheng(63 if bi % 4 == 1 else 62, t, 0.6)
        elif kind == 'storm':
            if bi % 2 == 0: kick(t, 0.8); kick(t + 0.22, 0.5)
            if bi % 8 == 0: pad(38, t, b * 8, 1.6); pad(44, t, b * 8, 0.9)
        t += b / (2 if kind in ('adv', 'party', 'epic', 'journey', 'mystic') else 1); i += 1
D = T['duration']
section(0, w(13), 'tense')
section(w(13), w(42), 'adv')
section(w(42), w(57), 'party')
section(w(57), w(73), 'tense')
section(w(73), w(100), 'epic')
section(w(100), w(110), 'adv')
section(w(110), w(133), 'mystic')
section(w(133), w(162), 'party')
section(w(162), w(166), 'journey')
section(w(166), w(180), 'storm')
section(w(180), D + 0.3, 'epic')
# ---------- sfx ----------
def crack(t, g=1): add(sfx, t, hp(noise(0.25), 2) * env(int(0.25 * SR), 0.001, 0.05), 0.4 * g); thud(t, 0.6 * g, 120)
def rise(t, dur=0.8, g=1):
    n = int(dur * SR); tt = np.arange(n) / SR; f = 300 * 2 ** (3 * tt / dur)
    add(sfx, t, (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + hp(noise(dur), 2) * 0.3) * (tt / dur) ** 1.5, 0.25 * g)
def roar(t0, t1, g=1):
    n = int((t1 - t0) * SR); x = lp_fast(np.concatenate([noise(t1 - t0), np.zeros(30)]), 25)[:n]; tt = np.arange(n) / SR
    add(sfx, t0, x * np.minimum(1, tt / 0.4) * np.minimum(1, (t1 - t0 - tt) / 0.4) * 2.5, 0.35 * g)
def splash(t, g=1): add(sfx, t, (hp(noise(0.7), 3) * 0.6 + lp_fast(np.concatenate([noise(0.7), np.zeros(10)]), 10)[:int(0.7 * SR)] * 2) * env(int(0.7 * SR), 0.005, 0.25), 0.4 * g)
def cheer(t, dur=1.5, g=1):
    for k in range(10): erhu_like = None; add(sfx, t + rng.random() * 0.3, tone(500 + rng.random() * 500, dur * 0.6, 'sine', 0.05, 0.4) * (1 + 0.3 * np.sin(np.arange(int(dur * 0.6 * SR)) / SR * 40)), 0.03 * g)
    add(sfx, t, hp(noise(dur), 3) * np.minimum(1, np.arange(int(dur * SR)) / SR / 0.1) * np.exp(-np.arange(int(dur * SR)) / SR / (dur * 0.5)), 0.12 * g)
def thunder(t, g=1):
    n = int(2.5 * SR); tt = np.arange(n) / SR; x = lp_fast(np.concatenate([noise(2.5), np.zeros(80)]), 60)[:n]
    add(sfx, t, x * np.exp(-tt * 1.6) * (1 + 0.6 * np.sin(tt * 23)) * 8, 0.35 * g); crack(t, 0.5 * g)
wi = w
thud(0.05, 1.0); sub(0.05, 0.8); for_k = [add(sfx, 0.3 + q * 0.5, hp(noise(0.08), 3) * env(int(0.08 * SR), 0.005, 0.03), 0.15) for q in range(5)]
pop(wi(10) + 0.1, 0.8, 600)
bell(wi(19), 0.5); whoosh(wi(17), 0.4, 0.8); ting(wi(17) + 0.2)
gong(wi(30), 0.5); cheer(wi(34), 1.4, 1.0); ting(wi(37), 1.2); rise(wi(36), 0.6, 0.8)
pop(wi(45), 1.0, 700); ting(wi(45) + 0.05); pop(wi(48), 0.8, 900); whoosh(wi(50), 0.8, 0.8)
for k in range(5): pop(wi(51) + k * 0.12, 0.5, 300 + k * 40)
ting(wi(55), 0.8)
roar(wi(60), wi(61), 0.4)
thud(wi(71), 0.6, 90); sub(wi(72), 1.1); thud(wi(72), 1.2, 60)
kk = wi(74) + 0.15; thud(kk, 1.3, 140); crack(kk + 0.05, 0.8); whoosh(kk, 0.5, 1.0)
whoosh(wi(78), 1.2, 1.2); flap(wi(82), 0.8); cheer(wi(85), 1.8, 1.2); gong(wi(85), 0.7)
for k in range(8): taiko(wi(90) + k * 0.25, 0.6)
for k in range(4): thud(wi(94) + 0.05 + k * 0.18, 0.9, 150); whoosh(wi(94) + k * 0.18, 0.5, 0.8)
pop(wi(98), 1.0, 300)
sub(wi(100), 0.5); thud(wi(105), 0.8, 100)
rise(wi(115) - 0.6, 0.7, 0.6); bell(wi(115), 0.4); ting(wi(121))
pop(wi(125), 1.0, 350); pop(wi(128), 1.0, 380); thud(wi(130), 1.0, 70); pop(wi(130) + 0.1, 0.9, 250)
for k in range(10): add(sfx, wi(144) + k * 0.12, lp_fast(np.concatenate([noise(0.08), np.zeros(20)]), 12)[:3500] * env(3500, 0.005, 0.04) * 4, 0.25)
roar(wi(148), wi(154), 0.3)
for k in range(12): pop(wi(155) + k * 0.1, 0.5, 1200 + (k % 4) * 200)
for k in range(4): crack(wi(160) + k * 0.12, 0.35)
ting(wi(161) + 0.3)
pop(wi(163), 0.6, 500)
bp = wi(165) + 0.1; n = int(0.5 * SR); tt = np.arange(n) / SR; add(sfx, bp, np.tanh(3 * np.sin(2 * np.pi * np.cumsum(90 + 30 * np.sin(tt * 30)) / SR)) * env(n, 0.01, 0.2), 0.45)
gong(wi(168), 1.0); rise(wi(166), 0.9, 1.0); sub(wi(169), 1.0)
roar(wi(171), wi(180), 0.8); for_k2 = [taiko(wi(171) + q * 0.5, 0.5) for q in range(16)]
sub(wi(180), 1.0); thud(wi(182), 1.2, 60); gong(wi(182), 1.0); rise(wi(182) - 0.5, 0.5, 0.8)
write('audio/music.wav', mus / np.abs(mus).max() * 0.9)
write('audio/sfx.wav', sfx / np.abs(sfx).max() * 0.9)
print('ok', DUR)
