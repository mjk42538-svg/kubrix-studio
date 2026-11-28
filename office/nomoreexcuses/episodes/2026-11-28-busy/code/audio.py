# Sound design for the "Busy" Short: dark drone + heartbeat pulse, whooshes on scene cuts,
# pops on element entrances, ticks on counters, booms on MONDAY / TODAY / NEVER.
import numpy as np, json, wave, subprocess
SR = 44100
D = json.load(open('work/timing.json')); W = D['words']; P = [p['start'] for p in D['phrases']]; PS8 = P[8]
ws = lambda i: W[i]['s']
DUR = D['duration'] + 0.6
N = int(DUR * SR); t = np.arange(N) / SR
rng = np.random.default_rng(7)

def env(n, a=0.005, r=0.2):
    e = np.ones(n); na = int(a * SR); e[:na] = np.linspace(0, 1, na)
    e *= np.exp(-np.arange(n) / (r * SR)); return e

music = np.zeros(N)
# drone (A minor), slow swell
for f, g in [(55, .5), (82.4, .3), (110, .25), (130.8, .12), (164.8, .08)]:
    music += g * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.07 * t))
music *= 0.35 + 0.25 * np.sin(2 * np.pi * 0.05 * t) ** 2
# heartbeat from the math section, faster in the rule section
def kick(at, g=1.0):
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 120 * np.exp(-tt * 18) + 45
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * g
    i = int(at * SR); m = min(n, N - i)
    if m > 0: music[i:i + m] += s[:m]
bt = P[2]
while bt < P[30]:
    rate = 0.86 if bt < P[23] else 0.62
    kick(bt, 0.8); kick(bt + 0.22, 0.45); bt += rate
# rising pad in the rule section
m = (t > P[23]) & (t < P[31])
music[m] += 0.12 * np.sin(2 * np.pi * 220 * t[m]) * np.clip((t[m] - P[23]) / 6, 0, 1)
music[t > P[31] + 1.5] *= np.exp(-(t[t > P[31] + 1.5] - P[31] - 1.5) * 0.8)

sfx = np.zeros(N)
def add(sig, at, g=1.0):
    i = int(max(0, at) * SR); m = min(len(sig), N - i)
    if m > 0: sfx[i:i + m] += sig[:m] * g
def whoosh(d=0.45):
    n = int(d * SR); x = rng.standard_normal(n)
    # crude band sweep: moving-average lowpass with varying window + envelope
    out = np.zeros(n); k0 = 40
    cs = np.cumsum(np.insert(x, 0, 0))
    for j in range(n):
        k = int(k0 - 34 * (j / n)) + 2
        a = max(0, j - k); out[j] = (cs[j + 1] - cs[a]) / (j + 1 - a)
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    return out * e * 3
def pop(f=880):
    n = int(0.12 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 600 * np.exp(-tt * 40)) * tt) * env(n, 0.002, 0.03)
def tick():
    n = int(0.03 * SR); return rng.standard_normal(n) * env(n, 0.001, 0.006) * 0.8
def boom(d=1.4):
    n = int(d * SR); tt = np.arange(n) / SR
    f = 90 * np.exp(-tt * 3) + 32
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.5) +
            0.3 * rng.standard_normal(n) * env(n, 0.001, 0.05))
def scratch():
    n = int(0.25 * SR); return rng.standard_normal(n) * env(n, 0.01, 0.08) * 0.5
def flip():
    n = int(0.18 * SR); x = rng.standard_normal(n); return np.convolve(x, np.ones(25) / 25, 'same') * env(n, 0.005, 0.05) * 4

WH = whoosh()
for k in (2, 6, 8, 10, 13, 18, 21, 23, 27, 29):
    add(WH, P[k] - 0.3, 0.5)
add(boom(), ws(4) + 0.05, 0.9)              # BUSY -> LAZY flip (hook)
add(flip(), ws(4) + 0.05, 0.6)
add(pop(), ws(14) - 0.1, 0.35)              # 12 hrs clock
for k in range(14): add(tick(), ws(17) + k * 1.0 / 14, 0.35)   # emails counter
for i in range(6): add(pop(700 + i * 90), ws(19) - 0.1 + i * 0.12, 0.3)  # meetings
add(boom(0.8), ws(22), 0.45)                # exhausted
add(boom(0.9), ws(28) - 0.1, 0.6)           # 0%
add(boom(0.7), PS8 - 0.1, 0.4)              # ugly truth
for k in range(30): add(tick(), P[9] + k * 0.05, 0.18)  # wall of tasks
add(boom(1.0), ws(38) - 0.1, 0.6)           # HIDE
def buzz(d=0.5):
    n = int(d * SR); tt = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * 180 * tt)) * (np.sin(2 * np.pi * 8 * tt) > 0) * env(n, 0.005, 0.4) * 0.5
add(buzz(), ws(44), 0.5)                    # phone ping
for i in range(10): add(pop(1500), ws(59) + i * 0.32, 0.3)  # ten pings
add(boom(), ws(69), 0.8)                    # 0 MIN
for i in range(6): add(pop(1100), P[13] + 0.15 + i * 0.55, 0.3)  # checkboxes
for i in (76, 77, 78): add(boom(0.5), ws(i) - 0.05, 0.55)       # FAST LOUD ALL DAY
add(scratch(), ws(80), 0.5)
add(boom(0.8), ws(94) - 0.1, 0.6)           # 1 hard thing
for k in range(24): add(tick(), ws(97) + k * 0.1, 0.3)          # 90:00 countdown
add(WH, ws(99), 0.4)                        # phone flies away
add(boom(0.7), ws(103), 0.4)                # 365 days later
add(WH, P[23] - 0.1, 0.4); add(boom(1.6), ws(111), 0.9)        # twist
add(boom(1.2), ws(117), 0.8)                # BOTH YOU
for i in (132, 134, 136): add(scratch(), ws(i) + 0.25, 0.5)    # crossed
add(boom(0.9), ws(139) - 0.1, 0.7)          # the thing
add(boom(), ws(155) + 0.1, 1.0); add(flip(), ws(155) + 0.1, 0.6)  # LAZY loop

def read(fn):
    raw = subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', fn, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'])
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768
v = read('audio/voice_t.wav'); vv = np.zeros(N); vv[:min(N, len(v))] = v[:N]
vv /= np.abs(vv).max() + 1e-9; vv *= 0.89
# duck music under voice
ve = np.convolve(np.abs(vv), np.ones(2205) / 2205, 'same'); duck = 1 - 0.5 * np.clip(ve / 0.08, 0, 1)
music = music / (np.abs(music).max() + 1e-9) * 0.16 * duck
sfx = sfx / (np.abs(sfx).max() + 1e-9) * 0.42
mix = vv + music + sfx
mix /= max(1.0, np.abs(mix).max() / 0.97)
mix[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
with wave.open('audio/mix.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', DUR)
