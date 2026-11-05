// Pat's room is a toy. The room shifts with the pointer, Pat's head can be grabbed, the TV changes channel.
// Nothing here leaves the browser. All of it sits on top of room.js and can fail without hurting the page.
import { PACK } from './voice-pack.js';
import { mountTvChannels } from './tv.js';
import { bother } from './wanted.js';
import { play } from './sfx.js';
import { mountRoomToys } from './roomtoys.js';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const COUNT_KEY = 'sw:bothered';

const DEPTHS = [['svg-room', 0], ['window', -5], ['clock', -4], ['lamp', -3], ['tv', 6], ['tv-glow', 6], ['props', 8], ['couch', 7], ['pat', 10]];
const NECK = [470, 410]; // pivot, in Pat's own coordinates
const LET_GO = ["Pat sits back down. He never got up.", 'Pat would like his head back where it was.', 'That did nothing. Pat is still waiting.', 'Structurally, that was unnecessary.'];
const BOTHER_NOTES = { 5: 'Five times now. Pat has time.', 10: 'Ten. Pat will remember this. He has nothing else to do.', 25: 'You are now the most interesting thing since 2013.', 50: 'Fifty. Go outside. Pat cannot, but you can.' };

function say(text, near) {
  const el = document.getElementById('pat-says');
  const stage = document.getElementById('stage');
  if (!el || !stage) return;
  el.textContent = text;
  el.hidden = false;
  const other = document.getElementById('bike-says');
  if (other) other.hidden = true; // one voice at a time
  if (near) {
    const a = near.getBoundingClientRect(); const s = stage.getBoundingClientRect();
    const half = Math.min(150, s.width / 2 - 12);
    el.style.left = clamp(a.left - s.left + a.width / 2, half + 8, s.width - half - 8) + 'px';
    el.style.top = Math.max(96, a.top - s.top - 10) + 'px';
  }
  clearTimeout(say.timer);
  say.timer = setTimeout(() => { el.hidden = true; }, 3200);
}

// One hint at a time, so the room stays clean.
function rotateHints(hint) {
  const spans = hint ? [...hint.querySelectorAll('span')] : [];
  if (!spans.length) return;
  let i = 0;
  const show = () => { spans.forEach((s, n) => s.classList.toggle('on', n === i)); i = (i + 1) % spans.length; };
  show();
  setInterval(show, 3200);
}

export function mountPlay({ room }) {
  if (!room?.svg) return;
  const svg = room.svg;
  const byId = (id) => svg.querySelector('#' + id) || svg.querySelector('#svg-' + id);
  const hint = document.getElementById('play-hint');
  const played = () => hint?.classList.add('used');

  // The head becomes one piece: skull, headset and eyes move together on the neck.
  const skull = byId('skull'); const headset = byId('headset'); const eyes = byId('eyes');
  let head = null;
  if (skull && headset) {
    head = document.createElementNS(NS, 'g');
    head.setAttribute('id', 'pat-head');
    headset.parentNode.insertBefore(head, headset);
    head.append(skull, headset);
    if (eyes && !head.contains(eyes)) head.append(eyes);
  }
  const layers = DEPTHS.map(([id, depth]) => ({ el: byId(id), depth })).filter((l) => l.el && l.depth && !l.el.hasAttribute('transform'));

  const motion = !reduceMotion();
  let px = 0; let py = 0; let pxNow = 0; let pyNow = 0; // parallax
  let ang = 0; let angV = 0; let ox = 0; let oy = 0; let oxV = 0; let oyV = 0; // head spring
  let lookAng = 0; let dragging = false; let grab = null; let moved = 0; let target = [0, 0, 0];
  let running = false;

  const toLocal = (e) => {
    const m = head.parentNode.getScreenCTM()?.inverse();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return [p.x, p.y];
  };

  const frame = () => {
    pxNow += (px - pxNow) * 0.06; pyNow += (py - pyNow) * 0.06;
    for (const l of layers) l.el.setAttribute('transform', `translate(${(pxNow * l.depth).toFixed(2)} ${(pyNow * l.depth * 0.5).toFixed(2)})`);
    if (head) {
      const [tx, ty, ta] = dragging ? target : [0, 0, lookAng];
      const k = dragging ? 0.3 : 0.055; const d = dragging ? 0.55 : 0.86; // loose on release: the head wobbles back
      oxV = (oxV + (tx - ox) * k) * d; oyV = (oyV + (ty - oy) * k) * d; angV = (angV + (ta - ang) * k) * d;
      ox += oxV; oy += oyV; ang += angV;
      head.setAttribute('transform', `translate(${ox.toFixed(2)} ${oy.toFixed(2)}) rotate(${ang.toFixed(2)} ${NECK[0]} ${NECK[1]})`);
    }
    const busy = dragging || Math.abs(px - pxNow) + Math.abs(py - pyNow) > 0.002 || Math.abs(ox) + Math.abs(oy) + Math.abs(ang - lookAng) + Math.abs(oxV) + Math.abs(oyV) + Math.abs(angV) > 0.03;
    running = busy;
    if (busy) requestAnimationFrame(frame);
  };
  const wake = () => { if (!running) { running = true; requestAnimationFrame(frame); } };

  if (motion && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('pointermove', (e) => {
      if (document.body.classList.contains('stilling')) return;
      px = (e.clientX / window.innerWidth - 0.5) * -1.6;
      py = (e.clientY / window.innerHeight - 0.5) * -1.6;
      lookAng = clamp(((e.clientX / window.innerWidth) - 0.6) * 22, -11, 11); // mirrored art: positive tips towards the TV side
      wake();
    }, { passive: true });
  }

  function bothered() {
    let n = 0;
    try { n = (Number(localStorage.getItem(COUNT_KEY)) || 0) + 1; localStorage.setItem(COUNT_KEY, String(n)); } catch { /* storage blocked: fine */ }
    return n;
  }

  if (head) {
    head.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true; moved = 0; grab = toLocal(e);
      head.setPointerCapture?.(e.pointerId);
      played(); wake();
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const [x, y] = toLocal(e);
      const dx = x - grab[0]; const dy = y - grab[1];
      moved = Math.max(moved, Math.hypot(dx, dy));
      const len = Math.hypot(dx, dy) || 1; const reach = Math.min(len, 150) / len; // a neck only goes so far
      target = [dx * reach, dy * reach, clamp(dx * 0.1, -32, 32)];
    });
    const release = () => {
      if (!dragging) return;
      dragging = false; target = [0, 0, 0];
      const n = bothered();
      bother(moved < 8 ? 0.45 : 0.8);
      play('rattle');
      if (moved < 8) angV += 7; // a tap: he rattles
      say(BOTHER_NOTES[n] || (moved < 8 ? pick(PACK.bot.couch) : pick(LET_GO)), skull);
      wake();
    };
    head.addEventListener('pointerup', release);
    head.addEventListener('pointercancel', release);
    head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); angV += 7; say(pick(PACK.bot.couch), skull); wake(); } });
    head.setAttribute('tabindex', '0');
    head.setAttribute('role', 'button');
    head.setAttribute('aria-label', 'Poke Pat');
  }

  // Pressing the remote: a beam crosses the room and his arm twitches.
  mountRoomToys({ room, byId, say, skull: () => skull });
  rotateHints(hint);
  const arm = byId('arm');
  const beam = document.createElementNS(NS, 'line');
  beam.setAttribute('class', 'ir-beam');
  for (const [k, v] of [['x1', 470], ['y1', 276], ['x2', 238], ['y2', 276]]) beam.setAttribute(k, v);
  svg.append(beam);
  const pressRemote = () => {
    played();
    beam.classList.remove('fire'); void beam.getBoundingClientRect(); beam.classList.add('fire');
    if (arm && !arm.hasAttribute('transform')) {
      arm.setAttribute('transform', 'rotate(-3 455 470)');
      setTimeout(() => arm.removeAttribute('transform'), 140);
    }
  };
  mountTvChannels({ room, byId, onChange: (ch) => { pressRemote(); play('blip'); bother(0.12); if (ch.line) say(ch.line, skull); } });
}
