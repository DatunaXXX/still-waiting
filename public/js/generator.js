// "How long have YOU been waiting?" card generator. 100% client-side canvas. Nothing leaves the device.
import { daysBetweenYMD, zonedParts, formatInt } from './schedule.js';

const SHARE_TEXT = (days, what) => `I've been waiting ${formatInt(days)} ${days === 1 ? 'day' : 'days'} for ${what}. Still waiting.`;

const W = 1200, H = 675;
let patImg = null;
function loadPat() {
  if (patImg) return patImg;
  patImg = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'assets/pat.svg';
  });
  return patImg;
}

export function wrap(ctx, text, maxWidth) {
  // Split words that are wider than the column into character chunks so nothing runs into Pat's picture.
  const words = [];
  for (const w of text.split(/\s+/)) {
    if (ctx.measureText(w).width <= maxWidth) { words.push(w); continue; }
    let chunk = '';
    for (const ch of Array.from(w)) {
      if (ctx.measureText(chunk + ch + '-').width > maxWidth && chunk) { words.push(chunk + '-'); chunk = ch; } else chunk += ch;
    }
    if (chunk) words.push(chunk);
  }
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawCard(canvas, what, days) {
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  ctx.fillStyle = '#0A1128'; ctx.fillRect(0, 0, W, H);

  // Pat (crop of the room around the couch) on the right.
  const img = await loadPat();
  if (img) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(640, 40, 520, 595, 28); ctx.clip();
    ctx.drawImage(img, 290, 60, 470, 540, 640, 40, 520, 595); // sx, sy, sw, sh of the 800x500 svg
    ctx.restore();
  }

  const font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#9FB0D6'; ctx.font = `600 40px ${font}`;
  ctx.fillText("I've been waiting", 60, 150);
  ctx.fillStyle = '#E6EEFF'; ctx.font = `800 132px ${font}`;
  const n = formatInt(days);
  ctx.fillText(n, 60, 290);
  const nw = ctx.measureText(n).width;
  ctx.fillStyle = '#8EC5FF'; ctx.font = `700 52px ${font}`;
  ctx.fillText(days === 1 ? 'day' : 'days', Math.min(60 + nw + 18, 560), 290);

  ctx.fillStyle = '#E6EEFF'; ctx.font = `600 46px ${font}`;
  let lines = wrap(ctx, `for ${what}.`, 540);
  if (lines.length > 3) { lines = lines.slice(0, 3); lines[2] = lines[2].replace(/.$/, '…'); }
  lines.forEach((l, i) => ctx.fillText(l, 60, 370 + i * 58));

  ctx.fillStyle = '#9FB0D6'; ctx.font = `500 30px ${font}`;
  ctx.fillText('Pat is patient. So am I.', 60, 590);
  ctx.fillStyle = '#8EC5FF'; ctx.font = `800 30px ${font}`;
  ctx.fillText('Still Waiting  $WAITING', 60, 630);
}

// The card is personal: days are counted on the VISITOR's own calendar (their local today = 0 days,
// their tomorrow is rejected). The big Pat counter on the page stays on Israel time (schedule.js).
const isoOf = ({ y, m, d }) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
export const visitorTZ = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
export const localTodayISO = (now = new Date(), tz = visitorTZ()) => isoOf(zonedParts(now, tz));

/** Validate inputs. Returns { days } or { error }. Exported for tests. */
export function computeDays(dateISO, now = new Date(), tz = visitorTZ()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateISO || ''));
  if (!m) return { error: 'Pick the day the waiting started.' };
  if (Number(m[1]) < 1900) return { error: 'Pick a date from 1900 on. Even Pat started later.' };
  const picked = { y: +m[1], m: +m[2], d: +m[3] };
  const check = new Date(Date.UTC(picked.y, picked.m - 1, picked.d));
  if (check.getUTCMonth() + 1 !== picked.m || check.getUTCDate() !== picked.d) return { error: 'Pick the day the waiting started.' };
  const days = daysBetweenYMD(picked, zonedParts(now, tz));
  if (days < 0) return { error: "That's in the future. That's not waiting, that's planning." };
  return { days };
}

export function mountGenerator(root = document) {
  const form = root.getElementById('gen-form');
  if (!form) return;
  const whatEl = root.getElementById('gen-what');
  const dateEl = root.getElementById('gen-date');
  const err = root.getElementById('gen-error');
  const out = root.getElementById('gen-output');
  const canvas = root.getElementById('gen-canvas');
  const dl = root.getElementById('gen-download');
  const shareBtn = root.getElementById('gen-share');
  dateEl.min = '1900-01-01';
  dateEl.max = localTodayISO();
  const xLink = root.getElementById('gen-x');
  let blobUrl = null, blob = null;

  const clearCard = () => {
    out.hidden = true;
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = null; blob = null;
    dl.removeAttribute('href');
    if (xLink) xLink.removeAttribute('href');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    dateEl.max = localTodayISO();
    const what = whatEl.value.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!what) { clearCard(); err.textContent = 'Waiting for what?'; whatEl.focus(); return; }
    const r = computeDays(dateEl.value);
    if (r.error) { clearCard(); err.textContent = r.error; dateEl.focus(); return; }
    const days = r.days;

    await drawCard(canvas, what, days);
    out.hidden = false;
    blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobUrl = URL.createObjectURL(blob);
    dl.href = blobUrl;
    dl.download = `still-waiting-${days}-${days === 1 ? "day" : "days"}.png`;
    const file = new File([blob], dl.download, { type: 'image/png' });
    const text = SHARE_TEXT(days, what);
    const canShareFiles = Boolean(navigator.canShare && navigator.canShare({ files: [file] }));
    shareBtn.hidden = !canShareFiles;
    shareBtn.onclick = () => navigator.share({ files: [file], text }).catch(() => {});
    // Desktop fallback: X intent with text only (the visitor attaches the downloaded PNG themselves).
    if (xLink) { xLink.href = 'https://x.com/intent/post?text=' + encodeURIComponent(text); xLink.hidden = canShareFiles; }
    out.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });
}
