# API contract: UknownCode-BD (Cloudflare Workers)

Single source of truth shared by the Worker (`UknownCode-BD` repo) and the app (`apps/mobile/src/lib`).
Change this file first, then both sides.

Base URL: `https://<worker>.workers.dev` (the user types it in Settings > Backend).

## Conventions

- JSON in, JSON out, UTF-8. Errors always: `{ "error": { "code": "UPPER_SNAKE", "message": "English, no secrets" } }`.
- Auth: `Authorization: Bearer <Supabase access token>` on everything except `GET /` and `GET /health`.
  The Worker verifies the token with `GET {SUPABASE_URL}/auth/v1/user` (headers `apikey: <publishable key>`,
  `Authorization: Bearer <token>`). It rejects users whose `email_confirmed_at` is null with 403 `EMAIL_NOT_CONFIRMED`.
- CORS: allow-list from env `CORS_ORIGINS` (default `https://localhost,http://localhost:5173`). No wildcard, no credentials.
  Methods `GET,POST,PUT,DELETE,OPTIONS`; headers `Authorization,Content-Type`; `Access-Control-Max-Age: 600`.
- Every response: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`,
  `Strict-Transport-Security: max-age=31536000`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`.
- Body limits: 64 KB everywhere except `PUT /github/repos/:owner/:repo/file` (1.5 MB) and `/ai/chat` (256 KB).
- Never log or return: tokens, secrets, file contents, prompts.

### Error codes

| HTTP | code | meaning |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | body/query failed validation |
| 401 | `UNAUTHORIZED` | missing/invalid/expired Supabase token |
| 403 | `EMAIL_NOT_CONFIRMED` | account exists but email not confirmed |
| 404 | `NOT_FOUND` | unknown route |
| 413 | `PAYLOAD_TOO_LARGE` | body over the limit |
| 429 | `RATE_LIMITED` | with `Retry-After` seconds |
| 503 | `AUTH_UNAVAILABLE` | Supabase unreachable |
| 503 | `NOT_CONFIGURED` | a required secret/var is missing on the Worker |
| 503 | `PROVIDER_NOT_CONFIGURED` | no `OPENROUTER_API_KEY` |
| 502 | `PROVIDER_ERROR` | OpenRouter failed (no upstream text) |
| 409 | `GITHUB_NOT_CONNECTED` | user has no stored GitHub token |
| 409 | `GITHUB_TOKEN_INVALID` | stored token rejected by GitHub; user must reconnect |
| 400 | `GITHUB_INVALID_TOKEN` | token given to `PUT /github/token` was rejected |
| 403 | `GITHUB_FORBIDDEN` | token lacks permission (or protected branch) |
| 404 | `GITHUB_NOT_FOUND` | repo/branch/file not found or not visible to the token |
| 409 | `GITHUB_CONFLICT` | sha mismatch, already exists, or branch moved |
| 429 | `GITHUB_RATE_LIMITED` | GitHub rate limit (with `Retry-After` if known) |
| 502 | `GITHUB_UPSTREAM` | GitHub 5xx / network |

## Endpoints

### `GET /` and `GET /health` (public)
`{ "status": "ok", "service": "uknowncode-backend", "version": "<semver>", "timestamp": "<iso>" }`
(`GET /` may add `"name"`, `"platform": "Cloudflare Workers"`.)

### `GET /me`
`{ "user": { "id", "email", "emailConfirmed": true }, "profile": { "id", "display_name", "avatar_url" } | null }`

### AI (OpenRouter, server-side key)
- `GET /ai/models` -> `{ "models": [{ "id", "name", "free": bool, "contextLength"?: number }] }` (cached 10 min per isolate).
- `POST /ai/chat` body `{ "model": string(<=120, [A-Za-z0-9._:/@+-]), "messages": [{ "role": "user"|"assistant", "content": string(1..32000) }] (1..40, total <= 100000 chars) }`
  -> `text/event-stream`, each event `data: <json>\n\n` with
  `{ "type":"delta","text" }` | `{ "type":"done","usage":{ "inputTokens"?,"outputTokens"? } }` | `{ "type":"error","code","message","retryable" }`
  where `code` in `RATE_LIMITED|AUTH|MODEL|TIMEOUT|UPSTREAM`. The server prepends its own system prompt; clients cannot send `system`.
  Limit `AI_RATE_LIMIT` (default 30) per user per 10 minutes, counted from `usage_logs` (see Data).

### GitHub (fine-grained personal access token stored encrypted; see Data)

`:owner` `[A-Za-z0-9-]{1,39}`, `:repo` `[A-Za-z0-9._-]{1,100}`. Paths: no leading `/`, no `..` segment, no NUL, <= 1024 chars.
Branch/ref names: <= 200 chars, no control chars, no `..`, no `~^:?*[\`, no leading/trailing `/`, no `.lock` suffix, not `@`.

- `GET /github/status` -> `{ "connected": false }` | `{ "connected": true, "login", "avatarUrl"|null, "linkedAt" }`
- `PUT /github/token` body `{ "token": string(1..255, no whitespace) }`. Validates with GitHub `GET /user`.
  -> `{ "connected": true, "login", "avatarUrl"|null, "linkedAt" }`. 400 `GITHUB_INVALID_TOKEN` if rejected. Audit `github.connect`.
- `DELETE /github/token` -> `{ "connected": false }`. Audit `github.disconnect`.
- `GET /github/repos?page=1&perPage=30` (perPage 1..100) -> `{ "repos": [{ "id", "fullName", "owner", "name", "private", "description"|null, "defaultBranch", "language"|null, "updatedAt", "permissions": { "push": bool } }], "hasMore": bool }`
  (GitHub `GET /user/repos?sort=updated&affiliation=owner,collaborator,organization_member`).
- `GET /github/repos/:owner/:repo/branches?page=1` (100 per page) -> `{ "branches": [{ "name", "sha", "protected" }], "defaultBranch", "hasMore" }`
- `GET /github/repos/:owner/:repo/tree?ref=<ref>&path=<dir>` (ref default = default branch, path default = root)
  -> `{ "ref", "path", "entries": [{ "name", "path", "type": "file"|"dir"|"symlink"|"submodule", "size", "sha" }] }` (dirs first, then files, each A-Z case-insensitive).
- `GET /github/repos/:owner/:repo/file?ref=&path=`
  -> `{ "path", "sha", "size", "ref", "kind": "text"|"binary"|"too_large", "content"?: string }`. `content` only for `kind:"text"` (valid UTF-8, no NUL in first 8000 bytes, size <= 1,000,000).
- `GET /github/repos/:owner/:repo/commits?ref=&path=&page=1` (30 per page)
  -> `{ "commits": [{ "sha", "message", "authorName", "authorLogin"|null, "date", "htmlUrl" }], "hasMore" }` (`message` = first line only, <= 200 chars).
- `POST /github/repos/:owner/:repo/branches` body `{ "name", "from" }` (`from` = branch name) -> `{ "name", "sha" }`. 409 `GITHUB_CONFLICT` if it exists. Audit `github.branch.create`.
- `PUT /github/repos/:owner/:repo/file` body `{ "branch", "path", "content": string(<=1000000 chars, UTF-8), "message": string(1..500), "sha"?: string }`
  (`sha` required to update an existing file, omitted to create). -> `{ "commitSha", "contentSha", "path", "branch" }`. 409 `GITHUB_CONFLICT` on stale sha. Audit `github.file.commit`.
- `DELETE /github/repos/:owner/:repo/file` body `{ "branch", "path", "message", "sha" }` -> `{ "commitSha" }`. Audit `github.file.delete`.
- `POST /github/repos/:owner/:repo/pulls` body `{ "title": 1..250, "body"?: <=65000, "head", "base", "draft"?: bool }` -> `{ "number", "htmlUrl" }`. Audit `github.pull.create`.

## Data (Supabase, service role used only inside the Worker)

Env on the Worker: vars `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `CORS_ORIGINS`, `AI_RATE_LIMIT`, `OPENROUTER_REFERER`;
secrets `SUPABASE_SECRET_KEY` (sb_secret_..., service role), `OPENROUTER_API_KEY`, `TOKEN_ENCRYPTION_KEY` (base64 of 32 random bytes).

- `public.github_connections`: `id uuid, user_id uuid UNIQUE, github_login text, github_user_id bigint, avatar_url text,
  token_ciphertext text, key_version int default 1, created_at, updated_at`. One row per user (upsert on `user_id`).
  `token_ciphertext` = base64( iv[12] || AES-256-GCM(ciphertext+tag) ), key = `TOKEN_ENCRYPTION_KEY`, **AAD = user id (UTF-8)**.
  Clients can never read `token_ciphertext` (column privileges).
- `public.usage_logs`: `id uuid, user_id, session_id null, provider text ('openrouter'), model text, input_tokens, output_tokens,
  latency_ms, status text in ('pending','success','error','timeout'), created_at`.
  AI flow: count rows for the user with `created_at > now() - 10 min` (any status); if >= limit -> 429. Insert a `pending` row, stream,
  then PATCH it with tokens/latency/final status (use `ctx.waitUntil`).
- `public.audit_logs`: `id bigint identity, user_id uuid null, action text (<=64), detail jsonb, created_at`.
  `detail` may hold `{ repo, branch, path }` style metadata only: never tokens or file contents. Users can read their own rows.
- PostgREST calls from the Worker: `apikey` and `Authorization: Bearer` both set to `SUPABASE_SECRET_KEY`.
