import * as THREE from 'three';
import { GameLoop } from './engine';
import { Input } from './input';
import { AudioSystem } from './audio';
import { storage } from './storage';
import { CHARACTERS, NIGHTS, PLAYER, type CharacterId } from './config';
import { World } from './world';
import { CAM_VIEWS, DAD_SPOTS, DOORWAYS, HALL_SPOTS, NORTH_ROOMS, type RoomId } from './house';

type Mode = 'menu' | 'intro' | 'playing' | 'paused' | 'jumpscare' | 'gameover' | 'victory';
type Threat = 'none' | 'door' | 'closet';
type Phase = 'travel' | 'approach' | 'active' | 'retreat';
interface SaveData { unlocked: number; character: CharacterId; completed: number[]; }
interface DebugApi {
  startNight: (night?: number) => void; triggerDoor: () => void; triggerCloset: () => void;
  win: () => void; lose: () => void; aim: (target: 'door' | 'closet' | 'tv' | 'tablet') => void;
  giveTablet: () => void; openTablet: (cam?: number) => void; toggleTV: () => void; setWardrobe: (open: boolean) => void;
  setElapsed: (seconds: number) => void; state: () => Record<string, unknown>;
}
declare global { interface Window { __GAME_READY__: boolean; __gameProbe: () => { x: number; y: number; z: number }; __gameDebug?: DebugApi; } }

let teardown: (() => void) | null = null;
const clamp = THREE.MathUtils.clamp;

export function startGame(canvas: HTMLCanvasElement) {
  if (teardown) teardown();
  const overlay = document.querySelector<HTMLDivElement>('#ui-overlay')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
  const world = new World(), input = new Input(canvas), audio = new AudioSystem();
  let disposed = false, mode: Mode = 'menu', previousMode: Mode = 'menu';
  let selectedNight = 0, selectedCharacter: CharacterId = 'dmitry', unlocked = 1, completed: number[] = [];
  const saved = storage.get<SaveData>('save-v1', { unlocked: 1, character: 'dmitry', completed: [] });
  if (saved && typeof saved === 'object') {
    unlocked = clamp(Number(saved.unlocked) || 1, 1, 6);
    completed = Array.isArray(saved.completed) ? saved.completed.filter(n => Number.isInteger(n) && n >= 1 && n <= 6) : [];
    if (CHARACTERS.some(c => c.id === saved.character)) selectedCharacter = saved.character;
  }
  let elapsed = 0, doorClosed = false, flashlight = false, threat: Threat = 'none', phase: Phase = 'approach';
  let phaseTime = 0, phaseDuration = 1, closetProgress = 0, closetLit = 0;
  let lastDoorCheck = 0, lastClosetCheck = 0, hiccup = false, hiccupTime = 0, hiccupBeat = 0, disabled = 0;
  let stepTime = 0, heartbeatTime = 0, jumpscareTime = 0, ending = 0, checks = 0, closeCalls = 0, doorExposure = 0;
  let yaw = 0, pitch = 0, walking = false, uiClock = 0, seed = 1337, totalTime = 0;
  let hasTablet = false, tabletOpen = false, camIndex = 0, camSwitch = 0, tvOn = false, wardrobeOpen = false, videoPending = false;
  let route: RoomId[] = [], routeIndex = 0, stageDuration = 3, doorTravel = 8, doorAt = 20, closetAt = 35, lastStart: RoomId | null = null;
  let hallSpot: readonly [number, number] = HALL_SPOTS.south, noticeText = '', noticeTime = 0, lastCreak = 0;
  const DOOR_Z = 0.42; // отец стоит у щели
  const STAGE_TIME = [3.6, 3.3, 3.0, 2.7, 2.3, 2.0];
  const video = document.createElement('video');
  video.loop = true; video.playsInline = true; video.preload = 'metadata'; video.crossOrigin = 'anonymous';
  video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
  video.src = `${import.meta.env.BASE_URL}video/tv-edit.mp4`;
  const videoTexture = new THREE.VideoTexture(video); videoTexture.colorSpace = THREE.SRGBColorSpace;
  world.setTV(false, videoTexture);
  const tabletAim = world.tabletPoint, tvAim = world.tvPoint;
  const player = new THREE.Vector3(0, PLAYER.eye, 1.25), dadPos = new THREE.Vector3(), lookTarget = new THREE.Vector3();
  const forward = new THREE.Vector3(), targetDir = new THREE.Vector3(), candidate = new THREE.Vector3();
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  const range = (a: number, b: number) => a + (b - a) * random();
  const character = () => CHARACTERS.find(c => c.id === selectedCharacter)!;
  const save = () => storage.set<SaveData>('save-v1', { unlocked, character: selectedCharacter, completed });

  function menuMarkup() {
    return `<div class="screen menu-screen">
      <div class="menu-grain"></div>
      <header class="topbar"><div class="brand-mini">DIBIL / 00:00</div><button class="icon-button" data-action="mute" aria-label="Звук">${audio.muted ? 'ЗВУК ВЫКЛ' : 'ЗВУК ВКЛ'}</button></header>
      <section class="title-block"><div class="eyebrow">ПСИХОЛОГИЧЕСКИЙ ХОРРОР</div><h1><span>FIVE NIGHTS AT</span>DIBIL<br>DADDY</h1><p class="tagline">Слушай, свети, закрывай.<br><b>И не икай.</b></p><div class="headphones">Играйте в наушниках · шаги подскажут направление</div></section>
      <section class="select-panel"><div class="panel-kicker">01 / ВЫБЕРИТЕ ПЕРСОНАЖА</div><div class="characters">${CHARACTERS.map(c => `<button class="character ${selectedCharacter === c.id ? 'selected' : ''}" data-character="${c.id}" style="--hero:${c.color}"><span class="avatar">${c.short}</span><span class="character-copy"><strong>${c.name}</strong><small>${c.perk}</small></span><span class="select-dot"></span></button>`).join('')}</div>
      <div class="perk-description">${character().description}</div>
      <div class="panel-kicker nights-label">02 / ВЫБЕРИТЕ НОЧЬ</div><div class="nights">${NIGHTS.map((_, i) => `<button data-night="${i}" class="night ${selectedNight === i ? 'selected' : ''} ${i >= unlocked ? 'locked' : ''} ${completed.includes(i + 1) ? 'complete' : ''}" ${i >= unlocked ? 'disabled' : ''}><span>${i === 5 ? 'БОНУС' : `0${i + 1}`}</span><small>${i === 5 ? 'НОЧЬ' : completed.includes(i + 1) ? 'ПРОЙДЕНО' : i >= unlocked ? 'ЗАКРЫТО' : 'НОЧЬ'}</small></button>`).join('')}</div>
      <button class="primary" data-action="intro"><span>НАЧАТЬ НОЧЬ ${selectedNight === 5 ? 'БОНУС' : selectedNight + 1}</span><kbd>SPACE</kbd></button><div class="menu-links"><button data-action="help">Как играть</button><button data-action="reset">Сбросить прогресс</button></div></section>
      <footer class="menu-footer"><span>ОДИНОЧНАЯ КАМПАНИЯ</span><span>5 НОЧЕЙ + БОНУС</span><span>PC / MOBILE</span></footer>
    </div>`;
  }

  function hudMarkup() {
    return `<div class="hud"><div class="hud-top"><div><span class="hud-label" id="night-label">НОЧЬ 1</span><strong id="clock">00:00</strong></div><div class="objective"><span>ДОЖИТЬ ДО РАССВЕТА</span><div class="time-track"><i id="time-progress"></i></div></div><button class="icon-button" data-action="pause">ПАУЗА <kbd>ESC</kbd></button></div>
      <div id="threat-caption" class="threat-caption"></div><div id="notice" class="notice"></div><div class="crosshair"><i></i><i></i></div><div id="interact" class="interact"></div>
      <div class="status-left"><div class="hero-badge" style="--hero:${character().color}">${character().short}</div><div><span>${character().name}</span><small id="status-text">Дыши ровно. Слушай дом.</small></div></div>
      <div class="panic"><span>ПАНИКА</span><div><i id="panic-bar"></i></div><b id="hiccup-indicator">ИКОТА</b></div>
      <div class="actions"><button data-action="door" id="door-button"><span class="action-icon door-icon"></span><strong>ДВЕРЬ</strong><small id="door-state">ОТКРЫТА</small><kbd>E</kbd></button><button data-action="light" id="light-button"><span class="action-icon light-icon"></span><strong>ФОНАРИК</strong><small id="light-state">ВЫКЛЮЧЕН</small><kbd>F</kbd></button><button data-action="mouth" id="mouth-button" disabled><span class="action-icon mouth-icon"></span><strong>ЗАЖАТЬ РОТ</strong><small>3 СЕКУНДЫ</small><kbd>C</kbd></button><button data-action="tablet" id="tablet-button" class="dim"><span class="action-icon tablet-icon"></span><strong>ПЛАНШЕТ</strong><small id="tablet-state">НЕ НАЙДЕН</small><kbd>T</kbd></button></div>
      <div class="context-wrap"><button id="context-button" class="context-button" data-action="interact"><span id="context-label">ДЕЙСТВИЕ</span><kbd>Q</kbd></button></div>
      ${tabletMarkup()}
      <div class="move-hint">WASD — движение · мышь — обзор · Q — действие · T — планшет · Shift — быстрый шаг</div><div class="mobile-stick"><i></i></div>
    </div>`;
  }

  function tabletMarkup() {
    return `<div class="tablet" id="tablet"><div class="tablet-frame"><div class="tablet-head"><b>ПЛАНШЕТ · КАМЕРЫ</b><span id="cam-clock">00:00</span><button class="tablet-close" data-action="tablet-close" aria-label="Закрыть планшет">✕ <kbd>T</kbd></button></div>
      <div class="tablet-body"><div class="cam-screen" id="cam-screen"><div class="cam-osd"><span class="rec">● REC</span><span id="cam-name"></span></div><div class="cam-noise" id="cam-noise"></div><div class="cam-lines"></div></div>
      <div class="cam-list">${CAM_VIEWS.map((v, i) => `<button class="cam-btn" data-cam="${i}"><b>${i + 1}</b><span>${v.name}</span></button>`).join('')}</div></div></div></div>`;
  }

  function setMode(next: Mode) {
    previousMode = mode; mode = next;
    if (next === 'menu') { tabletOpen = false; setTV(false); world.setCamLook(false); document.getElementById('game-root')?.classList.remove('cam-mode'); world.setWardrobeOpen(false); world.setTabletVisible(true); overlay.innerHTML = menuMarkup(); world.setFlashlight(true); audio.setThreat(0); document.exitPointerLock?.(); }
    else if (next === 'playing' || next === 'jumpscare') overlay.innerHTML = hudMarkup();
    updateUI(true);
  }

  function resetNight() {
    seed = 1337 + selectedNight * 811 + CHARACTERS.findIndex(c => c.id === selectedCharacter) * 97;
    elapsed = 0; doorClosed = true; flashlight = false; threat = 'none'; phase = 'approach'; phaseTime = 0; closetProgress = 0; closetLit = 0;
    hasTablet = false; tabletOpen = false; camIndex = 0; camSwitch = 0; wardrobeOpen = false; lastStart = null; noticeTime = 0; lastCreak = 0;
    setTV(false); world.setTabletVisible(true); world.setWardrobeOpen(false); world.setWardrobeShake(0, 0); world.setCamLook(false); input.actions.clear();
    const cfg = NIGHTS[selectedNight]; planDoor(range(...cfg.doorDelay) * .7); closetAt = range(...cfg.closetDelay) * .8;
    lastDoorCheck = 0; lastClosetCheck = 0; hiccup = false; hiccupTime = 0; disabled = 0; checks = 0; closeCalls = 0; ending = 0; doorExposure = 0;
    player.set(0, PLAYER.eye, 1.25); yaw = -0.28; pitch = 0; walking = false; world.setDoor(true, 1); world.setFlashlight(false); world.dad.visible = false;
  }

  function pick<T>(list: T[]): T { return list[Math.floor(random() * list.length) % list.length]; }
  /** Маршрут отца по домам: комната → (возможно ещё одна) → коридор. Всё это видно на камерах. */
  function makeRoute(): RoomId[] {
    const pool: RoomId[] = ['garage', 'kitchen', 'living', 'room2', 'toilet'];
    const first = pick(pool.filter(r => r !== lastStart)); lastStart = first;
    const r: RoomId[] = [first];
    if (random() < .55 + selectedNight * .07) r.push(pick(pool.filter(x => x !== first)));
    r.push('hall');
    hallSpot = NORTH_ROOMS.includes(r[r.length - 2]) ? HALL_SPOTS.north : HALL_SPOTS.south;
    return r;
  }
  function planDoor(base: number) {
    route = makeRoute(); routeIndex = 0; stageDuration = STAGE_TIME[selectedNight] * range(.85, 1.15);
    doorTravel = route.length * stageDuration; doorAt = Math.max(base - doorTravel, elapsed + 3);
  }

  function showIntro() {
    mode = 'intro'; world.setFlashlight(false);
    overlay.innerHTML = `<div class="screen intro-screen"><div class="intro-card"><div class="eyebrow">${selectedNight === 5 ? 'БОНУСНАЯ НОЧЬ' : `НОЧЬ ${selectedNight + 1}`} / ${NIGHTS[selectedNight].label}</div><h2>Ровно в полночь<br>он начнёт искать чужака.</h2><p>Этот чужак — ты. Выходы заблокированы. Доживи в своей комнате до шести утра.</p><div class="intro-rules"><div><b>01</b><span>Возьми планшет со стола.<br>Камеры покажут, где отец. Дверь держи закрытой, приоткрывай только чтобы посветить.</span></div><div><b>02</b><span>Скрип в шкафу?<br>Открой его и посвети на отца.</span></div><div><b>03</b><span>Не паникуй.<br>Зажми рот, если начнётся икота.</span></div></div><button class="primary" data-action="start">Я ГОТОВ <span>00:00</span></button><button class="text-button" data-action="menu">Вернуться в меню</button></div></div>`;
  }

  function beginNight() {
    resetNight(); setMode('playing'); audio.startDrone(); audio.sfx('ui');
  }

  function toggleDoor() {
    if (mode !== 'playing' || disabled > 0) return;
    doorClosed = !doorClosed; audio.sfx(doorClosed ? 'slam' : 'door');
    if (threat === 'door' && phase === 'active' && !doorClosed) closeCalls++;
  }
  function toggleLight() {
    if (mode !== 'playing' || disabled > 0) return;
    flashlight = !flashlight; world.setFlashlight(flashlight); audio.sfx('light');
  }
  function coverMouth() {
    if (mode !== 'playing' || !hiccup || disabled > 0) return;
    hiccup = false; disabled = 3; flashlight = false; world.setFlashlight(false); lastDoorCheck = elapsed; lastClosetCheck = elapsed; audio.sfx('ui');
  }
  function pauseGame() {
    if (mode !== 'playing') return; mode = 'paused'; document.exitPointerLock?.();
    overlay.insertAdjacentHTML('beforeend', `<div class="screen pause-screen"><div class="modal"><div class="eyebrow">НОЧЬ ПРИОСТАНОВЛЕНА</div><h2>Пауза</h2><p>Отец тоже остановился. Но он никуда не ушёл.</p><button class="primary" data-action="resume">ПРОДОЛЖИТЬ <kbd>ESC</kbd></button><button class="secondary" data-action="restart">Начать ночь заново</button><button class="text-button" data-action="menu">Выйти в меню</button></div></div>`);
  }
  function resumeGame() { if (mode !== 'paused') return; mode = 'playing'; overlay.querySelector('.pause-screen')?.remove(); }
  function triggerThreat(type: Exclude<Threat, 'none'>) {
    if (threat !== 'none' || mode !== 'playing') return;
    threat = type; phaseTime = 0; closetLit = 0;
    if (type === 'door') { phase = 'travel'; routeIndex = 0; phaseDuration = stageDuration; }
    else { phase = 'approach'; phaseDuration = 2.4; audio.sfx('closet'); closetProgress = 0; lastCreak = 0; }
  }
  function finishThreat() {
    if (threat === 'door') closeCalls++;
    if (threat === 'closet' && wardrobeOpen) { wardrobeOpen = false; world.setWardrobeOpen(false); audio.sfx('door'); }
    threat = 'none'; world.dad.visible = false; world.setWardrobeShake(0, 0); closetProgress = 0;
    const cfg = NIGHTS[selectedNight]; planDoor(elapsed + range(...cfg.doorDelay)); closetAt = elapsed + range(...cfg.closetDelay);
  }
  function facing(point: THREE.Vector3) {
    world.camera.getWorldDirection(forward); targetDir.copy(point).sub(world.camera.position).normalize();
    return forward.dot(targetDir);
  }
  function aimAt(point: THREE.Vector3, threshold: number) { return flashlight && facing(point) > threshold; }
  const doorAim = new THREE.Vector3(4.15, 1.25, 0), closetAim = new THREE.Vector3(-3.45, 1.25, -0.4), closetDadPos = new THREE.Vector3(-3.5, 0, -0.4);

  function showNotice(text: string, seconds = 2.5) { noticeText = text; noticeTime = seconds; }

  // ── Телевизор ──
  function setTV(on: boolean) {
    tvOn = on; world.setTV(on);
    if (!on) { video.pause(); videoPending = false; }
  }
  function syncVideo() {
    const want = tvOn && mode === 'playing';
    if (want && video.paused && !videoPending) {
      videoPending = true; video.muted = audio.muted;
      const p = video.play();
      if (p) p.then(() => { videoPending = false; }).catch(() => { videoPending = false; setTV(false); showNotice('Браузер не пустил звук — нажми ещё раз'); });
      else videoPending = false;
    } else if (!want && !video.paused) video.pause();
    if (want) {
      world.camera.getWorldDirection(forward); const dist = player.distanceTo(tvAim);
      video.volume = clamp(1.15 - dist / 9, .18, 1) * (tabletOpen ? .5 : 1);
    }
  }

  // ── Интерактивные предметы: планшет, шкаф, телевизор ──
  interface Interactable { id: 'tablet' | 'wardrobe' | 'tv'; label: string; dot: number }
  function findInteractable(): Interactable | null {
    const found: Interactable[] = [];
    const test = (id: Interactable['id'], label: string, point: THREE.Vector3, maxDist: number, minDot: number) => {
      if (world.camera.position.distanceTo(point) > maxDist) return;
      const dot = facing(point); if (dot >= minDot) found.push({ id, label, dot });
    };
    if (!hasTablet) test('tablet', 'ВЗЯТЬ ПЛАНШЕТ', tabletAim, 2.6, .88);
    test('wardrobe', wardrobeOpen ? 'ЗАКРЫТЬ ШКАФ' : 'ОТКРЫТЬ ШКАФ', closetAim, 3.4, .86);
    test('tv', tvOn ? 'ВЫКЛЮЧИТЬ ТВ' : 'ВКЛЮЧИТЬ ТВ', tvAim, 6.5, .93);
    found.sort((a, b) => b.dot - a.dot);
    return found[0] ?? null;
  }
  function interact() {
    if (mode !== 'playing' || tabletOpen || disabled > 0) return;
    const it = findInteractable();
    if (!it) { showNotice('Подойди и посмотри на шкаф, телевизор или планшет'); return; }
    if (it.id === 'tablet') { hasTablet = true; world.setTabletVisible(false); audio.sfx('ui'); showNotice('Планшет взят · T — открыть камеры', 3.5); }
    else if (it.id === 'wardrobe') { wardrobeOpen = !wardrobeOpen; world.setWardrobeOpen(wardrobeOpen); audio.sfx(wardrobeOpen ? 'closet' : 'door'); }
    else { setTV(!tvOn); audio.sfx('ui'); }
  }

  // ── Планшет и камеры ──
  function applyTabletUI() {
    document.getElementById('tablet')?.classList.toggle('open', tabletOpen);
    document.querySelector('.hud')?.classList.toggle('tablet-open', tabletOpen);
    document.getElementById('game-root')?.classList.toggle('cam-mode', tabletOpen);
    world.setCamLook(tabletOpen);
    selectCam(camIndex, false);
  }
  function toggleTablet(force?: boolean) {
    if (mode !== 'playing' && mode !== 'paused') return;
    if (!hasTablet) { showNotice('Сначала найди планшет на столе'); return; }
    const next = force ?? !tabletOpen; if (next === tabletOpen) return;
    tabletOpen = next; if (tabletOpen) document.exitPointerLock?.();
    audio.sfx('ui'); applyTabletUI();
  }
  function selectCam(i: number, beep = true) {
    camIndex = clamp(i, 0, CAM_VIEWS.length - 1);
    if (beep) { camSwitch = .3; audio.sfx('ui'); document.getElementById('cam-noise')?.classList.add('burst'); }
    const name = document.getElementById('cam-name'); if (name) name.textContent = `КАМ ${camIndex + 1} · ${CAM_VIEWS[camIndex].name}`;
    document.querySelectorAll<HTMLElement>('.cam-btn').forEach((b, idx) => b.classList.toggle('active', idx === camIndex));
  }

  function caught() {
    if (mode !== 'playing') return;
    mode = 'jumpscare'; jumpscareTime = 0; ending = Math.floor(random() * 3); flashlight = false; world.setFlashlight(false);
    if (tabletOpen) { tabletOpen = false; applyTabletUI(); } setTV(false); world.setWardrobeShake(0, 0);
    audio.sfx('caught'); audio.setThreat(1); audio.speakCaught(); document.exitPointerLock?.();
    world.camera.getWorldDirection(forward); dadPos.copy(world.camera.position).addScaledVector(forward, 0.78); dadPos.y = world.camera.position.y - 1.58;
    world.setDad(dadPos, true, false, 0, world.camera.position, false);
    const caption = document.getElementById('threat-caption'); if (caption) { caption.textContent = '«НУ ВСЁ, ПОПАЛСЯ»'; caption.classList.add('show', 'danger'); }
    document.getElementById('game-root')?.classList.add('jolt');
  }
  function showGameOver() {
    mode = 'gameover'; audio.setThreat(0); document.getElementById('game-root')?.classList.remove('jolt');
    const endings = [
      ['КОНЦОВКА / СЗАДИ', 'Ты не выдержал.', 'Глухие хлопки стихают за закрытой дверью. Ночь проиграна.'],
      ['КОНЦОВКА / ПОДВАЛ', 'Он запер тебя в подвале.', 'Замок щёлкнул. Шаги отца удаляются наверх.'],
      ['КОНЦОВКА / УДАР', 'Он вырубил тебя с одного удара.', 'Ты приходишь в себя утром. В следующий раз будь внимательнее.'],
    ][ending];
    if (ending === 1) { audio.sfx('slam'); audio.sfx('door'); } else audio.sfx('slam');
    overlay.innerHTML = `<div class="screen gameover-screen"><div class="gameover-card"><div class="eyebrow">${endings[0]}</div><h2>GAME OVER</h2><h3>${endings[1]} Игра окончена</h3><p>${endings[2]}</p><div class="run-stats"><span>Время</span><b>${formatTime(elapsed)}</b><span>Проверок светом</span><b>${checks}</b></div><button class="primary" data-action="restart">ПОВТОРИТЬ НОЧЬ</button><button class="text-button" data-action="menu">Вернуться в меню</button></div></div>`;
  }
  function victory() {
    if (mode !== 'playing') return; mode = 'victory'; if (tabletOpen) { tabletOpen = false; applyTabletUI(); } setTV(false); audio.sfx('win'); audio.setThreat(0); world.dad.visible = false; world.setFlashlight(false); document.exitPointerLock?.();
    const number = selectedNight + 1; if (!completed.includes(number)) completed.push(number); unlocked = Math.max(unlocked, Math.min(6, number + 1)); save();
    overlay.innerHTML = `<div class="screen victory-screen"><div class="dawn"></div><div class="victory-card"><div class="eyebrow">06:00 / РАССВЕТ</div><h2>ТЫ ВЫЖИЛ</h2><p>Шаги остановились. Отец вернулся в свою комнату.<br>Дом затих — по крайней мере, до следующей полночи.</p><div class="run-stats"><span>${character().name}</span><b>${selectedNight === 5 ? 'Бонус' : `Ночь ${number}`}</b><span>Проверок светом</span><b>${checks}</b><span>Опасных визитов</span><b>${closeCalls}</b></div>${selectedNight < 5 ? '<button class="primary" data-action="next">СЛЕДУЮЩАЯ НОЧЬ</button>' : '<button class="primary" data-action="menu">КАМПАНИЯ ПРОЙДЕНА</button>'}<button class="text-button" data-action="menu">Вернуться в меню</button></div></div>`;
  }
  function formatTime(gameSeconds: number) {
    const totalMinutes = Math.min(360, Math.floor(gameSeconds / NIGHTS[selectedNight].duration * 360));
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  }

  function collides(p: THREE.Vector3) {
    if (p.x < -3.55 || p.x > 3.55 || p.z < -3.12 || p.z > 3.12) return true;
    if (p.x < -0.3 && p.z > 1.8) return true; // bed (вдоль южной стены)
    if (p.x < -0.05 && p.z < -2.18) return true; // desk (вдоль северной стены)
    if (p.x < -2.75 && p.z > -1.15 && p.z < 0.35) return true; // wardrobe (вертикальный, узкий)
    if (p.x > 1.45 && p.z > 2.72) return true; // tv stand
    return false;
  }

  function updatePlaying(dt: number) {
    const cfg = NIGHTS[selectedNight]; elapsed += dt; disabled = Math.max(0, disabled - dt);
    if (elapsed >= cfg.duration) { victory(); return; }
    const look = input.consumeLook(); if (!tabletOpen) { yaw += look.yaw; pitch = clamp(pitch + look.pitch, -1.22, 1.22); }
    if (noticeTime > 0) noticeTime -= dt; camSwitch = Math.max(0, camSwitch - dt);
    const speed = (input.isHeld('ShiftLeft') || input.isHeld('ShiftRight') ? PLAYER.sprint : PLAYER.speed) * (selectedCharacter === 'artem' ? 1.18 : 1);
    const mx = tabletOpen ? 0 : input.moveX, mz = tabletOpen ? 0 : input.moveZ, len = Math.hypot(mx, mz) || 1;
    walking = Math.abs(mx) + Math.abs(mz) > 0.05 && disabled <= 0;
    if (walking) {
      const sin = Math.sin(yaw), cos = Math.cos(yaw);
      candidate.copy(player); candidate.x += ((-sin * mz + cos * mx) / len) * speed * dt; if (!collides(candidate)) player.x = candidate.x;
      candidate.copy(player); candidate.z += ((-cos * mz - sin * mx) / len) * speed * dt; if (!collides(candidate)) player.z = candidate.z;
      stepTime -= dt; if (stepTime <= 0) { stepTime = speed > 2.8 ? .32 : .48; audio.sfx('step', .24); if (selectedNight === 5 && selectedCharacter !== 'konstantin') { doorAt -= .22; closetAt -= .22; } }
    }
    if (input.consumeAction('KeyE')) toggleDoor(); if (input.consumeAction('KeyF')) toggleLight(); if (input.consumeAction('KeyC')) coverMouth();
    if (input.consumeAction('KeyQ')) interact(); if (input.consumeAction('KeyT')) toggleTablet();
    if (tabletOpen) for (let i = 0; i < CAM_VIEWS.length; i++) if (input.consumeAction(`Digit${i + 1}`) || input.consumeAction(`Numpad${i + 1}`)) selectCam(i);
    world.camera.position.copy(player); if (walking) world.camera.position.y += Math.sin(elapsed * 10) * .018;
    world.camera.rotation.set(pitch, yaw, 0);
    const doorAimed = !tabletOpen && aimAt(doorAim, .72), closetAimed = !tabletOpen && aimAt(closetAim, .9);
    if (doorAimed) { if (elapsed - lastDoorCheck > 1) checks++; lastDoorCheck = elapsed; }
    if (closetAimed) { if (elapsed - lastClosetCheck > 1) checks++; lastClosetCheck = elapsed; }
    const panicDelay = selectedCharacter === 'dmitry' ? 38 : 30;
    if (!hiccup && disabled <= 0 && elapsed - lastDoorCheck > panicDelay && elapsed - lastClosetCheck > panicDelay) { hiccup = true; hiccupTime = 5; hiccupBeat = 0; }
    if (hiccup) {
      hiccupTime -= dt; hiccupBeat -= dt; if (hiccupBeat <= 0) { hiccupBeat = 1.0; audio.sfx('hiccup'); doorAt -= 1.1; closetAt -= 1.1; }
      if (hiccupTime <= 0) { hiccup = false; lastDoorCheck = elapsed - 12; lastClosetCheck = elapsed - 12; }
    }
    if (threat === 'none') {
      if (elapsed >= doorAt && doorAt <= closetAt) triggerThreat('door');
      else if (elapsed >= closetAt) triggerThreat('closet');
    } else {
      phaseTime += dt;
      if (threat === 'door') {
        if (phase === 'travel') {
          const room = route[routeIndex];
          if (room === 'hall') { dadPos.set(hallSpot[0], 0, hallSpot[1]); lookTarget.set(hallSpot[0], 1.2, 0); }
          else { dadPos.set(DAD_SPOTS[room][0], 0, DAD_SPOTS[room][1]); lookTarget.set(DOORWAYS[room][0], 1.2, DOORWAYS[room][1]); }
          world.setDad(dadPos, true, false, dt, lookTarget);
          if (phaseTime >= phaseDuration) {
            phaseTime = 0; routeIndex++; audio.sfx('step', .1);
            if (routeIndex >= route.length) { phase = 'approach'; phaseDuration = cfg.approach * 1.7; }
          }
        } else if (phase === 'approach') {
          const t = clamp(phaseTime / phaseDuration, 0, 1), sign = Math.sign(hallSpot[1]) || 1, hallLen = Math.abs(hallSpot[1]), total = hallLen + 1.93, d = t * total;
          if (d < hallLen) { dadPos.set(hallSpot[0], 0, DOOR_Z + sign * (hallLen - d)); lookTarget.set(hallSpot[0], 1.2, 0); }
          else { dadPos.set(THREE.MathUtils.lerp(hallSpot[0], 4.47, (d - hallLen) / 1.93), 0, DOOR_Z); lookTarget.copy(player); }
          world.setDad(dadPos, true, true, dt, lookTarget);
          if (Math.floor(phaseTime * 2) !== Math.floor((phaseTime - dt) * 2)) audio.sfx('step', .3 + t * .7);
          if (t >= 1) { phase = 'active'; phaseTime = 0; phaseDuration = range(5, 7); }
        } else if (phase === 'active') {
          dadPos.set(4.47, 0, DOOR_Z); world.setDad(dadPos, true, false, dt, player);
          if (!doorClosed) { doorExposure += dt; if (doorExposure > .85) { caught(); return; } } else doorExposure = 0;
          if (phaseTime >= phaseDuration) { phase = 'retreat'; phaseTime = 0; phaseDuration = 2.8; }
        } else {
          const t = clamp(phaseTime / phaseDuration, 0, 1); dadPos.set(THREE.MathUtils.lerp(4.47, hallSpot[0], t), 0, DOOR_Z); world.setDad(dadPos, true, true, dt, player);
          if (Math.floor(phaseTime * 2) !== Math.floor((phaseTime - dt) * 2)) audio.sfx('step', .8 - t * .4);
          if (t >= 1) finishThreat();
        }
      } else {
        // Отец прячется в шкафу. Закрытый шкаф он выламывает, открытый — нужно осветить его.
        if (phase === 'approach') {
          world.dad.visible = false; world.setWardrobeShake(.25, totalTime);
          if (phaseTime >= phaseDuration) { phase = 'active'; phaseTime = 0; audio.sfx('closet'); }
        } else if (phase === 'active') {
          const lit = wardrobeOpen && closetAimed;
          if (lit) { closetLit += dt; closetProgress = Math.max(0, closetProgress - dt * .15); }
          else { closetLit = Math.max(0, closetLit - dt * .6); closetProgress += dt / (wardrobeOpen ? cfg.closetGrace * .55 : cfg.closetGrace); }
          if (closetLit >= 1.6) { phase = 'retreat'; phaseTime = 0; phaseDuration = 1.2; closeCalls++; audio.sfx('slam'); }
          else {
            if (!wardrobeOpen && elapsed - lastCreak > Math.max(.5, 1.4 - closetProgress)) { lastCreak = elapsed; audio.sfx('closet'); }
            world.setDad(closetDadPos, wardrobeOpen, false, dt, player, true);
            world.setWardrobeShake(wardrobeOpen ? 0 : .4 + closetProgress * 1.4, totalTime);
            if (closetProgress >= 1) { caught(); return; }
          }
        } else {
          world.setDad(closetDadPos, wardrobeOpen && phaseTime < .45, false, dt, player, true); world.setWardrobeShake(0, 0);
          closetProgress = Math.max(0, closetProgress - dt * .7); if (phaseTime >= phaseDuration) finishThreat();
        }
      }
    }
    heartbeatTime -= dt; const danger = threat === 'none' ? 0 : phase === 'active' ? 1 : .45;
    if (danger > .5 && heartbeatTime <= 0) { heartbeatTime = hiccup ? .7 : 1.05; audio.sfx('heartbeat', danger); }
    audio.setThreat(danger + (hiccup ? .25 : 0)); world.setDoor(doorClosed, dt);
  }

  function update(dt: number) {
    totalTime += dt;
    if (input.consumeAction('Escape')) { if (mode === 'playing' && tabletOpen) toggleTablet(false); else if (mode === 'playing') pauseGame(); else if (mode === 'paused') resumeGame(); }
    if (input.consumeAction('Space')) { if (mode === 'menu' || mode === 'intro') beginNight(); }
    if (mode === 'playing') updatePlaying(dt);
    else if (mode === 'jumpscare') { jumpscareTime += dt; world.camera.rotation.z = Math.sin(jumpscareTime * 47) * .025 * (1 - jumpscareTime / 2); if (jumpscareTime >= 1.85) showGameOver(); }
    else { input.consumeLook(); if (mode !== 'paused') input.actions.clear(); }
    syncVideo(); world.updateTV(totalTime); world.updateAmbient(totalTime);
  }

  function updateUI(force = false) {
    if (!force && uiClock < .08) return; uiClock = 0;
    if (mode === 'playing' || mode === 'jumpscare' || mode === 'paused') {
      const set = (id: string, text: string) => { const el = document.getElementById(id); if (el && el.textContent !== text) el.textContent = text; };
      set('clock', formatTime(elapsed)); set('night-label', selectedNight === 5 ? 'БОНУСНАЯ НОЧЬ' : `НОЧЬ ${selectedNight + 1}`);
      const progress = document.getElementById('time-progress'); if (progress) progress.style.width = `${elapsed / NIGHTS[selectedNight].duration * 100}%`;
      set('door-state', doorClosed ? 'ЗАКРЫТА' : 'ЩЕЛЬ'); set('light-state', flashlight ? 'ВКЛЮЧЁН · ∞' : 'ВЫКЛЮЧЕН');
      document.getElementById('door-button')?.classList.toggle('active', doorClosed); document.getElementById('light-button')?.classList.toggle('active', flashlight);
      const mouth = document.getElementById('mouth-button') as HTMLButtonElement | null; if (mouth) { mouth.disabled = !hiccup || disabled > 0; mouth.classList.toggle('urgent', hiccup); }
      const panicAge = Math.min(elapsed - lastDoorCheck, elapsed - lastClosetCheck), panicMax = selectedCharacter === 'dmitry' ? 38 : 30;
      const panic = document.getElementById('panic-bar'); if (panic) panic.style.width = `${clamp(panicAge / panicMax * 100, 0, 100)}%`;
      set('status-text', disabled > 0 ? `Рот зажат · ${disabled.toFixed(1)} с` : hiccup ? 'Ты икаешь — он слышит!' : threat === 'none' ? 'Дыши ровно. Слушай дом.' : 'Что-то движется в доме…');
      const caption = document.getElementById('threat-caption'); if (caption && mode !== 'jumpscare') {
        let text = ''; if (threat === 'door' && phase === 'active') text = doorClosed ? 'ОН ЗА ДВЕРЬЮ. НЕ ПРИОТКРЫВАЙ.' : 'ОН У ЩЕЛИ! ЗАКРОЙ ДВЕРЬ!';
        if (threat === 'closet' && phase === 'active') text = wardrobeOpen ? (closetLit > 0 ? 'СВЕТИ НА НЕГО!' : 'ОН В ШКАФУ! СВЕТИ ФОНАРИКОМ!') : 'ШКАФ СКРИПИТ… ОТКРОЙ И ПОСВЕТИ'; if (hiccup) text = 'ИКОТА ПРИВЛЕКАЕТ ЕГО';
        caption.textContent = text; caption.classList.toggle('show', !!text); caption.classList.toggle('danger', hiccup || (threat === 'door' && !doorClosed && phase === 'active'));
      }
      const notice = document.getElementById('notice'); if (notice) { const text = noticeTime > 0 ? noticeText : disabled > 0 ? 'Руки заняты — дверь и фонарик недоступны' : ''; if (notice.textContent !== text) notice.textContent = text; notice.classList.toggle('show', !!text); }
      const interact = document.getElementById('interact'), ctx = document.getElementById('context-button');
      const it = mode === 'playing' && !tabletOpen ? findInteractable() : null;
      if (interact) interact.textContent = it ? `${it.label} · Q` : (mode === 'playing' && !tabletOpen && facing(doorAim) > .8 ? 'ДВЕРЬ · E — приоткрыть / закрыть' : '');
      if (ctx) { ctx.classList.toggle('show', !!it); set('context-label', it ? it.label : 'ДЕЙСТВИЕ'); }
      set('tablet-state', !hasTablet ? 'НЕ НАЙДЕН' : tabletOpen ? 'ОТКРЫТ' : 'ЗАКРЫТ');
      document.getElementById('tablet-button')?.classList.toggle('dim', !hasTablet); document.getElementById('tablet-button')?.classList.toggle('active', tabletOpen);
      set('cam-clock', formatTime(elapsed));
      if (camSwitch <= 0) document.getElementById('cam-noise')?.classList.remove('burst');
    }
  }

  function renderCam() {
    const el = document.getElementById('cam-screen'); if (!el) return false;
    const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return false;
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H); renderer.setClearColor(0x000000, 1); renderer.clear();
    const x = r.left, y = H - r.bottom;
    renderer.setViewport(x, y, r.width, r.height); renderer.setScissor(x, y, r.width, r.height); renderer.setScissorTest(true);
    world.setCamView(camIndex, r.width / r.height, totalTime);
    renderer.toneMappingExposure = 1.5; renderer.render(world.scene, world.secCam); renderer.toneMappingExposure = 1.02;
    renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H);
    return true;
  }

  function render(_: number) {
    uiClock += 1 / 60; updateUI();
    if (tabletOpen && (mode === 'playing' || mode === 'paused') && renderCam()) { window.__GAME_READY__ = true; return; }
    if (mode === 'menu' || mode === 'intro') {
      world.camera.position.set(.1, 1.68, 2.65); world.camera.lookAt(3.7, 1.35, 0); world.setDoor(false, 1 / 60);
      dadPos.set(4.47, 0, DOOR_Z); world.setDad(dadPos, true, false, 0, world.camera.position);
    }
    renderer.render(world.scene, world.camera);
    window.__GAME_READY__ = true;
  }
  const loop = new GameLoop({ update, render });
  function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); world.resize(w, h); }
  const onCanvasClick = () => { if (mode === 'playing' && matchMedia('(pointer:fine)').matches && !document.pointerLockElement) void canvas.requestPointerLock(); };
  const onClick = (event: Event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action],[data-character],[data-night],[data-cam]'); if (!target) return;
    if (target.dataset.cam !== undefined) { selectCam(Number(target.dataset.cam)); return; }
    const char = target.dataset.character as CharacterId | undefined; if (char) { selectedCharacter = char; save(); audio.sfx('ui'); overlay.innerHTML = menuMarkup(); return; }
    if (target.dataset.night !== undefined) { const n = Number(target.dataset.night); if (n < unlocked) { selectedNight = n; audio.sfx('ui'); overlay.innerHTML = menuMarkup(); } return; }
    const action = target.dataset.action;
    if (action !== 'light' && action !== 'door' && action !== 'interact' && action !== 'tablet' && action !== 'tablet-close') audio.sfx('ui');
    switch (action) {
      case 'mute': audio.toggleMute(); video.muted = audio.muted; target.textContent = audio.muted ? 'ЗВУК ВЫКЛ' : 'ЗВУК ВКЛ'; break;
      case 'intro': showIntro(); break; case 'start': beginNight(); break; case 'menu': setMode('menu'); break;
      case 'interact': interact(); break; case 'tablet': toggleTablet(); break; case 'tablet-close': toggleTablet(false); break;
      case 'door': toggleDoor(); break; case 'light': toggleLight(); break; case 'mouth': coverMouth(); break;
      case 'pause': pauseGame(); break; case 'resume': resumeGame(); break; case 'restart': beginNight(); break;
      case 'next': selectedNight = Math.min(5, selectedNight + 1); showIntro(); break;
      case 'help': overlay.insertAdjacentHTML('beforeend', `<div class="screen help-screen"><div class="modal help-modal"><div class="eyebrow">РУКОВОДСТВО ПО ВЫЖИВАНИЮ</div><h2>До рассвета</h2><div class="help-grid"><div><b>ДВЕРЬ · E</b><p>Дверь открывается только на узкую щель. Приоткрой её и посвети в коридор, но если отец у двери — сразу закрой. Щель при нём означает проигрыш.</p></div><div><b>ШКАФ · Q</b><p>Услышал скрип — подойди, посмотри на шкаф и открой его (Q). Включи фонарик и держи свет на отце ~2 секунды, пока он не отступит. Закрытый шкаф он выломает.</p></div><div><b>ПЛАНШЕТ · T</b><p>Лежит на столе — посмотри на него и нажми Q, чтобы взять. Дальше T открывает камеры (клавиши 1–6): коридор, зал, вторая комната, туалет, гараж, кухня.</p></div><div><b>ТЕЛЕВИЗОР · Q</b><p>Посмотри на телевизор и нажми Q — включится эдит со звуком. Ещё раз Q — выключить.</p></div><div><b>ФОНАРИК · F</b><p>Бесконечный и без перегрева. Свет работает только туда, куда ты смотришь.</p></div><div><b>ИКОТА · C</b><p>Долго не проверял комнату — начнёшь икать. Зажми рот: 3 секунды без двери и фонарика.</p></div></div><p class="controls-copy">WASD / стрелки — ходить · мышь / свайп — обзор · Q — действие · T — планшет · Shift — быстрый шаг · Esc — пауза. На телефоне — экранные кнопки.</p><button class="primary" data-action="close-help">ПОНЯТНО</button></div></div>`); break;
      case 'close-help': target.closest('.help-screen')?.remove(); break;
      case 'reset': unlocked = 1; completed = []; selectedNight = 0; save(); overlay.innerHTML = menuMarkup(); break;
    }
  };
  overlay.addEventListener('click', onClick); canvas.addEventListener('click', onCanvasClick); window.addEventListener('resize', resize);
  window.__gameProbe = () => ({ x: player.x, y: player.y, z: player.z });
  window.__gameDebug = {
    startNight: (night = 0) => { selectedNight = clamp(night, 0, 5); beginNight(); },
    triggerDoor: () => { if (mode !== 'playing') beginNight(); threat = 'none'; triggerThreat('door'); },
    triggerCloset: () => { if (mode !== 'playing') beginNight(); threat = 'none'; triggerThreat('closet'); },
    win: () => { if (mode !== 'playing') beginNight(); elapsed = NIGHTS[selectedNight].duration - .02; },
    lose: () => { if (mode !== 'playing') beginNight(); caught(); },
    giveTablet: () => { if (mode !== 'playing') beginNight(); hasTablet = true; world.setTabletVisible(false); },
    openTablet: (cam = 0) => { if (mode !== 'playing') beginNight(); hasTablet = true; world.setTabletVisible(false); camIndex = cam; toggleTablet(true); },
    toggleTV: () => { if (mode === 'playing') setTV(!tvOn); },
    setWardrobe: (open) => { wardrobeOpen = open; world.setWardrobeOpen(open); },
    aim: (target) => { const point = target === 'door' ? doorAim : target === 'closet' ? closetAim : target === 'tv' ? tvAim : tabletAim; targetDir.copy(point).sub(player).normalize(); yaw = Math.atan2(-targetDir.x, -targetDir.z); pitch = Math.asin(clamp(targetDir.y, -1, 1)); },
    setElapsed: (seconds) => { elapsed = clamp(seconds, 0, NIGHTS[selectedNight].duration - 1); lastDoorCheck = elapsed - 40; lastClosetCheck = elapsed - 40; },
    state: () => ({ mode, hasTablet, tabletOpen, camIndex, tvOn, wardrobeOpen, route: route.join('>'), routeIndex, elapsed, selectedNight, doorClosed, flashlight, threat, phase, hiccup, disabled, unlocked, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
  };
  resize(); setMode('menu'); loop.start();
  void world.loadAssets().then(() => { if (!disposed) renderer.render(world.scene, world.camera); });
  teardown = () => {
    disposed = true; loop.stop(); input.dispose(); audio.dispose(); overlay.removeEventListener('click', onClick); canvas.removeEventListener('click', onCanvasClick); window.removeEventListener('resize', resize);
    document.exitPointerLock?.(); video.pause(); video.removeAttribute('src'); video.load(); videoTexture.dispose(); renderer.dispose(); delete window.__gameDebug; window.__GAME_READY__ = false; teardown = null;
  };
}

export function stopGame() { if (teardown) teardown(); }
