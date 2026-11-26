import re, json
words = open('script.txt').read().split()
def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower()); n = len(re.findall(r'[aeiouy]+', w))
    if w.endswith('e') and n > 1 and not w.endswith('le'): n -= 1
    return max(1, n)
t = 0.25; out = []
for i, w in enumerate(words):
    d = 0.08 + 0.17 * syl(w); out.append({'i': i, 'w': w, 's': round(t, 3), 'e': round(t + d, 3)}); t += d
    if w.endswith('...'): t += 0.35
    elif re.search(r'[.!?]["”]?$', w): t += 0.22
    elif re.search(r'[,:;]["”]?$', w): t += 0.1
dur = t + 0.6
json.dump({'duration': dur, 'frames': round(dur * 30), 'words': out, 'phrases': []}, open('work/timing.json', 'w'), indent=1)
# fake lip envelope
import math
fps = 30; v = [0.0] * (round(dur * fps) + 2)
for o in out:
    n = syl(o['w']); a, b = o['s'], o['e']
    for f in range(int(a * fps), int(b * fps) + 1):
        x = (f / fps - a) / max(0.01, b - a); v[f] = max(v[f], abs(math.sin(x * math.pi * n)) * 0.9)
json.dump({'fps': fps, 'v': [round(x, 3) for x in v]}, open('work/env.json', 'w'))
print(dur, len(words))
