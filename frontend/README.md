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

Account data comes from the team's scoring export `../ingest/scores_40_v1.json` (see `src/lib/accounts.ts`); `next.config.ts` sets `turbopack.root` to the repo root so it can be imported. Design tokens in `src/app/theme.css` are generated from `../docs/08-DESIGN.md`:

```sh
npx -p @google/design.md designmd export --format css-tailwind ../docs/08-DESIGN.md > src/app/theme.css
```
