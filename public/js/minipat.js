import { bother } from './wanted.js';
import { play } from './sfx.js';

// A small Pat lives at the bottom of the screen. He shuffles after the pointer, reacts to what you do, and you can pick him up and throw him.
// He always walks back. Decorative only: nothing depends on him, and reduced-motion visitors do not get him.
const POSES = { waiting: 'pat-01-waiting', hope: 'pat-02-hope', despair: 'pat-03-despair', breakdown: 'pat-04-breakdown', clicking: 'pat-05-clicking', happened: 'pat-06-it-happened' };
const GRAVITY = 0.62; const BOUNCE = 0.56; const FRICTION = 0.82;
const THROWN = ['Again.', 'Please.', 'He was comfortable.', 'Pat felt that. Pat has no nerves. Still.', 'The couch was right there.', 'Thirteen years. For this.'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function mountMiniPat() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.getElementById('minipat');
  const img = el?.querySelector('img');
  const note = document.getElementById('minipat-says');
  if (!el || !img) return;
  el.hidden = false;
  for (const name of Object.values(POSES)) new Image().src = `assets/kit/thumbs/${name}-320.webp`;

  const size = () => el.offsetWidth || 96;
  const floorY = () => window.innerHeight - size() - (window.innerWidth < 720 ? 56 : 0);
  let x = window.innerWidth * 0.5; let y = floorY(); let vx = 0; let vy = 0; let rot = 0; let spin = 0; let face = 1;
  let targetX = x; let state = 'floor'; // floor | held | air
  let pose = 'waiting'; let poseUntil = 0; let trail = []; let lastMove = performance.now(); let walked = 0;

  const setPose = (name, ms = 0) => {
    poseUntil = ms ? performance.now() + ms : 0;
    if (pose === name) return;
    pose = name;
    img.src = `assets/kit/thumbs/${POSES[name]}-320.webp`;
  };
  const speak = (text) => {
    note.textContent = text; note.hidden = false;
    clearTimeout(speak.t); speak.t = setTimeout(() => { note.hidden = true; }, 2200);
  };

  window.addEventListener('pointermove', (e) => { targetX = e.clientX - size() / 2; lastMove = performance.now(); }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (state === 'floor' && !el.contains(e.target)) setPose('clicking', 500);
    targetX = e.clientX - size() / 2;
  }, { passive: true });
  const six = document.getElementById('ch-six');
  six?.addEventListener('pointerenter', () => setPose('hope', 4000));
  six?.addEventListener('pointerleave', () => setPose('despair', 1800));
  six?.addEventListener('click', () => setPose('despair', 3600));

  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    state = 'held'; spin = 0; trail = []; if (rocket) { rocket = false; el.classList.remove('rocket'); }
    setPose('breakdown');
    el.classList.add('held');
  });
  el.addEventListener('pointermove', (e) => {
    if (state !== 'held') return;
    x = e.clientX - size() / 2; y = e.clientY - size() / 2;
    trail.push([performance.now(), x, y]);
    if (trail.length > 6) trail.shift();
  });
  const drop = () => {
    if (state !== 'held') return;
    el.classList.remove('held');
    const a = trail[0]; const b = trail[trail.length - 1];
    if (a && b && b[0] > a[0]) { const dt = (b[0] - a[0]) / 16.7; vx = (b[1] - a[1]) / dt; vy = (b[2] - a[2]) / dt; } else { vx = 0; vy = 0; }
    vx = Math.max(-60, Math.min(60, vx)); vy = Math.max(-60, Math.min(60, vy));
    spin = vx * 0.9;
    state = 'air';
    play('whoosh');
    bother(0.9);
  };
  el.addEventListener('pointerup', drop);
  el.addEventListener('pointercancel', drop);

  let rocket = false; let pointerY = 200;
  window.addEventListener('pointermove', (e) => { pointerY = e.clientY - size() / 2; }, { passive: true });
  document.addEventListener('sw:rocket', () => { rocket = !rocket; if (rocket && state === 'floor') { state = 'rocket'; setPose('hope'); } else if (!rocket) { state = 'air'; vx = 0; vy = 0; } el.classList.toggle('rocket', rocket); });
  document.addEventListener('sw:launch', () => { rocket = false; el.classList.remove('rocket'); state = 'air'; vy = -32; vx = (Math.random() - 0.5) * 34; spin = vx; setPose('breakdown'); });
  document.addEventListener('sw:busted', () => { rocket = false; el.classList.remove('rocket'); state = 'floor'; rot = 0; vx = 0; vy = 0; x = window.innerWidth * 0.5; targetX = x; setPose('despair', 3400); });

  const frame = () => {
    const now = performance.now();
    const still = document.body.classList.contains('stilling');
    const maxX = window.innerWidth - size();
    if (state === 'rocket') {
      x += (targetX - x) * 0.05; y += (pointerY - y) * 0.05;
      face = targetX > x ? 1 : -1; rot = Math.max(-25, Math.min(25, (targetX - x) * 0.05));
    } else if (state === 'air') {
      vy += GRAVITY; x += vx; y += vy; rot += spin;
      if (x <= 0) { x = 0; vx = -vx * BOUNCE; spin = -spin * 0.6; }
      if (x >= maxX) { x = maxX; vx = -vx * BOUNCE; spin = -spin * 0.6; }
      if (y <= 0) { y = 0; vy = -vy * BOUNCE; }
      if (y >= floorY()) {
        y = floorY();
        const hit = Math.abs(vy);
        if (hit > 6) play('thud'); else if (hit > 2.5) play('rattle');
        vy = -vy * BOUNCE; vx *= FRICTION; spin *= 0.6;
        if (hit < 3) {
          vy = 0; state = 'floor'; rot = 0; spin = 0;
          setPose('breakdown', 1400);
          if (Math.abs(vx) + hit > 0 && Math.random() < 0.7) speak(pick(THROWN));
        }
      }
    } else if (state === 'floor') {
      y = floorY();
      const gap = targetX - x;
      const busy = pose !== 'waiting' && poseUntil && now < poseUntil;
      if (Math.abs(gap) > 6 && !still && !(busy && pose === 'breakdown')) {
        const step = Math.max(-2.6, Math.min(2.6, gap * 0.03));
        x = Math.max(0, Math.min(maxX, x + step));
        walked += Math.abs(step); face = step > 0 ? 1 : -1;
        rot = Math.sin(walked / 7) * 5;
      } else rot *= 0.8;
      if (poseUntil && now >= poseUntil) setPose(now - lastMove > 9000 ? 'waiting' : 'waiting');
    }
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg) scaleX(${face})`;
    note.style.transform = `translate3d(${Math.max(8, Math.min(window.innerWidth - 220, x - 50)).toFixed(0)}px, ${(y - 38).toFixed(0)}px, 0)`;
    requestAnimationFrame(frame);
  };
  frame();
}
