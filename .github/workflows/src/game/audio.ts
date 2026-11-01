export type SfxId = 'ui' | 'door' | 'step' | 'closet' | 'hiccup' | 'light' | 'caught' | 'win' | 'heartbeat' | 'slam';
const MUTE_KEY = 'dibil-daddy.muted';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drone: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private disposed = false;
  muted = false;
  private unlock = () => { this.ensureCtx(); this.detachUnlock(); };
  constructor() {
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { this.muted = false; }
    window.addEventListener('pointerdown', this.unlock); window.addEventListener('keydown', this.unlock);
  }
  private detachUnlock() { window.removeEventListener('pointerdown', this.unlock); window.removeEventListener('keydown', this.unlock); }
  private ensureCtx() {
    if (!this.ctx) { this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.55; this.master.connect(this.ctx.destination); }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }
  toggleMute() { this.muted = !this.muted; try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* local fallback */ } if (this.master) this.master.gain.value = this.muted ? 0 : 0.55; return this.muted; }
  private tone(f0: number, f1: number, duration: number, gain: number, type: OscillatorType = 'sine', delay = 0) {
    if (this.disposed || this.muted) return; const ctx = this.ensureCtx(); if (!this.master) return; const t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + duration);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + duration + 0.02);
  }
  private noise(duration: number, gain: number, lowpass = 500, delay = 0) {
    if (this.disposed || this.muted) return; const ctx = this.ensureCtx(); if (!this.master) return;
    const length = Math.ceil(ctx.sampleRate * duration), buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let seed = 913 + length; for (let i = 0; i < length; i++) { seed = seed * 16807 % 2147483647; data[i] = (seed / 2147483647 * 2 - 1) * (1 - i / length); }
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), g = ctx.createGain(); src.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = lowpass; g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.master); src.start(ctx.currentTime + delay);
  }
  sfx(id: SfxId, intensity = 1) {
    switch (id) {
      case 'ui': this.tone(480, 620, 0.05, 0.09); break;
      case 'door': this.noise(0.28, 0.19, 420); this.tone(105, 48, 0.3, 0.12, 'triangle'); break;
      case 'step': this.noise(0.15, 0.16 * intensity, 180); this.tone(72, 42, 0.16, 0.11 * intensity, 'sine'); break;
      case 'closet': this.noise(0.55, 0.13, 900); this.tone(130, 65, 0.45, 0.06, 'sawtooth'); break;
      case 'hiccup': this.tone(390, 170, 0.11, 0.19, 'square'); this.noise(0.08, 0.07, 1800); break;
      case 'light': this.tone(1150, 800, 0.025, 0.045, 'square'); break;
      case 'caught': this.noise(0.85, 0.42, 1300); this.tone(95, 28, 0.95, 0.38, 'sawtooth'); break;
      case 'win': [0, .18, .36, .62].forEach((d, i) => this.tone([262, 330, 392, 523][i], [262, 330, 392, 523][i], .65, .1, 'sine', d)); break;
      case 'heartbeat': this.tone(68, 42, .12, .15 * intensity); this.tone(58, 38, .1, .1 * intensity, 'sine', .17); break;
      case 'slam': this.noise(.35, .35, 240); this.tone(65, 30, .35, .25); break;
    }
  }
  startDrone() {
    if (this.disposed || this.drone) return; const ctx = this.ensureCtx(); if (!this.master) return;
    this.drone = ctx.createOscillator(); this.droneGain = ctx.createGain(); const filter = ctx.createBiquadFilter();
    this.drone.type = 'sawtooth'; this.drone.frequency.value = 43; filter.type = 'lowpass'; filter.frequency.value = 105; this.droneGain.gain.value = 0.025;
    this.drone.connect(filter).connect(this.droneGain).connect(this.master); this.drone.start();
  }
  setThreat(value: number) { if (this.droneGain && this.ctx) this.droneGain.gain.setTargetAtTime(0.018 + value * 0.045, this.ctx.currentTime, .2); }
  speakCaught() {
    if (this.muted || !('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('Ну всё. Попался.'); u.lang = 'ru-RU'; u.rate = .78; u.pitch = .55; u.volume = .95; window.speechSynthesis.speak(u); } catch { /* voice is optional */ }
  }
  stop() { if (this.drone) { try { this.drone.stop(); } catch { /* already stopped */ } } this.drone = null; this.droneGain = null; if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
  dispose() { if (this.disposed) return; this.disposed = true; this.detachUnlock(); this.stop(); const ctx = this.ctx; this.ctx = null; this.master = null; if (ctx && ctx.state !== 'closed') void ctx.close(); }
}
