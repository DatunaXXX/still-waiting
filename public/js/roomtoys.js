// More of the room answers back: the window has things going past, the clock can be spun, the lamp can be turned off.
import { play } from './sfx.js';
import { bother } from './wanted.js';

const NS = 'http://www.w3.org/2000/svg';
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const add = (parent, tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent.append(e); return e; };

// Drawn around 0,0 and flown across the window (x 610 to 760, y 70 to 190).
const VISITORS = [
  { line: 'A UFO. It looked in, saw Pat, and left without taking him.', sound: 'ufo', draw(g) {
    add(g, 'ellipse', { cx: 0, cy: 4, rx: 24, ry: 7, fill: '#AEBBD8', stroke: '#0A1128', 'stroke-width': 1.5 });
    add(g, 'path', { d: 'M-10 2 Q0 -14 10 2 Z', fill: '#7CFFE3', stroke: '#0A1128', 'stroke-width': 1.5 });
    add(g, 'path', { d: 'M-8 11 L-20 44 L20 44 L8 11 Z', fill: '#7CFFE3', opacity: 0.3 });
  } },
  { line: 'A police helicopter. Not for Pat. Nothing is ever for Pat.', sound: 'whoosh', draw(g) {
    add(g, 'ellipse', { cx: 0, cy: 0, rx: 16, ry: 8, fill: '#26304F', stroke: '#0A1128', 'stroke-width': 1.5 });
    add(g, 'path', { d: 'M14 -1 L34 -5 L34 1 L14 3 Z', fill: '#26304F' });
    add(g, 'rect', { x: -22, y: -12, width: 44, height: 2, fill: '#E6F0FF' });
    add(g, 'circle', { cx: -12, cy: 1, r: 3, fill: '#FF5A4F' });
  } },
  { line: 'Somebody just drove past, in the air. Pat has one of those.', sound: 'whoosh', draw(g) {
    add(g, 'path', { d: 'M-24 4 Q-22 -3 -10 -3 L-5 -10 L12 -10 L18 -3 L25 0 L25 7 L-24 7 Z', fill: '#E8476F', stroke: '#0A1128', 'stroke-width': 1.5 });
    add(g, 'circle', { cx: -13, cy: 8, r: 4, fill: '#0A1128' }); add(g, 'circle', { cx: 15, cy: 8, r: 4, fill: '#0A1128' });
  } },
  { line: 'A shooting star. Pat wished for a release date. He has done this before.', sound: 'click', draw(g) {
    add(g, 'path', { d: 'M0 0 L-46 -14', stroke: '#FFE27A', 'stroke-width': 3, 'stroke-linecap': 'round' });
    add(g, 'circle', { cx: 0, cy: 0, r: 4, fill: '#FFF6D2' });
  } },
  { line: "A blimp. It says RELEASE DATE on one side. Pat can't see the other side.", sound: 'whoosh', draw(g) {
    add(g, 'ellipse', { cx: 0, cy: 0, rx: 30, ry: 13, fill: '#F2EAD3', stroke: '#0A1128', 'stroke-width': 1.5 });
    add(g, 'rect', { x: -7, y: 12, width: 14, height: 5, fill: '#26304F' });
  } },
];
const CLOCK_LINES = ['You spun the clock. Thirteen more years went by. Pat did not look up.', 'It is still not November 19.', 'Time flies. Not for Pat.'];

export function mountRoomToys({ room, byId, say, skull }) {
  const svg = room.svg;
  const win = byId('window'); const clock = byId('clock'); const lamp = byId('lamp'); const hand = byId('clock-hand');
  const clickable = (el, label, run) => {
    if (!el) return;
    el.classList.add('toy');
    el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', label);
    el.addEventListener('click', () => { document.getElementById('play-hint')?.classList.add('used'); run(); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } });
  };

  // Things fly past inside the window frame only.
  const clip = document.createElementNS(NS, 'clipPath');
  clip.setAttribute('id', 'window-view');
  add(clip, 'rect', { x: 610, y: 70, width: 150, height: 120 });
  svg.querySelector('defs')?.append(clip);
  const sky = byId('window-sky');
  const view = document.createElementNS(NS, 'g');
  view.setAttribute('clip-path', 'url(#window-view)');
  view.setAttribute('pointer-events', 'none');
  sky?.after(view);
  let turn = Math.floor(Math.random() * VISITORS.length); let flying = false;
  clickable(win, 'Look out of the window', () => {
    if (flying) return;
    flying = true;
    const v = VISITORS[turn++ % VISITORS.length];
    const g = document.createElementNS(NS, 'g');
    v.draw(g); view.append(g);
    const y = 96 + Math.random() * 56;
    play(v.sound); bother(0.08); say(v.line, skull());
    const t0 = performance.now(); const len = 2300;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / len);
      g.setAttribute('transform', `translate(${(575 + p * 220).toFixed(1)} ${(y + Math.sin(p * 7) * 5).toFixed(1)})`);
      if (p < 1) requestAnimationFrame(step); else { g.remove(); flying = false; }
    };
    requestAnimationFrame(step);
  });

  clickable(clock, 'Spin the clock', () => {
    if (!hand) return;
    hand.classList.remove('spin'); void hand.getBoundingClientRect(); hand.classList.add('spin');
    play('rattle'); bother(0.08); say(pick(CLOCK_LINES), skull());
  });

  clickable(lamp, 'Switch the lamp', () => {
    const off = room.container.classList.toggle('lights-off');
    play('click'); bother(0.05);
    say(off ? 'Lights off. Only the TV now. Pat prefers it.' : 'Lights on. Pat did not ask for this.', skull());
  });
}
