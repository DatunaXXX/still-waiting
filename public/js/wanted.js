// The GTA layer: wanted stars for bothering Pat, cruisers that chase small Pat, big banners, real cheat codes.
// Everything here is a joke running in this browser. Nothing is stored or sent, and the page works without it.
import { play, loop } from './sfx.js';

const MAX = 5;
const DECAY_PER_SEC = 0.035;
const NS = 'http://www.w3.org/2000/svg';
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

/** Anyone can raise the heat: document.dispatchEvent(new CustomEvent('sw:bother', { detail: 0.5 })) */
export const bother = (amount = 0.5) => emit('sw:bother', amount);

let bannerTimer = null;
export function banner(main, sub = '', tone = 'red', ms = 2600) {
  const el = document.getElementById('banner');
  if (!el) return;
  el.querySelector('.banner-main').textContent = main;
  el.querySelector('.banner-sub').textContent = sub;
  el.dataset.tone = tone;
  el.hidden = false;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { el.hidden = true; }, ms);
}

function makeCruiser() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 46');
  svg.setAttribute('class', 'cruiser');
  svg.setAttribute('aria-hidden', 'true');
  const add = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent.append(e); return e; };
  add('path', { d: 'M4 32 Q4 24 16 23 L34 22 L46 9 Q48 7 52 7 L82 7 Q86 7 88 10 L97 22 L110 24 Q117 25 117 32 L117 36 L4 36 Z', fill: '#EEF2FA', stroke: '#0A1128', 'stroke-width': 2.5 });
  add('path', { d: 'M4 30 L117 30 L117 36 L4 36 Z', fill: '#0A1128' });
  add('path', { d: 'M50 11 L66 11 L66 22 L40 22 Z M70 11 L84 11 L92 22 L70 22 Z', fill: '#3C5AA8' });
  add('rect', { x: 52, y: 1, width: 10, height: 6, fill: '#FF3B30', class: 'bar-red' });
  add('rect', { x: 62, y: 1, width: 10, height: 6, fill: '#2F7BFF', class: 'bar-blue' });
  add('circle', { cx: 28, cy: 37, r: 8, fill: '#0A1128', stroke: '#7B86A8', 'stroke-width': 2 });
  add('circle', { cx: 94, cy: 37, r: 8, fill: '#0A1128', stroke: '#7B86A8', 'stroke-width': 2 });
  document.body.append(svg);
  return { el: svg, x: Math.random() < 0.5 ? -140 : window.innerWidth + 20, speed: 2.4 + Math.random() * 1.2 };
}

export function mountWanted() {
  const starsEl = document.getElementById('stars');
  if (!starsEl) return;
  let heat = 0; let shown = -1; let immune = false; let cars = []; let last = performance.now(); let rested = 0;

  const paint = () => {
    const n = Math.min(MAX, Math.floor(heat));
    if (n === shown) return;
    const rising = n > shown;
    shown = n;
    starsEl.textContent = '★'.repeat(n) + '☆'.repeat(MAX - n);
    starsEl.setAttribute('aria-label', `Wanted level ${n} of ${MAX}`);
    starsEl.classList.toggle('hot', n > 0);
    if (rising && n > 0) play('star');
    loop('siren', n >= 3);
    if (rising && n > 0) { starsEl.classList.remove('bump'); void starsEl.getBoundingClientRect(); starsEl.classList.add('bump'); }
    document.body.classList.toggle('siren', n >= 3 && !reduce());
    if (rising && n === 1) banner('WANTED', 'For bothering a skeleton.', 'gold', 1800);
    if (rising && n === 5) banner('5 STARS', 'For a man who has not moved since 2013.', 'red', 2200);
  };
  document.addEventListener('sw:bother', (e) => {
    if (immune || document.body.classList.contains('stilling') || performance.now() - rested < 4000) return;
    heat = Math.max(0, Math.min(MAX + 0.99, heat + (Number(e.detail) || 0.5)));
    paint();
  });

  const bust = () => {
    rested = performance.now();
    heat = 0;
    cars.forEach((c) => c.el.remove());
    cars = [];
    paint();
    play('sting');
    banner('RESTED', 'Pat was returned to the couch. He did not resist. He did not notice.', 'white', 3400);
    emit('sw:busted');
  };

  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (heat > 0 && !document.body.classList.contains('stilling')) { heat = Math.max(0, heat - DECAY_PER_SEC * dt); paint(); }
    const want = reduce() ? 0 : Math.max(0, Math.min(3, shown - 1));
    while (cars.length < want) cars.push(makeCruiser());
    while (cars.length > want) cars.pop().el.remove();
    const mini = document.getElementById('minipat');
    const box = mini && !mini.hidden ? mini.getBoundingClientRect() : null;
    const floor = window.innerHeight - (window.innerWidth < 720 ? 56 : 0);
    for (const c of cars) {
      const w = c.el.clientWidth || 96;
      const goal = box ? box.left + box.width / 2 - w / 2 : window.innerWidth / 2;
      const gap = goal - c.x;
      c.x += Math.max(-c.speed, Math.min(c.speed, gap * 0.05));
      c.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${(floor - (c.el.clientHeight || 37)).toFixed(0)}px, 0) scaleX(${gap < 0 ? -1 : 1})`;
      if (shown >= MAX && box && Math.abs(gap) < w * 0.35 && box.bottom >= floor - 16) { bust(); break; }
    }
    requestAnimationFrame(frame);
  };
  paint();
  requestAnimationFrame(frame);

  // Real cheats, typed anywhere, or dialled on the CH II phone (the GTA V phone numbers).
  const CHEATS = {
    hesoyam: () => { banner('CHEAT ACTIVATED', 'Health, armor and $250,000. Pat has no health. The money is imaginary too.', 'green'); },
    aezakmi: () => { immune = true; heat = 0; paint(); banner('NEVER WANTED', 'The police have stopped looking. So has everyone else.', 'green'); },
    lawyerup: () => { heat = 0; paint(); banner('LAWYER UP', 'Wanted level cleared. Pat billed 0 hours. He was sitting.', 'green'); },
    rocketman: () => { emit('sw:rocket'); banner('ROCKETMAN', 'Small Pat is airborne. Big Pat stays. Big Pat always stays.', 'green'); },
    skyfall: () => { emit('sw:launch'); banner('SKYFALL', 'Small Pat has left the ground, briefly and against his will.', 'green'); },
    vicecity: () => { document.body.classList.toggle('neon'); banner('NICE NIGHT', 'Palm trees not included. Pat has not been outside.', 'pink'); },
    oppressor: () => { emit('sw:bike'); },
    gta6: () => { banner('NOT OUT YET', 'That is the entire website.', 'red'); },
    gtavi: () => { banner('NOT OUT YET', 'That is the entire website.', 'red'); },
    soon: () => { banner('SOON', 'Source: someone online, in 2014.', 'white'); },
  };
  const DIALED = { 52993787: 'lawyerup', 7593255: 'skyfall' }; // ends of the dialled numbers
  let typed = ''; let dialed = '';
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /^(input|textarea|select)$/i.test(e.target?.tagName || '')) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-12);
    for (const [code, run] of Object.entries(CHEATS)) if (typed.endsWith(code)) { typed = ''; play('cheat'); run(); document.getElementById('play-hint')?.classList.add('used'); return; }
  });
  document.getElementById('phone')?.addEventListener('click', (e) => {
    const k = e.target.closest('[data-key]')?.dataset.key;
    if (!k) return;
    dialed = (dialed + k).slice(-12);
    for (const [num, code] of Object.entries(DIALED)) if (dialed.endsWith(num)) { dialed = ''; play('cheat'); CHEATS[code](); return; }
  });
  // Phones have no keyboard to type at the page, so CH II has a box too.
  const box = document.getElementById('cheat-input');
  box?.addEventListener('input', () => {
    const code = box.value.trim().toLowerCase();
    if (CHEATS[code]) { box.value = ''; box.blur(); play('cheat'); CHEATS[code](); }
  });
  document.getElementById('cheats-toggle')?.addEventListener('click', () => { const l = document.getElementById('cheats-list'); l.hidden = !l.hidden; });
}

// The opening: every visit in a new tab starts by loading the game. It does not load.
export function bootScreen() {
  let seen = false;
  try { seen = sessionStorage.getItem('sw:booted') === '1'; sessionStorage.setItem('sw:booted', '1'); } catch { /* storage blocked: fine */ }
  const el = document.getElementById('boot');
  if (!el) return;
  if (seen || reduce()) { el.remove(); return; }
  el.hidden = false;
  const pct = el.querySelector('.boot-pct'); const bar = el.querySelector('.boot-bar i'); const line = el.querySelector('.boot-line');
  const close = () => { el.classList.add('gone'); setTimeout(() => el.remove(), 500); };
  el.addEventListener('click', close);
  const t0 = performance.now();
  const step = (now) => {
    if (!el.isConnected) return;
    const t = now - t0;
    const p = Math.min(99, Math.floor(99 * (1 - Math.pow(1 - Math.min(1, t / 1500), 3))));
    pct.textContent = p + '%'; bar.style.width = p + '%';
    if (t > 2000) line.textContent = 'Still loading. It has been 13 years.';
    if (t > 3300) line.textContent = 'This is Pat. He has been on this screen since 2013. Come in.';
    if (t > 4600) { close(); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
