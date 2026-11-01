import * as THREE from 'three';

/**
 * house.ts — остальной дом за дверью спальни. Нужен для системы камер:
 * Коридор, Зал, Вторая комната, Туалет, Гараж, Кухня.
 *
 * Оси: x — на восток (за дверью спальни), z — на юг. Спальня занимает x∈[-4,4], z∈[-3.5,3.5].
 * Коридор — длинный проход x∈[4,7.2], z∈[-8.2,8.2]. Комнаты примыкают к нему проёмами.
 */

export type RoomId = 'hall' | 'living' | 'room2' | 'toilet' | 'garage' | 'kitchen';

export interface CamView {
  id: RoomId;
  name: string;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
}

/** Порядок совпадает с порядком кнопок на планшете. */
export const CAM_VIEWS: CamView[] = [
  { id: 'hall', name: 'КОРИДОР', pos: [6.95, 2.75, 7.7], look: [5.3, 0.9, -1.5], fov: 75 },
  { id: 'living', name: 'ЗАЛ', pos: [12.2, 2.7, -3.25], look: [8.4, 0.6, -6.6], fov: 80 },
  { id: 'room2', name: 'ВТОРАЯ КОМНАТА', pos: [0.2, 2.65, -3.7], look: [2.8, 0.5, -6.9], fov: 80 },
  { id: 'toilet', name: 'ТУАЛЕТ', pos: [1.15, 2.6, 4.5], look: [3.0, 0.5, 7.2], fov: 80 },
  { id: 'garage', name: 'ГАРАЖ', pos: [9.4, 2.7, 8.5], look: [4.8, 0.6, 12.6], fov: 80 },
  { id: 'kitchen', name: 'КУХНЯ', pos: [12.2, 2.6, 3.55], look: [8.4, 0.6, 7.1], fov: 80 },
];

/** Где отец стоит в комнате (x, z). Коридор считается отдельно — см. HALL_SPOTS. */
export const DAD_SPOTS: Record<Exclude<RoomId, 'hall'>, [number, number]> = {
  living: [9.4, -5.0],
  room2: [2.0, -5.7],
  toilet: [2.5, 6.1],
  garage: [4.2, 10.4],
  kitchen: [9.2, 5.8],
};

/** Центр проёма из комнаты в коридор — туда отец «смотрит», пока стоит в комнате. */
export const DOORWAYS: Record<Exclude<RoomId, 'hall'>, [number, number]> = {
  living: [7.2, -5.6],
  room2: [4.0, -6.0],
  toilet: [4.0, 6.0],
  garage: [5.6, 8.2],
  kitchen: [7.2, 5.4],
};

/** Дальние точки коридора: откуда отец начинает идти к двери спальни. */
export const HALL_SPOTS = { north: [6.4, -5.2], south: [6.4, 5.4] } as const;
export const NORTH_ROOMS: RoomId[] = ['living', 'room2'];

const DOOR_H = 2.4;
const T = 0.12;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const lambertCache = new Map<number, THREE.MeshLambertMaterial>();
const basicCache = new Map<number, THREE.MeshBasicMaterial>();

/** Ламберт с лёгким самосвечением: комнаты без своего света всё равно читаются на камерах. */
function lam(color: number) {
  let m = lambertCache.get(color);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.22) });
    lambertCache.set(color, m);
  }
  return m;
}
function glow(color: number) {
  let m = basicCache.get(color);
  if (!m) { m = new THREE.MeshBasicMaterial({ color }); basicCache.set(color, m); }
  return m;
}

interface BoxOpts { cast?: boolean; receive?: boolean }
type V3 = [number, number, number];

function B(parent: THREE.Object3D, material: THREE.Material, size: V3, pos: V3, opts: BoxOpts = {}) {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = !!opts.cast;
  mesh.receiveShadow = !!opts.receive;
  parent.add(mesh);
  return mesh;
}

function wall(parent: THREE.Object3D, material: THREE.Material, axis: 'x' | 'z', fixed: number, from: number, to: number,
  gaps: Array<[number, number]>, height: number, opts: BoxOpts) {
  const seg = (a: number, b: number, y0: number, y1: number) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return;
    const len = b - a, mid = (a + b) / 2, h = y1 - y0, cy = (y0 + y1) / 2;
    if (axis === 'x') B(parent, material, [T, h, len], [fixed, cy, mid], opts);
    else B(parent, material, [len, h, T], [mid, cy, fixed], opts);
  };
  let cur = from;
  for (const [g0, g1] of [...gaps].sort((a, b) => a[0] - b[0])) {
    seg(cur, g0, 0, height);
    seg(g0, g1, DOOR_H, height); // перемычка над проёмом
    cur = g1;
  }
  seg(cur, to, 0, height);
}

function floorAndCeiling(parent: THREE.Object3D, floor: THREE.Material, ceil: THREE.Material, x0: number, x1: number, z0: number, z1: number, h: number) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  B(parent, floor, [w, 0.1, d], [cx, -0.06, cz], { receive: true });
  B(parent, ceil, [w, 0.1, d], [cx, h + 0.05, cz]);
}

export interface HouseMaterials { floorMat: THREE.Material; wallMat: THREE.Material }

export function buildHouse(scene: THREE.Scene, mats: HouseMaterials) {
  const house = new THREE.Group();
  house.name = 'house';
  scene.add(house);
  const wallOpts: BoxOpts = { cast: true, receive: false };
  const dark = lam(0x2a2d2c);
  const roomWall = lam(0x6b6e64);

  // ───── Коридор ─────
  floorAndCeiling(house, mats.floorMat, dark, 4, 7.2, -8.2, 8.2, 3.1);
  // восточная стена с проёмами в Зал и на Кухню
  wall(house, mats.wallMat, 'x', 7.2, -8.2, 8.2, [[-6.3, -4.9], [4.7, 6.1]], 3.1, { cast: true, receive: true });
  // западная стена (спальня: x=4) с проёмами во Вторую комнату и Туалет
  wall(house, mats.wallMat, 'x', 4.0, -8.2, -3.5, [[-6.7, -5.3]], 3.1, { cast: true, receive: true });
  wall(house, mats.wallMat, 'x', 4.0, 3.5, 8.2, [[5.3, 6.7]], 3.1, { cast: true, receive: true });
  // дорожка, столик с лампой, вешалка, картины, потолочные лампы
  B(house, lam(0x4a2323), [1.2, 0.012, 15.6], [5.6, 0.02, 0]);
  const table = new THREE.Group(); table.position.set(6.9, 0, -2.9); house.add(table);
  B(table, lam(0x2b1c16), [0.42, 0.06, 1.1], [0, 0.78, 0]);
  for (const dz of [-0.45, 0.45]) for (const dx of [-0.15, 0.15]) B(table, lam(0x2b1c16), [0.05, 0.76, 0.05], [dx, 0.38, dz]);
  B(table, lam(0x2a2b2b), [0.13, 0.2, 0.13], [0, 0.91, 0.25]);
  B(table, glow(0xffe3a0), [0.22, 0.18, 0.22], [0, 1.1, 0.25]);
  B(house, lam(0x3a2f26), [0.05, 1.7, 0.05], [6.9, 0.85, 3.2]);
  B(house, lam(0x3a3a46), [0.3, 0.7, 0.14], [6.9, 1.25, 3.2]);
  B(house, lam(0x6a5a40), [0.04, 0.55, 0.4], [7.1, 1.7, -3.8]);
  B(house, lam(0x40505a), [0.04, 0.45, 0.6], [7.1, 1.7, 2.0]);
  B(house, lam(0x5a4040), [0.04, 0.5, 0.4], [4.1, 1.7, 7.4]);
  for (const z of [-4, 3.5]) B(house, glow(0xfff0c0), [0.4, 0.03, 0.4], [5.6, 3.085, z]);

  // ───── Общая «внешняя» оболочка: северная и южная стены ─────
  wall(house, roomWall, 'z', -8.2, 0, 12.46, [], 3.0, wallOpts);
  wall(house, roomWall, 'z', 8.2, 1.0, 12.46, [[4.6, 6.6]], 3.0, wallOpts);

  // ───── Зал ─────
  floorAndCeiling(house, lam(0x4a3a2c), dark, 7.2, 12.4, -8.2, -3.0, 3.0);
  wall(house, roomWall, 'x', 12.4, -8.2, -3.0, [], 3.0, wallOpts);
  wall(house, roomWall, 'z', -3.0, 7.2, 12.46, [], 3.0, wallOpts);
  B(house, lam(0x4a3037), [2.6, 0.012, 1.9], [9.8, 0.02, -6.1]);
  B(house, lam(0x3a4650), [2.1, 0.42, 0.9], [10.0, 0.26, -7.6]);
  B(house, lam(0x3a4650), [2.1, 0.5, 0.22], [10.0, 0.72, -8.0]);
  for (const x of [8.85, 11.15]) B(house, lam(0x323c45), [0.22, 0.55, 0.9], [x, 0.4, -7.6]);
  B(house, lam(0x2b1c16), [1.1, 0.38, 0.55], [10.0, 0.2, -6.5]);
  B(house, lam(0x5a3a2e), [0.85, 0.4, 0.85], [11.5, 0.25, -4.0]);
  B(house, lam(0x5a3a2e), [0.85, 0.5, 0.2], [11.5, 0.7, -3.5]);
  B(house, lam(0x2a1d17), [0.35, 2.0, 1.4], [12.2, 1.0, -6.0]);
  for (let i = 0; i < 4; i++) B(house, lam([0x6a3a30, 0x30506a, 0x5a5a30, 0x4a3a5a][i]), [0.3, 0.04, 1.2], [12.2, 0.5 + i * 0.45, -6.0]);
  B(house, glow(0x31465a), [1.1, 1.2, 0.03], [8.3, 1.7, -8.12]);
  B(house, lam(0x2a2b2b), [0.04, 1.5, 0.04], [8.0, 0.75, -4.1]);
  B(house, glow(0xffe3a0), [0.3, 0.25, 0.3], [8.0, 1.6, -4.1]);

  // ───── Вторая комната ─────
  floorAndCeiling(house, lam(0x3f3a36), dark, 0, 4, -8.2, -3.5, 3.0);
  wall(house, roomWall, 'x', 0, -8.2, -3.5, [], 3.0, wallOpts);
  B(house, lam(0x3a2b22), [1.0, 0.45, 2.0], [0.7, 0.25, -7.0]);
  B(house, lam(0x3d5a7a), [0.98, 0.14, 1.5], [0.7, 0.55, -6.75]);
  B(house, lam(0x8a8a80), [0.4, 0.12, 0.5], [0.55, 0.58, -7.7]);
  B(house, lam(0x3a2b22), [0.1, 1.0, 1.0], [0.1, 0.7, -7.0]);
  B(house, lam(0x4a3a2c), [0.4, 0.5, 0.4], [0.35, 0.25, -5.7]);
  B(house, lam(0x3a2b22), [0.6, 2.0, 1.1], [0.4, 1.0, -4.4]);
  const desk2 = new THREE.Group(); desk2.position.set(3.2, 0, -7.7); house.add(desk2);
  B(desk2, lam(0x4a3a2c), [1.2, 0.06, 0.6], [0, 0.75, 0]);
  for (const dx of [-0.55, 0.55]) B(desk2, lam(0x4a3a2c), [0.05, 0.74, 0.5], [dx, 0.37, 0]);
  B(desk2, lam(0x2a2b2b), [0.45, 0.3, 0.05], [0, 0.93, -0.15]);
  B(desk2, lam(0x4a3a2c), [0.4, 0.05, 0.4], [0, 0.45, 0.6]);
  B(house, glow(0x2c4156), [1.0, 1.1, 0.03], [1.9, 1.8, -8.12]);
  for (let i = 0; i < 3; i++) B(house, lam([0x8a4a3a, 0x3a6a8a, 0x8a8a3a][i]), [0.28, 0.28, 0.28], [2.5 + i * 0.35, 0.14, -4.2 + (i % 2) * 0.2]);

  // ───── Туалет ─────
  floorAndCeiling(house, lam(0x7c8886), dark, 1.0, 4.0, 4.4, 8.2, 3.0);
  wall(house, lam(0x879391), 'x', 1.0, 4.4, 8.2, [], 3.0, wallOpts);
  wall(house, lam(0x879391), 'z', 4.4, 1.0, 4.06, [], 3.0, wallOpts);
  B(house, lam(0xd8dcd6), [0.42, 0.4, 0.55], [2.5, 0.2, 7.65]);
  B(house, lam(0xd8dcd6), [0.5, 0.45, 0.2], [2.5, 0.7, 7.95]);
  B(house, lam(0xd8dcd6), [0.4, 0.12, 0.5], [1.3, 0.85, 7.0]);
  B(house, lam(0xd8dcd6), [0.14, 0.8, 0.14], [1.25, 0.4, 7.0]);
  B(house, glow(0x9fb0b4), [0.03, 0.6, 0.5], [1.07, 1.55, 7.0]);
  B(house, lam(0xd8dcd6), [1.7, 0.55, 0.75], [3.05, 0.28, 4.85]);
  B(house, lam(0x55707a), [1.7, 1.4, 0.04], [3.05, 1.3, 4.5]);

  // ───── Гараж ─────
  floorAndCeiling(house, lam(0x4a4d4d), dark, 2.4, 9.6, 8.2, 14.2, 3.0);
  wall(house, lam(0x5d605c), 'x', 2.4, 8.2, 14.26, [], 3.0, wallOpts);
  wall(house, lam(0x5d605c), 'x', 9.6, 8.2, 14.26, [], 3.0, wallOpts);
  wall(house, lam(0x5d605c), 'z', 14.2, 2.4, 9.66, [], 3.0, wallOpts);
  B(house, lam(0x6a6e70), [4.2, 2.4, 0.08], [6.0, 1.2, 14.1]);
  for (const y of [0.4, 0.8, 1.2, 1.6, 2.0]) B(house, lam(0x585c5e), [4.2, 0.04, 0.09], [6.0, y, 14.08]);
  const car = new THREE.Group(); car.position.set(7.6, 0, 11.6); house.add(car);
  B(car, lam(0x32414f), [1.9, 0.55, 4.0], [0, 0.55, 0]);
  B(car, lam(0x2a3743), [1.7, 0.5, 2.0], [0, 1.07, 0.2]);
  B(car, glow(0x1c2a36), [1.72, 0.32, 1.7], [0, 1.1, 0.2]);
  for (const x of [-0.6, 0.6]) B(car, glow(0xffe9a0), [0.35, 0.15, 0.05], [x, 0.6, -2.02]);
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12);
  for (const x of [-0.95, 0.95]) for (const z of [-1.3, 1.3]) {
    const w = new THREE.Mesh(wheelGeo, lam(0x151515)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.32, z); car.add(w);
  }
  B(house, lam(0x4a3a2a), [0.65, 0.9, 2.6], [2.8, 0.45, 11.9]);
  B(house, lam(0x8a2a2a), [0.3, 0.2, 0.5], [2.8, 1.0, 11.2]);
  B(house, lam(0x3a3a3a), [0.2, 0.08, 0.7], [2.8, 0.94, 12.4]);
  B(house, lam(0x3a2f26), [0.4, 2.0, 1.0], [2.65, 1.0, 9.2]);
  for (let i = 0; i < 4; i++) B(house, lam(0x6a5a40), [0.42, 0.04, 0.95], [2.65, 0.4 + i * 0.5, 9.2]);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12), lam(0x30506a)); barrel.position.set(9.1, 0.45, 13.4); house.add(barrel);
  B(house, lam(0x6a5a40), [0.6, 0.5, 0.6], [9.0, 0.25, 12.5]);
  B(house, glow(0xfff0c0), [1.6, 0.05, 0.2], [6.0, 2.97, 10.5]);

  // ───── Кухня ─────
  floorAndCeiling(house, lam(0x6d726c), dark, 7.2, 12.4, 3.4, 8.2, 3.0);
  wall(house, roomWall, 'z', 3.4, 7.2, 12.46, [], 3.0, wallOpts);
  wall(house, roomWall, 'x', 12.4, 3.4, 8.2, [], 3.0, wallOpts);
  B(house, lam(0x5b5f58), [3.6, 0.9, 0.6], [9.7, 0.45, 3.75]);
  B(house, lam(0xb8b5a8), [3.7, 0.05, 0.65], [9.7, 0.925, 3.75]);
  B(house, lam(0x151515), [0.6, 0.03, 0.5], [9.2, 0.96, 3.75]);
  B(house, lam(0x4a3b2d), [3.6, 0.7, 0.35], [9.7, 2.0, 3.6]);
  B(house, lam(0xc8cac4), [0.8, 1.9, 0.75], [12.0, 0.95, 4.0]);
  const kt = new THREE.Group(); kt.position.set(11.0, 0, 6.8); house.add(kt);
  B(kt, lam(0x4a3a2c), [1.4, 0.06, 0.9], [0, 0.75, 0]);
  for (const dx of [-0.6, 0.6]) for (const dz of [-0.38, 0.38]) B(kt, lam(0x4a3a2c), [0.06, 0.74, 0.06], [dx, 0.37, dz]);
  for (const dz of [-0.65, 0.65]) { B(kt, lam(0x6a4a30), [0.4, 0.05, 0.4], [0, 0.45, dz]); B(kt, lam(0x6a4a30), [0.4, 0.5, 0.05], [0, 0.72, dz + Math.sign(dz) * 0.18]); }
  B(house, glow(0x2b405a), [0.03, 1.0, 1.4], [12.34, 1.7, 6.0]);
  B(house, glow(0xffe3a0), [0.3, 0.2, 0.3], [11.0, 2.2, 6.8]);

  return house;
}
