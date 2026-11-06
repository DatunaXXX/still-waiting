// Site settings. The contract address is NOT configured here: the single source is the TOKEN_MINT env var,
// served by /api/state as `ca` (site) and read directly by the Telegram bot.
export const STATE_POLL_MS = 180_000; // every 3 minutes per open tab: the free hosting plan allows 100,000 function calls a day
// Official links, given by Datuna 2026-11-05; Telegram group updated 2026-11-06. No buy/pump.fun links before launch.
export const LINKS = { x: 'https://x.com/datuna_memecoin', telegram: 'https://t.me/+ic_BeLEmz1ZiNmJk' };
