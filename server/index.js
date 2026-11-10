import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiServer } from './api.js';

const serverDir = dirname(fileURLToPath(import.meta.url));
// Shell variables win, then server/.env, then the repository .env.
for (const path of [resolve(serverDir, '.env'), resolve(serverDir, '..', '.env')]) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    const value = match[2];
    process.env[match[1]] = /^(["']).*\1$/.test(value) ? value.slice(1, -1) : value.replace(/\s+#.*$/, '');
  }
}
const port = Number(process.env.API_PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT must be an integer from 1 to 65535.');
const server = createApiServer();
server.on('error', error => { console.error(`API startup failed (${error.code || 'unknown'}).`); process.exitCode = 1; });
server.listen(port, process.env.API_HOST || '127.0.0.1', () => console.log(`SnapGrade API listening on port ${port}`));
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(() => process.exit(0));
  setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
