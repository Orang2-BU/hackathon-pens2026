# Backend deployment scaffold

This is packaging only, not a deployed or release-ready service. PostgreSQL ingest/publish is not implemented yet, so `/api/health/ready` remains `503` until a dataset revision has been published. Do not put this API behind a public URL until BE-04/13/15 gates pass.

## Local container smoke

1. Copy `.env.example` to `.env` in this directory. Replace every placeholder with random values. Use URL-safe alphanumeric passwords for the two database login passwords because Compose assembles their PostgreSQL URLs. Keep `.env` private.
2. Start the stack with `docker compose -f docker-compose.yml up --build -d`.
3. Check process liveness with `curl http://127.0.0.1:8080/api/health/live`. The port is bound to loopback for a local reverse proxy; PostgreSQL has no published host port.
4. Check `docker compose ps` and `docker compose logs --tail=50 db migrate api`. The migration job runs once the database is healthy. Initial DB role creation runs only when the named volume is empty.
5. Readiness is expected to remain `503` until ingest/publish exists. An HTTP liveness response does not prove DB readiness, dataset availability, HTTPS, or public deployment.

The API container is non-root, read-only, has all Linux capabilities dropped, and shares a private Compose network with PostgreSQL. Use HTTPS termination and a trusted reverse proxy on the host; never expose the PostgreSQL port. Set `PUBLIC_ORIGIN` to the exact public HTTPS origin before production. Provide actual secrets through the host environment/secret manager; do not put them in Git or an image layer.

The Postgres image bootstrap creates separate login/group roles on first initialization. `003_runtime-privileges.sql` grants runtime table privileges while keeping Decision UPDATE/DELETE revoked. Existing database volumes are not modified by changing init files; apply a reviewed migration/role procedure instead. Do not run `docker compose down -v` on any volume containing user data.

## Current deployment blockers

- Docker/Compose and PostgreSQL are not installed/available in the current environment, so image build, Compose validation, DB initialization, migrations, restart/persistence, and service smoke could not be run here.
- No VPS target, SSH identity, domain/HTTPS proxy, production secrets, or operator approval for a concrete host is configured. No public deployment was attempted.
- Backend dataset persistence and publish are not implemented; the ignored local KasirNusa dataset is not mounted into the API container or sent to any service.
- Jev credentials are absent; this scaffold does not make provider requests.
