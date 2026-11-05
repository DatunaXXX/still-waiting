// CH III: the stand-still test. The only game online you win by doing nothing. Runs in this browser only; nothing is sent anywhere.
import { daysWaiting, formatInt, formatHMS } from './schedule.js';
import { banner } from './wanted.js';

const BEST_KEY = 'sw:bestStill';
const RANKS = [[600, 'Load-bearing'], [180, 'Dust'], [60, 'Spider'], [30, 'Houseplant'], [10, 'Intern'], [0, 'Flinched']];
const WHISPERS = [[5, 'Good. Keep going.'], [10, 'Pat noticed.'], [20, 'Your hand wants to move. It is lying.'], [30, 'You now outrank the plant.'], [60, 'One minute. Pat did this 6.9 million times.'], [120, 'Some people finished GTA V in less. Not many.'], [180, 'A spider is looking at you with respect.'], [300, 'Five minutes. Pat would nod. Structurally, he cannot.'], [600, 'Load-bearing.']];
const GRACE_MS = 1200;

export const rankFor = (sec) => RANKS.find(([min]) => sec >= min)[1];

function drawCard(canvas, sec, rank, pat) {
  const c = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;
  c.fillStyle = '#05081A'; c.fillRect(0, 0, W, H);
  if (pat) { c.globalAlpha = 0.9; c.drawImage(pat, 420, 25, 1000, 625); c.globalAlpha = 1; const g = c.createLinearGradient(0, 0, 900, 0); g.addColorStop(0.3, '#05081A'); g.addColorStop(1, 'rgba(5,8,26,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  c.textBaseline = 'top';
  c.fillStyle = '#FF5A4F'; c.font = '700 150px ui-monospace, Menlo, monospace'; c.fillText(formatHMS(sec * 1000).replace(/^00:/, ''), 60, 120);
  c.fillStyle = '#F2EAD3'; c.font = '700 52px ui-monospace, Menlo, monospace'; c.fillText(`Rank: ${rank}`, 60, 300);
  c.fillStyle = '#A9B4D0'; c.font = '36px ui-monospace, Menlo, monospace';
  c.fillText(`I stood still for ${formatInt(sec)} seconds.`, 60, 385);
  c.fillText(`Pat: ${formatInt(daysWaiting())} days.`, 60, 435);
  c.fillStyle = '#7FB2FF'; c.font = '700 32px ui-monospace, Menlo, monospace'; c.fillText('STILL WAITING  $WAITING', 60, 575);
}

export function mountStillness() {
  const $ = (id) => document.getElementById(id);
  const start = $('still-start'); const clock = $('still-clock'); const line = $('still-line'); const result = $('still-result');
  const best = $('still-best'); const canvas = $('still-canvas'); const download = $('still-download');
  let running = false; let t0 = 0; let timer = null; let origin = null; let whisper = 0;
  const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
  const showBest = () => { const b = readBest(); best.textContent = b ? `Your best: ${formatHMS(b * 1000)} (${rankFor(b)})` : ''; };
  showBest();

  const onMove = (e) => {
    if (performance.now() - t0 < GRACE_MS) { origin = [e.clientX, e.clientY]; return; }
    if (!origin) origin = [e.clientX, e.clientY];
    if (Math.hypot(e.clientX - origin[0], e.clientY - origin[1]) > 8) finish('You moved.');
  };
  const onTouch = () => { if (performance.now() - t0 >= GRACE_MS) finish('You moved.'); };
  const onScroll = () => { if (performance.now() - t0 >= GRACE_MS) finish('You scrolled.'); };
  const onHide = () => { if (document.hidden) finish('You looked away. Pat did not.'); };
  const listeners = [['pointermove', onMove], ['pointerdown', onTouch], ['keydown', onTouch], ['wheel', onTouch], ['touchstart', onTouch], ['scroll', onScroll]];

  async function finish(why) {
    if (!running) return;
    running = false;
    clearInterval(timer);
    listeners.forEach(([n, f]) => window.removeEventListener(n, f));
    document.removeEventListener('visibilitychange', onHide);
    document.body.classList.remove('stilling');
    const sec = Math.floor((performance.now() - t0) / 1000);
    const rank = rankFor(sec);
    if (sec > readBest()) { try { localStorage.setItem(BEST_KEY, String(sec)); } catch { /* storage blocked: fine */ } }
    showBest();
    const share = (sec / (daysWaiting() * 86400)) * 100;
    banner('WAITED', `${formatInt(sec)} seconds. Rank: ${rank}.`, 'red', 2600);
    line.textContent = `${why} ${formatInt(sec)} seconds. Rank: ${rank}. That is ${share.toFixed(7)}% of Pat.`;
    start.textContent = 'Try again'; start.disabled = false; start.hidden = false;
    const pat = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'assets/kit/pat-couch.png'; });
    drawCard(canvas, sec, rank, pat);
    download.href = canvas.toDataURL('image/png');
    result.hidden = false;
  }

  start.addEventListener('click', () => {
    running = true; t0 = performance.now(); origin = null; whisper = 0;
    result.hidden = true; start.hidden = true;
    clock.textContent = '00:00:00'; line.textContent = 'Starting now. Do nothing.';
    document.body.classList.add('stilling');
    listeners.forEach(([n, f]) => window.addEventListener(n, f, { passive: true }));
    document.addEventListener('visibilitychange', onHide);
    timer = setInterval(() => {
      const sec = Math.floor((performance.now() - t0) / 1000);
      clock.textContent = formatHMS(sec * 1000);
      if (whisper < WHISPERS.length && sec >= WHISPERS[whisper][0]) { line.textContent = WHISPERS[whisper][1]; whisper += 1; }
    }, 250);
  });
}
