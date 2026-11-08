// Shared schedule module. Pure functions, no DOM, no dependencies.
// Works in the browser (<script type="module">) and in Node (import) for the Telegram bot.
// All "wall clock" logic is Asia/Jerusalem, computed with Intl (DST-safe).

export const TZ = 'Asia/Jerusalem';
export const WAIT_START = { y: 2013, m: 9, d: 17 };      // the day the waiting began
export const GAME_DAY = { y: 2026, m: 11, d: 19 };       // "November 19"
export const STORY_START = { y: 2026, m: 11, d: 4, h: 20, mi: 0 }; // event #0 of the story calendar; the dated events and reveals hang off this
export let LAUNCH = { y: 2026, m: 11, d: 8, h: 22, mi: 0 }; // launch, IL time. The room opens on whichever story slot falls here, so the story still ends Nov 19
// Nothing goes live on a date alone: launch state stays off until Datuna decides and this is flipped by hand.
export let LAUNCH_CONFIRMED = true;
/** Tests only. `at` replaces the launch moment, e.g. STORY_START for the original calendar. */
export const setLaunchConfirmed = (v, at = null) => { LAUNCH_CONFIRMED = Boolean(v); if (at) LAUNCH = at; };
export const FREEZE = { y: 2026, m: 11, d: 6, h: 18, mi: 0 }; // code freeze, IL time
export const EVENT_HOURS = [0, 4, 8, 12, 16, 20];         // story events, IL time
const DAY_MS = 86400000;

const fmtCache = new Map();
function fmt(tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return fmtCache.get(tz);
}

/** Wall-clock parts of an instant in a time zone (default Israel). */
export function zonedParts(date = new Date(), tz = TZ) {
  const o = {};
  for (const p of fmt(tz).formatToParts(date)) if (p.type !== 'literal') o[p.type] = Number(p.value);
  return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}

/** Offset (ms) of tz from UTC at a given instant. */
function tzOffset(ms, tz = TZ) {
  const p = zonedParts(new Date(ms), tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

/** Convert an Israel wall-clock time to a Date (instant). Handles DST. */
export function zonedToDate({ y, m, d, h = 0, mi = 0, s = 0 }, tz = TZ) {
  const guess = Date.UTC(y, m - 1, d, h, mi, s);
  let ms = guess - tzOffset(guess, tz);
  const off2 = tzOffset(ms, tz);
  ms = guess - off2;
  return new Date(ms);
}

const dayNumber = ({ y, m, d }) => Math.round(Date.UTC(y, m - 1, d) / DAY_MS);

/** Whole calendar days between two {y,m,d} dates. */
export function daysBetweenYMD(a, b) { return dayNumber(b) - dayNumber(a); }

/** Days Pat has been waiting on the Israel calendar date of `date`. 2026-11-04 -> 4796. */
export function daysWaiting(date = new Date()) {
  return daysBetweenYMD(WAIT_START, zonedParts(date));
}

/** Days waited from a user-supplied 'YYYY-MM-DD' to today's Israel date. */
export function daysSinceISO(iso, date = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return NaN;
  return daysBetweenYMD({ y: +m[1], m: +m[2], d: +m[3] }, zonedParts(date));
}

/** Total days from the start to "November 19" (4811). */
export const TOTAL_DAYS = daysBetweenYMD(WAIT_START, GAME_DAY);

export function launchDate() { return zonedToDate(LAUNCH); }
export function freezeDate() { return zonedToDate(FREEZE); }

function addDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** Current 4-hour slot and the next one. */
export function eventSlots(date = new Date()) {
  const p = zonedParts(date);
  const curHour = EVENT_HOURS[Math.floor(p.h / 4)];
  const current = zonedToDate({ y: p.y, m: p.m, d: p.d, h: curHour });
  const nextIdx = EVENT_HOURS.indexOf(curHour) + 1;
  const nextDay = nextIdx >= EVENT_HOURS.length ? addDays(p, 1) : { y: p.y, m: p.m, d: p.d };
  const nextHour = EVENT_HOURS[nextIdx % EVENT_HOURS.length];
  const next = zonedToDate({ y: nextDay.y, m: nextDay.m, d: nextDay.d, h: nextHour });
  return { current, currentHour: curHour, next, nextHour, msToNext: next - date };
}

/**
 * Story event index: 0 = the 20:00 launch slot on Nov 4, then +1 every 4 hours.
 * Negative before launch.
 */
export function eventIndex(date = new Date()) {
  if (!LAUNCH_CONFIRMED) return -1;
  return date < launchDate() ? -1 : storySlot(date); // compares the moment, not the slot: launch can fall in the middle of a 4-hour slot
}

function storySlot(date) {
  const p = zonedParts(date);
  const slot = Math.floor(p.h / 4);
  const days = daysBetweenYMD({ y: STORY_START.y, m: STORY_START.m, d: STORY_START.d }, p);
  return days * 6 + slot - 5; // story slot 0 (20:00) is slot 5 of Nov 4
}

/** The story slot the room opens on (0 if launch is on the original calendar). */
export const firstEventIndex = () => storySlot(launchDate());

/** Launch countdown. */
export function launchCountdown(date = new Date()) {
  if (!LAUNCH_CONFIRMED) return { ms: 0, launched: false, unset: true, ...splitMs(0) };
  const ms = launchDate() - date;
  return { ms, launched: ms <= 0, unset: false, ...splitMs(Math.max(0, ms)) };
}

export function splitMs(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(t / 86400), hours: Math.floor((t % 86400) / 3600), minutes: Math.floor((t % 3600) / 60), seconds: t % 60 };
}

const pad = (n) => String(n).padStart(2, '0');
/** "hh:mm:ss" (hours may exceed 24). */
export function formatHMS(ms) {
  const { days, hours, minutes, seconds } = splitMs(ms);
  return `${pad(days * 24 + hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** "1,234" style number. */
export const formatInt = (n) => Number(n).toLocaleString('en-US');

/** One snapshot of everything, handy for the Telegram bot. */
export function snapshot(date = new Date()) {
  const slots = eventSlots(date);
  return {
    days: daysWaiting(date),
    totalDays: TOTAL_DAYS,
    daysLeft: Math.max(0, TOTAL_DAYS - daysWaiting(date)),
    launch: launchCountdown(date),
    nextEventAt: slots.next.toISOString(),
    nextEventHourIL: slots.nextHour,
    nextEventIn: formatHMS(slots.msToNext),
    eventIndex: eventIndex(date),
  };
}

// ---------------------------------------------------------------------------
// REVEALS: shared by site and bot. Source: plan Page "תוכנית החשיפות עד 19.11" + Voice's event slots.
// SOURCE OF TRUTH = the room events (QA-v3-01): each reveal opens at the 4-hour slot of the event that
// reveals it in the story (`event` = index into js/events.js, #0 = Wed Nov 4 20:00 IL). So the room text,
// the bot's /phone stages and anything else keyed on REVEALS switch at the same moment.
// R1-R4 times approved by Datuna 2026-11-03 01:01 IL. R5-R7 (kitchen Nov 15 00:00, 48-hours Nov 17 00:00, remote Nov 19 12:00 IL)
// confirmed by Datuna 2026-11-03 02:10 IL ("החשיפות R5 עד R7 מאושרות"), times unchanged; all `confirm: false`. `holders`: plan milestone; REVEALS_FORCED flips a reveal early
// in the bot only (the room story is fixed per slot).
// ---------------------------------------------------------------------------
/** Wall-clock IL parts of event slot i (#0 = launch). */
export function slotParts(i) {
  const hours = STORY_START.h + 4 * i;
  const day = new Date(Date.UTC(STORY_START.y, STORY_START.m - 1, STORY_START.d + Math.floor(hours / 24)));
  return { y: day.getUTCFullYear(), m: day.getUTCMonth() + 1, d: day.getUTCDate(), h: hours % 24, mi: 0 };
}
export const slotDate = (i) => zonedToDate(slotParts(i));

const R = (n, key, event, holders, what) => ({ n, key, event, at: slotParts(event), holders, confirm: false, what });
export const REVEALS = [
  R(1, 'room',        0,  null, 'Live room, 4h events, generator, /wait'),
  R(2, 'phone',       18, 500,  'A phone appears and rings; "Your call is important to us." /phone: operator + 1/2/3 menu'),
  R(3, 'couch-fills', 24, null, '"The couch feels less empty lately." (couch fills with generator cards)'),
  R(4, 'intern',      42, 1000, '"Hi! I\'m the intern!" /phone: intern'),
  R(5, 'kitchen',     61, 2000, 'The kitchen door creaks open (fridge from 2013)'),
  R(6, '48-hours',    73, null, '"48 hours." Calendar with November 19 circled'),
  R(7, 'remote',      88, null, 'The music stops and Pat lifts the remote (TV on / "They did it again" switched by hand)'),
];
export function revealDate(n) {
  const r = REVEALS.find((x) => x.n === n);
  return r ? zonedToDate(r.at) : null;
}

/**
 * Is reveal n open? Opens when its date passes, when `holders` reaches its milestone, or when forced by hand.
 * opts: { holders?: number, forced?: Iterable<number> }
 */
export function isRevealed(n, date = new Date(), { holders = null, forced = [] } = {}) {
  const r = REVEALS.find((x) => x.n === n);
  if (!r || !LAUNCH_CONFIRMED) return false;
  if (new Set([...forced].map(Number)).has(n)) return true;
  if (r.holders && typeof holders === 'number' && holders >= r.holders) return true;
  return date >= (n === 1 ? launchDate() : zonedToDate(r.at)); // reveal 1 is the launch itself
}

/** Highest open reveal number (0 before launch). */
export function revealPhase(date = new Date(), opts = {}) {
  let p = 0;
  for (const r of REVEALS) if (isRevealed(r.n, date, opts)) p = Math.max(p, r.n);
  return p;
}
