import re,os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P=lambda *a:os.path.join(ROOT,*a)
def load_vocab():
    s=open(P('data/vocab.js'),encoding='utf-8').read()
    val={int(k):set(v.split()) for k,v in re.findall(r'(\d):new Set\("([^"]*)"',s)}
    gs=s.split('const GEN=')[1]
    gen={int(k):set(v.split()) for k,v in re.findall(r'(\d):"([^"]*)"',gs)}
    return val,gen
def save_vocab(val,gen):
    v=','.join('%d:new Set("%s".split(" "))'%(k,' '.join(sorted(val[k]))) for k in sorted(val))
    g=','.join('%d:"%s".split(" ")'%(k,' '.join(sorted(gen[k]))) for k in sorted(gen))
    open(P('data/vocab.js'),'w',encoding='utf-8').write('// 自動生成: tools/build_vocab.py (手で編集しない)\nconst VAL={%s};\nconst GEN={%s};\n'%(v,g))
def load_bank():
    s=open(P('data/bank.js'),encoding='utf-8').read()
    bank={int(k):v.split() for k,v in re.findall(r'(\d):"([^"]*)"',s.split('const BSC')[0])}
    bsc=[int(x) for x in re.search(r'const BSC=\[(.*?)\]',s).group(1).split(',')]
    return bank,bsc
def save_bank(bank,bsc):
    b=','.join('%d:"%s".split(" ")'%(k,' '.join(bank[k])) for k in sorted(bank))
    open(P('data/bank.js'),'w',encoding='utf-8').write('// 自動生成: tools/gen_puzzles.py\nconst BANK={%s};\nconst BSC=%s;\n'%(b,bsc))
