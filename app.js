import {auth,db} from './firebase-config.js';
import {createUserWithEmailAndPassword as signUp,signInWithEmailAndPassword as signIn,signOut,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {doc,setDoc,collection,addDoc,updateDoc,query,orderBy,limit,onSnapshot,arrayUnion,arrayRemove} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const F=['Tech','AI','E-commerce','EdTech','Content','Social Impact','Marketing'];
const CLS=['High School','College','Independent'],EX=['Just an idea','Building MVP','Launched','Earning revenue'];
const S={uid:null,view:'feed',filter:'All',peer:null,room:'Tech',q:'',auth:'login',edit:false,img:''};
let users={},posts=[],msgs=[],unsubs=[],unsubChat=null,ready=false;
const $=id=>document.getElementById(id),U=id=>users[id]||{name:'?'},me=()=>users[S.uid];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ago=t=>{const m=(Date.now()-t)/6e4|0;return m<1?'now':m<60?m+'m':m<1440?(m/60|0)+'h':(m/1440|0)+'d'};
const av=n=>`<span class="inline-flex w-9 h-9 rounded-full items-center justify-center text-white font-bold shrink-0" style="background:linear-gradient(135deg,#8b5cf6,#06b6d4)">${esc((n||'?')[0])}</span>`;
const fld=(l,id,t='text',v='')=>`<label class="block text-xs opacity-70 mt-2">${l}</label><input id="${id}" type="${t}" value="${esc(v)}" class="in">`;
const sel=(l,id,o,v='')=>`<label class="block text-xs opacity-70 mt-2">${l}</label><select id="${id}" class="in">${o.map(x=>`<option ${x==v?'selected':''}>${x}</option>`).join('')}</select>`;
const fields=(u={})=>fld('Full name','n','text',u.name)+fld('Age','a','number',u.age)+sel('Class / education','c',CLS,u.cls)+fld('Country','co','text',u.country||'India')+fld('Date of birth','dob','date',u.dob)+fld('Phone','ph','tel',u.phone)+sel('Field of interest','f',F,u.field)+fld('Short bio / vision','b','text',u.bio)+fld('Your startup idea','i','text',u.idea)+sel('Idea executed?','x',EX,u.exec);
const read=()=>({name:$('n').value.trim(),age:+$('a').value,cls:$('c').value,country:$('co').value,dob:$('dob').value,phone:$('ph').value,field:$('f').value,bio:$('b').value,idea:$('i').value,exec:$('x').value});
const theme=()=>document.documentElement.classList.toggle('dark',localStorage.fxTheme!=='light');
const dmId=()=>[S.uid,S.peer].sort().join('_');

// ---------- realtime ----------
function listen(){
  unsubs=[onSnapshot(collection(db,'users'),s=>{users={};s.forEach(d=>users[d.id]=d.data());ready=true;soft()}),
  onSnapshot(query(collection(db,'posts'),orderBy('ts','desc'),limit(100)),s=>{posts=s.docs.map(d=>({id:d.id,...d.data()}));soft()})];
}
function watchChat(){
  unsubChat&&unsubChat();msgs=[];if(!S.room&&!S.peer)return;
  const ref=S.room?collection(db,'rooms',S.room,'messages'):collection(db,'chats',dmId(),'messages');
  unsubChat=onSnapshot(query(ref,orderBy('ts'),limit(200)),s=>{msgs=s.docs.map(d=>d.data());const l=$('ml');if(l){l.innerHTML=msgList();l.scrollTop=1e6}});
}
function soft(){const a=document.activeElement;if(a&&['INPUT','TEXTAREA','SELECT'].includes(a.tagName))return;render()}

// ---------- auth ----------
onAuthStateChanged(auth,u=>{unsubs.forEach(f=>f());unsubChat&&unsubChat();S.uid=u?u.uid:null;ready=false;if(u)listen();render()});
const authV=()=>{const s=S.auth=='signup';return `<div class="g p-5 mt-10"><h1 class="text-3xl font-extrabold bg-clip-text text-transparent" style="background-image:linear-gradient(90deg,#a78bfa,#22d3ee,#34d399)">FoundX</h1><p class="opacity-70 text-sm">Share your startup journey. Day by day.</p>
${s?fields():''}${fld('Email','em','email')}${fld('Password (min 6)','pw','password')}
<button class="btn w-full mt-4" onclick="doAuth()">${s?'Create account':'Log in'}</button>
<p class="text-sm mt-3 text-center opacity-80 cursor-pointer" onclick="S.auth='${s?'login':'signup'}';render()">${s?'Have an account? Log in':'New here? Sign up'}</p></div>`};
const onboardV=()=>`<div class="g p-5 mt-10"><h2 class="text-xl font-bold">Complete your profile</h2>${fields()}<button class="btn w-full mt-4" onclick="saveProfile(true)">Continue</button></div>`;
async function doAuth(){const e=$('em').value.trim(),p=$('pw').value;
  try{if(S.auth=='signup'){const d=read();if(!d.name||!d.age)return alert('Name and age required');const c=await signUp(auth,e,p);await setDoc(doc(db,'users',c.user.uid),{...d,email:e,created:Date.now()})}else await signIn(auth,e,p)}catch(x){alert(x.message)}}
async function saveProfile(first){const d=read();if(!d.name)return alert('Name required');await setDoc(doc(db,'users',S.uid),{...d,email:auth.currentUser.email,created:Date.now()},{merge:true});S.edit=false;render()}

// ---------- posts ----------
async function post(){const t=$('pt').value.trim();if(!t&&!S.img)return;await addDoc(collection(db,'posts'),{uid:S.uid,t,img:S.img,likes:[],cm:[],ts:Date.now()});S.img='';render()}
function pick(f){if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,640/im.width),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);S.img=c.toDataURL('image/jpeg',.7);$('pv').innerHTML=`<img src="${S.img}" class="rounded-xl max-h-40 mt-2">`};im.src=r.result};r.readAsDataURL(f)}
const like=id=>{const p=posts.find(p=>p.id==id);updateDoc(doc(db,'posts',id),{likes:p.likes.includes(S.uid)?arrayRemove(S.uid):arrayUnion(S.uid)})};
const cmt=id=>{const t=$('c'+id).value.trim();if(t){$('c'+id).value='';updateDoc(doc(db,'posts',id),{cm:arrayUnion({uid:S.uid,t})})}};
const share=id=>{navigator.clipboard?.writeText(posts.find(p=>p.id==id).t);alert('Post text copied!')};
const postC=p=>`<div class="g p-4 mt-3"><div class="flex gap-3 items-center cursor-pointer" onclick="go('profile',{peer:'${p.uid}'})">${av(U(p.uid).name)}<div><b>${esc(U(p.uid).name)}</b> <span class="chip">${esc(U(p.uid).field)}</span><div class="text-xs opacity-60">${ago(p.ts)}</div></div></div>
<p class="mt-3 whitespace-pre-wrap">${esc(p.t)}</p>${p.img?`<img src="${p.img}" class="rounded-xl mt-2 max-w-full">`:''}
<div class="flex gap-5 mt-3 text-sm"><button onclick="like('${p.id}')">${p.likes.includes(S.uid)?'💜':'🤍'} ${p.likes.length}</button><span>💬 ${p.cm.length}</span><button onclick="share('${p.id}')">🔗 Share</button></div>
${p.cm.map(c=>`<p class="text-sm mt-2"><b>${esc(U(c.uid).name)}</b> ${esc(c.t)}</p>`).join('')}
<div class="flex gap-2 mt-2"><input id="c${p.id}" class="in" placeholder="Comment…"><button class="btn" onclick="cmt('${p.id}')">↵</button></div></div>`;
const feedV=()=>{let ps=[...posts];if(S.filter=='Trending')ps.sort((a,b)=>b.likes.length+b.cm.length-a.likes.length-a.cm.length);else if(S.filter!='All'&&S.filter!='Latest')ps=ps.filter(p=>U(p.uid).field==S.filter);
return `<div class="g p-4 mt-3"><textarea id="pt" class="in" rows="2" placeholder="Day ${posts.filter(p=>p.uid==S.uid).length+1} of my startup…"></textarea><div id="pv"></div>
<div class="flex justify-between mt-2"><label class="chip">📷 Image<input type="file" accept="image/*" hidden onchange="pick(this.files[0])"></label><button class="btn" onclick="post()">Post</button></div></div>
<div class="flex gap-2 flex-wrap mt-3">${['All','Latest','Trending',...F].map(f=>`<span class="chip ${S.filter==f?'on':''}" onclick="go('feed',{filter:'${f}'})">${f}</span>`).join('')}</div>${ps.map(postC).join('')||'<p class="mt-4 opacity-60">No posts yet. Be the first!</p>'}`};

// ---------- explore / chat / profile ----------
const list=()=>{const q=S.q.toLowerCase();return Object.entries(users).filter(([id,u])=>id!=S.uid&&[u.name,u.field,u.cls].join(' ').toLowerCase().includes(q)).map(([id,u])=>`<div class="g p-3 mt-3 flex items-center gap-3">${av(u.name)}<div class="flex-1 cursor-pointer" onclick="go('profile',{peer:'${id}'})"><b>${esc(u.name)}</b><div class="text-xs opacity-70">${esc(u.field)} · ${esc(u.cls)}</div></div><button class="btn" onclick="go('msgs',{peer:'${id}',room:null})">Chat</button></div>`).join('')||'<p class="mt-4 opacity-60">No matches.</p>'};
const exploreV=()=>`<input class="in mt-3" placeholder="Search by name, field or class…" value="${esc(S.q)}" oninput="S.q=this.value;$('sl').innerHTML=list()"><div id="sl">${list()}</div>`;
const msgList=()=>msgs.map(m=>`<div class="mb-2 ${m.uid==S.uid?'text-right':''}"><span class="text-xs opacity-60">${esc(U(m.uid).name)} · ${ago(m.ts)}</span><div class="px-3 py-1.5 rounded-2xl inline-block block ${m.uid==S.uid?'bg-violet-600 text-white':'g'}">${esc(m.t)}</div></div>`).join('')||'<p class="opacity-60 text-sm">Say hi 👋</p>';
const msgsV=()=>`<div class="flex gap-2 flex-wrap mt-3">${F.map(f=>`<span class="chip ${S.room==f?'on':''}" onclick="go('msgs',{room:'${f}'})">#${f}</span>`).join('')}</div>
<div class="flex gap-2 flex-wrap mt-2">${Object.entries(users).filter(([i])=>i!=S.uid).map(([i,u])=>`<span class="chip ${!S.room&&S.peer==i?'on':''}" onclick="go('msgs',{room:null,peer:'${i}'})">✉ ${esc((u.name||'').split(' ')[0])}</span>`).join('')}</div>
<div class="g p-3 mt-3 h-80 overflow-y-auto" id="ml">${msgList()}</div>
<div class="flex gap-2 mt-2"><input id="mt" class="in" placeholder="Message…" onkeydown="event.key=='Enter'&&send()"><button class="btn" onclick="send()">Send</button></div>`;
async function send(){const t=$('mt').value.trim();if(!t||(!S.room&&!S.peer))return;$('mt').value='';
  const ref=S.room?collection(db,'rooms',S.room,'messages'):collection(db,'chats',dmId(),'messages');await addDoc(ref,{uid:S.uid,t,ts:Date.now()})}
const profV=()=>{const id=S.peer||S.uid,u=U(id),own=id==S.uid;
  if(own&&S.edit)return `<div class="g p-4 mt-3"><h2 class="font-bold">Edit profile</h2>${fields(u)}<button class="btn mt-3" onclick="saveProfile()">Save</button></div>`;
  return `<div class="g p-5 mt-3"><div class="flex gap-3 items-center">${av(u.name)}<div><h2 class="text-xl font-bold">${esc(u.name)}</h2><span class="chip">${esc(u.field)}</span></div></div>
<p class="mt-3">${esc(u.bio)}</p><p class="text-sm opacity-70 mt-2">🎓 ${esc(u.cls)} · ${esc(u.age)} yrs · ${esc(u.country)}</p><p class="text-sm mt-2">💡 ${esc(u.idea||'—')} <span class="chip">${esc(u.exec)}</span></p>
<div class="mt-3">${own?'<button class="btn" onclick="S.edit=true;render()">Edit profile</button>':`<button class="btn" onclick="go('msgs',{room:null,peer:'${id}'})">Message</button>`}</div></div>${posts.filter(p=>p.uid==id).map(postC).join('')}`};

// ---------- shell ----------
function go(v,x={}){Object.assign(S,{view:v,edit:false},{peer:null},x);if(v=='msgs'){if(!x.room&&!x.peer)S.room=S.room||'Tech';watchChat()}render()}
function render(){theme();const a=$('app');
  if(!S.uid){a.innerHTML=authV();return}
  if(!ready){a.innerHTML='<p class="mt-20 text-center opacity-60">Loading…</p>';return}
  if(!me()){a.innerHTML=onboardV();return}
  const t=[['feed','Feed'],['explore','Explore'],['msgs','Messages'],['profile','Profile']];
  const body={feed:feedV,explore:exploreV,msgs:msgsV,profile:profV}[S.view]();
  a.innerHTML=`<nav class="g p-2 flex items-center gap-1 sticky top-2 z-10 flex-wrap"><b class="mr-auto px-2 bg-clip-text text-transparent" style="background-image:linear-gradient(90deg,#a78bfa,#22d3ee)">FoundX</b>${t.map(([v,l])=>`<button class="chip ${S.view==v?'on':''}" onclick="go('${v}')">${l}</button>`).join('')}
<button class="chip" onclick="localStorage.fxTheme=localStorage.fxTheme=='light'?'dark':'light';render()">🌗</button><button class="chip" onclick="signOutNow()">Logout</button></nav>${body}`;
  const l=$('ml');if(l)l.scrollTop=1e6}
Object.assign(window,{S,render,go,doAuth,saveProfile,post,pick,like,cmt,share,send,list,signOutNow:()=>signOut(auth)});
render();