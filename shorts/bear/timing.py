import re, json, subprocess, sys
voice, script = sys.argv[1], sys.argv[2]
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',voice]))
log = subprocess.run(['ffmpeg','-hide_banner','-i',voice,'-af','silencedetect=noise=-35dB:d=0.17','-f','null','-'],capture_output=True,text=True).stderr
ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
# speech segments
segs = []; t = 0.0
lead = 0.0
for a, b in zip(ss, se):
    if a - t > 0.05: segs.append((t, a))
    t = b
if dur - t > 0.1: segs.append((t, dur))
# leading silence: first seg start
txt = open(script).read()
words = txt.split()
def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower())
    if not w: return 1
    n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and n > 1 and not w.endswith('le'): n -= 1
    return max(1, n)
# phrases split at punctuation
phrases = []; cur = []
for i, w in enumerate(words):
    cur.append(i)
    if re.search(r'[.,!?;:]["”]?$', w):
        phrases.append(cur); cur = []
if cur: phrases.append(cur)
P = [sum(syl(words[i]) for i in p) for p in phrases]
endsent = [bool(re.search(r'[.!?]["”]?$', words[p[-1]])) for p in phrases]
segd = [b - a for a, b in segs]
rate = sum(segd) / sum(P)
INF = 1e18
nP, nS = len(phrases), len(segs)
import functools
best = [[INF] * (nS + 1) for _ in range(nP + 1)]; bp = {}
best[0][0] = 0
for i in range(nP + 1):
    for j in range(nS + 1):
        if best[i][j] >= INF: continue
        for di in range(1, 5):
            for dj in range(1, 4):
                if di > 1 and dj > 1: continue
                i2, j2 = i + di, j + dj
                if i2 > nP or j2 > nS: continue
                sy = sum(P[i:i2]); d = segs[j2-1][1] - segs[j][0]
                c = ((d - sy * rate) / (0.35 + 0.15 * sy * rate)) ** 2
                c += 2.5 * sum(endsent[k] for k in range(i, i2 - 1))  # sentence end inside a segment
                c += 0.4 * (di - 1)
                c += 3.0 * (dj - 1)  # phrase split across pauses
                if best[i][j] + c < best[i2][j2]:
                    best[i2][j2] = best[i][j] + c; bp[(i2, j2)] = (i, j)
i, j = nP, nS; groups = []
while (i, j) != (0, 0):
    pi, pj = bp[(i, j)]; groups.append((pi, i, pj, j)); i, j = pi, pj
groups.reverse()
wt = [None] * len(words); out_ph = []
for (i0, i1, j0, j1) in groups:
    widx = [w for p in phrases[i0:i1] for w in p]
    # time pool = concatenated segments
    pool = segs[j0:j1]; tot = sum(b - a for a, b in pool)
    sy = [syl(words[w]) for w in widx]; S = sum(sy)
    acc = 0
    def at(x):
        for a, b in pool:
            if x <= b - a: return a + x
            x -= b - a
        return pool[-1][1]
    for w, s in zip(widx, sy):
        st = at(acc / S * tot); acc += s; en = at(acc / S * tot)
        wt[w] = (round(st, 3), round(en, 3))
    for p in phrases[i0:i1]:
        out_ph.append({'text': ' '.join(words[k] for k in p), 'start': wt[p[0]][0], 'end': wt[p[-1]][1], 'w0': p[0], 'w1': p[-1]})
json.dump({'duration': dur, 'frames': round(dur * 30), 'words': [{'i': k, 'w': words[k], 's': wt[k][0], 'e': wt[k][1]} for k in range(len(words))], 'phrases': out_ph}, open('work/timing.json', 'w'), indent=1)
for p in out_ph: print(f"{p['start']:6.2f}-{p['end']:6.2f}  [{p['w0']}-{p['w1']}] {p['text']}")
print('segs', nS, 'phrases', nP, 'frames', round(dur * 30))
