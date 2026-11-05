// Cloudflare Pages entry for GET /api/state. Runs the same handler as Vercel and the local server, through a small req/res adapter.
import handler from '../_state.js';

export async function onRequest({ request, env }) {
  globalThis.process ||= { env: {} };
  process.env.TOKEN_MINT = env.TOKEN_MINT || '';
  process.env.HELIUS_API_KEY = env.HELIUS_API_KEY || '';
  process.env.VERCEL_ENV = 'production'; // production rules: no mock data, no upstream error details

  const headers = {};
  let status = 200;
  let body = '';
  const res = {
    set statusCode(v) { status = v; },
    get statusCode() { return status; },
    setHeader: (k, v) => { headers[k] = v; },
    end: (b) => { body = b ?? ''; },
  };
  const { pathname, search } = new URL(request.url);
  await handler({ url: pathname + search, method: request.method, headers: Object.fromEntries(request.headers) }, res);
  return new Response(request.method === 'HEAD' ? null : body, { status, headers });
}
