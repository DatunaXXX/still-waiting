// Story events for Pat's room. One per 4-hour slot (00/04/08/12/16/20 Israel time) from launch:
// story slot #0 = Wed Nov 4 20:00 IL ... #89 = Thu Nov 19 16:00 IL; the room opens on the slot at LAUNCH (Fri Nov 6 20:00 IL = #12). Text + prop come from Voice's pack (js/voice-pack.js).
// After the last event the room stays on it: nothing new is shown or announced.
import { PACK } from './voice-pack.js';
import { firstEventIndex } from './schedule.js';

export const PRE_LAUNCH = { text: PACK.site.preLaunch.replace('Wednesday', 'Sunday').replace('20:00', '22:00') }; // pack text predates the move to Sunday Nov 8, 22:00
export const EVENTS = PACK.events.map(({ text, prop }) => ({ text, prop }));
export const LAST_EVENT = EVENTS.length - 1;

/** Shared by the site (line under the counter) and the bot (/wait): Voice's wait_after_nov19 lines.
 *  n = days since Nov 19 (Nov 20 = 1). Day 1 = main line, then the alternates in order, then repeat. */
export const WAIT_AFTER_NOV19 = PACK.bot.waitAfterNov19;
export function afterNov19Line(n) {
  const k = Math.max(1, Math.floor(n));
  return WAIT_AFTER_NOV19[(k - 1) % WAIT_AFTER_NOV19.length].replaceAll('{days}', String(k));
}

/** Event for a slot index (see schedule.eventIndex). Never wraps: past the end it stays on the last one. */
export function eventFor(index) {
  if (index < 0) return { ...PRE_LAUNCH, index, preLaunch: true };
  if (index > LAST_EVENT) return { ...EVENTS[LAST_EVENT], index: LAST_EVENT, final: true };
  // The room's first slot always reads as the opening, even when launch falls later on the story calendar.
  if (index === firstEventIndex()) return { ...EVENTS[index], text: EVENTS[0].text, index };
  return { ...EVENTS[index], index };
}
