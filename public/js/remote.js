// The remote: channels I to V are the sections of the page. Channel VI has no signal. That is the whole joke.
import { daysWaiting, TOTAL_DAYS, formatInt } from './schedule.js';

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountRemote() {
  const nav = document.getElementById('remote');
  const staticEl = document.getElementById('static');
  const six = document.getElementById('ch-six');
  const noSignal = document.getElementById('no-signal');
  const links = [...nav.querySelectorAll('a')];
  let hideTimer = null;

  const burst = (ms = 260) => {
    if (reduce()) return;
    staticEl.classList.add('on');
    setTimeout(() => staticEl.classList.remove('on'), ms);
  };
  links.forEach((a) => a.addEventListener('click', () => burst()));

  six.addEventListener('click', () => {
    const left = TOTAL_DAYS - daysWaiting();
    noSignal.querySelector('#no-signal-sub').textContent = left > 0
      ? `Try again in ${formatInt(left)} ${left === 1 ? 'day' : 'days'}. Pat has tried ${formatInt(daysWaiting())} times.`
      : 'Pat is checking. Please hold.';
    noSignal.hidden = false;
    staticEl.classList.add('on');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(close, 3600);
  });
  function close() { noSignal.hidden = true; staticEl.classList.remove('on'); }
  noSignal.addEventListener('click', close);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !noSignal.hidden) close(); });

  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach((a) => a.toggleAttribute('aria-current', a.hash === '#' + en.target.id));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.hash); if (s) io.observe(s); });
}
