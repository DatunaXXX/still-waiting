// GET /api/state  -  Vercel-style serverless function (Node runtime).
// Returns the market "rhythm" for Pat's room. Read-only public data, no wallets, no keys in code.
//
// env TOKEN_MINT      Solana mint of $WAITING = the ONLY source of the contract address (returned as `ca`).
//                     Unset => { preLaunch: true }.
// env HELIUS_API_KEY  optional, enables holder count (cached, deduped, capped).
// env ALLOW_MOCK=1    enables ?mock=up|down|flat for local/preview testing. Never in Vercel production.
//
// Production hardening: any query string => 308 to /api/state (one cacheable URL, no cache-busting
// against upstream/Helius), upstream calls deduped while in flight, no upstream error details in responses.

const CACHE_MS = 30_000;            // market data cache
const HOLDERS_CACHE_MS = 300_000;   // holder count refresh at most every 5 min (also after failures)
const HOLDERS_MAX_PAGES = 10;
const FAIL_CACHE_MS = 30_000;      // negative cache: after an upstream failure, don't retry for 30 s       // cap: 10 x 1000 accounts per refresh
const TIMEOUT_MS = 6_000;
const MOCK_KINDS = new Set(['up', 'down', 'flat']);
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

let cache = { at: 0, mint: '', data: null };
let inflight = { mint: '', promise: null };
let holdersCache = { at: 0, mint: '', value: null };
let holdersInflight = { mint: '', promise: null };
let failCache = { at: 0, mint: '', errors: [] };

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const isProd = () => process.env.VERCEL_ENV === 'production';
export const mockAllowed = () => process.env.ALLOW_MOCK === '1' && !isProd();

async function getJSON(url, init = {}) {
  const r = await fetch(url, { ...init, headers: { accept: 'application/json', ...(init.headers || {}) }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error(`${new URL(url).host} HTTP ${r.status}`); // host only, never the full URL (may carry a key)
  return r.json();
}

async function fromDexScreener(mint) {
  const j = await getJSON(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`);
  const pairs = (j.pairs || []).filter((p) => p.chainId === 'solana');
  if (!pairs.length) throw new Error('dexscreener: no pairs');
  pairs.sort((a, b) => (num(b.liquidity?.usd) || 0) - (num(a.liquidity?.usd) || 0));
  const p = pairs[0];
  return {
    price: num(p.priceUsd), change5m: num(p.priceChange?.m5), change1h: num(p.priceChange?.h1),
    volume24h: pairs.reduce((s, x) => s + (num(x.volume?.h24) || 0), 0),
    mcap: num(p.marketCap) ?? num(p.fdv), source: 'dexscreener',
  };
}

async function fromGeckoTerminal(mint) {
  const j = await getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${encodeURIComponent(mint)}/pools?page=1`);
  const pools = j.data || [];
  if (!pools.length) throw new Error('geckoterminal: no pools');
  pools.sort((a, b) => (num(b.attributes?.reserve_in_usd) || 0) - (num(a.attributes?.reserve_in_usd) || 0));
  const a = pools[0].attributes || {};
  return {
    price: num(a.base_token_price_usd), change5m: num(a.price_change_percentage?.m5), change1h: num(a.price_change_percentage?.h1),
    volume24h: pools.reduce((s, x) => s + (num(x.attributes?.volume_usd?.h24) || 0), 0),
    mcap: num(a.market_cap_usd) ?? num(a.fdv_usd), source: 'geckoterminal',
  };
}

// Counts owners with a non-zero balance via Helius DAS getTokenAccounts. Cached 5 min (also on failure), deduped, page-capped.
async function holdersFromHelius(mint, key) {
  if (holdersCache.mint === mint && Date.now() - holdersCache.at < HOLDERS_CACHE_MS) return holdersCache.value;
  if (holdersInflight.mint === mint && holdersInflight.promise) return holdersInflight.promise;
  const promise = (async () => {
    const url = `https://mainnet.helius-rpc.com/?api-key=${encodeURIComponent(key)}`;
    const owners = new Set();
    try {
      for (let page = 1; page <= HOLDERS_MAX_PAGES; page++) {
        const j = await getJSON(url, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 'holders', method: 'getTokenAccounts', params: { mint, page, limit: 1000 } }),
        });
        const accts = j.result?.token_accounts || [];
        for (const a of accts) if (Number(a.amount) > 0) owners.add(a.owner);
        if (accts.length < 1000) break;
      }
      holdersCache = { at: Date.now(), mint, value: owners.size };
    } catch {
      holdersCache = { at: Date.now(), mint, value: holdersCache.mint === mint ? holdersCache.value : null }; // back off 5 min
    } finally { if (holdersInflight.promise === promise) holdersInflight = { mint: '', promise: null }; }
    return holdersCache.value;
  })();
  holdersInflight = { mint, promise };
  return promise;
}

async function fetchMarket(mint) {
  const errors = [];
  for (const src of [fromDexScreener, fromGeckoTerminal]) {
    try { return { market: await src(mint) }; } catch (e) { errors.push(String(e.message || e)); }
  }
  return { market: null, errors };
}

async function refresh(mint) {
  const { market, errors } = await fetchMarket(mint);
  if (!market) { failCache = { at: Date.now(), mint, errors }; return { ok: false, errors }; }
  const holders = process.env.HELIUS_API_KEY ? await holdersFromHelius(mint, process.env.HELIUS_API_KEY) : null;
  const data = { ca: mint, ...market, holders, updatedAt: new Date().toISOString(), community: null };
  cache = { at: Date.now(), mint, data };
  return { ok: true, data };
}

function mock(kind) {
  const wobble = Math.sin(Date.now() / 7000) * 0.8;
  const presets = {
    up: { change5m: 12 + wobble, change1h: 34, volume24h: 850_000 },
    down: { change5m: -14 + wobble, change1h: -27, volume24h: 420_000 },
    flat: { change5m: 0.3 * wobble, change1h: 0.5, volume24h: 15_000 },
  };
  return { price: 0.000042, mcap: 42_000, holders: 1234, ...presets[kind], source: `mock:${kind}` };
}

function send(res, status, body, cacheSeconds = 15) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', cacheSeconds ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60` : 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'method not allowed' }, 0);

  // Production: exactly one URL. Any query string => permanent redirect to the bare path.
  if (isProd() && url.search) {
    res.statusCode = 308;
    res.setHeader('location', '/api/state');
    res.setHeader('cache-control', 'public, max-age=3600');
    return res.end();
  }

  const allowMock = mockAllowed();
  const mockKind = url.searchParams.get('mock');
  // TODO(community): community rhythm fields will be added once the Telegram bot exposes them. Reserved: community.
  if (mockKind !== null && allowMock) {
    if (!MOCK_KINDS.has(mockKind)) return send(res, 400, { error: 'mock must be up|down|flat' }, 0);
    return send(res, 200, { ...mock(mockKind), mockAllowed: true, updatedAt: new Date().toISOString(), community: null }, 0);
  }
  const extra = allowMock ? { mockAllowed: true } : {};

  const mint = (process.env.TOKEN_MINT || '').trim();
  if (!mint) return send(res, 200, { preLaunch: true, ...extra, updatedAt: new Date().toISOString(), source: 'none', community: null }, 60);
  if (!BASE58.test(mint)) return send(res, 500, { error: 'server misconfigured' }, 0);

  if (cache.mint === mint && cache.data && Date.now() - cache.at < CACHE_MS) return send(res, 200, { ...cache.data, ...extra });

  // Negative cache: upstream failed < 30 s ago for this mint => answer without calling upstream again.
  const recentFail = failCache.mint === mint && Date.now() - failCache.at < FAIL_CACHE_MS;
  // Dedupe: concurrent requests share one upstream refresh.
  if (recentFail) {
    // fall through to the failure response below
  } else if (inflight.mint !== mint || !inflight.promise) {
    const p = refresh(mint).finally(() => { if (inflight.promise === p) inflight = { mint: '', promise: null }; });
    inflight = { mint, promise: p };
  }
  const result = recentFail ? { ok: false, errors: failCache.errors } : await inflight.promise;
  if (result.ok) return send(res, 200, { ...result.data, ...extra });

  // Upstream down: last known state, but only for THIS mint.
  if (cache.data && cache.mint === mint) return send(res, 200, { ...cache.data, ...extra, stale: true });
  const body = { error: 'market data unavailable', ca: mint, updatedAt: new Date().toISOString() };
  if (!isProd()) body.details = result.errors;
  return send(res, 502, body, 0);
}
