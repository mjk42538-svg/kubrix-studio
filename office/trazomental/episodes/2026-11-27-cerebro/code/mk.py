import json,re
R=1.04
raw=json.load(open('work/words_raw.json'))
if isinstance(raw,dict): raw=raw.get('words',raw)
words=[];intag=False
for w in raw:
    if w.get('type','word')!='word': continue
    t=w['text']
    if t.startswith('['): intag=True
    if intag:
        if t.endswith(']'): intag=False
        continue
    words.append({'i':len(words),'w':t.replace('"',''),'s':round(w['start']/R,3),'e':round(w['end']/R,3)})
ph=[];w0=0
for i,w in enumerate(words):
    if w['w'][-1] in '.:' or (w['w'][-1]==',' and i-w0>=4):
        ph.append({'text':' '.join(x['w'] for x in words[w0:i+1]),'start':words[w0]['s'],'end':w['e'],'w0':w0,'w1':i}); w0=i+1
if w0<len(words): ph.append({'text':' '.join(x['w'] for x in words[w0:]),'start':words[w0]['s'],'end':words[-1]['e'],'w0':w0,'w1':len(words)-1})
dur=round(56.92/R,3)
json.dump({'duration':dur,'words':words,'phrases':ph},open('work/timing.json','w'),indent=1,ensure_ascii=False)
for k,p in enumerate(ph): print(k,p['w0'],p['start'],p['text'])
print(' '.join(f"{w['i']}:{w['w']}" for w in words))
