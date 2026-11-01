// Exact native construction loops for components whose count varies continuously.
export function buildDynamic(THREE,kind,p,templates,group,deformNormals){
 if(kind!=='scroll-sofa-nails')throw new Error(`Unknown dynamic construction ${kind}`);
 const template=templates.get('nail1')?.object;if(!template)throw new Error('Missing nail template');
 let count=0;const r=p.nail_size/.0045;
 function nail(location,forward){
  const g=template.geometry.clone(),pos=g.attributes.position,before=pos.array.slice();
  for(let i=0;i<pos.count;i++){const x=before[i*3],y=before[i*3+1],z=before[i*3+2],tip=Math.hypot(x,y)<.00011;pos.setXYZ(i,x*(tip?1:r),y*(tip?1:r),z*r);}
  deformNormals(THREE,g,before);pos.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
  const material=Array.isArray(template.material)?template.material.map(m=>m.clone()):template.material.clone();
  const o=new THREE.Mesh(g,material);o.name=`nail${++count}`;o.position.fromArray(location);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...forward));o.castShadow=o.receiveShadow=true;group.add(o);
 }
 const W=p.width,D=p.depth,S=p.seat_height,R=p.arm_roll_radius,L=p.leg_height;
 const baseFront=-(D/2-.025),baseBack=D/2-.025,armFront=baseFront+.01,armBack=baseBack-.03,rollZ=S-.025+R*.25,armCX=W/2-.19/2;
 for(let x=-(W/2-.19-.06);x<=W/2-.19-.06+1e-6;x+=.031)nail([x,baseFront-.004,L+.045],[0,-1,0]);
 for(const side of [-1,1]){
  const cx=side*armCX,panelZ=rollZ-R*.28,mid=R*1.18+.015;
  for(let step=0;step<11;step++){const a=(-60+step*12)*Math.PI/180;nail([cx+mid*Math.sin(a)*.78,armFront-.029,panelZ-mid*Math.cos(a)],[0,-1,0]);}
  for(const px of [-1,1])for(let z=L+.03;z<=panelZ+.005-.008;z+=.034)nail([cx+px*(.19/2-.0225),armFront-.027,z],[0,-1,0]);
  for(let y=armFront+.06;y<=armBack-.08;y+=.034)nail([side*(W/2+.003),y,rollZ-R*.55],[side,0,0]);
 }
 return count;
}
