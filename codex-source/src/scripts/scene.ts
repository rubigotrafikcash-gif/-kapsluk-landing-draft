import * as T from 'three';
import {cameraProgress,DOOR_DURATION} from './choreography';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

/** All objects share one world, one perspective camera and one lighting setup. */
export function createWardrobe(host: HTMLElement) {
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.setSize(host.clientWidth,host.clientHeight);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.setClearColor(0xd8cbb8); renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
 host.appendChild(renderer.domElement);
 const scene=new T.Scene(); scene.fog=new T.FogExp2(0xd8cbb8,.043);
 const camera=new T.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.06,75);
 const warm=new T.HemisphereLight(0xfff6e4,0x786452,2.4);scene.add(warm);
 const key=new T.DirectionalLight(0xfff3d6,3.1);key.position.set(-5,9,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-6;key.shadow.camera.far=40;key.shadow.bias=-.0008;scene.add(key);
 const rim=new T.DirectionalLight(0xffe2b2,2);rim.position.set(3,6,-12);scene.add(rim);
 const fill=new T.PointLight(0xffdf9b,26,16,2);fill.position.set(0,3.8,-2);scene.add(fill);
 const far=new T.PointLight(0xffe8c8,40,22,2);far.position.set(-2,4,-14);scene.add(far);
 const mat=(color:number,roughness=.75,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const ivory=mat(0xe0d5bf), oak=mat(0x9e8464), brass=mat(0x807358,.25,.72), wall=mat(0xd7cab5);
 const box=(w:number,h:number,d:number,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=scene,round=0)=>{
  const g=round?new RoundedBoxGeometry(w,h,d,2,round):new T.BoxGeometry(w,h,d);
  const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const line=(points:T.Vector3[],radius:number,m:T.Material,parent:T.Object3D)=>{
  const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,radius,6,false),m);parent.add(mesh);return mesh;
 };
 // Full-height built-in cabinet, with a warm wooden threshold and real depth.
 box(30,.12,65,wall,0,-3.49,-18);
 box(30,20,.14,ivory,0,0,-35);
 box(14,12,.2,ivory,-8.62,1,0);box(14,12,.2,ivory,8.62,1,0);
 box(.13,6.92,3.4,ivory,-1.68,0,-1.65);box(.13,6.92,3.4,ivory,1.68,0,-1.65);
 box(3.5,.15,3.4,ivory,0,3.45,-1.65);box(3.5,.15,3.4,oak,0,-3.4,-1.65);
 // The centre remains open; shelving sits beside the camera's route.
 [-1,1].forEach(side=>{
  [-2.25,-.95,1.75].forEach(y=>box(.48,.09,2.7,oak,side*1.4,y,-1.7));
  box(.035,.035,2.9,brass,side*1.49,2.72,-1.8);
  box(.03,.018,2.8,new T.MeshBasicMaterial({color:0xffe9ae}),side*1.48,2.9,-1.8);
 });
 const doors:T.Group[]=[];
 for(const side of [-1,1]){
  const hinge=new T.Group();hinge.position.set(side*1.61,0,.03);scene.add(hinge);doors.push(hinge);
  const center=-side*.803;
  box(1.596,6.76,.14,ivory,center,0,0,hinge,.025);
  // Quiet, inset joinery. No floating outlines or tunnel frames.
  box(1.31,5.98,.024,mat(0xded2bd),center,0,.075,hinge,.016);
  const handleX=-side*1.46;
  box(.035,.73,.06,brass,handleX,-.18,.19,hinge,.016);
  box(.035,.035,.1,brass,handleX,.15,.12,hinge);
  box(.035,.035,.1,brass,handleX,-.5,.12,hinge);
 }
 // Subtle woven bump texture shared by all fabrics. No downloaded fashion assets.
 const cv=document.createElement('canvas');cv.width=128;cv.height=128;
 const ctx=cv.getContext('2d')!;const pix=ctx.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){let i=(y*128+x)*4;const n=122+((x%3===0)?18:0)+((y%3===0)?12:0);pix.data[i]=pix.data[i+1]=pix.data[i+2]=n;pix.data[i+3]=255;}ctx.putImageData(pix,0,0);
 const weave=new T.CanvasTexture(cv);weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(6,6);
 const cloth=(color:number)=>new T.MeshStandardMaterial({color,roughness:.87,side:T.DoubleSide,bumpMap:weave,bumpScale:.013});
 const sand=cloth(0xb99571),cream=cloth(0xe9dfca),ink=cloth(0x41453e),red=cloth(0x80392e),grey=cloth(0x8c8b7a);
 // Draped closed surfaces, with folds and varying silhouette, not billboard images.
 function drape(width:number,height:number,material:T.Material,kind:'skirt'|'torso',parent:T.Object3D){
  const radial=48,rows=30,positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=rows;j++){const v=j/rows;for(let i=0;i<=radial;i++){
   const a=i/radial*Math.PI*2;
   const flare=kind==='skirt'?.55+.5*v:1-.16*Math.sin(v*Math.PI)+.05*v;
   const fold=Math.sin(a*9+v*.65)*(.012+v*.027)+Math.sin(a*17-v)*.008;
   const rx=width*.5*flare+fold,rz=(kind==='skirt'?.17+.1*v:.16)+fold;
   positions.push(Math.cos(a)*rx,-height*v+.012*Math.sin(a*7)*v,Math.sin(a)*rz);
   uv.push(i/radial,v);
   if(j<rows&&i<radial){let n=j*(radial+1)+i;indices.push(n,n+1,n+radial+1,n+1,n+radial+2,n+radial+1);}
  }}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
 }
 function patch(points:number[][],material:T.Material,parent:T.Object3D){const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));s.closePath();const mesh=new T.Mesh(new T.ShapeGeometry(s),material);mesh.position.z=.19;parent.add(mesh);return mesh;}
 function hanger(parent:T.Object3D,width:number){
  line([new T.Vector3(-width*.44,0,0),new T.Vector3(0,.25,0),new T.Vector3(width*.44,0,0),new T.Vector3(-width*.44,0,0)],.016,brass,parent);
  line([new T.Vector3(0,.25,0),new T.Vector3(0,.35,0),new T.Vector3(.065,.44,0),new T.Vector3(.01,.51,0),new T.Vector3(-.065,.46,0)],.012,brass,parent);
 }
 function jacket(material:T.Material,long=false){
  const g=new T.Group(),w=.92,h=long?1.75:1.08;drape(w,h,material,'torso',g);hanger(g,w);
  for(const side of [-1,1]){
   const sleeve=new T.Group();sleeve.position.set(side*.4,-.06,0);sleeve.rotation.z=side*.2;g.add(sleeve);drape(.31,long?1.05:.8,material,'torso',sleeve);
   patch([[side*.07,.02],[side*.26,-.12],[side*.16,-.55],[side*.02,-.2]],material,g);
   if(long)box(.26,.03,.035,material,side*.25,-.98,.2,g);
  }
  for(let j=0;j<3;j++){const b=new T.Mesh(new T.SphereGeometry(.023,8,6),brass);b.position.set(.035,-.45-j*.22,.18);g.add(b);}
  return g;
 }
 function skirt(material:T.Material){const g=new T.Group();drape(1.18,1.2,material,'skirt',g);box(.63,.07,.29,material,0,0,0,g,.02);hanger(g,.68);return g;}
 function bag(){const g=new T.Group();box(.63,.46,.25,mat(0x6e4630,.6),0,-.2,0,g,.065);line([new T.Vector3(-.2,0,0),new T.Vector3(-.16,.27,0),new T.Vector3(.16,.27,0),new T.Vector3(.2,0,0)],.028,brass,g);box(.09,.06,.02,brass,0,-.17,.14,g,.01);return g;}
 const clothes:T.Group[]=[];
 const specs=[[-1.07,1.15,-1.25,0],[1.05,1.25,-1.8,1],[-1.28,.45,-4.4,2],[1.35,1.45,-6.8,3],[-1.35,1.18,-9.2,4],[1.45,.85,-11.8,0],[-1.45,.25,-14,2],[1.6,1.35,-16.3,1]];
 specs.forEach(([x,y,z,type],i)=>{const g=type===2?skirt(i%2?grey:ink):type===3?bag():jacket(type===0?sand:type===1?cream:red,type===0);g.position.set(x,y,z);g.rotation.y=(i%2?-.22:.28);g.rotation.z=(i%2?.035:-.045);scene.add(g);clothes.push(g);});
 // Objects already in the opened wardrobe remain in place as the camera passes.
 const b=bag();b.scale.setScalar(.6);b.position.set(1.4,2.12,-1.2);scene.add(b);
 [-1,1].forEach(side=>{for(let i=0;i<3;i++)box(.4,.095,.55,i%2?cream:grey,side*1.4,-.87+i*.095,-1.65,scene,.03);});
 // Air catches the light without expensive postprocessing passes.
 const dustG=new T.BufferGeometry(),dust:number[]=[];let seed=29;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 for(let i=0;i<150;i++)dust.push((random()-.5)*7,(random()-.5)*6,-random()*27);
 dustG.setAttribute('position',new T.Float32BufferAttribute(dust,3));const dustM=new T.PointsMaterial({color:0xfff6da,size:.022,transparent:true,opacity:.43,depthWrite:false});scene.add(new T.Points(dustG,dustM));
 const rayMat=new T.MeshBasicMaterial({color:0xffe9bf,transparent:true,opacity:.018,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
 for(let i=0;i<4;i++){const g=new T.PlaneGeometry(.18+i*.04,10);const ray=new T.Mesh(g,rayMat);ray.position.set(-.6+i*.43,.1,-3.3-i*3);ray.rotation.z=-.2;scene.add(ray);}
 let startZ=9;let progress=0;let pointerX=0,pointerY=0;let driftX=0,driftY=0;let motion=true;let disposed=false;
 // A tiny preview uses the actual 3D doors, not an overlay. Latch its angle when opening starts.
 let idlePeek=0,travelStartPeek=0,traveling=false;
 function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;startZ=Math.max(8.7,1.88/(Math.tan(T.MathUtils.degToRad(21))*camera.aspect));camera.updateProjectionMatrix();renderer.setSize(w,h);render(progress);}
 const smooth=(a:number,b:number,t:number)=>{const p=T.MathUtils.clamp((t-a)/(b-a),0,1);return p*p*(3-2*p);};
 function render(t:number){if(disposed)return;progress=t;
  const doorProgress=smooth(0,DOOR_DURATION,t);
  const opening=traveling?T.MathUtils.lerp(travelStartPeek,1,doorProgress):t>0?doorProgress:idlePeek;
  const travel=cameraProgress(t);
  doors[0].rotation.y=-opening*1.62;doors[1].rotation.y=opening*1.62;
  const z=T.MathUtils.lerp(startZ,-18.8,travel);
  const curve=Math.sin(travel*Math.PI*2)*.19;
  driftX+=(pointerX-driftX)*.05;driftY+=(pointerY-driftY)*.05;
  camera.position.set(curve+(motion?driftX*.09:0),.15+Math.sin(travel*Math.PI)*.23+(motion?driftY*.05:0),z);
  camera.lookAt(curve*.4,.08,z-8);
  clothes.forEach((g,i)=>{g.rotation.z=(i%2?.035:-.045)+(motion?Math.sin(t*.75+i)*.018*travel:0);});
  key.intensity=3.1-travel*.9;warm.intensity=2.4+travel*.35;
  renderer.render(scene,camera);
 }
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const pointer=(e:PointerEvent)=>{if(e.pointerType!=='mouse')return;pointerX=e.clientX/innerWidth*2-1;pointerY=1-e.clientY/innerHeight*2;};window.addEventListener('pointermove',pointer,{passive:true});
 return {render,setMotion:(v:boolean)=>{motion=v;},
  setIdlePeek:(v:number)=>{idlePeek=T.MathUtils.clamp(v,0,.12);if(!traveling)render(0);},
  beginTravel:()=>{travelStartPeek=idlePeek;traveling=true;},
  resetTravel:()=>{traveling=false;idlePeek=0;travelStartPeek=0;render(0);},
  canvas:renderer.domElement,dispose:()=>{disposed=true;observer.disconnect();window.removeEventListener('pointermove',pointer);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();}});renderer.dispose();}};
}
