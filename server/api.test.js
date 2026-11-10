import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiServer } from './api.js';

const notes = 'Photosynthesis uses light energy to convert carbon dioxide and water into glucose and oxygen.';
const question = { question: 'What does photosynthesis produce?', choices: ['A. Glucose', 'B. Iron', 'C. Salt', 'D. Helium'], answer: 'A', explanation: 'Glucose is a sugar produced when photosynthesis uses light energy to convert carbon dioxide and water into stored chemical energy.' };
const env = { GROQ_API_KEY: 'test-key', SUPABASE_URL: 'https://auth.invalid', SUPABASE_ANON_KEY: 'test-anon' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

async function fixture(t, options = {}) {
  const calls = [];
  const server = createApiServer({ env, fetchImpl: async (url, init) => {
    calls.push({ url, init });
    if (url.includes('/auth/v1/')) return json({ id: 'test-student' });
    if (url.includes('/rest/v1/')) return json([{ is_active: true }]);
    return json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify([question]) } }] });
  }, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { calls, base, server, post: (body = { notes, numQ: 1 }, headers = {}) => fetch(`${base}/api/generate-questions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }) };
}

test('health, routing, query strings, and method responses', async t => {
  const app = await fixture(t);
  const health = await fetch(`${app.base}/api/health?probe=true`);
  assert.deepEqual(await health.json(), { ok: true });
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.ok(health.headers.get('x-request-id'));
  assert.equal((await fetch(`${app.base}/unknown`)).status, 404);
  const method = await fetch(`${app.base}/api/generate-questions`);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'POST, OPTIONS');
  assert.equal(app.calls.length, 0);
});

test('CORS allows only explicit origins and permits authorization preflights', async t => {
  const app = await fixture(t);
  const allowed = await fetch(`${app.base}/api/generate-questions`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Headers': 'authorization, content-type' } });
  assert.equal(allowed.status, 204);
  assert.equal(await allowed.text(), '');
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.match(allowed.headers.get('access-control-allow-headers'), /Authorization/);
  const denied = await app.post(undefined, { Origin: 'https://other.invalid' });
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  assert.equal(app.calls.length, 0);
});

test('rejects malformed body shapes and coercion before contacting services', async t => {
  const app = await fixture(t, { env: { ...env, API_RATE_LIMIT: '100' } });
  for (const body of ['{', 'null', '[]', '{}', JSON.stringify({ notes: {}, numQ: 1 }), JSON.stringify({ notes: 'short', numQ: 1 }), JSON.stringify({ notes: 'a'.repeat(12001), numQ: 1 }), ...[true, [], {}, 0, 31, 1.5, null].map(numQ => JSON.stringify({ notes, numQ }))]) {
    const response = await app.post(body);
    assert.equal(response.status, 400, body.slice(0, 100));
  }
  assert.equal((await app.post(undefined, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await app.post(undefined, { 'Content-Encoding': 'gzip' })).status, 415);
  assert.equal(app.calls.length, 0);
});

test('returns a structured 413 for both declared and streamed oversized bodies', async t => {
  const app = await fixture(t);
  assert.equal((await app.post('x'.repeat(65537))).status, 413);
  const status = await new Promise((resolve, reject) => {
    const req = http.request(`${app.base}/api/generate-questions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write('x'.repeat(40000)); req.end('x'.repeat(30000));
  });
  assert.equal(status, 413);
  assert.equal(app.calls.length, 0);
});

test('requires a verified session and active database profile', async t => {
  const app = await fixture(t);
  assert.equal((await app.post(undefined, { Authorization: '' })).status, 401);
  assert.equal(app.calls.length, 0);
  const expired = await fixture(t, { fetchImpl: async () => json({ error: 'secret-auth-details' }, 401) });
  assert.equal((await expired.post()).status, 401);
  const inactive = await fixture(t, { fetchImpl: async url => url.includes('/auth/v1/') ? json({ id: 'student' }) : json([{ is_active: false }]) });
  assert.equal((await inactive.post()).status, 403);
  const missing = await fixture(t, { env: { GROQ_API_KEY: 'test' } });
  assert.equal((await missing.post()).status, 503);
});

test('valid generation uses separate instructions and returns the exact contract', async t => {
  const app = await fixture(t);
  const response = await app.post({ notes, numQ: '1' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { questions: [question] });
  assert.equal(app.calls.length, 3);
  const payload = JSON.parse(app.calls[2].init.body);
  assert.equal(payload.messages[0].role, 'system');
  assert.deepEqual(JSON.parse(payload.messages[1].content), { questionCount: 1, studyNotes: notes });
  assert.ok(app.calls[2].init.signal);
});

test('rejects incomplete, duplicate, mislabelled and malformed generated questions', async t => {
  for (const content of ['not json', '[]', JSON.stringify([{ ...question, choices: ['B. Glucose', 'A. Iron', 'C. Salt', 'D. Helium'] }]), JSON.stringify([{ ...question, choices: ['A. Same', 'B. Same', 'C. Salt', 'D. Helium'] }]), JSON.stringify([{ ...question, answer: 'Z' }]), JSON.stringify([question, question])]) {
    const app = await fixture(t, { fetchImpl: async url => url.includes('/auth/v1/') ? json({ id: 'student' }) : url.includes('/rest/v1/') ? json([{ is_active: true }]) : json({ choices: [{ message: { content } }] }) });
    assert.equal((await app.post()).status, 502);
  }
});

test('provider failures are sanitized and truncated output is rejected', async t => {
  for (const [result, expected] of [[json({ error: { message: 'secret-api-key' } }, 429), 503], [json({ error: { message: 'secret-api-key' } }, 500), 503], [json({ error: { message: 'secret-api-key' } }, 401), 502], [new Response('secret-api-key', { status: 500 }), 502], [json({ choices: [{ finish_reason: 'length', message: { content: JSON.stringify([question]) } }] }), 502]]) {
    const app = await fixture(t, { fetchImpl: async url => url.includes('/auth/v1/') ? json({ id: 'student' }) : url.includes('/rest/v1/') ? json([{ is_active: true }]) : result });
    const response = await app.post();
    assert.equal(response.status, expected);
    assert.doesNotMatch(await response.text(), /secret-api-key/);
  }
});

test('rate limits reset after one minute and do not trust forwarded IP headers', async t => {
  let time = 100;
  const app = await fixture(t, { env: { ...env, API_RATE_LIMIT: '1' }, now: () => time });
  assert.equal((await app.post()).status, 200);
  const denied = await app.post(undefined, { 'X-Forwarded-For': '192.0.2.1' });
  assert.equal(denied.status, 429);
  assert.equal(denied.headers.get('retry-after'), '60');
  time += 60_000;
  assert.equal((await app.post()).status, 200);
});

test('upstream timeouts return 504 and release the concurrency slot', async t => {
  const app = await fixture(t, { env: { ...env, API_AUTH_TIMEOUT_MS: '20', API_MAX_CONCURRENT: '1' }, fetchImpl: async (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })) });
  assert.equal((await app.post()).status, 504);
  assert.equal((await app.post()).status, 504);
});

test('concurrency limit rejects excess requests while allowing health probes', async t => {
  let release;
  let started;
  const ready = new Promise(resolve => { started = resolve; });
  const app = await fixture(t, { env: { ...env, API_MAX_CONCURRENT: '1' }, fetchImpl: async url => {
    if (url.includes('/auth/v1/')) { started(); await new Promise(resolve => { release = resolve; }); return json({ id: 'student' }); }
    if (url.includes('/rest/v1/')) return json([{ is_active: true }]);
    return json({ choices: [{ message: { content: JSON.stringify([question]) } }] });
  } });
  const first = app.post();
  await ready;
  assert.equal((await app.post()).status, 503);
  assert.equal((await fetch(`${app.base}/api/health`)).status, 200);
  release();
  assert.equal((await first).status, 200);
});

test('provider timeout returns 504 after successful authentication', async t => {
  const app = await fixture(t, { env: { ...env, API_PROVIDER_TIMEOUT_MS: '20' }, fetchImpl: async (url, { signal }) => {
    if (url.includes('/auth/v1/')) return json({ id: 'student' });
    if (url.includes('/rest/v1/')) return json([{ is_active: true }]);
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  assert.equal((await app.post()).status, 504);
});

test('client disconnect cancels upstream work and frees capacity', async t => {
  let started;
  let aborted;
  const ready = new Promise(resolve => { started = resolve; });
  const cancelled = new Promise(resolve => { aborted = resolve; });
  let callCount = 0;
  const app = await fixture(t, { env: { ...env, API_MAX_CONCURRENT: '1' }, fetchImpl: async (url, { signal }) => {
    callCount++;
    if (callCount === 1) {
      started();
      return new Promise((resolve, reject) => signal.addEventListener('abort', () => { aborted(); reject(signal.reason); }, { once: true }));
    }
    if (url.includes('/auth/v1/')) return json({ id: 'student' });
    if (url.includes('/rest/v1/')) return json([{ is_active: true }]);
    return json({ choices: [{ message: { content: JSON.stringify([question]) } }] });
  } });
  const req = http.request(`${app.base}/api/generate-questions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-session' } });
  req.on('error', () => {});
  req.end(JSON.stringify({ notes, numQ: 1 }));
  await ready;
  req.destroy();
  await cancelled;
  // The next HTTP request occurs after the cancelled handler's finally releases its slot.
  assert.equal((await app.post()).status, 200);
});

test('rejects oversized upstream responses without exposing their content', async t => {
  const app = await fixture(t, { fetchImpl: async url => url.includes('/auth/v1/') ? json({ id: 'student' }) : url.includes('/rest/v1/') ? json([{ is_active: true }]) : new Response('x'.repeat(300_000)) });
  const response = await app.post();
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /too large/);
});

test('root Supabase configuration and production origin are supported', async t => {
  const app = await fixture(t, { env: { GROQ_API_KEY: 'test', VITE_SUPABASE_URL: 'https://auth.invalid/', VITE_SUPABASE_ANON_KEY: 'anon', ALLOWED_ORIGINS: 'https://study.example' } });
  const response = await app.post(undefined, { Origin: 'https://study.example' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://study.example');
  assert.equal(app.calls[0].url, 'https://auth.invalid/auth/v1/user');
  assert.equal(app.calls[0].init.headers.Authorization, 'Bearer test-session');
});

test('new quizzes require a nonempty plain-text explanation for every answer', async t => {
  for (const explanation of [undefined, '', '   ', {}, '<script>bad()</script>', 'x'.repeat(701)]) {
    const app = await fixture(t, { fetchImpl: async url => url.includes('/auth/v1/') ? json({ id: 'student' }) : url.includes('/rest/v1/') ? json([{ is_active: true }]) : json({ choices: [{ message: { content: JSON.stringify([{ ...question, explanation }]) } }] }) });
    assert.equal((await app.post()).status, 502);
  }
});
