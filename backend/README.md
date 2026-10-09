# Tessera backend workspace

All backend-owned code belongs in this directory: the HTTP API, PostgreSQL adapter and migrations, ingest CLI, Jev adapter, graph and scoring logic, plans and Decisions, feedback, and backend checks. The standalone service uses Node's built-in HTTP server; only `postgres.js` is an application dependency.

The existing Next.js application remains in `../frontend/`. This workspace is the boundary for the API service; consumers communicate over HTTP. Backend source must not import frontend source.

The shared HTTP/DTO contract is documented in `../docs/13-BACKEND-CONTRACT.md`. Execution order and acceptance criteria are in `../docs/12-BACKEND-TASKS.md`. PostgreSQL and `postgres.js` remain the accepted storage choices.

KasirNusa files stay in the root-level gitignored `../dataset_kasirnusa/`. Ingest runs as an operator command; raw files are not public web assets.

The backend API, schema/migration runner, connected workspace and container deployment scaffold are implemented. Local PostgreSQL verification and its limitations are recorded in `../docs/04-TODO.md`. See [DEPLOY.md](DEPLOY.md); liveness is not readiness or proof of a VPS deployment.

Run `corepack pnpm install`, then `corepack pnpm test` and `corepack pnpm check`. Bootstrap roles with a PostgreSQL administrator by applying `db/roles.sql`; provision `tessera_migrator_login` and `tessera_runtime_login` outside the repository, each as a member of its matching role. `MIGRATION_DATABASE_URL` must be able to `SET ROLE tessera_migrator`; `DATABASE_URL` uses the restricted runtime login. `pnpm migrate` applies migrations under the owner role. `pnpm test:integration` requires `TEST_DATABASE_URL` pointing at a disposable database migrated with the current schema and migration/runtime roles, plus `TEST_DATASET_DIR` pointing at the ignored local KasirNusa dataset. It publishes all rows and verifies a repeated import is a no-op; use only a disposable database.

Dry-run first with `node scripts/ingest.js --dir ../dataset_kasirnusa --dry-run`. Actual persistence is explicit: set `MIGRATION_DATABASE_URL`, then run `node scripts/ingest.js --dir ../dataset_kasirnusa --publish` against the intended database. Publishing is not available as a public HTTP upload.

`pnpm test:workspace` requires an administrator `TEST_DATABASE_URL` whose database name starts with `tessera_test_`. It resets that database's public schema, applies all migrations and tests graph provenance, plans, immutable Decisions, Actions/progress, professional memory, feedback, and session permissions using a restricted runtime role. Use only an isolated disposable database. Its two-account labeled fixture is separate from `pnpm test:integration`, which requires the full ignored KasirNusa dataset.

Migration `007_actions.sql` adds append-only action events. CSM/admin track approved Decisions with owner/due date/status/progress/outcome; completed actions require observed results and cannot be rewritten. Memory retrieves previous approved actions and recorded results by leading measured factor, with source references and limitations. No automated outreach, feedback-driven scoring or generative LLM is added.

Migration `008_structured_source_json.sql` repairs double-encoded source/node/fact objects written by the previous bulk insert path, retaining their IDs and original record hashes. It adds an index for account-scoped source reads. After `test:integration` publishes and scores KasirNusa in its disposable database, `pnpm test:workspace:dataset` verifies 40 accounts, C01 → K017/P01/FEAT-07, C03/C05 → BUG-412 candidates, C04 renewal, and exact quotes through the restricted runtime role.
