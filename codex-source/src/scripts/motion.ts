import {DURATION,chapters,chapterOpacity} from './choreography';
const root=document.documentElement;
const fusion=root.classList.contains('fusion-concept');
const experience=document.getElementById('experience')!;
const open=document.getElementById('open-wardrobe') as HTMLButtonElement;
const skip=document.getElementById('skip-story') as HTMLButtonElement;
const pause=document.getElementById('pause') as HTMLButtonElement;
const message=document.getElementById('load-state')!;
const status=document.getElementById('story-status')!;
const final=document.getElementById('final-screen')!;
const chrome=[...document.querySelectorAll<HTMLElement>('.chrome')];
final.inert=true;chrome.forEach(e=>e.inert=true);
const params=new URLSearchParams(location.search);
const forced=params.get('motion')==='1';
const preference=matchMedia('(prefers-reduced-motion: reduce)');
let storedReduced=false;
try{storedReduced=['0','off','reduce','reduced'].includes(localStorage.getItem('kapsluk-motion')||'');}catch{}
let reduced=!forced&&(preference.matches||storedReduced);
root.classList.toggle('forced-motion',forced);
root.dataset.motionMode=forced?'forced':reduced?'reduced':'full';
if(forced&&!fusion){
 const badge=document.createElement('span');
 badge.className='motion-mode';
 badge.textContent='Forced motion';
 badge.setAttribute('aria-label','Анимация принудительно включена');
 document.body.append(badge);
}
let state:'closed'|'travel'|'final'='closed';
let scene:ReturnType<typeof import('./scene').createWardrobe>|null=null;
let elapsed=0,last=0,paused=false,frame=0;
const captions=[...document.querySelectorAll<HTMLElement>('.chapter')];let activeChapter=-1;
function showChapters(t:number){captions.forEach((e,i)=>{const c=chapters[i],a=chapterOpacity(t,c.start,c.end);e.style.opacity=String(a);e.style.visibility=a>0?'visible':'hidden';e.setAttribute('aria-hidden',String(a===0));if(a===1&&activeChapter!==i){activeChapter=i;status.textContent=c.title;}});}
let pointer:{x:number,y:number}|null=null;
// Invitation: a real 3D peek, rest, and close. Active only on the fusion concept.
let idleFrame=0,idleEpoch=0,lastIdlePaint=0;
const peekEase=(t:number)=>t*t*(3-2*t);
function peekAt(now:number){
 const phase=((now-idleEpoch)/1000)%7;
 if(phase<1.1)return 0;
 if(phase<2.3)return .12*peekEase((phase-1.1)/1.2);
 if(phase<2.9)return .12;
 if(phase<4.3)return .12*(1-peekEase((phase-2.9)/1.4));
 return 0;
}
function idleTick(now:number){
 idleFrame=0;
 if(!fusion||state!=='closed'||reduced||!scene||document.hidden)return;
 if(!lastIdlePaint||now-lastIdlePaint>=40){scene.setIdlePeek(peekAt(now));lastIdlePaint=now;}
 idleFrame=requestAnimationFrame(idleTick);
}
function startIdleHint(){
 if(!fusion||state!=='closed'||reduced||!scene||document.hidden||idleFrame)return;
 idleEpoch=performance.now();lastIdlePaint=0;idleFrame=requestAnimationFrame(idleTick);
}
function stopIdleHint(reset=false){
 cancelAnimationFrame(idleFrame);idleFrame=0;
 if(reset)scene?.setIdlePeek(0);
}
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);stopIdleHint();});
function finish(focus=true){stopIdleHint();state='final';cancelAnimationFrame(frame);scene?.render(DURATION);showChapters(0);experience.dataset.state=state;final.inert=false;chrome.forEach(e=>e.inert=false);open.disabled=true;pause.hidden=true;status.textContent='КАПСЛУК: собирайте капсулы для клиентов в Telegram.';if(focus)document.getElementById('final-title')!.focus({preventScroll:true});}
function tick(now:number){if(state!=='travel')return;if(last&&!paused&&!document.hidden)elapsed+=Math.min((now-last)/1000,.06);last=now;scene?.render(elapsed);showChapters(elapsed);if(elapsed>=DURATION){finish();return;}frame=requestAnimationFrame(tick);}
function start(){if(state!=='closed')return;if(reduced||!scene){finish();return;}stopIdleHint();scene.beginTravel();state='travel';experience.dataset.state=state;open.disabled=true;open.setAttribute('aria-expanded','true');elapsed=0;last=0;paused=false;pause.textContent='Пауза';pause.hidden=false;status.textContent='Шкаф открывается. Начинается путешествие между вещами.';frame=requestAnimationFrame(tick);}
function restart(){cancelAnimationFrame(frame);state='closed';elapsed=0;last=0;paused=false;experience.dataset.state=state;final.inert=true;chrome.forEach(e=>e.inert=true);open.disabled=false;open.setAttribute('aria-expanded','false');scene?.resetTravel();scene?.render(0);showChapters(0);activeChapter=-1;pause.hidden=true;status.textContent='Шкаф закрыт.';open.focus({preventScroll:true});startIdleHint();}
open.addEventListener('click',start);
open.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};open.setPointerCapture(e.pointerId);});
open.addEventListener('pointermove',e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>28){pointer=null;start();}});
open.addEventListener('pointerup',()=>pointer=null);open.addEventListener('pointercancel',()=>pointer=null);
skip.addEventListener('click',()=>finish());
pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Продолжить':'Пауза';pause.setAttribute('aria-pressed',String(paused));});
document.getElementById('restart')!.addEventListener('click',restart);
document.getElementById('brand')!.addEventListener('click',e=>{e.preventDefault();restart();});
preference.addEventListener('change',()=>{reduced=!forced&&(preference.matches||storedReduced);root.dataset.motionMode=forced?'forced':reduced?'reduced':'full';scene?.setMotion(!reduced);if(reduced){stopIdleHint(true);if(state==='travel')finish();}else if(state==='closed')startIdleHint();});
document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)stopIdleHint();else if(state==='closed')startIdleHint();});
const dialogs=[...document.querySelectorAll<HTMLDialogElement>('dialog')];
let returnFocus:HTMLElement|null=null;
const dialogParents=new WeakMap<HTMLDialogElement,{dialog:HTMLDialogElement,trigger:HTMLElement}>();
document.querySelectorAll<HTMLButtonElement>('[data-dialog]').forEach(b=>b.addEventListener('click',()=>{
 const d=document.getElementById('dialog-'+b.dataset.dialog) as HTMLDialogElement;
 const parent=b.closest<HTMLDialogElement>('dialog');
 if(parent)dialogParents.set(d,{dialog:parent,trigger:b});else returnFocus=b;
 dialogs.forEach(x=>{if(x.open)x.close();});
 d.showModal();
}));
dialogs.forEach(d=>{
 d.querySelector('.close')!.addEventListener('click',()=>d.close());
 d.addEventListener('close',()=>{
  const parent=dialogParents.get(d);
  if(parent){dialogParents.delete(d);if(!dialogs.some(x=>x.open)){parent.dialog.showModal();parent.trigger.focus();}return;}
  if(!dialogs.some(x=>x.open)&&returnFocus)returnFocus.focus();
 });
 d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
});
let timedOut=false;
const watchdog=setTimeout(()=>{timedOut=true;root.classList.add('ready','fallback');message.textContent='3D-сцена загружается дольше обычного. Можно перейти к сервису.';},12000);
import('./scene').then(({createWardrobe})=>{
 scene=createWardrobe(document.getElementById('stage')!);clearTimeout(watchdog);root.classList.remove('fallback');root.classList.add('ready');scene.setMotion(!reduced);scene.render(state==='final'?DURATION:0);startIdleHint();
 scene.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);scene=null;root.classList.add('fallback');message.textContent='3D недоступно. Нажмите «Пропустить», чтобы продолжить.';if(state==='travel')finish();});
 if(timedOut)message.textContent='';
}).catch(()=>{clearTimeout(watchdog);root.classList.add('ready','fallback');message.textContent='3D недоступно в этом браузере. Нажмите, чтобы перейти к сервису.';});
// Development-only worst-case fixture; never included in production bundles.
if(import.meta.env.DEV&&params.get('data')==='worst'){
 document.querySelector('.final-intro')!.textContent='Добавляйте выбранные вещи и собирайте подробный PDF-лукбук для клиента Александры Вишневской-Ковальчук.';
 document.querySelector<HTMLAnchorElement>('.primary')!.firstChild!.textContent='Открыть бот для создания капсулы в Telegram ';
 root.style.fontSize='36px';
}
