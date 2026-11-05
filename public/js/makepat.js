// CH V: Make your own Pat. A meme maker that runs entirely in this browser: nothing is uploaded, and the result is the visitor's to share.
import { daysWaiting, formatInt } from './schedule.js';

const SIZE = 1080;
const INK = '#0A1128';
const BONE = '#EEF2FA';
// Measured from the kit art (1024 px): head centre, then the midpoint of the eyes and the eye spacing.
const POSES = [
  { id: 'waiting', label: 'Waiting', file: 'pat-01-waiting', head: [530, 290], eyes: [607, 315], gap: 35, tilt: 0 },
  { id: 'hope', label: 'Hope', file: 'pat-02-hope', head: [595, 280], eyes: [682, 247], gap: 35, tilt: -4 },
  { id: 'despair', label: 'Despair', file: 'pat-03-despair', head: [575, 375], eyes: [637, 447], gap: 33, tilt: 0 },
  { id: 'breakdown', label: 'Breakdown', file: 'pat-04-breakdown', head: [500, 392], eyes: [585, 452], gap: 0, tilt: 8 },
  { id: 'clicking', label: 'Clicking', file: 'pat-05-clicking', head: [560, 282], eyes: [655, 294], gap: 35, tilt: 0 },
  { id: 'happened', label: 'It happened', file: 'pat-06-it-happened', head: [510, 282], eyes: [587, 242], gap: 35, tilt: 0 },
  { id: 'wink', label: 'Big head', file: 'pat-wink-face', head: [430, 370], eyes: null, gap: 0, tilt: -4, big: true },
];
const FACES = [['classic', 'Classic'], ['wink', 'Wink'], ['shades', 'Shades'], ['hearts', 'In love'], ['stars', '5 stars'], ['x', 'Done'], ['shock', 'Shocked']];
const HATS = [['none', 'No hat'], ['cap', 'Cap'], ['party', 'Party'], ['crown', 'Crown'], ['cowboy', 'Cowboy'], ['wizard', 'Wizard'], ['top', 'Top hat']];
const BACKS = [['sunset', 'Sunset'], ['neon', 'Neon grid'], ['tv', 'TV blue'], ['static', 'No signal'], ['pink', 'Hot pink'], ['teal', 'Teal'], ['couch', 'The couch']];
const LINES = () => [['WAITING FOR GTA VI', `DAY ${formatInt(daysWaiting())}`], ['ANY UPDATES?', 'NO'], ['THE INTERN', 'SAID SOON'], ['ONE MORE REFRESH', 'I PROMISE'], ['BOUGHT GTA V', 'THREE TIMES'], ['NOT OUT YET', 'STILL HERE'], ['13 YEARS', 'NO REGRETS'], ['NOVEMBER 19', 'THEY SAID'], ['ME IN THE GROUP CHAT', 'AT 3 A.M.'], ['MY FRIENDS', 'HAVE MOVED ON']];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const star = (c, x, y, r, fill) => {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5; const d = i % 2 ? r * 0.45 : r; c.lineTo(x + d * Math.sin(a), y - d * Math.cos(a)); }
  c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = r * 0.14; c.stroke();
};
const heart = (c, x, y, s, fill) => {
  c.beginPath(); c.moveTo(x, y + s * 0.8);
  c.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.6, y - s * 1.1, x, y - s * 0.3);
  c.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.5, y - s * 0.2, x, y + s * 0.8);
  c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.lineWidth = 5; c.stroke();
};

function drawFace(c, pose, face) {
  if (face === 'classic' || !pose.eyes) return;
  const [ex, ey] = pose.eyes; const g = pose.gap || 34;
  const L = pose.gap ? ex - g : ex - 34; const R = pose.gap ? ex + g : ex + 34;
  c.fillStyle = BONE; // paint out the original dots
  for (const x of [L, R]) { c.beginPath(); c.arc(x, ey, 22, 0, 7); c.fill(); }
  c.lineCap = 'round'; c.strokeStyle = INK; c.fillStyle = INK;
  if (face === 'wink') {
    c.beginPath(); c.arc(L, ey, 18, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(L + 6, ey - 6, 6, 0, 7); c.fill();
    c.lineWidth = 11; c.beginPath(); c.moveTo(R - 20, ey + 3); c.quadraticCurveTo(R, ey - 20, R + 20, ey + 3); c.stroke();
  } else if (face === 'shades') {
    c.fillStyle = '#10121E'; c.strokeStyle = INK; c.lineWidth = 8;
    for (const x of [L, R]) { c.beginPath(); c.roundRect(x - 33, ey - 22, 66, 44, 12); c.fill(); }
    c.beginPath(); c.moveTo(L + 30, ey - 8); c.lineTo(R - 30, ey - 8); c.moveTo(L - 33, ey - 8); c.lineTo(L - 76, ey - 18); c.stroke();
    c.strokeStyle = '#7FB2FF'; c.lineWidth = 5; for (const x of [L, R]) { c.beginPath(); c.moveTo(x - 18, ey + 8); c.lineTo(x - 2, ey - 12); c.stroke(); }
  } else if (face === 'hearts') {
    for (const x of [L, R]) heart(c, x, ey, 24, '#FF3F6E');
  } else if (face === 'stars') {
    for (const x of [L, R]) star(c, x, ey, 30, '#FFC83D');
  } else if (face === 'x') {
    c.lineWidth = 11;
    for (const x of [L, R]) { c.beginPath(); c.moveTo(x - 17, ey - 17); c.lineTo(x + 17, ey + 17); c.moveTo(x + 17, ey - 17); c.lineTo(x - 17, ey + 17); c.stroke(); }
  } else if (face === 'shock') {
    for (const x of [L, R]) { c.fillStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.arc(x, ey, 26, 0, 7); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(x, ey, 8, 0, 7); c.fill(); }
  }
}

function drawHat(c, pose, hat) {
  if (hat === 'none') return;
  const r = pose.big ? 300 : 172;
  const [hx, hy] = pose.head;
  c.save();
  c.translate(hx, hy - r * (pose.big ? 0.98 : 0.86));
  c.rotate((pose.tilt * Math.PI) / 180);
  c.scale(r / 172, r / 172);
  c.lineWidth = 9; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round';
  const fillStroke = (color) => { c.fillStyle = color; c.fill(); c.stroke(); };
  if (hat === 'cap') {
    c.beginPath(); c.moveTo(-122, 34); c.bezierCurveTo(-118, -70, 108, -82, 122, 28); c.closePath(); fillStroke('#E8476F');
    c.beginPath(); c.moveTo(70, 26); c.quadraticCurveTo(170, 10, 214, 44); c.quadraticCurveTo(150, 58, 66, 48); c.closePath(); fillStroke('#B9264E');
    c.font = '800 54px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.fillStyle = '#FFD36E'; c.fillText('VI', -8, 12);
  } else if (hat === 'party') {
    c.beginPath(); c.moveTo(0, -170); c.lineTo(84, 26); c.lineTo(-84, 26); c.closePath(); fillStroke('#FFC83D');
    c.fillStyle = '#FF3F86'; c.beginPath(); c.arc(0, -180, 22, 0, 7); c.fill(); c.stroke();
    c.lineWidth = 7; c.strokeStyle = '#4B2BC8'; c.beginPath(); c.moveTo(-40, -50); c.lineTo(46, -12); c.moveTo(-18, -100); c.lineTo(26, -80); c.stroke();
  } else if (hat === 'crown') {
    c.beginPath(); c.moveTo(-104, 30); c.lineTo(-122, -82); c.lineTo(-56, -26); c.lineTo(0, -108); c.lineTo(56, -26); c.lineTo(122, -82); c.lineTo(104, 30); c.closePath(); fillStroke('#FFC83D');
    c.fillStyle = '#FF3F6E'; c.beginPath(); c.arc(0, -4, 15, 0, 7); c.fill(); c.lineWidth = 6; c.stroke();
  } else if (hat === 'cowboy') {
    c.beginPath(); c.ellipse(0, 26, 214, 34, 0, 0, 7); fillStroke('#9A5B2B');
    c.beginPath(); c.moveTo(-96, 20); c.bezierCurveTo(-112, -96, -36, -92, 0, -66); c.bezierCurveTo(36, -92, 112, -96, 96, 20); c.closePath(); fillStroke('#B9743A');
    c.fillStyle = '#3B2110'; c.fillRect(-96, -4, 192, 22);
  } else if (hat === 'wizard') {
    c.beginPath(); c.ellipse(0, 26, 170, 28, 0, 0, 7); fillStroke('#3F2C86');
    c.beginPath(); c.moveTo(-96, 20); c.quadraticCurveTo(-30, -96, 26, -196); c.quadraticCurveTo(46, -80, 96, 20); c.closePath(); fillStroke('#5B3FD6');
    star(c, -6, -44, 26, '#FFD36E');
  } else if (hat === 'top') {
    c.beginPath(); c.ellipse(0, 26, 176, 26, 0, 0, 7); fillStroke('#10121E');
    c.beginPath(); c.rect(-96, -150, 192, 174); fillStroke('#10121E');
    c.fillStyle = '#FF3F86'; c.fillRect(-92, -22, 184, 28);
  }
  c.restore();
}

function drawBack(c, name, couch, seed) {
  const S = SIZE;
  const flat = (a, b) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, S, S); };
  if (name === 'sunset') {
    const g = c.createLinearGradient(0, 0, 0, S);
    [[0, '#FFD36E'], [0.38, '#FF7A59'], [0.68, '#FF3F86'], [1, '#4B2BC8']].forEach(([o, col]) => g.addColorStop(o, col));
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    c.fillStyle = 'rgba(255,255,255,.11)';
    for (let i = 0; i < 16; i += 2) { const a = (i * Math.PI) / 8; const b = a + Math.PI / 8; c.beginPath(); c.moveTo(S / 2, S / 2); c.lineTo(S / 2 + 1200 * Math.cos(a), S / 2 + 1200 * Math.sin(a)); c.lineTo(S / 2 + 1200 * Math.cos(b), S / 2 + 1200 * Math.sin(b)); c.fill(); }
  } else if (name === 'neon') {
    flat('#160A36', '#3A0F5E');
    c.fillStyle = '#FF7A59'; c.beginPath(); c.arc(S / 2, S * 0.56, 240, Math.PI, 0); c.fill();
    c.strokeStyle = '#2DE2E6'; c.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const y = S * 0.56 + (i * i * 6.2); c.beginPath(); c.moveTo(0, y); c.lineTo(S, y); c.stroke(); }
    for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(S / 2 + i * 26, S * 0.56); c.lineTo(S / 2 + i * 165, S); c.stroke(); }
  } else if (name === 'tv') { flat('#3470F2', '#112A8C'); }
  else if (name === 'pink') { flat('#FF7AB0', '#C80F66'); }
  else if (name === 'teal') { flat('#2DE2D2', '#0F7F92'); }
  else if (name === 'static') {
    const img = c.createImageData(270, 270); let v = seed;
    for (let i = 0; i < img.data.length; i += 4) { v = (v * 16807) % 2147483647; const n = 40 + (v % 170); img.data[i] = n; img.data[i + 1] = n; img.data[i + 2] = n + 12; img.data[i + 3] = 255; }
    const t = document.createElement('canvas'); t.width = t.height = 270; t.getContext('2d').putImageData(img, 0, 0);
    c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, S, S); c.imageSmoothingEnabled = true;
  } else if (name === 'couch') {
    flat('#0D1A40', '#081230');
    if (couch) c.drawImage(couch, 0, S - 960, S, S * 0.89);
  }
}

function drawCaption(c, text, y, fromBottom) {
  const t = text.trim().toUpperCase();
  if (!t) return;
  c.textAlign = 'center'; c.textBaseline = fromBottom ? 'bottom' : 'top'; c.lineJoin = 'round';
  let size = 104; let lines = [t];
  const fit = () => {
    c.font = `900 ${size}px Impact, "Arial Black", "Liberation Sans", sans-serif`;
    lines = []; let line = '';
    for (const w of t.split(/\s+/)) { const next = line ? line + ' ' + w : w; if (c.measureText(next).width > SIZE - 70 && line) { lines.push(line); line = w; } else line = next; }
    lines.push(line);
    return lines.length <= 2 && lines.every((l) => c.measureText(l).width <= SIZE - 50);
  };
  while (!fit() && size > 40) size -= 6;
  // Prefer one clean line over a stranded last word, as long as it stays big enough to read.
  const best = size; const oneLine = () => { size = best; while (size > 62) { c.font = `900 ${size}px Impact, "Arial Black", "Liberation Sans", sans-serif`; if (c.measureText(t).width <= SIZE - 50) return true; size -= 4; } return false; };
  if (lines.length > 1 && oneLine()) { lines = [t]; } else { size = best; fit(); }
  const step = size * 1.02;
  const start = fromBottom ? y - step * (lines.length - 1) : y;
  lines.forEach((l, i) => {
    c.lineWidth = size * 0.16; c.strokeStyle = '#000'; c.strokeText(l, SIZE / 2, start + i * step);
    c.fillStyle = '#fff'; c.fillText(l, SIZE / 2, start + i * step);
  });
}

export function mountMakePat() {
  const $ = (id) => document.getElementById(id);
  const canvas = $('mp-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const st = { pose: 'waiting', face: 'wink', hat: 'cap', back: 'sunset', top: 'WAITING FOR GTA VI', bottom: `DAY ${formatInt(daysWaiting())}`, x: 0, y: 0, zoom: 1, flip: false };
  const images = {};
  const load = (file) => (images[file] ||= new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = `assets/kit/${file}.png`; }));
  let token = 0; const seed = 1 + Math.floor(Math.random() * 99999);

  async function draw() {
    const mine = ++token;
    const pose = POSES.find((p) => p.id === st.pose);
    const [art, couch] = await Promise.all([load(pose.file), load('seat-couch-night')]);
    if (mine !== token) return;
    drawBack(c, st.back, couch, seed);
    if (art) {
      c.save();
      const base = pose.big ? 0.8 : 0.76;
      c.translate(SIZE / 2 + st.x, SIZE / 2 + 34 + st.y);
      c.scale(base * st.zoom * (st.flip ? -1 : 1), base * st.zoom);
      c.translate(-512, -512);
      c.drawImage(art, 0, 0, 1024, 1024);
      drawFace(c, pose, st.face);
      drawHat(c, pose, st.hat);
      c.restore();
    }
    drawCaption(c, st.top, 28, false);
    drawCaption(c, st.bottom, SIZE - 54, true);
    c.textAlign = 'right'; c.textBaseline = 'bottom'; c.font = '700 26px ui-monospace, Menlo, monospace'; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText('$WAITING', SIZE - 20, SIZE - 14); c.fillStyle = '#fff'; c.fillText('$WAITING', SIZE - 20, SIZE - 14);
    $('mp-download').href = canvas.toDataURL('image/png');
  }

  // Chip groups
  const group = (id, list, key) => {
    const box = $(id);
    list.forEach(([value, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.textContent = label; b.dataset.value = value;
      b.addEventListener('click', () => { st[key] = value; paintChips(); draw(); });
      box.append(b);
    });
  };
  group('mp-poses', POSES.map((p) => [p.id, p.label]), 'pose');
  group('mp-faces', FACES, 'face');
  group('mp-hats', HATS, 'hat');
  group('mp-backs', BACKS, 'back');
  const paintChips = () => {
    for (const [id, key] of [['mp-poses', 'pose'], ['mp-faces', 'face'], ['mp-hats', 'hat'], ['mp-backs', 'back']]) {
      for (const b of $(id).children) b.setAttribute('aria-pressed', String(b.dataset.value === st[key]));
    }
    $('mp-faces').classList.toggle('muted-group', st.pose === 'wink');
    $('mp-top').value = st.top; $('mp-bottom').value = st.bottom;
    $('mp-zoom').value = String(st.zoom);
  };

  $('mp-top').addEventListener('input', (e) => { st.top = e.target.value; draw(); });
  $('mp-bottom').addEventListener('input', (e) => { st.bottom = e.target.value; draw(); });
  $('mp-zoom').addEventListener('input', (e) => { st.zoom = Number(e.target.value); draw(); });
  $('mp-flip').addEventListener('click', () => { st.flip = !st.flip; draw(); });
  $('mp-random').addEventListener('click', () => {
    st.pose = pick(POSES).id; st.face = pick(FACES.slice(1))[0]; st.hat = pick(HATS)[0]; st.back = pick(BACKS)[0];
    [st.top, st.bottom] = pick(LINES()); st.x = 0; st.y = 0; st.zoom = 1; st.flip = Math.random() < 0.3;
    paintChips(); draw();
  });

  // Drag Pat around the picture
  let drag = null;
  const scale = () => SIZE / canvas.getBoundingClientRect().width;
  canvas.addEventListener('pointerdown', (e) => { drag = [e.clientX, e.clientY, st.x, st.y]; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    st.x = drag[2] + (e.clientX - drag[0]) * scale();
    st.y = drag[3] + (e.clientY - drag[1]) * scale();
    draw();
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  // Sharing: the system sheet with the image where there is one, otherwise the X compose box
  const SHARE = 'I made my own Pat. Still waiting for GTA VI. $WAITING';
  const share = $('mp-share');
  $('mp-x').href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(SHARE);
  if (navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'p.png', { type: 'image/png' })] })) {
    share.hidden = false;
    share.addEventListener('click', () => canvas.toBlob(async (blob) => {
      try { await navigator.share({ files: [new File([blob], 'my-pat.png', { type: 'image/png' })], text: SHARE }); } catch { /* cancelled: fine */ }
    }, 'image/png'));
  }

  paintChips();
  draw();
}
