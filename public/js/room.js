// Pat's living room: loads assets/pat.svg inline and reacts to market rhythm, time of day and visit length.
import { STATE_POLL_MS } from './config.js';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const LAST_STATE_KEY = 'sw:lastState';

export async function mountRoom(container) {
  let svg = null;
  try {
    const r = await fetch('assets/pat.svg');
    if (!r.ok) throw new Error(r.status);
    const doc = new DOMParser().parseFromString(await r.text(), 'image/svg+xml');
    svg = document.importNode(doc.documentElement, true);
    if (svg.nodeName.toLowerCase() !== 'svg') throw new Error('bad svg');
    // Extra art layers (e.g. #headset, #room) are fine. An art id that is already used by the page
    // (Studio's <g id="room"> vs the page's div#room) is renamed to svg-<id> so ids stay unique.
    for (const el of svg.querySelectorAll('[id]')) {
      if (document.getElementById(el.id)) el.id = 'svg-' + el.id;
    }
    svg.setAttribute('aria-hidden', 'false');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    container.prepend(svg);
  } catch {
    // Fallback: a plain <img> of the same art (no reactions); the page still works.
    const img = document.createElement('img');
    Object.assign(img, { className: 'room-fallback', src: 'assets/pat.svg', alt: 'Pat, a skeleton, waiting on a couch in front of a TV', width: 800, height: 500 });
    container.prepend(img);
    return null;
  }
  const $ = (id) => svg.getElementById ? svg.getElementById(id) : svg.querySelector('#' + id);
  const room = {
    svg, container,
    eyes: $('eyes'), eyeL: $('eye-left'), eyeR: $('eye-right'),
    sky: $('window-sky'), orb: $('window-orb'), cobweb: $('cobweb'), clockHand: $('clock-hand'),
    dustLayer: container.querySelector('#dust-layer'),
    props: $('props') || $('svg-props'),
    tvText: addTvText(svg),
    visitWeb: 0, ageWeb: 0, aged: false,
  };
  fitPortrait(svg);
  setWindow(room);
  startCobwebs(room);
  followPointer(room);
  return room;
}

// The room fills the screen. On a phone the shot moves in on Pat instead of squeezing the whole room.
function fitPortrait(svg) {
  const q = window.matchMedia('(max-aspect-ratio: 1/1)');
  const apply = () => svg.setAttribute('viewBox', q.matches ? '80 -220 500 720' : '0 0 800 500');
  q.addEventListener('change', apply);
  apply();
}

// Text on the TV lives inside the art, so it stays on the screen however the room is cropped.
function addTvText(svg) {
  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'tv-text');
  g.setAttribute('aria-hidden', 'true');
  const line = (y, size) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', '170'); t.setAttribute('y', y); t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', size);
    g.append(t);
    return t;
  };
  const top = line('268', '24'); const bottom = line('292', '9.5');
  (svg.getElementById?.('tv-glow') || svg.querySelector('#tv-glow'))?.before(g);
  return { top, bottom };
}

export function setTvText(room, top, bottom) {
  if (!room?.tvText) return;
  room.tvText.top.textContent = top;
  room.tvText.bottom.textContent = bottom;
}

// Pat's eyes follow the pointer, very slowly. He is in no hurry.
function followPointer(room) {
  if (reduceMotion() || !window.matchMedia('(hover: hover)').matches || !room.eyeL) return;
  let tx = 0; let ty = 0; let x = 0; let y = 0; let running = false;
  const step = () => {
    x += (tx - x) * 0.018; y += (ty - y) * 0.018;
    const t = `translate(${(-x * 2.6).toFixed(2)} ${(y * 2.6).toFixed(2)})`; // the eyes sit in Pat's mirrored coordinates (scale -0.38)
    room.eyeL.setAttribute('transform', t); room.eyeR?.setAttribute('transform', t);
    running = Math.abs(tx - x) + Math.abs(ty - y) > 0.03;
    if (running) requestAnimationFrame(step);
  };
  window.addEventListener('pointermove', (e) => {
    tx = clamp((e.clientX / window.innerWidth - 0.5) * 9, -4.5, 4.5);
    ty = clamp((e.clientY / window.innerHeight - 0.5) * 6, -3, 3);
    if (!running) { running = true; requestAnimationFrame(step); }
  }, { passive: true });
}

const hexLerp = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const AGE_PROPS = [['pizza', 0.22], ['plant', 0.44], ['spider', 0.62], ['mail', 0.84]];

/**
 * The scroll through the years (js/tunnel.js). p = 0 is September 17, 2013; 1 is today.
 * Days pass in the window, the clock spins, cobwebs grow, things pile up. showProps is off once the live story owns them.
 */
export function ageRoom(room, p, { showProps = true } = {}) {
  if (!room) return;
  room.ageWeb = p;
  paintWeb(room);
  if (p >= 0.985) {
    if (room.aged) { room.aged = false; paintWindow(room); }
  } else {
    room.aged = true;
    const wave = (Math.sin(p * Math.PI * 16) + 1) / 2; // 8 slow day/night rounds, slow enough not to strobe
    room.sky?.setAttribute('fill', hexLerp('#16213a', '#8cc7e8', wave));
    room.orb?.setAttribute('fill', hexLerp('#e8e3c8', '#fff6d2', wave));
    room.orb?.setAttribute('cy', (165 - wave * 75).toFixed(0));
    room.clockHand?.setAttribute('transform', `rotate(${(p * 360 * 13).toFixed(1)} 420 95)`);
  }
  if (showProps && room.props) {
    for (const [name, at] of AGE_PROPS) room.props.querySelector(`[data-prop="${name}"]`)?.setAttribute('display', p >= at ? 'inline' : 'none');
  }
}

// Window shows morning / day / sunset / night by the VISITOR's local hour.
function setWindow(room) {
  paintWindow(room);
  setTimeout(() => setWindow(room), 10 * 60_000);
}

function paintWindow(room, now = new Date()) {
  if (room.aged) return;
  const h = now.getHours();
  const phase = h >= 5 && h < 9 ? 'morning' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'sunset' : 'night';
  const sky = { morning: '#f3b48a', day: '#8cc7e8', sunset: '#d9725a', night: '#16213a' }[phase];
  const orb = { morning: '#ffe7a8', day: '#fff6d2', sunset: '#ffcf70', night: '#e8e3c8' }[phase];
  room.sky?.setAttribute('fill', sky);
  room.orb?.setAttribute('fill', orb);
  room.orb?.setAttribute('cy', phase === 'night' ? 100 : phase === 'day' ? 92 : 165);
  room.container.dataset.time = phase;
}

// Cobwebs grow with how long this visitor has stayed (full after ~10 minutes).
function startCobwebs(room) {
  const t0 = Date.now();
  const tick = () => {
    room.visitWeb = clamp((Date.now() - t0) / 600_000, 0, 1);
    paintWeb(room);
    if (room.visitWeb < 1) setTimeout(tick, 15_000);
  };
  tick();
}
const paintWeb = (room) => room.cobweb?.setAttribute('opacity', (Math.max(room.visitWeb, room.ageWeb) * 0.8).toFixed(2));

/** Wall clock: red hand points at the next 4-hour event (fraction of the way through the slot). */
export function setClock(room, msToNext) {
  if (!room?.clockHand || room.aged) return;
  const frac = 1 - clamp(msToNext / (4 * 3600_000), 0, 1);
  room.clockHand.setAttribute('transform', `rotate(${(frac * 360).toFixed(1)} 420 95)`);
}

function spawnDust(room, count) {
  if (!room?.dustLayer) return;
  const n = reduceMotion() ? Math.min(count, 8) : count;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('span');
    d.className = 'dust';
    d.style.left = (20 + Math.random() * 75) + '%';
    d.style.top = (Math.random() * 55) + '%';
    d.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
    d.style.setProperty('--dur', (4 + Math.random() * 5).toFixed(1) + 's');
    d.style.animationDelay = (Math.random() * 3).toFixed(1) + 's';
    room.dustLayer.appendChild(d);
    setTimeout(() => d.remove(), reduceMotion() ? STATE_POLL_MS : 12_000);
  }
}

/** Apply a market state to the room. Pre-launch or missing data => calm idle. */
export function applyMarket(room, state) {
  if (!room) return;
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const live = Boolean(state) && !state.preLaunch && !state.error && isNum(state.change5m);
  room.container.dataset.mood = live ? (state.change5m > 1 ? 'up' : state.change5m < -1 ? 'down' : 'flat') : 'idle';

  // TV flicker intensity from 24h volume (log scale: $1k -> 0, $1M+ -> 1).
  const vol = live && isNum(state.volume24h) ? state.volume24h : 0;
  const flicker = live ? clamp((Math.log10(Math.max(vol, 1)) - 3) / 3, 0.05, 1) : 0.08;
  room.container.style.setProperty('--flicker', flicker.toFixed(2));

  // Eye dots: up with hope, down with despair. +-20% 5m change => +-9px. Missing dot = collapse.
  const ch = live ? state.change5m : 0;
  const dy = clamp(-ch * 0.45, -9, 9) * 2.6; // Pat's own coordinates
  room.eyes?.setAttribute('transform', `translate(0 ${dy.toFixed(1)})`);
  room.eyeR?.setAttribute('opacity', live && ch <= -25 ? '0' : '1');

  // Dust on dips.
  if (live && ch < -1) spawnDust(room, Math.round(clamp(-ch, 2, 30)));
}

export const MOCK_KINDS = ['up', 'down', 'flat'];
/** ?mock=up|down|flat is forwarded ONLY if the server said mockAllowed and the value is one of the three. */
export function pickMockKind(search, serverAllowsMock) {
  if (!serverAllowsMock) return null;
  const m = new URLSearchParams(search || '').get('mock');
  return MOCK_KINDS.includes(m) ? m : null;
}

/** Poll /api/state every 60s. Keeps last known state on failure (stored in the browser). */
export function startMarketPolling(onState, onCA = () => {}) {
  let mock = null; // decided after the first bare response
  let last = null;
  try { last = JSON.parse(localStorage.getItem(LAST_STATE_KEY) || 'null'); } catch { /* ignore */ }
  if (last) onState({ ...last, stale: true });

  const poll = async () => {
    try {
      const r = await fetch(mock ? `/api/state?mock=${mock}` : '/api/state', { cache: 'no-store' });
      if (!r.ok && r.status !== 502) throw new Error(r.status);
      const s = await r.json();
      if (!mock) {
        const want = pickMockKind(location.search, s.mockAllowed === true);
        if (want) { mock = want; return poll(); }
      }
      // The CA comes from the server's TOKEN_MINT and is valid even if market data is down (502).
      if (!mock && typeof s.ca === 'string') onCA(s.ca);
      if (!r.ok) throw new Error(r.status);
      last = s;
      if (!mock) try { localStorage.setItem(LAST_STATE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
      onState(s);
    } catch {
      onState(last ? { ...last, stale: true } : { preLaunch: true, offline: true });
    }
  };
  poll();
  const id = setInterval(() => { if (!document.hidden) poll(); }, STATE_POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  return () => clearInterval(id);
}
