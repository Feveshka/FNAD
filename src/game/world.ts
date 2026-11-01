import * as THREE from 'three';
import { ROOM } from './config';
import { buildHouse, CAM_VIEWS } from './house';

export interface WardrobeAsset extends THREE.Group {
  setState?: (name: string) => Promise<void>;
  dispose?: () => Promise<void>;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const mat = (color: number, roughness = 0.85, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(parent: THREE.Object3D, material: THREE.Material, size: [number, number, number], pos: [number, number, number], name = '') {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.scale.set(...size);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function wallpaperTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#303634'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? '#343a37' : '#2c3230'; x.fillRect(i * 32, 0, 32, 256);
    x.strokeStyle = 'rgba(170,165,135,.09)'; x.lineWidth = 2;
    for (let y = 16; y < 256; y += 64) {
      x.beginPath(); x.moveTo(i * 32 + 16, y); x.bezierCurveTo(i * 32 + 30, y + 12, i * 32 + 2, y + 28, i * 32 + 16, y + 40); x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function floorTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const x = c.getContext('2d')!; x.fillStyle = '#2b211b'; x.fillRect(0, 0, 512, 512);
  let seed = 73;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
    const px = col * 170 + (row % 2) * 85, py = row * 64;
    const v = Math.floor(31 + rnd() * 18);
    x.fillStyle = `rgb(${v + 13},${v + 3},${v - 3})`; x.fillRect(px + 2, py + 2, 166, 60);
    x.strokeStyle = 'rgba(8,5,3,.45)'; x.strokeRect(px + 1, py + 1, 168, 62);
    for (let g = 0; g < 5; g++) { x.strokeStyle = 'rgba(130,100,65,.06)'; x.beginPath(); x.moveTo(px + 8, py + 10 + g * 9); x.lineTo(px + 160, py + 8 + g * 9 + rnd() * 6); x.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class World {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, 1, 0.05, 45);
  flashlight: THREE.SpotLight;
  doorPivot = new THREE.Group();
  dad = new THREE.Group();
  wardrobe: WardrobeAsset | null = null;
  wardrobeDoors: THREE.Group;
  dust: THREE.Points;
  secCam = new THREE.PerspectiveCamera(75, 16 / 9, 0.05, 45);
  tabletPoint = new THREE.Vector3(-0.55, 1.0, -2.95);
  tvPoint = new THREE.Vector3(2.45, 0.82, 3.16);
  private tablet = new THREE.Group();
  private tvVideoMat: THREE.MeshBasicMaterial;
  private tvScreenMat: THREE.MeshStandardMaterial;
  private tvLight: THREE.PointLight;
  private tvOn = false;
  private wardrobeBase = new THREE.Vector3(-3.47, 0, -0.4);
  private wardrobeTarget: 'open' | 'closed' = 'closed';
  private wardrobeCurrent: 'open' | 'closed' = 'closed';
  private wardrobeBusy = false;
  private fallbackDoor = new THREE.Group();
  private faceMaterial: THREE.MeshBasicMaterial;
  private leftLeg = new THREE.Group();
  private rightLeg = new THREE.Group();
  private doorAngle = 0;
  private walkTime = 0;

  constructor() {
    this.scene.background = new THREE.Color(0x050708);
    this.scene.fog = new THREE.FogExp2(0x070a0b, 0.045);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallpaperTexture(), color: 0x9a9b90, roughness: 1 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.82, color: 0xb9a18d });
    const wood = mat(0x2b1c16, 0.78), trim = mat(0x171919), fabric = mat(0x343c3e), pale = mat(0x8d897b);
    box(this.scene, floorMat, [ROOM.width, 0.12, ROOM.depth], [0, -0.08, 0]);
    box(this.scene, mat(0x252827), [ROOM.width, 0.12, ROOM.depth], [0, ROOM.height + 0.05, 0]);
    box(this.scene, wallMat, [ROOM.width, ROOM.height, 0.12], [0, ROOM.height / 2, -ROOM.depth / 2]);
    box(this.scene, wallMat, [ROOM.width, ROOM.height, 0.12], [0, ROOM.height / 2, ROOM.depth / 2]);
    box(this.scene, wallMat, [0.12, ROOM.height, ROOM.depth], [-ROOM.width / 2, ROOM.height / 2, 0]);
    const side = (ROOM.depth - ROOM.doorWidth) / 2;
    box(this.scene, wallMat, [0.12, ROOM.height, side], [ROOM.width / 2, ROOM.height / 2, -(ROOM.doorWidth + side) / 2]);
    box(this.scene, wallMat, [0.12, ROOM.height, side], [ROOM.width / 2, ROOM.height / 2, (ROOM.doorWidth + side) / 2]);
    box(this.scene, wallMat, [0.12, ROOM.height - ROOM.doorHeight, ROOM.doorWidth], [ROOM.width / 2, ROOM.doorHeight + (ROOM.height - ROOM.doorHeight) / 2, 0]);
    // Skirting and ceiling trim give the small room a grounded scale.
    for (const z of [-3.42, 3.42]) box(this.scene, trim, [7.9, 0.11, 0.08], [0, 0.08, z]);
    for (const x of [-3.92, 3.92]) box(this.scene, trim, [0.08, 0.11, 6.8], [x, 0.08, 0]);
    // Весь дом за дверью: коридор и пять комнат для камер.
    buildHouse(this.scene, { floorMat, wallMat });
    const corridorGlow = new THREE.PointLight(0x6d7d78, 1.3, 5, 2); corridorGlow.position.set(6.5, 2.4, 0); this.scene.add(corridorGlow);
    // Door, frame, handle.
    this.doorPivot.position.set(3.94, 0, -0.65); this.scene.add(this.doorPivot);
    box(this.doorPivot, wood, [0.09, ROOM.doorHeight, 1.28], [0, ROOM.doorHeight / 2, 0.64], 'bedroom-door');
    for (const y of [0.68, 1.65]) box(this.doorPivot, mat(0x201511), [0.025, 0.62, 0.86], [-0.058, y, 0.64]);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), mat(0x84745a, 0.3, 0.65)); handle.position.set(-0.09, 1.03, 1.08); this.doorPivot.add(handle);
    for (const z of [-0.72, 0.72]) box(this.scene, trim, [0.19, 2.47, 0.12], [3.88, 1.23, z]);
    box(this.scene, trim, [0.19, 0.12, 1.55], [3.88, 2.41, 0]);
    // Bed with layered blanket, pillow and worn frame.
    const bed = new THREE.Group(); bed.position.set(-2.2, 0, 2.7); bed.scale.set(1.24, 1, 1.04); this.scene.add(bed); // кровать вдоль южной стены, изголовье у западной
    box(bed, wood, [2.75, 0.28, 1.45], [0, 0.34, 0]);
    box(bed, pale, [2.62, 0.26, 1.35], [0, 0.59, 0]);
    box(bed, fabric, [1.88, 0.12, 1.4], [0.32, 0.77, 0]);
    const pillow = box(bed, mat(0x77786e), [0.58, 0.17, 1.02], [-0.93, 0.82, 0]); pillow.rotation.z = -0.09;
    box(bed, wood, [0.12, 1.15, 1.55], [-1.36, 0.72, 0]);
    for (const x of [-1.15, 1.15]) for (const z of [-0.55, 0.55]) box(bed, wood, [0.1, 0.38, 0.1], [x, 0.16, z]);
    // Desk and small narrative props.
    const desk = new THREE.Group(); desk.position.set(-2.03, 0, -3.08); desk.scale.set(1.85, 1, 1.1); this.scene.add(desk); // стол вдоль северной стены слева
    box(desk, wood, [2.0, 0.12, 0.72], [0, 0.86, 0]);
    for (const x of [-0.85, 0.85]) for (const z of [-0.25, 0.25]) box(desk, wood, [0.09, 0.85, 0.09], [x, 0.42, z]);
    box(desk, mat(0x5b615c), [0.7, 0.025, 0.48], [-0.25, 0.94, 0]);
    box(desk, mat(0xb0a27c), [0.38, 0.035, 0.5], [0.55, 0.95, 0]);
    const lamp = new THREE.Group(); lamp.position.set(-0.72, 0.94, 0); desk.add(lamp);
    box(lamp, mat(0x292b2b, 0.4, 0.4), [0.28, 0.04, 0.28], [0, 0, 0]);
    box(lamp, mat(0x292b2b, 0.4, 0.4), [0.035, 0.55, 0.035], [0, 0.27, 0]);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.32, 16, 1, true), mat(0x383d39)); shade.position.y = 0.56; lamp.add(shade);
    // Window: cold moonlight is the only constant light.
    box(this.scene, trim, [2.15, 1.55, 0.08], [0.3, 1.9, -3.4]);
    const glass = new THREE.MeshBasicMaterial({ color: 0x263b4a }); box(this.scene, glass, [1.92, 1.34, 0.03], [0.3, 1.9, -3.33]);
    box(this.scene, trim, [0.06, 1.38, 0.06], [0.3, 1.9, -3.29]); box(this.scene, trim, [1.96, 0.06, 0.06], [0.3, 1.9, -3.29]);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: 0xb6c6c4 })); moon.position.set(0.82, 2.25, -3.30); this.scene.add(moon);
    const moonlight = new THREE.SpotLight(0x718fa8, 13, 12, 0.75, 0.8, 1.4); moonlight.position.set(0.4, 2.6, -3.1); moonlight.target.position.set(-0.5, 0, 1.5); this.scene.add(moonlight, moonlight.target);
    // Rug and small clutter.
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.75), new THREE.MeshStandardMaterial({ color: 0x392a29, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0.5, 0.012, 0.85); this.scene.add(rug);
    for (let i = 0; i < 5; i++) { const b = box(this.scene, mat([0x4d4337, 0x35464b, 0x4e3632][i % 3]), [0.32, 0.035, 0.45], [2.3 + i * 0.05, 0.03 + i * 0.04, -1.9 + i * 0.025]); b.rotation.y = i * 0.17; }
    // Wardrobe fallback is replaced by the reusable detailed asset when loaded.
    this.wardrobeDoors = new THREE.Group(); this.wardrobeDoors.position.set(-3.48, 0, -0.4); this.scene.add(this.wardrobeDoors);
    box(this.wardrobeDoors, mat(0x2c211c), [0.62, 2.5, 1.3], [0, 1.25, 0]);
    this.fallbackDoor.position.set(0.33, 0, -0.65); this.wardrobeDoors.add(this.fallbackDoor);
    box(this.fallbackDoor, mat(0x191919), [0.04, 2.35, 1.29], [0, 1.25, 0.645]);
    // Телевизор на низкой тумбе у южной стены, экран смотрит в комнату.
    const tv = new THREE.Group(); tv.position.set(2.45, 0, 3.2); tv.rotation.y = Math.PI; this.scene.add(tv);
    box(tv, mat(0x2b1c16), [1.5, 0.5, 0.45], [0, 0.25, 0]);
    box(tv, mat(0x111213, 0.4, 0.3), [1.05, 0.64, 0.07], [0, 0.82, 0]);
    box(tv, mat(0x111213), [0.14, 0.12, 0.1], [0, 0.56, 0]);
    this.tvScreenMat = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.25, metalness: 0.2 });
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.56), this.tvScreenMat); tvScreen.position.set(0, 0.82, 0.037); tv.add(tvScreen);
    this.tvVideoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const tvVideo = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.56), this.tvVideoMat); tvVideo.position.set(0, 0.82, 0.039); tv.add(tvVideo);
    this.tvVideoMat.visible = false;
    this.tvLight = new THREE.PointLight(0xa8c8ff, 0, 7, 2); this.tvLight.position.set(2.45, 1.0, 2.5); this.scene.add(this.tvLight);
    // Планшет на столе: его нужно подобрать.
    this.tablet.position.set(-0.55, 0.99, -2.95); this.tablet.rotation.y = 0.3; this.scene.add(this.tablet);
    box(this.tablet, mat(0x15181a, 0.4, 0.3), [0.3, 0.018, 0.21], [0, 0, 0]);
    const tabScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.18), new THREE.MeshBasicMaterial({ color: 0x3f86a8 })); tabScreen.rotation.x = -Math.PI / 2; tabScreen.position.y = 0.0095; this.tablet.add(tabScreen);
    // Dad is an articulated low-poly figure with the supplied portrait mapped to his face.
    const bodyMat = mat(0x425e70), pantsMat = mat(0x34373b), skinMat = mat(0x9b7662);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.46, 6, 14), bodyMat); torso.scale.set(1.08, 1, 0.64); torso.position.y = 1.22; torso.castShadow = true; this.dad.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.255, 20, 16), skinMat); head.scale.set(0.9, 1.15, 0.9); head.position.y = 1.88; head.castShadow = true; this.dad.add(head);
    this.faceMaterial = new THREE.MeshBasicMaterial({ color: 0xc8c8c8, toneMapped: false });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.235, 32), this.faceMaterial); face.scale.set(0.88, 1.15, 1); face.position.set(0, 1.88, 0.247); this.dad.add(face);
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * 0.43, 1.5, 0); this.dad.add(arm);
      const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.62, 5, 10), bodyMat); a.position.y = -0.36; a.castShadow = true; arm.add(a);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), skinMat); hand.position.y = -0.77; arm.add(hand);
      const leg = side < 0 ? this.leftLeg : this.rightLeg; leg.position.set(side * 0.19, 0.8, 0); this.dad.add(leg);
      const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.57, 5, 10), pantsMat); l.position.y = -0.39; l.castShadow = true; leg.add(l);
      box(leg, mat(0x171717), [0.26, 0.16, 0.43], [0, -0.77, 0.08]);
    }
    this.dad.visible = false; this.scene.add(this.dad);
    this.flashlight = new THREE.SpotLight(0xffedc5, 0, 15, 0.48, 0.55, 1.25);
    this.flashlight.position.set(0.08, -0.08, 0); this.flashlight.target.position.set(0, -0.05, -1);
    this.flashlight.castShadow = true; this.flashlight.shadow.mapSize.set(512, 512); this.flashlight.shadow.bias = -0.0004;
    this.camera.add(this.flashlight, this.flashlight.target);
    this.scene.add(new THREE.HemisphereLight(0x657481, 0x211b17, 0.88));
    const dustGeo = new THREE.BufferGeometry(); const positions = new Float32Array(240 * 3);
    let seed = 19; const rnd = () => ((seed = seed * 48271 % 2147483647) / 2147483647);
    for (let i = 0; i < 240; i++) { positions[i * 3] = rnd() * 7.6 - 3.8; positions[i * 3 + 1] = rnd() * 2.8 + 0.15; positions[i * 3 + 2] = rnd() * 6.6 - 3.3; }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xb7b6a5, size: 0.012, transparent: true, opacity: 0.36, depthWrite: false })); this.scene.add(this.dust);
  }

  async loadAssets() {
    const loader = new THREE.TextureLoader();
    this.faceMaterial.map = await loader.loadAsync(`${import.meta.env.BASE_URL}textures/daddy-face.jpg`);
    this.faceMaterial.needsUpdate = true;
    try {
      const assetUrl = new URL(`${import.meta.env.BASE_URL}wardrobe/asset.mjs`, window.location.href).href;
      const module = await import(/* @vite-ignore */ assetUrl);
      const asset = await module.createAsset(THREE, { params: { width: 1.3, height: 2.55, depth: 0.7 } }) as WardrobeAsset;
      asset.position.copy(this.wardrobeBase); asset.rotation.y = Math.PI / 2;
      asset.traverse((o) => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.scene.add(asset); this.wardrobe = asset; this.wardrobeDoors.visible = false; void this.applyWardrobe();
    } catch (error) { console.warn('Detailed wardrobe unavailable; using built-in wardrobe.', error); }
  }

  setFlashlight(on: boolean) { this.flashlight.intensity = on ? 85 : 0; }
  setDoor(closed: boolean, dt: number) {
    const target = closed ? 0 : -0.26; // только щель ~15°, полностью дверь не открывается
    this.doorAngle = THREE.MathUtils.damp(this.doorAngle, target, 9, dt);
    this.doorPivot.rotation.y = this.doorAngle;
  }
  setWardrobeOpen(open: boolean) {
    this.wardrobeTarget = open ? 'open' : 'closed';
    this.fallbackDoor.rotation.y = open ? -1.5 : 0;
    void this.applyWardrobe();
  }
  private async applyWardrobe() {
    if (this.wardrobeBusy || !this.wardrobe?.setState) return;
    this.wardrobeBusy = true;
    try {
      while (this.wardrobeCurrent !== this.wardrobeTarget) {
        this.wardrobeCurrent = this.wardrobeTarget;
        this.wardrobe.userData.state = this.wardrobeCurrent;
        await this.wardrobe.setState(this.wardrobeCurrent);
      }
    } catch { /* ассет необязателен: игра работает и без анимации дверок */ } finally { this.wardrobeBusy = false; }
  }
  /** Шкаф трясётся, пока отец рвётся наружу (amount 0..1). */
  setWardrobeShake(amount: number, time: number) {
    const k = Math.sin(time * 55) * 0.012 * amount;
    const target = this.wardrobe ?? this.wardrobeDoors;
    if (this.wardrobe) { this.wardrobe.position.set(this.wardrobeBase.x + k, 0, this.wardrobeBase.z + k * 0.5); }
    else target.position.set(-3.48 + k, 0, -0.4);
  }
  setTV(on: boolean, texture?: THREE.Texture | null) {
    this.tvOn = on;
    if (texture !== undefined) { this.tvVideoMat.map = texture; this.tvVideoMat.needsUpdate = true; }
    this.tvVideoMat.visible = on;
    this.tvLight.intensity = on ? 1.8 : 0;
    this.tvScreenMat.color.setHex(on ? 0x000000 : 0x050607);
  }
  setTabletVisible(v: boolean) { this.tablet.visible = v; }
  /** Камера наблюдения: лёгкое покачивание, как у настоящей CCTV. */
  setCamView(index: number, aspect: number, time: number) {
    const v = CAM_VIEWS[index];
    this.secCam.fov = v.fov; this.secCam.aspect = aspect;
    this.secCam.position.set(v.pos[0], v.pos[1], v.pos[2]);
    this.secCam.lookAt(v.look[0] + Math.sin(time * 0.4) * 0.6, v.look[1], v.look[2] + Math.cos(time * 0.33) * 0.4);
    this.secCam.updateProjectionMatrix();
  }
  setCamLook(on: boolean) {
    (this.scene.fog as THREE.FogExp2).density = on ? 0.012 : 0.045;
    this.scene.background = new THREE.Color(on ? 0x0b0f10 : 0x050708);
  }
  updateTV(time: number) { if (this.tvOn) this.tvLight.intensity = 1.6 + Math.sin(time * 13) * 0.25 + Math.sin(time * 5.1) * 0.15; }
  setDad(position: THREE.Vector3, visible: boolean, walking: boolean, dt: number, lookAt?: THREE.Vector3, inCloset = false) {
    this.dad.visible = visible; if (!visible) return;
    this.dad.scale.set(inCloset ? 0.9 : 1, inCloset ? 0.97 : 1, inCloset ? 0.9 : 1);
    this.dad.position.copy(position); if (lookAt) this.dad.lookAt(lookAt.x, inCloset ? position.y : 1.2, lookAt.z);
    if (walking) this.walkTime += dt * 7;
    const swing = walking ? Math.sin(this.walkTime) * 0.34 : 0;
    this.leftLeg.rotation.x = swing; this.rightLeg.rotation.x = -swing;
    this.dad.position.y += walking ? Math.abs(Math.sin(this.walkTime)) * 0.025 : 0;
  }
  updateAmbient(time: number) { this.dust.rotation.y = time * 0.006; this.dust.position.y = Math.sin(time * 0.17) * 0.03; }
  resize(width: number, height: number) { this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); }
}
