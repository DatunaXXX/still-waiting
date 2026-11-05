// The Oppressed Mk VI: our own flying bike, with Pat on it. It wanders the page at random, gets carried along when you scroll,
// sometimes leaves and comes back, and fires at police cruisers when clicked. Decorative: nothing depends on it.
import { banner, bother } from './wanted.js';
import { play, loop, engineSpeed } from './sfx.js';

const NS = 'http://www.w3.org/2000/svg';
const LINES = ['The Oppressed Mk VI. Pat bought it to get to the couch faster.', 'Pat is not going anywhere. He is just not going anywhere faster.', 'Top speed: patient.', 'Fully paid off. He has had time.'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function drawBike() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 -78 200 174');
  const add = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); svg.append(e); return e; };
  add('path', { class: 'bike-flame', d: 'M24 56 L-2 50 L8 60 L-6 68 L26 66 Z', fill: '#FF9A3D' });
  add('path', { class: 'bike-flame', d: 'M24 58 L8 56 L14 61 L6 65 L26 64 Z', fill: '#FFE27A' });
  add('path', { d: 'M62 58 L30 28 L52 28 L92 54 Z', fill: '#3F2C86', stroke: '#0A1128', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  add('rect', { x: 18, y: 50, width: 36, height: 20, rx: 8, fill: '#26304F', stroke: '#0A1128', 'stroke-width': 3 });
  add('path', { d: 'M38 50 Q70 34 110 44 L154 56 Q166 60 156 68 L128 76 Q84 84 44 72 Z', fill: '#E8476F', stroke: '#0A1128', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  add('path', { d: 'M60 52 Q88 44 116 51', fill: 'none', stroke: '#FFD36E', 'stroke-width': 4, 'stroke-linecap': 'round' });
  add('path', { d: 'M120 44 L140 22 L148 24', fill: 'none', stroke: '#0A1128', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  add('path', { d: 'M122 68 L172 80 L150 58 Z', fill: '#3F2C86', stroke: '#0A1128', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  add('circle', { cx: 158, cy: 62, r: 5, fill: '#7CFFE3' });
  add('ellipse', { class: 'bike-hover', cx: 92, cy: 90, rx: 62, ry: 4, fill: '#7FB2FF' });
  // Pat, riding: drawn for the bike, bones in the same ink-and-white style as the room art.
  const bone = (d, w = 7) => {
    add('path', { d, fill: 'none', stroke: '#0A1128', 'stroke-width': w + 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    add('path', { d, fill: 'none', stroke: '#EEF2FA', 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  };
  bone('M86 30 L112 40 L100 64 L116 66');                // far leg, boot on the footrest
  bone('M92 -18 Q78 4 84 32', 8);                        // spine
  for (const [y, w] of [[-8, 13], [2, 14], [12, 13]]) bone(`M${86 - w / 2} ${y} L${88 + w / 2} ${y + 2}`, 3);
  bone('M78 32 L108 44 L94 70 L112 72');                 // near leg
  bone('M90 -12 L114 8 L139 22');                        // arm on the handlebar
  add('circle', { cx: 139, cy: 22, r: 5, fill: '#EEF2FA', stroke: '#0A1128', 'stroke-width': 2.5 });
  add('circle', { cx: 100, cy: -44, r: 27, fill: '#EEF2FA', stroke: '#0A1128', 'stroke-width': 3.5 });
  add('circle', { cx: 103, cy: -46, r: 5.4, fill: '#0A1128' });
  add('circle', { cx: 105, cy: -48, r: 1.8, fill: '#fff' });
  add('path', { d: 'M113 -46 Q118 -52 124 -46', fill: 'none', stroke: '#0A1128', 'stroke-width': 3, 'stroke-linecap': 'round' });
  add('ellipse', { cx: 92, cy: -36, rx: 4, ry: 2.4, fill: '#FF9DB8' });
  add('ellipse', { cx: 121, cy: -36, rx: 4, ry: 2.4, fill: '#FF9DB8' });
  add('path', { d: 'M101 -35 Q110 -24 118 -35 Q110 -33 101 -35 Z', fill: '#0A1128' });
  add('path', { d: 'M76 -46 A26 28 0 0 1 124 -60', fill: 'none', stroke: '#0A1128', 'stroke-width': 7, 'stroke-linecap': 'round' });
  add('path', { d: 'M76 -46 A26 28 0 0 1 124 -60', fill: 'none', stroke: '#2A3350', 'stroke-width': 3, 'stroke-linecap': 'round' });
  add('rect', { x: 68, y: -54, width: 14, height: 22, rx: 6, fill: '#2A3350', stroke: '#0A1128', 'stroke-width': 3 });
  add('circle', { cx: 75, cy: -43, r: 3, fill: '#5AA9FF' });
  add('path', { d: 'M75 -32 Q86 -18 108 -24', fill: 'none', stroke: '#0A1128', 'stroke-width': 3.5, 'stroke-linecap': 'round' });
  add('circle', { cx: 108, cy: -24, r: 3.5, fill: '#2A3350', stroke: '#0A1128', 'stroke-width': 2 });
  return svg;
}

export function mountHoverbike() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.getElementById('hoverbike');
  if (!el) return;
  el.prepend(drawBike());
  const size = () => el.offsetWidth || 170;
  let x = -220; let y = 160; let vx = 0; let vy = 0; let rot = 0; let face = 1; let roll = 0;
  let goal = null; let goalUntil = 0; let awayUntil = 0; let lastScroll = window.scrollY; let bumped = 0;

  const newGoal = (now) => {
    const w = window.innerWidth; const h = window.innerHeight;
    if (Math.random() < 0.16) { // leave for a while
      goal = { x: Math.random() < 0.5 ? -320 : w + 320, y: rand(60, h - 160), leave: true };
    } else {
      goal = { x: rand(10, w - size() - 70), y: rand(70, h - 190) };
    }
    goalUntil = now + rand(2500, 6500);
  };

  // Scrolling carries the bike along with the page, and it noses into the direction of travel.
  window.addEventListener('scroll', () => {
    const d = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    if (now0() < awayUntil) return;
    vy += clamp(d * 0.04, -4, 4);
    vx += face * Math.min(1.2, Math.abs(d) * 0.006);
    bumped = 1;
  }, { passive: true });
  const now0 = () => performance.now();

  const say = (text) => {
    const note = document.getElementById('bike-says');
    note.textContent = text; note.hidden = false;
    const other = document.getElementById('pat-says');
    if (other) other.hidden = true; // one voice at a time
    clearTimeout(say.t); say.t = setTimeout(() => { note.hidden = true; }, 2800);
  };

  function fire() {
    roll = 1;
    play('whoosh');
    const cars = [...document.querySelectorAll('.cruiser')];
    if (!cars.length) { say(pick(LINES)); return; }
    const b = el.getBoundingClientRect();
    const t = cars[Math.floor(Math.random() * cars.length)].getBoundingClientRect();
    const m = document.createElement('i');
    m.className = 'missile';
    document.body.append(m);
    const fromX = b.left + b.width / 2; const fromY = b.top + b.height * 0.7;
    const toX = t.left + t.width / 2; const toY = t.top + t.height / 2;
    m.style.setProperty('--r', `${Math.atan2(toY - fromY, toX - fromX)}rad`);
    play('missile');
    const flight = m.animate([{ transform: `translate(${fromX}px, ${fromY}px) rotate(var(--r))` }, { transform: `translate(${toX}px, ${toY}px) rotate(var(--r))` }], { duration: 520, easing: 'ease-in', fill: 'forwards' });
    flight.onfinish = () => {
      m.remove();
      const boom = document.createElement('i');
      boom.className = 'boom';
      boom.style.left = toX + 'px'; boom.style.top = toY + 'px';
      document.body.append(boom);
      setTimeout(() => boom.remove(), 700);
      play('boom');
      bother(-1.05); // one star down, so one car fewer
      say('Pat got out of a ticket. He was not in a hurry.');
    };
  }
  el.addEventListener('click', fire);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  // OPPRESSOR: for the first time since 2013, Pat leaves the couch. Eight seconds. Then he sits back down.
  const couchPat = document.querySelector('#room #pat') || document.querySelector('#room #svg-pat');
  let backTimer = null;
  document.addEventListener('sw:bike', () => {
    awayUntil = 0;
    const box = couchPat?.getBoundingClientRect();
    const onScreen = box && box.bottom > 0 && box.top < window.innerHeight;
    if (!onScreen) {
      x = -220; y = rand(90, 300); goal = { x: window.innerWidth * 0.45, y: rand(120, 320) }; goalUntil = now0() + 3500;
      banner('MK VI DELIVERED', 'The Oppressed. Pat signed for it without standing up.', 'pink');
      return;
    }
    x = box.left + box.width / 2 - size() / 2; y = box.top + box.height / 2 - size() / 2;
    couchPat.setAttribute('display', 'none');
    vx = 0; vy = -7; face = 1; roll = 0;
    goal = { x: window.innerWidth * 0.2, y: 60 }; goalUntil = now0() + 2600;
    play('whoosh');
    say('Pat got up. For the first time since 2013.');
    clearTimeout(backTimer);
    backTimer = setTimeout(() => {
      couchPat.removeAttribute('display');
      play('thud');
      banner('HE SAT BACK DOWN', 'That was the most he has moved in 13 years. There is also a bike now, somehow.', 'pink', 3000);
    }, 8000);
  });

  const frame = (now) => {
    if (now < awayUntil) loop('engine', false);
    const still = document.body.classList.contains('stilling');
    el.classList.toggle('bike-still', still);
    if (still) { requestAnimationFrame(frame); return; }
    if (now >= awayUntil) {
      if (!goal || now > goalUntil) newGoal(now);
      const dx = goal.x - x; const dy = goal.y - y;
      vx = (vx + clamp(dx * 0.0009, -0.13, 0.13)) * 0.965;
      vy = (vy + clamp(dy * 0.0014, -0.14, 0.14)) * 0.95;
      x += vx; y += vy + Math.sin(now / 420) * 0.35;
      if (y < 40) { y = 40; vy = Math.max(0, vy); }
      const low = window.innerHeight - size() - 40;
      if (y > low) { y = low; vy = Math.min(0, vy); }
      if (goal.leave && Math.abs(dx) < 90) { awayUntil = now + rand(6000, 14000); goal = null; x = Math.random() < 0.5 ? -260 : window.innerWidth + 90; y = rand(70, window.innerHeight - 200); vx = 0; vy = 0; }
      if (Math.abs(vx) > 0.25) face = vx > 0 ? 1 : -1;
      const visible = x > -size() && x < window.innerWidth;
      loop('engine', visible);
      engineSpeed(Math.min(1, Math.hypot(vx, vy) / 5));
      rot += (clamp(vy * 4 - Math.abs(vx) * 1.4, -24, 24) - rot) * 0.08;
      roll = Math.max(0, roll - 0.022);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scaleX(${face}) rotate(${(rot + roll * 360).toFixed(1)}deg)`;
      const note = document.getElementById('bike-says');
      if (!note.hidden) note.style.transform = `translate3d(${clamp(x, 8, window.innerWidth - 300).toFixed(0)}px, ${Math.max(60, y - 34).toFixed(0)}px, 0)`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  el.hidden = false;
}
