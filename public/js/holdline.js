// CH II: a phone line you can actually sit on. Hold music is synthesized in the browser, so there are no audio files
// and nothing plays until the visitor presses the button. Lines come from Voice's pack, same as the bot's /phone.
import { PACK } from './voice-pack.js';
import { formatHMS } from './schedule.js';

const P = PACK.bot.phone;
const EXTRA = {
  4: 'Press 4 to hear these options again, but slower. Pat has heard them 4,000 times.',
  5: 'You pressed 5. GTA V support. Most people have finished it by now. Some of them three times.',
  6: 'GTA VI line is not connected. Please try again November 19.',
  7: 'For a callback, stay on the line. Nobody will call you back.',
  8: 'Your feedback was recorded and placed on the couch.',
  9: 'Emergency line. Pat asks: is it out? No? Then please hold.',
  '*': 'Star menu. Five stars is the most anyone gets. Keep bothering Pat and find out.',
  '#': 'Your account number has been forgotten. Please hold.',
};
const STATIONS = [
  { name: 'Radio Couch: easy listening for the long wait', beat: 0.62, chords: [[146.83, 174.61, 220, 261.63], [98, 146.83, 196, 246.94], [130.81, 164.81, 196, 246.94], [110, 164.81, 220, 277.18]] },
  { name: 'Non-Stop Hold: synths from a better decade', beat: 0.34, chords: [[110, 130.81, 164.81, 220], [87.31, 130.81, 174.61, 220], [130.81, 164.81, 196, 261.63], [98, 146.83, 196, 246.94]] },
  { name: 'Skeleton FM: all bones, all night', beat: 0.48, chords: [[82.41, 123.47, 164.81, 196], [82.41, 123.47, 164.81, 196], [110, 164.81, 196, 261.63], [123.47, 185, 246.94, 293.66]] },
];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function makeMusic(station) {
  const CHORDS = station.chords;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const out = ctx.createGain();
  out.gain.value = 0.13;
  const filter = ctx.createBiquadFilter(); // the phone line: everything between 300 Hz and 2.4 kHz
  filter.type = 'bandpass'; filter.frequency.value = 900; filter.Q.value = 0.5;
  filter.connect(out); out.connect(ctx.destination);
  const wow = ctx.createOscillator(); // old tape drift
  const wowDepth = ctx.createGain();
  wow.frequency.value = 0.35; wowDepth.gain.value = 7; wow.connect(wowDepth); wow.start();
  const note = (freq, at, len, type = 'triangle', level = 0.5) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; wowDepth.connect(o.detune);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(level, at + 0.03); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.connect(g); g.connect(filter); o.start(at); o.stop(at + len + 0.05);
  };
  let bar = 0; let next = ctx.currentTime + 0.05; const beat = station.beat;
  const schedule = () => {
    while (next < ctx.currentTime + 1.5) {
      const chord = CHORDS[bar % CHORDS.length];
      note(chord[0] / 2, next, beat * 1.8, 'sine', 0.7);
      note(chord[0] / 2, next + beat * 1.5, beat, 'sine', 0.5);
      [1, 2.5].forEach((b) => chord.slice(1).forEach((f) => note(f, next + beat * b, beat * 0.9, 'triangle', 0.22)));
      note(chord[3] * 2, next + beat * (bar % 2 ? 3 : 2), beat * 1.1, 'sine', 0.28);
      bar += 1; next += beat * 4;
    }
  };
  schedule();
  const timer = setInterval(schedule, 500);
  return {
    duck: (on) => out.gain.linearRampToValueAtTime(on ? 0.04 : 0.13, ctx.currentTime + 0.3),
    stop: () => { clearInterval(timer); ctx.close(); },
  };
}

function say(text, music) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92; u.pitch = 0.8; u.lang = 'en-US';
  u.onstart = () => music?.duck(true);
  u.onend = () => music?.duck(false);
  speechSynthesis.speak(u);
}

export function mountHoldLine() {
  const $ = (id) => document.getElementById(id);
  const lcd = $('lcd-line'); const timer = $('lcd-timer'); const toggle = $('hold-toggle'); const phone = $('phone');
  let music = null; let station = 0; let startedAt = 0; let ticker = null; let lineTimer = null; let voiceTimer = null;
  const show = (text) => { lcd.textContent = text; };
  show(P.menu.prompt.split('\n').join(' '));

  const stop = () => {
    music?.stop(); music = null;
    clearInterval(ticker); clearInterval(lineTimer); clearInterval(voiceTimer);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    toggle.textContent = 'Call again'; toggle.setAttribute('aria-pressed', 'false');
    phone.dataset.state = 'idle';
    show(`You hung up after ${formatHMS(performance.now() - startedAt)}. Pat never does.`);
  };
  const start = () => {
    music = makeMusic(STATIONS[station]); startedAt = performance.now();
    toggle.textContent = 'Hang up'; toggle.setAttribute('aria-pressed', 'true');
    phone.dataset.state = 'on-hold';
    show('You are caller #2. Pat is caller #1.');
    timer.textContent = '00:00:00';
    ticker = setInterval(() => { timer.textContent = formatHMS(performance.now() - startedAt); }, 1000);
    lineTimer = setInterval(() => show(pick(P.hold)), 12000);
    voiceTimer = setInterval(() => say('Your call is important to us. Please hold.', music), 45000);
    setTimeout(() => { if (music) say('Your call is important to us. Please hold.', music); }, 6000);
  };
  toggle.addEventListener('click', () => (music ? stop() : start()));

  document.getElementById('hold-station')?.addEventListener('click', () => {
    station = (station + 1) % STATIONS.length;
    show(STATIONS[station].name);
    if (music) { music.stop(); music = makeMusic(STATIONS[station]); }
  });

  const press = (key) => {
    show(P.menu.buttons[key] || EXTRA[key] || P.menu.footer);
    const b = phone.querySelector(`[data-key="${key}"]`);
    b?.classList.add('pressed'); setTimeout(() => b?.classList.remove('pressed'), 160);
  };
  phone.addEventListener('click', (e) => { const k = e.target.closest('[data-key]')?.dataset.key; if (k) press(k); });
}
