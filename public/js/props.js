// Room props for the story events. Art: Studio (assets/pat.svg #props > g[data-prop], 800x500 room coords,
// all display="none" by default). This file only decides which ones are visible.
// Story logic: a prop appears with its first event and STAYS (the room accumulates: the phone stays on the rug,
// the mail pile, the plant, the spider). The current event's prop gets a short glow.
// 'sheet' covers an upcoming item: shown in the slot right before a reveal whose event brings a NEW prop
// (today: #17 "Something under the couch cushion buzzes" -> #18 the phone appears, Nov 7 20:00 IL).
import { REVEALS } from './schedule.js';

export const PROP_NAMES = ['pizza', 'plant', 'spider', 'mail', 'phone'];

/** Visible props at event index idx. Pure (tested in Node). */
export function propsState(events, idx) {
  const last = events.length - 1;
  const i0 = Math.min(idx, last);
  const visible = new Set();
  for (let i = 0; i <= i0; i++) if (events[i]?.prop) visible.add(events[i].prop);
  const current = i0 >= 0 ? events[i0]?.prop || null : null;
  let sheet = false;
  if (i0 >= 0 && i0 < last) {
    const next = events[i0 + 1]?.prop;
    const nextIsReveal = REVEALS.some((r) => r.event === i0 + 1);
    sheet = Boolean(nextIsReveal && next && !visible.has(next));
  }
  if (sheet) visible.add('sheet');
  return { visible: [...visible].sort(), current };
}

/** Toggle Studio's prop groups in the inlined room SVG. Safe if the layer or a group is missing. */
export function renderProps(svg, events, idx) {
  const layer = svg?.getElementById?.('props') || svg?.getElementById?.('svg-props');
  if (!layer) return;
  const { visible, current } = propsState(events, idx);
  for (const g of layer.querySelectorAll(':scope > [data-prop]')) {
    const name = g.getAttribute('data-prop');
    g.setAttribute('display', visible.includes(name) ? 'inline' : 'none');
    g.classList.toggle('prop-new', name === current);
  }
}
