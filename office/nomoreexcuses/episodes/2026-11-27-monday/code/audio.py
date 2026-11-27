# Sound design for the "Monday" Short: dark drone + heartbeat pulse, whooshes on scene cuts,
# pops on element entrances, ticks on counters, booms on MONDAY / TODAY / NEVER.
import numpy as np, json, wave, subprocess
SR = 44100
D = json.load(open('work/timing.json')); W = D['words']; P = [p['start'] for p in D['phrases']]
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
bt = P[7]
while bt < P[36]:
    rate = 0.86 if bt < P[29] else 0.6
    kick(bt, 0.8); kick(bt + 0.22, 0.45); bt += rate
# rising pad in the rule section
m = (t > P[29]) & (t < P[38])
music[m] += 0.12 * np.sin(2 * np.pi * 220 * t[m]) * np.clip((t[m] - P[29]) / 6, 0, 1)
music[t > P[38]] *= np.exp(-(t[t > P[38]] - P[38]) * 0.6)

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
for k in (2, 7, 11, 14, 17, 21, 24, 26, 29, 36):
    add(WH, P[k] - 0.3, 0.5)
add(scratch(), ws(7), 0.6)                 # strike through NO
add(boom(), ws(10) - 0.1, 0.9)             # MONDAY
for i in (14, 19, 22, 25): add(pop(), ws(i) - 0.1, 0.35)
add(pop(1200), ws(25) + 0.05, 0.3)
# counter ticks
for k in range(18): add(tick(), ws(37) + k * 1.4 / 18, 0.35)
for k in range(22): add(tick(), ws(46) + k * 2.6 / 22, 0.3)
add(boom(0.8), ws(43) - 0.1, 0.5)          # TOTAL
for k in (15, 16): add(pop(660), P[k] - 0.1, 0.35)
for k in (18, 19, 20): add(pop(990), P[k] - 0.08, 0.35)
add(pop(), ws(80) - 0.08, 0.35); add(pop(1300), P[22] - 0.05, 0.4)
t0, t1 = ws(84), D['phrases'][23]['end']
for r in range(10): add(tick(), t0 + r * (t1 - t0) / 10, 0.5)
add(WH, ws(115) - 0.2, 0.3)
for i in (128, 129, 130, 131): add(boom(0.5), ws(i) - 0.08, 0.45)
add(boom(), ws(132) - 0.08, 1.0)           # TODAY
add(flip(), ws(134) - 0.1, 0.6); add(flip(), ws(136) - 0.1, 0.6)
add(boom(1.8), ws(140) - 0.05, 1.0)        # NEVER

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
