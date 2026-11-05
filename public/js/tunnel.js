// CH I: scrolling plays Pat's wait from September 17, 2013 to today. The room stays pinned and ages.
// Captions live in index.html (#tunnel-log li[data-p]), so they also work without JS and for screen readers.
import { daysWaiting, formatInt, WAIT_START } from './schedule.js';
import { setLed } from './led.js';
import { ageRoom } from './room.js';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function mountTunnel({ room, showProps }) {
  const $ = (id) => document.getElementById(id);
  const tunnel = $('ch1');
  const stage = $('stage');
  const captions = [...document.querySelectorAll('#tunnel-log li')].map((li) => ({ p: Number(li.dataset.p), text: li.textContent }));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startMs = Date.UTC(WAIT_START.y, WAIT_START.m - 1, WAIT_START.d);
  let shownCaption = null;
  let queued = false;

  const render = () => {
    queued = false;
    const total = daysWaiting();
    const span = tunnel.offsetHeight - window.innerHeight;
    const p = reduce || span <= 0 ? 1 : clamp01(-tunnel.getBoundingClientRect().top / span);
    const day = Math.round(total * p);
    setLed($('days-led'), day);
    const at = new Date(startMs + day * 86400000);
    $('osd-date').textContent = `${MONTHS[at.getUTCMonth()]} ${String(at.getUTCDate()).padStart(2, '0')} ${at.getUTCFullYear()}`;
    stage.dataset.phase = p < 0.04 ? 'start' : p >= 0.985 ? 'end' : 'run';
    stage.style.setProperty('--age', p.toFixed(3));
    const caption = captions.filter((c) => c.p <= p).pop();
    if (caption && caption !== shownCaption) {
      shownCaption = caption;
      const el = $('caption');
      el.textContent = caption.text.replace('{days}', formatInt(total));
      el.classList.remove('caption-in');
      void el.offsetWidth; // restart the fade
      el.classList.add('caption-in');
    }
    ageRoom(room, p, { showProps });
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  render();
}
