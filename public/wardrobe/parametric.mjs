// Browser-only geometry responses. No Python or Blender service is called.
import {buildDynamic} from './dynamic.mjs';
async function resource(url, gzip=false) {
  const r=await fetch(url); if(!r.ok) throw new Error(`Asset resource ${r.status}: ${url}`);
  return gzip ? new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer() : r.json();
}
export async function attachParameters(THREE, root, spec, base, initial={}) {
  const schema=spec.parameterSchema, defaults=Object.fromEntries(Object.entries(schema).map(([k,v])=>[k,v.default]));
  const data=await resource(new URL('response.json',base));
  const originalSetState=root.setState.bind(root), originalPrepare=root.prepareState.bind(root), originalDispose=root.dispose.bind(root);
  const originalGroups=[...root.children];
  const templates=new Map(), pending=new Map();
  let committed={...defaults}, desired={...defaults}, state=root.userData.state, desiredState=state, token=0, disposed=false, live=null;
  const active=new Set();
  function check(patch, current) {
    const out={...current};
    for(const [key,value] of Object.entries(patch)) {
      const d=schema[key]; if(!d) throw new RangeError(`Unknown parameter: ${key}`);
      if(d.enum ? !d.enum.includes(value) : typeof value!=='number'||!Number.isFinite(value)||value<d.min||value>d.max||(d.type==='integer'&&!Number.isInteger(value))) throw new RangeError(`Invalid ${key}: ${value}`);
      out[key]=value;
    }
    if(data.link) {
      const l=data.link;
      if(Object.hasOwn(patch,l.count)&&!Object.hasOwn(patch,'seat_count_mode'))out.seat_count_mode='manual';
      if(out.seat_count_mode==='auto') {
        let net=out[l.width];
        if(l.arc)net*=out[l.arc]*Math.PI/180;
        for(const s of l.subtract||[])net-=s.key?out[s.key]*(s.factor??1):s.constant;
        out[l.count]=Math.max(l.min,Math.min(l.max,Math.floor(net/out.target_seat_width+.5)));
      }
    }
    return out;
  }
  function free(group) { if(!group)return;group.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();}});group.removeFromParent(); }
  async function prepared(name) {
    if(!templates.has(name))templates.set(name,(async()=>{
      await originalPrepare(name);await originalSetState(name);root.updateMatrixWorld(true);
      const group=root.children.find(g=>g.name===`state:${name}`), map=new Map();
      if(!group)throw new Error(`Missing state template ${name}`);
      const inv=root.matrixWorld.clone().invert();
      group.traverse(o=>{if(o.isMesh||o.name.startsWith('socket:'))map.set(o.name,{object:o,matrix:new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)});});
      group.visible=false;return map;
    })().catch(e=>{templates.delete(name);throw e;}));
    return templates.get(name);
  }
  function array(buffer,d){return new (d.type==='u32'?Uint32Array:Float32Array)(buffer,d.offset,d.length/4);}
  function expression(e,p) {
    if(typeof e==='number')return e;if(typeof e==='string')return p[e];
    const [op,...children]=e,a=children.map(x=>expression(x,p));
    switch(op){case '+':return a.reduce((x,y)=>x+y,0);case '-':return a[0]-a[1];case '*':return a.reduce((x,y)=>x*y,1);case '/':return a[0]/a[1];case 'max':return Math.max(...a);case 'min':return Math.min(...a);case '>':return +(a[0]>a[1]);case 'sin':return Math.sin(a[0]);case 'cos':return Math.cos(a[0]);default:throw new Error(`Unsupported expression ${op}`);}
  }
  async function build(p,name) {
    const effective={...Object.fromEntries(data.keys.map((k,i)=>[k,data.centers[i]])),...p};
    const model=data.models.find(m=>m.state===name&&Object.entries(m.variant).every(([k,v])=>p[k]===v)&&(!m.bounds||data.keys.every((k,i)=>effective[k]>=m.bounds[0][i]-1e-9&&effective[k]<=m.bounds[1][i]+1e-9)));
    if(!model)throw new RangeError('Unsupported parameter/state combination');
    const tm=await prepared(name);
    if(!pending.has(model.file))pending.set(model.file,resource(new URL(model.file,base),true).catch(e=>{pending.delete(model.file);throw e;}));
    const buffer=await pending.get(model.file), u=data.keys.map((k,i)=>(effective[k]-(model.centers??data.centers)[i])/(model.scales??data.scales)[i]);
    for(const f of data.features||[])u.push((expression(f.expression,p)-expression(f.expression,defaults))/(f.scale??1));
    const group=new THREE.Group();group.name=`parameters:${name}`;
    try {
      for(const part of model.parts) {
        const template=tm.get(part.template);if(!template)throw new Error(`Missing template ${part.template}`);
        const old=template.object;
        const positions=new Float32Array(array(buffer,part.base)), mapping=array(buffer,part.map);
        for(const term of part.terms) {
          const factor=term.powers.reduce((n,i)=>n*u[i],1);if(Math.abs(factor)<1e-15)continue;
          const values=array(buffer,term.values);for(let i=0;i<positions.length;i++)positions[i]+=values[i]*factor;
        }
        if(part.socket){const socket=new THREE.Group();socket.name=part.name;socket.position.fromArray(positions);socket.userData={...old.userData};group.add(socket);continue;}
        const g=old.geometry.clone();g.applyMatrix4(template.matrix);
        const attr=g.getAttribute('position'), before=attr.array.slice();
        for(let i=0;i<mapping.length;i++)for(let j=0;j<3;j++)attr.array[3*i+j]=positions[3*mapping[i]+j];
        deformNormals(THREE,g,before);attr.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
        const mats=(Array.isArray(old.material)?old.material:[old.material]).map(m=>m?.clone());
        for(const [key,control] of Object.entries(data.materialControls||{}))for(const m of mats){
          if(!m||!new RegExp(control.match,'i').test([m.name,m.userData.family,m.userData.finish_id].join(' ')))continue;
          const ratio=control.expression?expression(control.expression,p):p[key]/schema[key].default;
          // Three multiplies this uniform by the retained roughness texture
          // before the physical shader clamps the resulting surface roughness.
          if(control.property==='roughness')m.roughness=Math.max(0,m.roughness*ratio);
          else if(control.property==='color')m.color.multiplyScalar(ratio);
        }
        const mesh=new THREE.Mesh(g,Array.isArray(old.material)?mats:mats[0]);mesh.name=part.name;mesh.userData={...old.userData,assetNode:part.name};mesh.castShadow=old.castShadow;mesh.receiveShadow=old.receiveShadow;mesh.visible=old.visible;
        group.add(mesh);
      }
      if(data.dynamic)buildDynamic(THREE,data.dynamic,p,tm,group,deformNormals);
      return group;
    } catch(e){free(group);throw e;}
  }
  async function apply(p,name,request) {
    const group=await build(p,name);
    if(disposed||request!==token){free(group);return root;}
    for(const g of originalGroups)g.visible=false;
    for(const g of root.children)if(g.name.startsWith('state:'))g.visible=false;
    free(live);live=group;root.add(group);committed={...p};state=name;root.userData.state=name;root.userData.params={...p};root.updateMatrixWorld(true);
    return root;
  }
  function submit(p,name) {
    if(disposed)throw new Error('Asset has been disposed');
    desired=p;desiredState=name;const request=++token;
    const job=apply(p,name,request).catch(e=>{if(request===token){desired={...committed};desiredState=state;}throw e;});
    active.add(job);job.finally(()=>active.delete(job)).catch(()=>{});return job;
  }
  root.parameterSchema=schema;root.getParams=()=>({...committed});
  root.updateParams=patch=>submit(check(patch,desired),desiredState);
  root.resetParams=()=>submit(check({},defaults),desiredState);
  root.setState=name=>{if(!spec.availableStates.includes(name))throw new RangeError(`Unknown state: ${name}`);return submit({...desired},name);};
  root.getStateObject=name=>live?.getObjectByName(name);
  root.dispose=async()=>{if(disposed)return;disposed=true;++token;await Promise.allSettled([...active]);free(live);pending.clear();await originalDispose();};
  await submit(check(initial,defaults),state);return root;
}
// Transport the saved split/weighted normals through each deformed triangle.
// This retains original smooth/crease normals instead of flattening UV seams.
function deformNormals(THREE,g,before) {
  const pos=g.attributes.position.array, normal=g.attributes.normal;if(!normal)return;
  const oldNormals=normal.array.slice(), sums=new Float64Array(normal.array.length), counts=new Uint32Array(pos.length/3), index=g.index?.array;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),d=new THREE.Vector3(),n=new THREE.Vector3(),q=new THREE.Vector3();
  const oldFrame=new THREE.Matrix3(),newFrame=new THREE.Matrix3(),transform=new THREE.Matrix3();
  const length=index?index.length:pos.length/3;
  for(let t=0;t<length;t+=3) {
    const ids=index?[index[t],index[t+1],index[t+2]]:[t,t+1,t+2], [i,j,k]=ids.map(v=>3*v);
    a.set(before[j]-before[i],before[j+1]-before[i+1],before[j+2]-before[i+2]);b.set(before[k]-before[i],before[k+1]-before[i+1],before[k+2]-before[i+2]);
    c.set(pos[j]-pos[i],pos[j+1]-pos[i+1],pos[j+2]-pos[i+2]);d.set(pos[k]-pos[i],pos[k+1]-pos[i+1],pos[k+2]-pos[i+2]);
    n.crossVectors(a,b);q.crossVectors(c,d);if(n.lengthSq()<1e-24||q.lengthSq()<1e-24)continue;n.normalize();q.normalize();
    oldFrame.set(a.x,b.x,n.x,a.y,b.y,n.y,a.z,b.z,n.z);newFrame.set(c.x,d.x,q.x,c.y,d.y,q.y,c.z,d.z,q.z);
    transform.multiplyMatrices(newFrame,oldFrame.invert()).invert().transpose();
    for(const v of ids){n.fromArray(oldNormals,3*v).applyMatrix3(transform).normalize();sums[3*v]+=n.x;sums[3*v+1]+=n.y;sums[3*v+2]+=n.z;counts[v]++;}
  }
  for(let i=0;i<counts.length;i++)if(counts[i]){n.fromArray(sums,3*i).normalize();normal.setXYZ(i,n.x,n.y,n.z);}
  normal.needsUpdate=true;
}
