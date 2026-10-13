export const DOOR_DURATION=2.3;
export const DURATION=18;
export const chapters=[
 {start:3.2,end:7.3,title:'Мы верим, что стилист создаёт образы, а не коллажи.'},
 {start:7.5,end:11.8,title:'Достаточно прислать ссылку с маркетплейса — и вещь уже в капсуле.'},
 {start:12,end:16.8,title:'Готовый лукбук для клиента за 20 минут вместо двух часов.'}
] as const;
/** One uninterrupted dolly: gentle takeoff/landing, constant speed between them.
 * Caption boundaries never affect camera velocity. */
export function cameraProgress(t:number){
 const length=DURATION-DOOR_DURATION,ramp=.8;
 const elapsed=Math.max(0,Math.min(length,t-DOOR_DURATION));
 const integral=(v:number)=>v/2-ramp*Math.sin(Math.PI*v/ramp)/(2*Math.PI);
 const distance=length-ramp;
 if(elapsed<ramp)return integral(elapsed)/distance;
 if(elapsed>length-ramp)return 1-integral(length-elapsed)/distance;
 return (elapsed-ramp/2)/distance;
}
export function chapterOpacity(t:number,start:number,end:number){return Math.max(0,Math.min(1,(t-start)/.4,(end-t)/.4));}
