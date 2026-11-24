const ADD={"4": ["ウィンク", "ウィーン"], "3": ["タルト"], "5": ["ブレーカー"]};for(const k in ADD)ADD[k].forEach(w=>{VAL[k].add(w);if(!GEN[k].includes(w))GEN[k].push(w);});
const BADHEAD=/^[ーンッァィゥェォャュョヮヵヶ]/;for(const k in VAL)for(const w of [...VAL[k]])if(BADHEAD.test(w))VAL[k].delete(w);
const $=id=>document.getElementById(id);
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let MODE=store.get('katakana15.mode',4);if(![3,4,5,6].includes(MODE))MODE=4;let N=MODE==6?4:MODE,XM=MODE==6;
let grid=[],sol=null,init=null,base=new Set(),moves=0,secs=0,tm=null,cleared=false,viewed=false,drag=false,S=80;
let found=new Set();
let hint=0,solWords=new Set(),solKeys=new Set();
const HC=()=>hint>=(dyn()?2:1);const GAP=34,dyn=()=>N==5||XM,bk=()=>XM?6:N;
function setTheme(t){document.documentElement.setAttribute('data-theme',t);store.set('katakana15.theme',t);}
setTheme(store.get('katakana15.theme',(matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'));
function size(){
 S=Math.floor(Math.min(innerWidth-32-GAP,420)/N);
 const st=$('stage');document.documentElement.style.setProperty('--s',S+'px');
 st.style.width=(N*S+GAP)+'px';st.style.height=(N*S+GAP)+'px';
 $('board').style.width=$('board').style.height=N*S+'px';
 st.querySelectorAll('.m').forEach(e=>e.remove());
 for(let i=0;i<N;i++)for(const k of ['r','c']){
  const m=document.createElement('div');m.className='m '+k;m.dataset.i=i;
  m.style.cssText=k=='r'?'left:'+(N*S+4)+'px;top:'+i*S+'px;width:30px;height:'+S+'px':'top:'+(N*S+4)+'px;left:'+i*S+'px;width:'+S+'px;height:30px';
  st.appendChild(m);}
 if(grid.length)layout();
 hintBoxes();
}
function build(chars){
 $('board').innerHTML='';
 grid=chars.map(ch=>{
  const el=document.createElement('div');const x=ch==='X';
  el.className='t'+(ch===null?' blank':x?' xt':'');
  el.textContent=ch===null?'〇':x?'✕':ch;
  $('board').appendChild(el);return{ch:x?'✕':ch,x,el};});
 layout();hintBoxes();
}
function layout(){grid.forEach((p,i)=>p.el.style.transform='translate('+((i%N)*S+1)+'px,'+(Math.floor(i/N)*S+1)+'px)');judge();}
const lt=i=>{const p=grid[i];return p.ch===null||p.x?null:p.ch;};
function analyze(){
 const rows=[],cols=[];
 const mk=(idx)=>{const t=idx.map(i=>lt(i)===null?'・':grid[i].ch).join('');return{t,ok:VAL[idx.length]?VAL[idx.length].has(t):false,idx};};
 if(!dyn()){
  for(let r=0;r<N;r++){const len=r<N-1?N:N-1;rows.push([mk([...Array(len).keys()].map(c=>r*N+c))]);}
  for(let c=0;c<N;c++){const len=c<N-1?N:N-1;cols.push([mk([...Array(len).keys()].map(r=>r*N+c))]);}
 }else{
  const runs=(get)=>{const out=[];let cur=[];for(let k=0;k<=N;k++){const i=k<N?get(k):-1;if(i>=0&&lt(i)!==null)cur.push(i);else{if(cur.length>=2)out.push(mk(cur));cur=[];}}return out;};
  for(let r=0;r<N;r++)rows.push(runs(k=>r*N+k));
  for(let c=0;c<N;c++)cols.push(runs(k=>k*N+c));
 }
 const all=[...rows.flat(),...cols.flat()];
 const nOk=all.filter(x=>x.ok).length;
 return{rows,cols,all,nOk,nTot:all.length,done:all.length>0&&nOk==all.length&&(dyn()||grid[N*N-1].ch===null)};
}
function judge(){
 const a=analyze();
 document.querySelectorAll('.m').forEach(m=>{
  const runs=(m.classList.contains('r')?a.rows:a.cols)[+m.dataset.i];
  m.innerHTML=runs.map(x=>'<i'+(x.ok?' class="ok"':'')+'></i>').join('');});
 const hit=new Set();
 if(dyn())a.all.forEach(x=>{if(x.ok)x.idx.forEach(i=>hit.add(i));});
 else grid.forEach((p,i)=>{if(p.ch!==null&&i!==N*N-1&&(a.rows[Math.floor(i/N)][0].ok||a.cols[i%N][0].ok))hit.add(i);});
 const hy=new Set(),hg=new Set();
 if(HC())a.all.forEach(x=>{if(!x.ok||!solWords.has(x.t))return;const g=solKeys.has(x.idx.join()+':'+x.t);x.idx.forEach(i=>(g?hg:hy).add(i));});
 grid.forEach((p,i)=>{const c=p.el.classList;c.toggle('hit',hit.has(i));c.toggle('hy',hy.has(i)&&!hg.has(i));c.toggle('hg',hg.has(i));});
 $('sl').textContent=a.nOk+'/'+a.nTot;$('sm').textContent=moves;
 return a;
}
function fmt(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function msg(t){$('msg').textContent=t;}
function validNow(a){return new Set(a.all.filter(x=>x.ok).map(x=>x.t));}
function record(a){
 const cur=validNow(a);let add=false;
 for(const w of [...base])if(!cur.has(w))base.delete(w);
 for(const w of cur)if(!base.has(w)&&!found.has(w)){found.add(w);add=true;}
 
 $('bf').textContent='発見語 '+found.size;
}
function toSol(n,s){
 if(s.includes('/')){
  let ch=s.replace(/\//g,'').split('').map(c=>c=='O'?null:c);
  const bl=[];ch.forEach((c,i)=>{if(c===null||c==='X')bl.push(i);});
  const j=bl[Math.floor(Math.random()*bl.length)];
  ch=ch.map((c,i)=>i===j?null:bl.includes(i)?'X':c);
  const flat=ch.map(c=>c===null?'O':c).join(''),rows=[];
  for(let r=0;r<n;r++)rows.push(flat.slice(r*n,r*n+n));
  return{rows,chars:ch};}
 const rows=[];let p=0;for(let r=0;r<n-1;r++){rows.push(s.slice(p,p+n));p+=n;}rows.push(s.slice(p,p+n-1));
 const cols=[];for(let c=0;c<n;c++)cols.push(rows.slice(0,c<n-1?n:n-1).map(x=>x[c]).join(''));
 return{rows,cols,chars:[...rows.join('')].concat([null])};
}
function solLines(){
 if(!dyn())return{rows:sol.rows,cols:sol.cols};
 const cs=[...Array(N).keys()].map(c=>sol.rows.map(r=>r[c]).join(''));
 const ex=L=>L.flatMap(l=>l.split(/[XO]/).filter(x=>x.length>=2));
 return{rows:ex(sol.rows),cols:ex(cs)};
}
function startFrom(){
 const steps=N==3?80:N==4?160:300;
 let b,tries=0;
 do{
  b=sol.chars.slice();let e=b.indexOf(null),prev=-1;
  for(let k=0;k<steps;k++){
   const o=[],r=Math.floor(e/N),c=e%N;
   if(r>0)o.push(e-N);if(r<N-1)o.push(e+N);if(c>0)o.push(e-1);if(c<N-1)o.push(e+1);
   const f=o.filter(x=>x!==prev),n=f[Math.floor(Math.random()*f.length)];
   [b[e],b[n]]=[b[n],b[e]];prev=e;e=n;}
  init=b;build(init.slice());tries++;
 }while(analyze().done&&tries<5);
 setViewed(false);setHint(false);reset();
}
function reset(){
 clearInterval(tm);tm=null;moves=0;secs=0;cleared=false;$('st').textContent='00:00';
 build(init.slice());base=validNow(analyze());
 msg('');
}
function step(b,n){
 [grid[b],grid[n]]=[grid[n],grid[b]];moves++;
 if(!tm)tm=setInterval(()=>{secs++;$('st').textContent=fmt(secs)},1000);
}
function onPtr(e,down){
 const r=$('board').getBoundingClientRect();
 const c=Math.min(N-1,Math.max(0,Math.floor((e.clientX-r.left)/S))),rr=Math.min(N-1,Math.max(0,Math.floor((e.clientY-r.top)/S)));
 const t=rr*N+c;let b=grid.findIndex(p=>p.ch===null);
 if(down){if(t!==b||cleared)return;drag=true;$('stage').setPointerCapture(e.pointerId);return;}
 if(!drag)return;
 let g=0;
 while(b!==t&&g++<2*N){
  const br=Math.floor(b/N),bc=b%N,tr=Math.floor(t/N),tc=t%N;let n;
  if(tr!==br&&(Math.abs(tr-br)>=Math.abs(tc-bc)||tc===bc))n=b+(tr>br?N:-N);else n=b+(tc>bc?1:-1);
  step(b,n);b=n;}
 layout();after();
}
function after(){
 const a=judge();record(a);
 if(a.done&&!cleared){
  cleared=true;drag=false;clearInterval(tm);
  let same;
  if(dyn())same=grid.map(p=>p.ch===null?'O':p.x?'X':p.ch).join('')===sol.rows.join('');
  else same=a.rows.map(x=>x[0].t).join()===sol.rows.join()&&a.cols.map(x=>x[0].t).join()===sol.cols.join();
  msg('クリア  '+moves+'手 / '+fmt(secs)+(viewed?'  ・解答閲覧済':'')+(same?'':'  ・別解'));
  setTimeout(()=>result(a,same),300);
 }
}
$('stage').addEventListener('pointerdown',e=>onPtr(e,true));
$('stage').addEventListener('pointermove',e=>onPtr(e,false));
['pointerup','pointercancel'].forEach(k=>$('stage').addEventListener(k,()=>{drag=false;}));
function open(t,h){$('bt').textContent=t;$('bd').innerHTML=h;$('ov').classList.add('open');}
function close(){$('ov').classList.remove('open');}
$('bx').onclick=close;$('ov').onclick=e=>{if(e.target.id=='ov')close();};
function mini(chars,n){n=n||N;return'<div class="mini" style="grid-template-columns:repeat('+n+',36px)">'+chars.map(c=>'<div'+(c===null?' class="e">〇':c==='X'?' class="e">✕':'>'+c)+'</div>').join('')+'</div>';}
function wl(rows,cols){return'<div class="wl"><div><b>横</b>'+rows.map((x,i)=>(i+1)+' '+x).join('<br>')+'</div><div><b>縦</b>'+cols.map((x,i)=>(i+1)+' '+x).join('<br>')+'</div></div>';}
function result(a,same){
 const cur=dyn()?{rows:a.rows.flat().map(x=>x.t),cols:a.cols.flat().map(x=>x.t)}:{rows:a.rows.map(x=>x[0].t),cols:a.cols.map(x=>x[0].t)};
 const sl=solLines();
 open('クリア','<div class="big">'+moves+'手 / '+fmt(secs)+'</div>'
  +(viewed||!same?'<div class="sub">'+(viewed?'解答閲覧済':'')+(viewed&&!same?' ・ ':'')+(same?'':'別解')+'</div>':'')
  +mini(grid.map(p=>p.ch===null?null:p.x?'X':p.ch))+wl(cur.rows,cur.cols)
  +(same?'':'<div class="sub">出題時の解: '+sl.rows.join(' / ')+' ／ '+sl.cols.join(' / ')+'</div>'));
}
function setViewed(v){viewed=v;document.body.classList.toggle('v',v);}
function showAns(){const sl=solLines();open('解答',mini(sol.chars.map(c=>c))+wl(sl.rows,sl.cols));}
function solRuns(){
 const out=[];let cur=[];const get=i=>sol.chars[i];
 const scan=f=>{for(let k=0;k<=N;k++){const i=k<N?f(k):-1;if(i>=0&&get(i)!==null&&get(i)!=='X')cur.push(i);else{if(cur.length>=2)out.push({idx:cur,t:cur.map(get).join('')});cur=[];}}};
 for(let r=0;r<N;r++)scan(k=>r*N+k);
 for(let c=0;c<N;c++)scan(k=>k*N+c);
 return out;
}
function hintBoxes(){
 $('board').querySelectorAll('.hx').forEach(e=>e.remove());
 if(!hint||!sol)return;
 sol.chars.forEach((c,i)=>{if(c!=='X'&&!(c===null&&dyn()))return;const e=document.createElement('div');e.className='hx';e.style.left=((i%N)*S+1)+'px';e.style.top=(Math.floor(i/N)*S+1)+'px';$('board').appendChild(e);});
}
function setHint(v){
 hint=+v||0;$('ba').textContent=!hint?'ヒント':(dyn()&&hint==1)?'ヒント②':'解答';
 if(hint){const r=solRuns();solWords=new Set(r.map(x=>x.t));solKeys=new Set(r.map(x=>x.idx.join()+':'+x.t));}
 hintBoxes();if(grid.length)judge();
}
$('ba').onclick=()=>{
 if(!hint){
  open('ヒントを見ますか？','<div>'+(dyn()?'まず✕マスと〇マスの正しい位置だけが黄色い縁で示されます。色付きのヒントは次の段階です。':'正しい単語が完成すると黄色（正しい位置なら緑）で表示されます。発見語の正しい単語にも色が付きます。')+'</div><button id="yes">ヒントを見る</button>');
  $('yes').onclick=()=>{setHint(1);close();};return;}
 if(dyn()&&hint==1){
  open('ヒント②を見ますか？','<div>正しい単語が完成すると黄色（正しい位置なら緑）で表示されます。発見語の正しい単語にも色が付きます。</div><button id="yes">ヒント②を見る</button>');
  $('yes').onclick=()=>{setHint(2);close();};return;}
 if(viewed){showAns();return;}
 open('解答を見ますか？','<div>見ると、この問題には「解答閲覧済」と表示されます。</div><button id="yes">解答を見る</button>');
 $('yes').onclick=()=>{setViewed(true);showAns();};
};
function nextIdx(){
 const key='katakana15.seen.'+bk(),B=BANK[bk()];
 let seen=store.get(key,[]).filter(i=>i<B.length);
 let rest=B.map((_,i)=>i).filter(i=>!seen.includes(i));
 if(!rest.length){seen=[];rest=B.map((_,i)=>i);}
 const W0=bk()==6?4:bk(),isB=c=>c==='X'||c==='O';
 const st=s=>{let rows,g=s.replace(/\//g,'');
  if(s.includes('/'))rows=s.split('/');else{rows=[];let p=0;for(let r=0;r<W0-1;r++){rows.push(s.slice(p,p+W0));p+=W0;}rows.push(s.slice(p,p+W0-1));}
  const cols=[...Array(W0).keys()].map(c=>rows.slice(0,rows.length).map(x=>x[c]||'').join(''));
  const ex=L=>s.includes('/')?L.flatMap(l=>l.split(/[XO]/).filter(x=>x.length>=2)):L;
  const ws=ex(rows).concat(ex(cols)),ch=[...g].filter(c=>!isB(c));
  let ad=0;for(let i=0;i<g.length;i++){if(!isB(g[i]))continue;if(i%W0<W0-1&&isB(g[i+1]))ad++;if(i+W0<g.length&&isB(g[i+W0]))ad++;}
  return{dw:ws.length-new Set(ws).size,dc:ch.length-new Set(ch).size,ad};};
 let info=rest.map(i=>({i,...st(B[i])}));
 const nd=info.filter(x=>!x.dw);if(nd.length)info=nd;
 if(dyn()){const m=Math.min(...info.map(x=>x.ad));info=info.filter(x=>x.ad==m);}
 const mc=Math.min(...info.map(x=>x.dc));
 rest=info.map(x=>x.i);
 const w=info.map(x=>Math.pow(.4,x.dc-mc)*(bk()==4?1/Math.pow(1+(BSC[x.i]??3),2):1));let r=Math.random()*w.reduce((a,b)=>a+b,0),k=0;
 while(k<rest.length-1&&(r-=w[k])>0)k++;
 const i=rest[k];seen.push(i);store.set(key,seen);return i;
}
function newGame(){clearInterval(tm);tm=null;found=new Set();$('bf').textContent='発見語 0';sol=toSol(N,BANK[bk()][nextIdx()]);size();startFrom();}
$('bn').onclick=newGame;
let dl=4;
function dict(){
 const q=$('q')?$('q').value.trim():'';
 const P=new Set(GEN[dl]);
 let a=[...VAL[dl]].filter(w=>!q||w.includes(q));
 const n=a.length;a=a.slice(0,400);
 $('dl').innerHTML=a.map(w=>'<span class="'+(P.has(w)?'':'x')+'">'+w+'</span>').join('')+(n>400?'<span class="x">…他'+(n-400)+'語</span>':'');
 [2,3,4,5].forEach(k=>$('d'+k).classList.toggle('on',dl==k));
}
function vocab(){
 open('語彙（黒=出題語 / 灰=解答のみ許容）','<div class="tabs">'+[2,3,4,5].map(k=>'<button id="d'+k+'">'+k+'文字 '+VAL[k].size+'</button>').join('')+'</div><input id="q" placeholder="検索"><div class="tags" id="dl"></div>');
 [2,3,4,5].forEach(k=>$('d'+k).onclick=()=>{dl=k;dict();});$('q').oninput=dict;dict();
}
let fl=4;
function foundList(){
 const q=$('fq').value.trim();
 const a=[...found].filter(w=>w.length==fl&&(!q||w.includes(q))).sort((x,y)=>x.localeCompare(y,'ja'));
 $('fd').innerHTML=a.length?a.map(w=>'<span'+(HC()&&solWords.has(w)?' class="hy"':'')+'>'+w+'</span>').join(''):'<span class="x">まだありません</span>';
 [2,3,4,5].forEach(k=>$('f'+k).classList.toggle('on',fl==k));
}
$('bf').onclick=()=>{
 const cnt=k=>[...found].filter(w=>w.length==k).length;
 open('発見語 '+found.size+'語','<div class="tabs">'+[2,3,4,5].map(k=>'<button id="f'+k+'">'+k+'文字 '+cnt(k)+'</button>').join('')+'</div><input id="fq" placeholder="検索"><div class="tags" id="fd"></div>');
 [2,3,4,5].forEach(k=>$('f'+k).onclick=()=>{fl=k;foundList();});$('fq').oninput=foundList;foundList();
};
$('bm').onclick=()=>{
 const th=document.documentElement.getAttribute('data-theme');
 open('メニュー','<div class="sub">モード</div><div class="tabs">'+[3,4,6,5].map(k=>'<button data-m="'+k+'"'+(k==MODE?' class="on"':'')+'>'+(k==6?'4×4(✕)':k+'×'+k)+'</button>').join('')+'</div>'
  +'<div class="sub">その他</div><div class="tabs"><button id="mv">語彙</button></div>'
  +'<div class="sub">設定（表示）</div><div class="tabs"><button data-t="light"'+(th=='light'?' class="on"':'')+'>ライト</button><button data-t="dark"'+(th=='dark'?' class="on"':'')+'>ダーク</button></div>');
 document.querySelectorAll('#bd [data-m]').forEach(b=>b.onclick=()=>{const k=+b.dataset.m;close();if(k!==MODE){MODE=k;N=k==6?4:k;XM=k==6;store.set('katakana15.mode',MODE);grid=[];newGame();}});
 $('mv').onclick=vocab;
 document.querySelectorAll('#bd [data-t]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.t);document.querySelectorAll('#bd [data-t]').forEach(x=>x.classList.toggle('on',x===b));});
};
addEventListener('resize',size);
$('bf').textContent='発見語 '+found.size;
newGame();
function intro(){
 const s3=toSol(3,BANK[3][1]);
 const c4='Xカケス/ブロンズ/XリXキ/ケーキO'.replace(/\//g,'').split('').map(c=>c=='O'?null:c);
 const r4=[0,1,2,3].map(r=>c4.slice(r*4,r*4+4).map(c=>c===null?'O':c).join(''));
 const cs4=[0,1,2,3].map(c=>r4.map(r=>r[c]).join(''));
 const ex=L=>L.flatMap(l=>l.split(/[XO]/).filter(x=>x.length>=2));
 open('15cross の遊び方','<div>空きマス〇をドラッグすると、通った順にタイルがスライドします。タイルを動かして、縦と横の並びをすべてカタカナの単語にしましょう。</div>'
  +'<div><div class="sub">3×3 / 4×4</div>横・縦すべての列を単語にし、右下を空欄〇にすると完成です。</div>'
  +'<div><div class="sub">4×4(✕) / 5×5</div>✕は他のタイルと同じように動く黒マスです。✕と〇で区切られた2文字以上の並びがすべて単語になると完成で、〇の位置は問いません。✕どうしや✕と〇が隣り合うこともあります。</div>'
  +'<div>行・列の端の細い線は、その並びが単語になると濃くなります。</div>'
  +'<div class="sub">完成例　3×3</div>'+mini(s3.chars,3)+wl(s3.rows,s3.cols)
  +'<div class="sub">完成例　4×4(✕)</div>'+mini(c4.map(c=>c),4)+wl(ex(r4),ex(cs4))
  +'<button id="go">はじめる</button>');
 $('go').onclick=close;
}
$('bh').onclick=intro;
if(!store.get('15cross.intro',false)){store.set('15cross.intro',true);intro();}
