#!/usr/bin/env python3
"""JMdict から 2〜5文字のカナ語を抽出して data/vocab.js を作る。
使い方: python3 tools/build_vocab.py JMdict_e.gz [--nf-max 24]
既存の語彙は削除せず、和集合で増やす(--replace で置換)。"""
import sys,gzip,argparse,re
import xml.etree.ElementTree as ET
from common import *
ap=argparse.ArgumentParser();ap.add_argument('jmdict');ap.add_argument('--nf-max',type=int,default=24)
ap.add_argument('--replace',action='store_true');a=ap.parse_args()
BADHEAD=re.compile(r'^[ーンッァィゥェォャュョヮヵヶ]');OK=re.compile(r'^[ァ-ヴヵヶー]+$')
POS_NG=('prefix','suffix','particle','auxiliary','copula','counter','conjunction')
MISC_NG=('archaism','obsolete','vulgar','x-rated','obscure','rare','derogatory')
COMMON={'ichi1','news1','spec1','gai1'}
def kata(s):return ''.join(chr(ord(c)+96) if 'ぁ'<=c<='ゖ' else c for c in s)
val={k:set() for k in(2,3,4,5)};gen={k:set() for k in(2,3,4,5)}
op=gzip.open if a.jmdict.endswith('.gz') else open
with op(a.jmdict,'rb') as f:
    for _,e in ET.iterparse(f):
        if e.tag!='entry':continue
        pos=' '.join((x.text or '') for x in e.iter('pos')).lower()
        misc=' '.join((x.text or '') for x in e.iter('misc')).lower()
        if any(t in pos for t in POS_NG) or any(t in misc for t in MISC_NG):e.clear();continue
        kpri={x.text for x in e.iter('ke_pri')}
        for r in e.findall('r_ele'):
            w=kata(r.findtext('reb') or '')
            if not(2<=len(w)<=5) or not OK.match(w) or BADHEAD.match(w):continue
            pri={x.text for x in r.findall('re_pri')}|(kpri if r.find('re_restr') is None else set())
            val[len(w)].add(w)
            nf=[int(p[2:]) for p in pri if re.fullmatch(r'nf\d\d',p)]
            if pri&COMMON or (nf and min(nf)<=a.nf_max):gen[len(w)].add(w)
        e.clear()
if not a.replace:
    ov,og=load_vocab()
    for k in val:val[k]|=ov[k];gen[k]|=og[k]
for k in val:gen[k]&=val[k]
save_vocab(val,gen)
for k in sorted(val):print('%d文字: 許容語 %d / 出題語 %d'%(k,len(val[k]),len(gen[k])))
print('合計 許容語 %d / 出題語 %d'%(sum(map(len,val.values())),sum(map(len,gen.values()))))
