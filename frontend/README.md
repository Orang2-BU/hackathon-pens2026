# Tessera — frontend

Next.js 16 app for the Tessera CS workspace. Product, rules, and design live in `../docs/` (start with `../CLAUDE.md`).

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # Vitest
pnpm typecheck
pnpm lint
pnpm exec knip    # dead code
pnpm build
```

Workspace data comes from the separate backend API. Copy `.env.example` to `.env.local`, set server-only `BACKEND_URL`, and match `PUBLIC_ORIGIN` exactly with the backend origin configuration. Start the backend after migrations, dataset publish, graph compile, and scoring (see `../backend/DEPLOY.md`). Login uses its configured `DEMO_PASSWORD`; no hardcoded browser password or localStorage Decision fallback exists. Missing data/backend configuration produces an explicit empty/error state.

Dashboard, Accounts/detail, Investigate, Review, Actions and Data use the same-origin `/api/[...path]` relay. Decisions, feedback and action events persist in PostgreSQL. Professional memory is retrieved by the backend, without a Knowledge page or model training. Docker packaging is in `Dockerfile`, and `../backend/docker-compose.yml` includes both services. `next.config.ts` emits `.next/standalone/frontend/server.js` with the repository tracing root.

Design tokens in `src/app/theme.css` are generated from `../docs/08-DESIGN.md`:

```sh
npx -p @google/design.md designmd export --format css-tailwind ../docs/08-DESIGN.md > src/app/theme.css
```
