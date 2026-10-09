# Tessera backend workspace

All backend-owned code belongs in this directory: the HTTP API, PostgreSQL adapter and migrations, ingest CLI, Jev adapter, graph and scoring logic, plans and Decisions, feedback, and backend checks. The standalone service uses Node's built-in HTTP server; only `postgres.js` is an application dependency.

The existing Next.js application remains in `../frontend/`. This workspace is the boundary for the API service; consumers communicate over HTTP. Backend source must not import frontend source.

The shared HTTP/DTO contract is documented in `../docs/13-BACKEND-CONTRACT.md`. Execution order and acceptance criteria are in `../docs/12-BACKEND-TASKS.md`. PostgreSQL and `postgres.js` remain the accepted storage choices.

KasirNusa files stay in the root-level gitignored `../dataset_kasirnusa/`. Ingest runs as an operator command; raw files are not public web assets.

The BE-02 API and initial schema/migration runner are implemented. The PostgreSQL service still needs a local or disposable database for integration verification; ingest, domain routes, and deployment are future tasks.

Run `corepack pnpm install`, then `corepack pnpm test` and `corepack pnpm check`. Bootstrap roles with a PostgreSQL administrator by applying `db/roles.sql`; provision `tessera_migrator_login` and `tessera_runtime_login` outside the repository, each as a member of its matching role. `MIGRATION_DATABASE_URL` must be able to `SET ROLE tessera_migrator`; `DATABASE_URL` uses the restricted runtime login. `pnpm migrate` applies migrations under the owner role. `pnpm test:integration` requires `TEST_DATABASE_URL` pointing at a disposable database migrated with the current schema and using the restricted runtime role.
