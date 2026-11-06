# Development guide

Read this and `docs/api.md` (the backend contract) before touching the app.

## Layout

- `apps/mobile/src/features/<name>/` — one folder per feature (workspace, security, update). A feature owns its folder; do not edit another feature's files.
- `apps/mobile/src/screens/` — the older top-level screens (Home, Agent, Terminal, Settings, Auth).
- `apps/mobile/src/lib/` — shared logic. `components/` — shared UI.
- Backend lives in the separate repo `BigDreamSmallDih/UknownCode-BD` (Cloudflare Workers + Hono).

## Rules

- No fake features. If something is not wired to a real API, show an honest empty/unavailable state.
- TypeScript strict with `noUncheckedIndexedAccess`; no `any`.
- No secrets in the app or repo. Only the public Supabase URL and publishable key.
- Every user-facing string goes through i18n (`t('key')`), in all 8 languages.
- Pure logic gets a Vitest test (`*.test.ts`, node environment, no DOM).

## Styling

Tokens are in `src/styles/tokens.css`; never hard-code colors. Shared classes in `components.css`:
`.card .panel .frame .row .stack .spacer .hr .btn (.primary .danger .ghost .sm .block) .icon-btn (.sm .bordered) .input label.field .segmented .toggle .theme-grid .badge .chip .dot .kv .list .list-item .empty .skeleton .spinner .sheet-backdrop .sheet .toast .muted .ok .warn .bad .error-text .small .mono .truncate .sr-only`.
Screen wrapper: `<section className="screen">` (scrolling page) or add `fill` to `.page` for a full-height pane.
Layout: `<html data-layout="phone|desktop">`; use `useLayoutMode()` in code and `[data-layout='desktop']` in CSS.

## i18n parts

Each feature declares strings in `src/i18n/parts/<feature>.ts` with `defineMessages({ en, id, zh, es, fr, de, ja, ko })`.
English defines the keys; the compiler requires the same keys in all other languages. Prefix keys with the feature name.
Add new parts to `parts/index.ts`.

## Verifying

`npm run lint && npm run typecheck && npm test && npm run build`. CI runs the same on every PR.
