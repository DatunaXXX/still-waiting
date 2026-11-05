// All sound effects are synthesized here, with no audio files. Nothing plays before the visitor's first click or key (browser rule),
// the sound button mutes everything, and the stand-still test is always silent. Hold music in CH II has its own button.
const KEY = 'sw:muted';
let ctx = null; let master = null; let noiseBuf = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked: fine */ }
const loops = {};
const wanted = {};

function start() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  ctx = new Ctx();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  for (const [name, on] of Object.entries(wanted)) setLoop(name, on);
}
window.addEventListener('pointerdown', start, { passive: true });
window.addEventListener('keydown', start);

const silent = () => !ctx || muted || document.body.classList.contains('stilling');

function tone(freq, at, len, { type = 'sine', level = 0.1, to = null } = {}) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + len);
  g.gain.setValueAtTime(level, at); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
  o.connect(g); g.connect(master); o.start(at); o.stop(at + len + 0.02);
}
function noise(at, len, { level = 0.2, freq = 1200, type = 'lowpass', to = null } = {}) {
  const s = ctx.createBufferSource(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(freq, at);
  if (to) f.frequency.exponentialRampToValueAtTime(to, at + len);
  g.gain.setValueAtTime(level, at); g.gain.exponentialRampToValueAtTime(0.0008, at + len);
  s.connect(f); f.connect(g); g.connect(master); s.start(at); s.stop(at + len + 0.02);
}

const SOUNDS = {
  blip: (t) => { noise(t, 0.09, { level: 0.1, freq: 4000, type: 'highpass' }); tone(1500, t + 0.07, 0.05, { type: 'square', level: 0.025 }); },
  rattle: (t) => { for (let i = 0; i < 7; i++) tone(900 + Math.random() * 1500, t + i * 0.035 + Math.random() * 0.012, 0.04, { type: 'square', level: 0.035 }); },
  thud: (t) => { tone(130, t, 0.16, { level: 0.22, to: 45 }); SOUNDS.rattle(t + 0.02); },
  whoosh: (t) => noise(t, 0.34, { level: 0.1, freq: 500, type: 'bandpass', to: 2600 }),
  missile: (t) => { noise(t, 0.5, { level: 0.14, freq: 700, type: 'bandpass', to: 3200 }); tone(420, t, 0.5, { type: 'sawtooth', level: 0.03, to: 1300 }); },
  boom: (t) => { noise(t, 0.9, { level: 0.5, freq: 1800, to: 70 }); tone(95, t, 0.7, { level: 0.35, to: 28 }); },
  star: (t) => { tone(660, t, 0.1, { type: 'triangle', level: 0.08 }); tone(990, t + 0.09, 0.14, { type: 'triangle', level: 0.08 }); },
  sting: (t) => { [196, 185, 174.6, 146.8].forEach((f, i) => tone(f, t + i * 0.2, 0.42, { type: 'sawtooth', level: 0.06 })); },
  cheat: (t) => { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.14, { type: 'square', level: 0.04 })); },
  click: (t) => tone(1100, t, 0.03, { type: 'square', level: 0.04 }),
  ufo: (t) => { tone(400, t, 1.8, { type: 'sine', level: 0.05, to: 1900 }); tone(1500, t + 0.9, 0.9, { type: 'sine', level: 0.03, to: 300 }); },
};

export function play(name) {
  if (silent() || !SOUNDS[name]) return;
  SOUNDS[name](ctx.currentTime);
}

function buildLoop(name) {
  const out = ctx.createGain(); out.gain.value = 0; out.connect(master);
  if (name === 'engine') {
    const a = ctx.createOscillator(); const b = ctx.createOscillator(); const f = ctx.createBiquadFilter();
    a.type = 'sawtooth'; a.frequency.value = 62; b.type = 'square'; b.frequency.value = 93;
    f.type = 'lowpass'; f.frequency.value = 340;
    a.connect(f); b.connect(f); f.connect(out); a.start(); b.start();
    return { out, level: 0.028, freq: a.frequency };
  }
  const o = ctx.createOscillator(); const lfo = ctx.createOscillator(); const depth = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = 760; lfo.type = 'square'; lfo.frequency.value = 1.5; depth.gain.value = 170;
  lfo.connect(depth); depth.connect(o.frequency); o.connect(out); o.start(); lfo.start();
  return { out, level: 0.018 };
}
function setLoop(name, on) {
  wanted[name] = on;
  if (!ctx) return;
  if (!loops[name]) { if (!on) return; loops[name] = buildLoop(name); }
  const l = loops[name];
  l.out.gain.setTargetAtTime(on && !silent() ? l.level : 0, ctx.currentTime, 0.25);
}
export const loop = setLoop;
/** Engine pitch follows the bike's speed (0..1). */
export function engineSpeed(v) { if (loops.engine && ctx) loops.engine.freq.setTargetAtTime(58 + v * 70, ctx.currentTime, 0.2); }

export function mountSoundButton() {
  const b = document.getElementById('sound-toggle');
  if (!b) return;
  const paint = () => { b.textContent = muted ? '×' : '♪'; b.setAttribute('aria-pressed', String(!muted)); b.setAttribute('aria-label', muted ? 'Sound off. Turn on' : 'Sound on. Mute'); b.classList.toggle('off', muted); };
  paint();
  b.addEventListener('click', () => {
    muted = !muted;
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* storage blocked: fine */ }
    start();
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
    for (const [name, on] of Object.entries(wanted)) setLoop(name, on);
    paint();
  });
  // The stand-still test is silent, whatever else is going on.
  new MutationObserver(() => { for (const [name, on] of Object.entries(wanted)) setLoop(name, on); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
