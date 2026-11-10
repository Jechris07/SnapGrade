# SnapGrade API

Run with Node.js 22 or newer:

```sh
npm run dev:api
npm run test:api
```

The server loads `server/.env`, then the repository `.env`. Variables already set in the process take precedence. `API_PORT` is read after environment files are loaded. Never put a Groq secret in a `VITE_` variable: Vite exposes those variables to the browser.

Copy the settings you need from `server/.env.example`. The server requires `GROQ_API_KEY`, plus `SUPABASE_URL` and `SUPABASE_ANON_KEY`; it also accepts the existing root `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. An anonymous/publishable key is sufficient: authentication and profile reads use the caller's verified session and database row-level security. A service-role key is not needed.

`GET /api/health` reports process liveness. It does not contact Supabase or Groq or establish that those services are configured correctly.

`POST /api/generate-questions` accepts JSON `{ "notes": "...", "numQ": 10 }` and requires `Authorization: Bearer <Supabase access token>`. The frontend supplies its session automatically. The API verifies the token with Supabase and checks that the user's `public.users` row is active before calling Groq. Database schema and RLS policies must already be applied. Direct API integrations must now supply this token.

Notes must contain 60–12000 characters after cleaning (the input string may not exceed 12000 characters). Question counts must be integers from 1–30; numeric strings are accepted for compatibility. JSON bodies are limited to 64 KiB. Invalid or partial generated quizzes return an error rather than silently reducing the requested question count.

Errors use `{ "error": "...", "requestId": "..." }` and appropriate HTTP status codes. Responses also include `X-Request-Id`. Provider messages, access tokens, API keys, and study notes are excluded from application error logs and error responses. Rate-limit and capacity failures include `Retry-After`.

Each newly generated question includes a required plain-text `explanation` (up to 700 characters) defining the correct answer and explaining it using the source notes. The quiz reveals it beside the correct choice only after an incorrect selection, and preserves it in saved results and retakes. Older quizzes without this field still work and display an unavailable-explanation message after a wrong selection.

## Deployment

- Set `ALLOWED_ORIGINS` to a comma-separated list of exact frontend origins, including scheme and port. Defaults allow only the Vite development origins. CORS is additional browser protection; authentication is enforced for non-browser requests too.
- The default bind address is `127.0.0.1`. Set `API_HOST=0.0.0.0` when a container or hosting platform needs to reach the listener. Put an HTTPS reverse proxy in front of it for remote access.
- Defaults allow 10 generation attempts per minute per socket IP and per verified user, and four concurrent generation requests including authentication. Configure these with `API_RATE_LIMIT` and `API_MAX_CONCURRENT`.
- Limits are held in memory for this server process and reset on restart. Forwarded-IP headers are deliberately not trusted. A proxy's clients share its socket-IP budget. For multiple instances or public deployment behind a proxy, add shared gateway throttling and tune the local IP budget for expected traffic.
- Request bodies have a 10-second deadline. Supabase calls default to 8 seconds each; generation defaults to 30 seconds. Configure `API_AUTH_TIMEOUT_MS` and `API_PROVIDER_TIMEOUT_MS` as needed. The frontend has a 60-second generation deadline; keep backend timeouts within it or update both together.
- Client disconnects cancel upstream work. SIGINT/SIGTERM drain the server, with a 10-second shutdown deadline.

The regression suite uses temporary loopback HTTP listeners and mocked Supabase/Groq responses. It does not use credentials, contact external services, or spend generation credits. Live provider behavior, production networking, and deployed database policies require separate deployment verification.
