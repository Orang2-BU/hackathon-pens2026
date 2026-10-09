# Tessera backend workspace

All backend-owned code belongs in this directory: the HTTP API, PostgreSQL adapter and migrations, ingest CLI, Jev adapter, graph and scoring logic, plans and Decisions, feedback, and backend checks.

The existing Next.js application remains in `../frontend/`. This workspace is the boundary for the API service; consumers communicate over HTTP. Backend source must not import frontend source.

The shared HTTP/DTO contract is documented in `../docs/13-BACKEND-CONTRACT.md`. Execution order and acceptance criteria are in `../docs/12-BACKEND-TASKS.md`. PostgreSQL and `postgres.js` remain the accepted storage choices.

KasirNusa files stay in the root-level gitignored `../dataset_kasirnusa/`. Ingest runs as an operator command; raw files are not public web assets.

This is only the requested workspace scaffold. The API runtime, database, migrations, ingest, and deployment have not been built yet.
