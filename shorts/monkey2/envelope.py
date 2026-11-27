import numpy as np, subprocess, json, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'audio/voice_v2.wav'
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'])
x = np.frombuffer(raw, np.float32); hop = 16000 // 30
n = len(x) // hop; r = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(n)])
ref = np.percentile(r[r > 1e-4], 90); v = np.clip((20*np.log10(r/ref + 1e-9) + 30) / 30, 0, 1)
v = np.convolve(v, [0.25, 0.5, 0.25], 'same')
json.dump({'fps': 30, 'v': [round(float(a), 3) for a in v]}, open('work/env_v2.json', 'w'))
print(n, 'frames')
