// Copy shared by the site and the bot, so the two never drift (QA-v8 Low, Guard).
// A line Datuna has not approved yet carries a named marker: DRAFT(<name>); approved lines say APPROVED(<name>). scripts/freeze-gate.mjs lists
// and FAILS on every one; delete a marker only when Datuna/Voice approve that exact text.

// Pre-launch CA slot (site top bar, /api/ca ca:null before launch) and bot /ca empty state.
// APPROVED by Datuna 2026-11-03 01:01 IL ("שורת ה-CA מאושרת"); Voice: approved as-is.
// Keeps the launch-brief wording "Contract address: posted at launch" + the bot's anti-scam line.
export const CA_PRELAUNCH = 'Contract address: posted at launch. No CA yet; anyone posting one now is lying.';

// From the launch time (js/schedule.js LAUNCH) while TOKEN_MINT is still unset (QA-v10-01): never call a posted CA a lie.
// APPROVED(CA post-launch line): Voice 2026-11-03, Datuna 2026-11-03 02:10 IL ("מאשר את כל 10 הטקסטים של Voice"). Site top bar (after launch, /api/ca ca:null) and bot /ca use this same string.
export const CA_POSTLAUNCH = 'Launch is live. The CA is being verified and will appear shortly here, in the pinned Telegram message and on our X (@datuna_memecoin). Trust only those three. Admins never DM first.';

// While no launch is confirmed (js/schedule.js LAUNCH_CONFIRMED). Site room line and bot /wait, /next.
export const ROOM_UNSET = 'The room opens when it opens. Pat is already here.';

// APPROVED(source-of-truth line: site footer + bot /safety): Voice 2026-11-03, Datuna 2026-11-03 02:10 IL ("מאשר את כל 10 הטקסטים של Voice").
// One source of truth for the site link (the quick-tunnel URL changes, so fakes are easy).
export const SOURCE_OF_TRUTH = 'The only real site link is the one in our X bio (@datuna_memecoin) and in the pinned Telegram message. Anything else is fake.';
// Bot /safety: the "/links" clause only when SITE_URL is valid (so /links really lists the site); otherwise omitted (QA-v10-05).
export const SOURCE_OF_TRUTH_BOT = SOURCE_OF_TRUTH + ' (/links here shows the same one)';
// Site footer: no "/links" clause (only true when SITE_URL is set and current) (QA-v10-05).
export const SOURCE_OF_TRUTH_SITE = SOURCE_OF_TRUTH;
