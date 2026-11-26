import numpy as np, subprocess, sys, wave
SR = 44100
def load(p):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32).astype(np.float64)
def gated_rms(x, win=0.4, gate_db=-40):
    n = int(win * SR); k = len(x) // n
    r = np.sqrt((x[:k * n].reshape(k, n) ** 2).mean(1) + 1e-12)
    thr = r.max() * 10 ** (gate_db / 20); g = r[r > thr]
    return np.sqrt((g ** 2).mean())
v, m, s = load(sys.argv[1]), load(sys.argv[2]), load(sys.argv[3])
L = len(v); m = np.pad(m, (0, max(0, L - len(m))))[:L]; s = np.pad(s, (0, max(0, L - len(s))))[:L]
rv, rm, rs = gated_rms(v), gated_rms(m), gated_rms(s)
m *= 0.5 * rv / rm
s *= 0.5 * rv / rs
cap = 0.7 * np.abs(v).max()
if np.abs(s).max() > cap: s *= cap / np.abs(s).max()
db = lambda a, b: 20 * np.log10(a / b)
print(f'voice gRMS {20*np.log10(rv):.1f} dBFS | music {db(gated_rms(m), rv):+.1f} dB vs voice | sfx {db(gated_rms(s), rv):+.1f} dB vs voice | sfx peak {np.abs(s).max()/np.abs(v).max():.2f}x voice peak')
mix = v + m + s
with wave.open(sys.argv[4] if len(sys.argv) > 4 else 'audio/mix.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(4); f.setframerate(SR)
    f.writeframes((np.clip(mix, -8, 8) / 8 * 2147483647).astype(np.int32).tobytes())
np.save('audio/mixgain.npy', np.array([8.0]))
