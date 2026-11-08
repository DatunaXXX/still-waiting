// Page wiring: counter, launch countdown, story events, market rhythm, community hook.
import { daysWaiting, TOTAL_DAYS, launchCountdown, eventSlots, eventIndex, formatHMS, formatInt, splitMs, launchDate, firstEventIndex } from './schedule.js';
import { eventFor, LAST_EVENT, EVENTS, afterNov19Line } from './events.js';
import { renderProps } from './props.js';
import { PACK } from './voice-pack.js';
import { mountRoom, applyMarket, startMarketPolling, setClock, setTvText } from './room.js';
import { mountGenerator } from './generator.js';
import { CA_POSTLAUNCH } from './shared-copy.js';
import { ROOM_UNSET } from './shared-copy.js';
import { mountTunnel } from './tunnel.js';
import { mountHoldLine } from './holdline.js';
import { mountStillness } from './stillness.js';
import { mountRemote } from './remote.js';
import { mountPlay } from './play.js';
import { mountMiniPat } from './minipat.js';
import { mountWanted, bootScreen } from './wanted.js';
import { mountHoverbike } from './hoverbike.js';
import { mountSoundButton } from './sfx.js';
import { mountMakePat } from './makepat.js';
import { buyUrl } from './config.js';

const $ = (id) => document.getElementById(id);
const SEEN_KEY = 'sw:lastSeenEvent';
const pad = (n) => String(n).padStart(2, '0');

// Contract address slot. Single source: TOKEN_MINT on the server, served by /api/ca (no upstream, long cache),
// fetched first and independently of /api/state; /api/state's `ca` is accepted too.
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
let shownCA = '';
function setCA(ca) {
  if (typeof ca !== 'string' || !BASE58.test(ca) || ca === shownCA) return;
  shownCA = ca;
  $('ca-text').textContent = 'CA: ' + ca;
  const b = $('ca-copy');
  b.hidden = false;
  b.onclick = async () => {
    try { await navigator.clipboard.writeText(shownCA); b.textContent = 'Copied'; } catch { b.textContent = 'Copy failed'; }
    setTimeout(() => (b.textContent = 'Copy'), 1500);
  };
  const buy = $('ca-buy');
  buy.href = buyUrl(ca);
  buy.hidden = false;
}

const CA_MISSING = "Couldn't load the address. Check the pinned post in our official Telegram or X."; // copy: Voice may adjust
const CA_COMING = CA_POSTLAUNCH; // after launch, before TOKEN_MINT is set (QA-v3-03, QA-v10-01): same string as bot /ca
function showCAMissing(text = CA_MISSING) {
  if (shownCA) return;
  $('ca-text').textContent = text;
}

/** Fetch /api/ca until we have the address (every 30 s). Never shows a cached or mock address. */
async function loadCA() {
  let notSetYet = false; // server answered fine, the address just isn't configured yet
  try {
    const r = await fetch('/api/ca', { cache: 'no-store' });
    const j = await r.json();
    if (j && typeof j.ca === 'string') setCA(j.ca);
    else if (r.ok && j && j.ca === null) notSetYet = true;
  } catch { /* handled below */ }
  if (!shownCA) {
    if (launchCountdown().launched) showCAMissing(notSetYet ? CA_COMING : CA_MISSING);
    setTimeout(loadCA, 30_000);
  }
}

const fmtCountdown = (ms) => {
  const t = splitMs(ms);
  return `${t.days > 0 ? t.days + 'd ' : ''}${pad(t.hours)}:${pad(t.minutes)}:${pad(t.seconds)}`;
};
const localDayTime = (d) => d.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });

// Copy from Voice's pack (js/voice-pack.js).
function awayNote(n) {
  if (n === 1) return PACK.site.awayNote.one;
  const many = PACK.site.awayNote.many;
  return many[Math.floor(Math.random() * many.length)].replaceAll('{n}', String(n));
}

let room = null;
let shownEvent = null;

function renderEvent(rawIdx) {
  const idx = Math.min(rawIdx, LAST_EVENT); // after the last event the room stays on it
  if (idx === shownEvent) return;
  shownEvent = idx;
  const ev = eventFor(idx);
  $('scene').textContent = launchCountdown().unset ? ROOM_UNSET : ev.text;
  $('tv-strip').textContent = ev.preLaunch ? 'CH VI. PLEASE STAND BY' : 'CH VI';
  setTvText(room, 'VI', ev.preLaunch ? 'PLEASE STAND BY' : 'NO SIGNAL');
  if (idx >= 0) renderProps(room?.svg, EVENTS, idx); // props appear with their event and stay (builder placeholder art)

  // Diary: today's slots so far (Israel time).
  const list = $('diary');
  list.replaceChildren();
  const start = Math.max(firstEventIndex(), idx - 5);
  if (idx < 0) {
    const li = document.createElement('li'); li.textContent = 'Nothing yet. The diary opens at launch.'; list.append(li);
  } else {
    for (let i = idx; i >= start; i--) {
      const li = document.createElement('li');
      li.textContent = `#${i + 1} - ${eventFor(i).text}`;
      list.append(li);
    }
  }

  // While you were away (remembered in this browser only). Pre-launch slots are not events:
  // nothing is stored before launch and stored values < 0 (old builds) are ignored.
  if (idx < 0) return;
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const seen = raw === null ? NaN : Number(raw);
    const away = $('away');
    if (Number.isInteger(seen) && seen >= 0 && idx > seen) {
      const missed = idx - seen;
      away.textContent = awayNote(missed);
      away.hidden = false;
    }
    localStorage.setItem(SEEN_KEY, String(idx));
  } catch { /* storage blocked: fine */ }
}

function tick() {
  const now = new Date();
  const days = daysWaiting(now);
  $('days').textContent = formatInt(days);
  const left = TOTAL_DAYS - days;
  $('days-left').textContent = left > 0 ? `${formatInt(left)} ${left === 1 ? 'day' : 'days'} to November 19.` : left === 0 ? 'Today is November 19.' : afterNov19Line(-left);

  const lc = launchCountdown(now);
  if (lc.unset) {
    $('launch').hidden = true;
    $('next-event').closest('p').hidden = true;
    setClock(room, 0);
    renderEvent(eventIndex(now));
    return;
  }
  $('launch').hidden = false;
  if (lc.launched) {
    $('launch-label').textContent = 'The room is open.';
    $('launch-time').textContent = 'Live';
  } else {
    $('launch-time').textContent = fmtCountdown(lc.ms);
    $('launch-when').textContent = 'Sun Nov 8, 22:00 Israel time';
  }

  if (!lc.launched) {
    // Before launch nothing happens at the 4h slots: the next event IS the launch.
    $('next-event').textContent = fmtCountdown(lc.ms);
    $('next-event-at').textContent = `(Sun 22:00 Israel time, ${localDayTime(launchDate())} your time: the room opens)`;
    setClock(room, Math.min(lc.ms, 4 * 3600_000));
  } else if (eventIndex(now) >= LAST_EVENT) {
    // After the last event (#90, Nov 19 16:00 IL) nothing new happens: no "next event" countdown.
    $('next-event').closest('p').hidden = true;
    setClock(room, 0);
  } else {
    const slots = eventSlots(now);
    $('next-event').closest('p').hidden = false;
    $('next-event').textContent = formatHMS(slots.msToNext);
    $('next-event-at').textContent = `(${pad(slots.nextHour)}:00 Israel time, ${localDayTime(slots.next)} your time)`;
    setClock(room, slots.msToNext);
  }
  renderEvent(eventIndex(now));
}

// Pat reports the room's weather, never prices or advice.
const hasNumber = (v) => typeof v === 'number' && Number.isFinite(v);
function mood(s) {
  const c = Number(s.change5m);
  if (!Number.isFinite(c)) return 'unclear';
  if (c >= 10) return 'hopeful. His eyes are up.';
  if (c > 1) return 'a little hopeful.';
  if (c <= -25) return 'collapse. One eye gave up.';
  if (c <= -10) return 'dusty. Very dusty.';
  if (c < -1) return 'a bit dusty.';
  return 'still. Very still.';
}

function onState(s) {
  applyMarket(room, s);
  const m = $('market');
  if (s.preLaunch) {
    m.textContent = s.offline ? 'Market: no signal. Pat is calm.' : 'Market: closed. Pat is calm.';
  } else if (s.error || !hasNumber(s.change5m)) {
    m.textContent = 'Market: no signal. Pat keeps waiting.';
  } else {
    const mock = String(s.source || '').startsWith('mock') ? ' [mock data]' : '';
    m.textContent = `Room mood${s.stale ? ' (last known)' : ''}: ${mood(s)}${hasNumber(s.holders) && s.holders > 0 ? ` ${formatInt(s.holders)} waiting with him.` : ''}${mock}`;
  }
  // TODO(community): when s.community exists, render find-the-difference winner / poll / meme of the day.
  if (s.community && typeof s.community.text === 'string') $('community-text').textContent = s.community.text;
}

async function main() {
  bootScreen();
  mountSoundButton();
  loadCA(); // first, independent of the market API
  $('community-text').textContent = PACK.site.communityBlurb;
  mountGenerator(document);
  tick();
  setInterval(tick, 1000);
  mountHoldLine();
  mountStillness();
  mountMakePat();
  mountRemote();
  room = await mountRoom($('room'));
  shownEvent = null; // repaint now that the art is in the page
  tick();
  mountTunnel({ room, showProps: eventIndex() < 0 });
  mountPlay({ room });
  mountMiniPat();
  mountWanted();
  setTimeout(mountHoverbike, 5200); // arrives after the boot screen
  startMarketPolling(onState, setCA); // also accepts a fresh `ca` from /api/state; never from cache or mock
}
main();
