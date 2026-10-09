# ADR-0006: Isolated backend service runtime

- Status: Accepted for implementation under the user's backend-only direction, 9 Okt 2026
- Supersedes: the monolithic Next.js backend location in `0003-stack-hosting-auth-llm.md` and section 4c of `03-ARCHITECTURE.md`; it does not replace the accepted PostgreSQL, postgres.js, Jev, or no-LLM decisions.

## Context

The user asked to isolate backend work in a root `backend/` workspace and not modify the frontend. A backend package must expose the documented HTTP/JSON boundary without importing frontend code. The accepted stack already allows Node.js and `postgres.js`; introducing a web framework would add an unapproved dependency.

## Decision

- Run a separate Node.js 22.18+ ESM service from `backend/` using the built-in `node:http` server.
- Use the existing approved `postgres.js` dependency for PostgreSQL access. Keep schema changes as ordered SQL migrations and apply them only through an operator/release command, never from a public request.
- Keep the existing frontend workspace untouched. Its future consumer communicates with the backend over HTTP.
- Use distinct migration and runtime database URLs. Runtime access to `decisions` is append-only; migration credentials are not exposed to the service.

## Consequences

- Backend checks and dependencies are isolated from the frontend package.
- Deployment topology now requires a backend service alongside the frontend and PostgreSQL; the earlier two-service Compose plan must be revised in the deployment task.
- PostgreSQL-backed integration tests require a disposable database. Without one, unit tests do not prove migration execution, grants, or transaction behavior.
- Authentication, CORS/origin policy, rate limits, and consumer integration remain owned by their later tasks; no cross-origin access is opened by this decision alone.

## Alternatives considered

- Keep server logic in Next.js: rejected for this implementation because it conflicts with the user's explicit backend-only workspace direction.
- Add Express/Fastify: deferred; built-in HTTP is sufficient for the bounded MVP API and avoids an additional dependency.
