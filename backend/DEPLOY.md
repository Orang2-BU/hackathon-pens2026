# Backend deployment scaffold

This is packaging only, not a deployed or release-ready service. PostgreSQL ingest/publish code exists but has not been verified against PostgreSQL, so `/api/health/ready` remains `503` until a dataset revision has been successfully published. Do not put this API behind a public URL until BE-04/13/15 gates pass.

## Local container smoke

1. Copy `.env.example` to `.env` in this directory. Replace every placeholder with random values. Use URL-safe alphanumeric passwords for the two database login passwords because Compose assembles their PostgreSQL URLs. Keep `.env` private.
2. Start the stack with `docker compose -f docker-compose.yml up --build -d`.
3. After verifying that the host path is a private dataset directory, publish using the migrator service: `docker compose run --rm --volume /srv/tessera/dataset_kasirnusa:/data:ro migrate node scripts/ingest.js --dir /data --publish`. This is an operator command; the API never accepts dataset uploads.
4. Compile the graph for the returned `revisionId`: `docker compose run --rm migrate node scripts/compile-graph.js --revision "<revision-id>"`.
5. Check process liveness with `curl http://127.0.0.1:8080/api/health/live`. The port is bound to loopback for a local reverse proxy; PostgreSQL has no published host port.
6. Check `docker compose ps` and `docker compose logs --tail=50 db migrate api`. The migration job runs once the database is healthy. Initial DB role creation runs only when the named volume is empty.
7. Readiness is expected to remain `503` until ingest/publish completes. An HTTP liveness response does not prove DB readiness, HTTPS, or public deployment.

The API container is non-root, read-only, has all Linux capabilities dropped, and shares a private Compose network with PostgreSQL. Use HTTPS termination and a trusted reverse proxy on the host; never expose the PostgreSQL port. Set `PUBLIC_ORIGIN` to the exact public HTTPS origin before production. Provide actual secrets through the host environment/secret manager; do not put them in Git or an image layer.

The Postgres image bootstrap creates separate login/group roles on first initialization. `003_runtime-privileges.sql` grants runtime table privileges while keeping Decision UPDATE/DELETE revoked. Existing database volumes are not modified by changing init files; apply a reviewed migration/role procedure instead. Do not run `docker compose down -v` on any volume containing user data.

## Current deployment blockers

- Docker/Compose and PostgreSQL are not installed/available in the current environment, so image build, Compose validation, DB initialization, migrations, restart/persistence, and service smoke could not be run here.
- No VPS target, SSH identity, domain/HTTPS proxy, production secrets, or operator approval for a concrete host is configured. No public deployment was attempted.
- The publish code has no real PostgreSQL run yet; the ignored local dataset is not mounted into the API container or sent to any service in this workspace.
- Jev credentials are absent; this scaffold does not make provider requests.
