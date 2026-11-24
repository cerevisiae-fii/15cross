#!/usr/bin/env python3
"""出題語(GEN)から問題を自動生成して data/bank.js に追加する。
使い方: python3 tools/gen_puzzles.py [--count 300] [--sec 60] [--modes 3 4 5 6]
3=3×3, 4=4×4, 5=5×5(✕), 6=4×4(✕)。5/6は既存問題の✕・〇の配置をテンプレートにして埋める。"""
import argparse,random,time,itertools
from collections import defaultdict
from common import *
ap=argparse.ArgumentParser();ap.add_argument('--count',type=int,default=300);ap.add_argument('--sec',type=float,default=60)
ap.add_argument('--modes',type=int,nargs='+',default=[3,4,5,6]);a=ap.parse_args()
_,gen=load_vocab();bank,bsc=load_bank()
words={k:sorted(v) for k,v in gen.items()}
idx=defaultdict(set)
for L,ws in words.items():
    for i,w in enumerate(ws):
        for p,c in enumerate(w):idx[(L,p,c)].add(i)
def templates(m):
    if m==3:return ['.../.../..O']
    if m==4:return ['..../..../..../...O']
    t=set()
    for s in bank[m]:t.add(''.join('.' if c not in 'XO/' else c for c in s))
    return sorted(t)
def fill(t,deadline,limit=4000):
    rows=t.split('/');n=len(rows[0]);g=[list(r) for r in rows];slots=[]
    def runs(get):
        cur=[]
        for k in range(n+1):
            c=get(k) if k<n else None
            if c and g[c[0]][c[1]]=='.':cur.append(c)
            else:
                if len(cur)>=2:slots.append(cur)
                cur=[]
    for r in range(len(g)):runs(lambda k,r=r:(r,k) if k<len(g[r]) else None)
    for c in range(n):runs(lambda k,c=c:(k,c) if k<len(g) and c<len(g[k]) else None)
    if any(len(s)>5 for s in slots):return None
    asg={};used=set();nodes=[0]
    def cand(s):
        L=len(s);sets=[idx[(L,p,g[r][c])] for p,(r,c) in enumerate(s) if g[r][c]!='.']
        base=set.intersection(*sets) if sets else set(range(len(words[L])))
        return [i for i in base if words[L][i] not in used]
    def rec(todo):
        if not todo:return True
        nodes[0]+=1
        if nodes[0]>limit or time.time()>deadline:return False
        best=min(((len(c:=cand(s)),k,c) for k,s in enumerate(todo)),key=lambda x:x[0])
        if best[0]==0:return False
        s=todo[best[1]];rest=todo[:best[1]]+todo[best[1]+1:];c=best[2];random.shuffle(c)
        for i in c[:40]:
            w=words[len(s)][i];save=[g[r][cc] for r,cc in s]
            for (r,cc),ch in zip(s,w):g[r][cc]=ch
            used.add(w)
            if rec(rest):return True
            used.discard(w)
            for (r,cc),ch in zip(s,save):g[r][cc]=ch
        return False
    if not rec(slots):return None
    return ['' .join(r) for r in g]
def enc(m,rows):
    return ''.join(rows)[:-1] if m in(3,4) else '/'.join(rows)
for m in a.modes:
    have=set(bank[m]);ts=templates(m);new=0;dl=time.time()+a.sec
    per=max(1,a.count//len(ts)+1)
    for rnd in range(per*6):
        for t in ts:
            if new>=a.count or time.time()>dl:break
            rows=fill(t,min(dl,time.time()+2))
            if rows and (e:=enc(m,rows)) not in have:
                have.add(e);bank[m].append(e);new+=1
                if m==4:bsc.append(3)
        if new>=a.count or time.time()>dl:break
    print('モード%d: +%d問 (計%d)'%(m,new,len(bank[m])))
save_bank(bank,bsc)
