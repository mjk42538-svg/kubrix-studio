import re, json, sys
T = json.load(open('work/' + (sys.argv[1] if len(sys.argv) > 1 else 'timing.json')))
i0s = [int(x) for x in re.findall(r"shot\((\d+), '", open('web/story.js').read())]
st = [0] + [T['words'][i]['s'] - 0.07 for i in i0s[1:]] + [T['duration']]
fr = []
for k in range(len(i0s)):
    a, b = st[k], st[k + 1]; fr.append(int((a + (b - a) * 0.6) * 30))
print(','.join(map(str, fr)))
