// The TV in the room really changes channel. Click it (or press , and . on a keyboard). The first click shows Pat's dream
// (a community picture Datuna approved as-is on 2026-11-06), then five channels play. VI does not.
const W = 288; const H = 200;
const NS = 'http://www.w3.org/2000/svg';
const XHTML = 'http://www.w3.org/1999/xhtml';
const CREAM = '#F2EAD3'; const RED = '#FF5A4F'; const BLUE = '#1E46C8';
const MONO = 'ui-monospace, Menlo, monospace';
const text = (c, str, x, y, size, color = CREAM, align = 'center', weight = 700) => {
  c.font = `${weight} ${size}px ${MONO}`; c.fillStyle = color; c.textAlign = align; c.fillText(str, x, y);
};

let dvd = { x: 30, y: 40, vx: 1.1, vy: 0.8, hue: 0, bounces: 0 };
const TICKER = 'BREAKING: STILL NOTHING  +++  LOCAL SKELETON REMAINS SEATED  +++  GTA VI EXPERTS SAY SOON  +++  THEY SAID THAT IN 2014  +++  ';

// Pat's dream: a picture, slowly panned top to bottom and back (still when reduced motion is on).
const dream = new Image();
dream.decoding = 'async';
dream.src = 'assets/tv/dream.jpg';

const CHANNELS = [
  { name: 'DREAM', line: 'Pat dozed off. He dreams in purple.', draw(c, t, still) {
    c.fillStyle = '#1A0B2E'; c.fillRect(0, 0, W, H);
    if (!dream.complete || !dream.naturalWidth) { text(c, 'TUNING IN…', W / 2, H / 2 + 8, 20); return; }
    const sw = dream.naturalWidth; const sh = sw * H / W; // fill the screen width, show a band of the height
    const room = dream.naturalHeight - sh;
    const k = still ? 0.5 : (1 - Math.cos(t / 9000)) / 2;
    c.drawImage(dream, 0, room * k, sw, sh, 0, 0, W, H);
  } },
  { name: 'I', line: 'Pat has seen this one.', draw(c, t) {
    c.fillStyle = '#0B1E5A'; c.fillRect(0, 0, W, H);
    c.fillStyle = RED; c.fillRect(0, 22, 118, 24); text(c, 'BREAKING', 59, 40, 18);
    text(c, 'GTA VI', W / 2, 88, 40); text(c, 'NOT OUT', W / 2, 134, 42);
    c.fillStyle = CREAM; c.fillRect(0, 164, W, 26);
    c.font = `700 16px ${MONO}`; c.fillStyle = '#05081A'; c.textAlign = 'left';
    const off = (t / 22) % (TICKER.length * 9.6);
    c.fillText(TICKER + TICKER, -off, 183);
  } },
  { name: 'II', line: 'Pat checked. It is the couch again.', draw(c, t) {
    c.fillStyle = '#123A6B'; c.fillRect(0, 0, W, H);
    text(c, 'FORECAST', W / 2, 34, 22);
    for (let i = 0; i < 3; i++) {
      const x = 56 + i * 88;
      c.fillStyle = '#7FB2FF'; c.beginPath(); c.arc(x, 82 + Math.sin(t / 700 + i) * 4, 19, 0, 7); c.fill();
      text(c, ['NOV', 'NOV', 'NOV'][i], x, 124, 13);
      text(c, ['WAIT', 'WAIT', 'WAIT'][i], x, 146, 17);
    }
    text(c, 'COUCH: 100% CHANCE OF PAT', W / 2, 182, 15, '#FFE7A8');
  } },
  { name: 'III', line: 'Pat already owns it. Three times.', draw(c, t) {
    c.fillStyle = Math.floor(t / 500) % 2 ? '#7A1020' : '#A01A2C'; c.fillRect(0, 0, W, H);
    text(c, 'GTA V', W / 2, 52, 34, '#FFE7A8');
    text(c, 'NOW ON A', W / 2, 88, 20); text(c, 'NEWER CONSOLE', W / 2, 114, 24);
    text(c, 'CALL NOW', W / 2, 152, 22);
    text(c, 'ALL LINES ARE BUSY', W / 2, 180, 14);
  } },
  { name: 'IV', line: 'Pat has been watching for the corner since 2015.', draw(c) {
    c.fillStyle = '#05081A'; c.fillRect(0, 0, W, H);
    const w = 96; const h = 40;
    dvd.x += dvd.vx * 2; dvd.y += dvd.vy * 2;
    if (dvd.x <= 0 || dvd.x >= W - w) { dvd.vx *= -1; dvd.hue += 67; dvd.bounces += 1; dvd.x = Math.min(W - w, Math.max(0, dvd.x)); }
    if (dvd.y <= 0 || dvd.y >= H - h) { dvd.vy *= -1; dvd.hue += 67; dvd.bounces += 1; dvd.y = Math.min(H - h, Math.max(0, dvd.y)); }
    c.fillStyle = `hsl(${dvd.hue} 80% 68%)`; c.fillRect(dvd.x, dvd.y, w, h);
    text(c, 'WAIT', dvd.x + w / 2, dvd.y + 29, 26, '#05081A');
  } },
  { name: 'V', line: 'GTA V. Again. He knows how it ends.', draw(c, t) {
    c.fillStyle = '#10131F'; c.fillRect(0, 0, W, H);
    text(c, 'RERUN', W / 2, 44, 18, '#A9B4D0');
    text(c, '2013', W / 2, 92, 46);
    c.strokeStyle = CREAM; c.lineWidth = 2; c.strokeRect(34, 120, 220, 22);
    c.fillStyle = CREAM; c.fillRect(38, 124, 208 + Math.sin(t / 400) * 2, 14);
    text(c, 'LOADING GTA VI: 99%', W / 2, 172, 15);
  } },
  { name: 'VI', line: 'GTA VI. Pat leans in. Nothing.', draw(c, t) {
    const img = c.createImageData(W / 2, H / 2);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 190 + 30; img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v + 15; img.data[i + 3] = 255; }
    c.putImageData(img, 0, 0);
    c.drawImage(c.canvas, 0, 0, W / 2, H / 2, 0, 0, W, H);
    c.fillStyle = '#000'; c.fillRect(38, 74, 212, 52);
    text(c, 'NO SIGNAL', W / 2, 111, 32, Math.floor(t / 600) % 2 ? CREAM : RED);
  } },
];

export function mountTvChannels({ room, byId, onChange }) {
  const screen = byId('tv-screen'); const tv = byId('tv');
  if (!screen || !tv) return;
  const fo = document.createElementNS(NS, 'foreignObject');
  for (const [k, v] of [['x', 98], ['y', 227], ['width', 144], ['height', 100]]) fo.setAttribute(k, v);
  fo.setAttribute('class', 'tv-canvas');
  fo.setAttribute('display', 'none');
  const canvas = document.createElementNS(XHTML, 'canvas');
  canvas.width = W; canvas.height = H;
  fo.append(canvas);
  screen.parentNode.append(fo);
  const c = canvas.getContext('2d');
  let current = -1; let raf = 0; let last = 0; let switchedAt = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const draw = (now) => {
    raf = 0;
    if (current < 0) return;
    if (now - last > 40 || reduce) {
      last = now;
      if (now - switchedAt < 180) { // the channel jump
        const img = c.createImageData(W, H);
        for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
        c.putImageData(img, 0, 0);
      } else {
        CHANNELS[current].draw(c, now, reduce);
        c.textBaseline = 'alphabetic';
        text(c, 'CH ' + CHANNELS[current].name, W - 12, 24, 18, '#7CFF8A', 'right');
      }
    }
    if (!reduce || now - switchedAt < 180) raf = requestAnimationFrame(draw);
  };
  const next = () => {
    current = (current + 1) % CHANNELS.length;
    switchedAt = performance.now();
    fo.setAttribute('display', 'inline');
    room.tvText && (room.tvText.top.parentNode.setAttribute('display', 'none'));
    if (!raf) raf = requestAnimationFrame(draw);
    onChange(CHANNELS[current]);
  };
  // Stop drawing when the room is off screen.
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { if (current >= 0 && !raf) raf = requestAnimationFrame(draw); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }).observe(room.container);

  for (const el of [tv, fo]) el.addEventListener('click', next);
  tv.setAttribute('tabindex', '0'); tv.setAttribute('role', 'button'); tv.setAttribute('aria-label', 'Change the channel on Pat\'s TV');
  tv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
}
