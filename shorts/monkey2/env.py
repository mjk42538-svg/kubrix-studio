import numpy as np, subprocess, json, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'audio/voice_v2.wav'
SR = 16000; x = np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',src,'-ac','1','-ar',str(SR),'-f','f32le','-']), np.float32)
hop = SR // 30; n = len(x) // hop
r = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(n)])
ref = np.percentile(r[r > 1e-4], 92); v = np.clip((r / ref - 0.08) / 0.92, 0, 1) ** 0.8
v = np.maximum(v, np.concatenate([[0], v[:-1]]) * 0.55)  # slight release
json.dump({'fps': 30, 'v': [round(float(a), 3) for a in v]}, open('work/env.json', 'w')); print(n, 'frames')
