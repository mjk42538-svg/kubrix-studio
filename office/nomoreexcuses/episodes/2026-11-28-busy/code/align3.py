# DP alignment: phrase boundaries -> silence gaps, matching each phrase's spoken duration (from STT) and position.
import re, json, subprocess, sys
wav, raw, out, tempo = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
dur = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',wav]))
log = subprocess.run(['ffmpeg','-i',wav,'-af','silencedetect=noise=-38dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
ss=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]; se=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
gaps=[(a,b) for a,b in zip(ss,se) if a>0.05 and a<dur-0.2]
W=[w for w in json.load(open(raw))['words'] if w['type']=='word' and not w['text'].startswith('[')]
for w in W: w['s']=w['start']/tempo; w['e']=w['end']/tempo
ph=[]; cur=[]
for i,w in enumerate(W):
    cur.append(i)
    if re.search(r'[.?!]"?$', w['text']): ph.append(cur); cur=[]
if cur: ph.append(cur)
N=len(ph); M=len(gaps)
pd=[W[p[-1]]['e']-W[p[0]]['s'] for p in ph]
pend=[W[p[-1]]['e'] for p in ph]
# bstart(j): start time after gap j (j=-1 -> 0); bend(j): end before gap j (j=M -> dur)
bs=lambda j: 0.0 if j<0 else gaps[j][1]
be=lambda j: dur if j>=M else gaps[j][0]
INF=1e9
# D[k][j] = best cost with phrase k ending at gap j
import functools
D=[[INF]*(M+1) for _ in range(N)]; B=[[None]*(M+1) for _ in range(N)]
for k in range(N):
    for j in range(M+1):
        if k==N-1 and j!=M: continue
        if k<N-1 and j==M: continue
        prevs=[-1] if k==0 else range(-1,j)
        for i in prevs:
            pc=0 if k==0 else (D[k-1][i] if i>=0 else INF)
            if pc>=INF: continue
            d=be(j)-bs(i)
            if d<=0.15: continue
            c=pc+abs(d-pd[k])+0.3*abs(be(j)-pend[k])
            if c<D[k][j]: D[k][j]=c; B[k][j]=i
j=M; bnd=[]
for k in range(N-1,-1,-1):
    i=B[k][j]; bnd.append((bs(i),be(j))); j=i
bnd=bnd[::-1]
words=[]; phrases=[]
for k,p in enumerate(ph):
    s0,e0=W[p[0]]['s'],W[p[-1]]['e']; s1,e1=bnd[k]
    f=lambda x:s1+(x-s0)/(e0-s0)*(e1-s1)
    w0=len(words)
    for i in p: words.append({'i':len(words),'w':W[i]['text'],'s':round(f(W[i]['s']),3),'e':round(f(W[i]['e']),3)})
    phrases.append({'text':' '.join(W[i]['text'] for i in p),'start':round(s1,3),'end':round(e1,3),'w0':w0,'w1':len(words)-1})
json.dump({'duration':dur,'frames':int(dur*30),'words':words,'phrases':phrases},open(out,'w'),indent=1)
for k,p in enumerate(phrases): print(k,p['start'],p['end'],round(pd[k],2),p['w0'],p['text'])
