import numpy as np, subprocess, json, re, wave
SR = 44100; SPEED = 1.12
T = json.load(open('work/timing.json'))
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', 'audio/voice.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'])
x = np.frombuffer(raw, np.float32).astype(np.float64)
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'audio/voice.mp3', '-af', 'silencedetect=noise=-35dB:d=0.17', '-f', 'null', '-'], capture_output=True, text=True).stderr
ss = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', log)]; se = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', log)]
segs = []; t = 0.0
for a, b in zip(ss, se):
    if a - t > 0.05: segs.append([t, a])
    t = b
if T['duration'] - t > 0.1: segs.append([t, T['duration']])
PAD = 0.035
words = T['words']
DRAMA = {160, 143, 183, 100}
out = []; mapping = []  # (old_start, old_end, new_start)
cur = 0.0
for j, (a, b) in enumerate(segs):
    a0, b0 = max(0, a - PAD), min(T['duration'], b + PAD)
    if j > 0:
        # gap length based on what ends before this segment
        prev = [w for w in words if w['s'] < segs[j - 1][1] and w['s'] >= segs[j - 1][0] - 0.05]
        nxt = [w for w in words if a - 0.05 <= w['s'] < b]
        end_sent = bool(prev) and re.search(r'[.!?]["”]?$', prev[-1]['w'])
        gap = 0.20 if end_sent else 0.08
        if nxt and nxt[0]['i'] in DRAMA: gap = 0.38
        if nxt and nxt[0]['w'].startswith('Huss') and prev and prev[-1]['w'].startswith('Huss'): gap = a - segs[j - 1][1] - 2 * PAD
        if nxt and nxt[0]['w'].startswith('Huss') and not (prev and prev[-1]['w'].startswith('Huss')): gap = 0.3
        a0 = max(a0, segs[j - 1][1] + PAD)
        out.append(np.zeros(int(gap * SR))); cur += gap
    seg = x[int(a0 * SR):int(b0 * SR)].copy()
    f = min(len(seg) // 2, int(0.01 * SR)); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    out.append(seg); mapping.append((a0, b0, cur)); cur += len(seg) / SR
y = np.concatenate(out + [np.zeros(int(0.22 * SR))])
with wave.open('audio/voice_tight.wav', 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'audio/voice_tight.wav', '-af', f'atempo={SPEED}', 'audio/voice_v2.wav'], check=True)
def m(t):
    for a0, b0, n0 in mapping:
        if t <= b0: return (n0 + max(0, t - a0)) / SPEED
    return mapping[-1][2] / SPEED
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'audio/voice_v2.wav']))
nw = [{'i': w['i'], 'w': w['w'], 's': round(m(w['s']), 3), 'e': round(m(w['e']), 3)} for w in words]
json.dump({'duration': dur, 'frames': round(dur * 30), 'words': nw, 'phrases': []}, open('work/timing_v2.json', 'w'), indent=1)
print('old', T['duration'], 'new', dur, 'frames', round(dur * 30))
print(' '.join(f"{w['i']}:{w['s']:.2f}" for w in nw[::10]))
