export const INPUT_CONFIG = {
  MOUSE_SENS_X: 0.0024,
  MOUSE_SENS_Y: 0.0021,
  INVERT_X: false,
  INVERT_Y: false,
} as const;

export const ROOM = { width: 8, depth: 7, height: 3.2, doorWidth: 1.3, doorHeight: 2.35 } as const;
export const PLAYER = { radius: 0.25, eye: 1.58, speed: 2.15, sprint: 3.15 } as const;

export interface NightConfig {
  duration: number;
  doorDelay: [number, number];
  closetDelay: [number, number];
  approach: number;
  closetGrace: number;
  label: string;
}

export const NIGHTS: NightConfig[] = [
  { duration: 150, doorDelay: [22, 30], closetDelay: [38, 48], approach: 5.4, closetGrace: 12, label: 'Тихие шаги' },
  { duration: 155, doorDelay: [18, 25], closetDelay: [32, 42], approach: 4.8, closetGrace: 10, label: 'Он ближе' },
  { duration: 160, doorDelay: [14, 21], closetDelay: [27, 36], approach: 4.2, closetGrace: 9, label: 'Не спится' },
  { duration: 165, doorDelay: [11, 17], closetDelay: [23, 31], approach: 3.6, closetGrace: 8, label: 'Без передышки' },
  { duration: 170, doorDelay: [8, 13], closetDelay: [18, 25], approach: 3.0, closetGrace: 7, label: 'Последняя ночь' },
  { duration: 180, doorDelay: [6, 10], closetDelay: [14, 20], approach: 2.6, closetGrace: 6, label: 'Он слышит всё' },
];

export const CHARACTERS = [
  { id: 'dmitry', name: 'Дебёлый Дмитрий', short: 'ДМ', color: '#a53b37', perk: 'Крепкие нервы', description: 'Икота начинается позже на 8 секунд.' },
  { id: 'konstantin', name: 'Сакович Константин', short: 'СК', color: '#3f6972', perk: 'Тихий шаг', description: 'Движение почти не привлекает отца.' },
  { id: 'artem', name: 'Милиев Артем', short: 'МА', color: '#8a6b3f', perk: 'Лёгкие ноги', description: 'Ходит на 18% быстрее остальных.' },
] as const;

export type CharacterId = typeof CHARACTERS[number]['id'];
