# Tessera — Churn Early Warning Graph

Tessera is a Customer Success workspace for the fictional **PT KasirNusa Teknologi** case in Hackathon PENS 2026. It compiles customer signals that normally live in disconnected CRM, billing, support, usage, interaction, employment, and decision records into one context graph, then helps an Account Manager decide **which account needs attention first, why, and what to do next**.

**Live demo:** https://tessera.kandu.kr  
The login page displays the demo-access note for reviewers. No credential is stored in this repository.

## Why Tessera exists

A conventional account dashboard can say an account is healthy while the relationship is already deteriorating. Tessera looks for the combination of signals that a single dashboard misses:

- a champion or decision-maker has left;
- usage or outlet activity changes after a release;
- support issues remain open for a long time;
- a promised feature or escalation has not been delivered;
- the customer has stopped responding;
- the same product problem appears across several accounts.

The point is not to produce an unexplained churn number. Tessera produces a **priority ranking with an evidence path** that a human can inspect and challenge.

## What the workspace does

- **Dashboard** — portfolio priority, weighted contract value, renewals due soon, and accounts needing attention.
- **Accounts** — all 40 scored accounts, searchable and filterable by priority level and risk factor.
- **Account detail** — measured risk factors, annual contract context, evidence graph, decision history, a suggested next step, and an Ask-the-Graph panel.
- **Investigate** — cross-account investigation from an account, bug, feature, or other graph entity.
- **Review** — a human reviews the proposed save plan, records the reason for the decision, and approves or rejects it. Approval does **not** send an email or contact the customer automatically.
- **Actions** — approved decisions can be assigned, tracked, and completed with an observed outcome.
- **Data** — published source counts, the compiled graph, and persisted Jev processing statistics.

## The C01 case

**Kopi Lintas Nusantara (C01)** is the clearest example in the KasirNusa snapshot.

- CRM health is still **Hijau** (healthy).
- Tessera gives C01 the portfolio's highest priority score: **53/100** in the live `risk-heuristic-v2` build.
- Champion **Rina Hapsari (K017)** left on 15 August 2026 and started as GM Operations at prospect **P01 Grup Ritel Mandala** on 1 September 2026; the CRM relationship is stale.
- Deal **D-2025-11** promised the FEAT-07 accounting integration for Q3 2026, but it remains undelivered and has no target date.
- Escalation **D-2026-08** has been pending since 14 July 2026.
- A renewal email sent on 25 September 2026 has not been answered; renewal is on 15 December 2026, 75 days after the 1 October 2026 data snapshot.
- Three support tickets remain open.

No single item proves that C01 will churn. Together, across five sources, they create an urgent and inspectable retention case.

## Cross-account product pattern

C03 and C05 both show offline/synchronisation problems after application version 4.12. **BUG-412**, an offline-sync bug affecting version 4.12, remains open.

Tessera deliberately labels this connection **derived**, not hard evidence:

- no support ticket carries a hard `bug_id = BUG-412` link;
- only 16 of 640 tickets carry any `bug_id`;
- the candidate connection comes from the offline-outlet pattern, release timing, and ticket wording.

A human must verify a derived connection before treating it as the root cause.

## How Tessera works

```text
KasirNusa source files
        │
        ▼
Validation and ingest ───────────────┐
        │                            │
        ▼                            │
Compiled context graph               │
(nodes, edges, provenance)           │
        │                            │
        ├─ deterministic risk factors and priority score
        ├─ evidence paths and cross-account patterns
        └─ save-plan drafts ──► human review ──► tracked actions

Customer interactions ──► Jev/TypeSafe ──► candidate signals
                              │
                              ├─ weak/non-actionable output: discarded by code
                              └─ persisted candidate: human review
                                                       │
                                                accept ──► active signal
                                                reject ──► discarded

User question ──► Jev intent router ──► deterministic graph query
                              │
                              └─ ambiguous or unsupported: abstain
```

### Deterministic scoring

The live scoring version is `risk-heuristic-v2`. Its five measured factors are:

| Factor | Weight |
|---|---:|
| Usage | 30% |
| Service | 25% |
| Champion stability | 20% |
| Commitments and engagement | 15% |
| Payment | 10% |

The result is a **priority score from 0 to 100**, not a churn probability. Contract value is used as context and for prioritisation:

```text
weighted value for priority = annual contract value × priority score / 100
```

Renewal proximity and NPS are shown as context rather than being folded into the score, so urgency is not confused with measured relationship risk.

Snapshot result:

| Account | Priority | Level |
|---|---:|---|
| C01 — Kopi Lintas Nusantara | 53 | Critical |
| C05 — Minimarket Berkah | 34 | Critical |
| C03 — Apotek Sehat Sentosa | 33 | Critical |
| C02 — TB Sinar Jaya | 30 | Critical |
| C34 — Grosir Plastik Jaya | 15 | High |

The live dashboard reports **IDR 297M** of portfolio weighted priority value across four Critical and one High account, with 12 renewals due within 90 days.

### Jev and the AI boundary

Tessera uses **Jev by TypeSafe** only where the input is genuinely ambiguous: free-text customer interactions and natural-language question routing.

For interaction enrichment, the versioned rubric `kasirnusa-signals-v1` asks five small questions:

- `is_champion_exit` — does the text explicitly say a champion/contact left or is leaving?
- `mentions_competitor` — does it explicitly mention a competing product or provider?
- `negative_sentiment` — is the customer voice positive, neutral, negative, or mixed?
- `urgency_severity` — how urgent is the issue, on a 0–3 rubric?
- `is_expansion` — does the customer explicitly want more outlets, users, or capabilities?

Each persisted signal candidate carries its label, the primitive-specific probability/score/confidence, the exact supporting quote and span, the source record, the model, and the rubric version. Code first discards clearly weak or non-actionable outputs using primitive-specific thresholds. Every remaining candidate starts in **human review**; only acceptance activates the signal, and rejection discards it.

Jev also routes an Ask-the-Graph question to one of ten supported intents. Code requires the leading intent to reach 0.70 with at least a 0.15 margin, resolves the named account/bug/feature, and then runs a deterministic graph query. If the intent is ambiguous, the entity cannot be resolved, or the graph has no sourced facts, the system abstains instead of inventing an answer.

This follows the principle of **selective classification**: the model may abstain instead of turning uncertainty into a false fact. The final priority score and every account action remain deterministic and human-controlled. Tessera does not claim that its score is a calibrated churn probability.

The live Data page reports 346 persisted Jev calls, 221,732 input tokens, 42,904 output tokens, and 0 errors for the final hackathon build.

## Evidence rules

Tessera distinguishes three kinds of statement:

1. **Hard evidence** — directly supported by an identifier or field in a source record.
2. **Derived evidence** — a computed candidate connection, such as the C03/C05 relationship to BUG-412. It must be labelled and reviewed.
3. **Human decision** — a plan approval or rejection, persisted with its reason. A decision never silently rewrites the underlying source facts.

This distinction is part of the product, not an implementation footnote.

## Dataset

The committee-provided dummy dataset contains 15 source files, operational history from 1 October 2025 to 30 September 2026, and a business snapshot dated 1 October 2026.

| Source | Records |
|---|---:|
| `crm_accounts` | 45 |
| `contracts_billing` | 40 |
| `crm_contacts` | 160 |
| `contact_employment_history` | 217 |
| `crm_deals` | 22 |
| `decision_log` | 30 |
| `employees` | 10 |
| `interactions.jsonl` | 350 |
| `outlets` | 620 |
| `product_usage_daily` | 226,300 |
| `feature_usage_monthly` | 1,178 |
| `support_tickets` | 640 |
| `bugs` | 4 |
| `releases` | 3 |
| `features` | 8 |

The compiled live graph contains account, contract, contact, interaction, ticket, outlet, deal, employee, feature, bug, release, and decision nodes, with **4,140 active edges** and **5 review edges** in the final hackathon build.

A read-only Google Sheets copy of the raw dataset is available here:

https://drive.google.com/drive/folders/1Bo30bbXnWnNNJSRYHtAg6CQujvikgoHF

The dataset directory itself is intentionally ignored by Git. Place the committee-provided `dataset_kasirnusa/` directory locally before running ingest; do not commit customer data or secrets.

## Technology

| Layer | Implementation |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, React Flow |
| Backend | Standalone Node.js HTTP service using `node:http` and `postgres` |
| Database | PostgreSQL 16 |
| AI classification | Jev / TypeSafe, server-side only |
| Graph | PostgreSQL node, edge, source, signal, plan, decision, and action records |
| Deployment | Docker Compose services for frontend, API, migrations, and PostgreSQL behind an HTTPS reverse proxy |
| Tests | Vitest and Node's built-in test runner |

## Repository map

```text
frontend/   Next.js workspace and landing page
backend/    HTTP API, PostgreSQL migrations, ingest, graph compiler,
            scoring, Jev enrichment, plans, decisions, and actions
ingest/     Research utilities, deterministic scoring prototype,
            evidence pack, and classifier experiments
docs/       Product, architecture, workflow, data profile, pitch,
            design, backend contract, Jev notes, and ADRs
PRODUCT.md  Short product definition
```

Start with these documents:

- [`PRODUCT.md`](PRODUCT.md) — product definition
- [`docs/00-BRIEF.md`](docs/00-BRIEF.md) — challenge brief and evaluation framing
- [`docs/01-PRD.md`](docs/01-PRD.md) — product requirements
- [`docs/03-ARCHITECTURE.md`](docs/03-ARCHITECTURE.md) — system architecture
- [`docs/08-DESIGN.md`](docs/08-DESIGN.md) — design system
- [`docs/10-DATA-PROFILE-KASIRNUSA.md`](docs/10-DATA-PROFILE-KASIRNUSA.md) — dataset profile
- [`docs/13-BACKEND-CONTRACT.md`](docs/13-BACKEND-CONTRACT.md) — frontend/backend contract
- [`docs/JEV-KIT.md`](docs/JEV-KIT.md) and [`docs/JEV-LENS.md`](docs/JEV-LENS.md) — Jev integration notes
- [`docs/adr/`](docs/adr/) — architecture decision records

## Running locally

The supported local stack is defined in `backend/docker-compose.yml`.

1. Copy the backend environment template and fill every placeholder with local-only values:

   ```sh
   cp backend/.env.example backend/.env
   ```

2. Start the services:

   ```sh
   cd backend
   docker compose up --build -d
   ```

3. Publish the locally provided dataset, compile the graph, and persist scores by following [`backend/DEPLOY.md`](backend/DEPLOY.md). Dataset publishing is an operator command; the public API does not accept dataset uploads.

4. Optional Jev enrichment is a separate, explicitly executed one-shot operation. It requires `JEV_API_KEY` in the server environment and should be run only with an approved request limit. Never place the key in Git, an image, or frontend code.

For frontend-only development:

```sh
cd frontend
pnpm install
pnpm dev
```

The frontend expects the backend API described in [`frontend/README.md`](frontend/README.md).

## Verification commands

Frontend:

```sh
cd frontend
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Backend:

```sh
cd backend
corepack pnpm test
corepack pnpm check
```

Database-backed workspace and full-dataset integration checks require disposable PostgreSQL databases and the locally provided dataset. See [`backend/README.md`](backend/README.md) before running them.

## Limitations

- The KasirNusa data is fictional committee data, not production customer data.
- The portfolio contains no reliable churn-outcome labels, so the priority score is a transparent heuristic—not a trained or calibrated churn model.
- The primitive-specific Jev signal thresholds and the Ask-the-Graph router thresholds are operating policies, not learned optima. They should be recalibrated from recorded human decisions.
- Derived graph connections are hypotheses until a human verifies them.
- Tessera does not send outreach automatically. A person reviews, approves, and executes every retention action.
- A replacement dataset must follow the same KasirNusa schema before it can be ingested and rescored.

## What comes next

The natural continuation is to use the persisted human decisions as explicit outcome labels. Account managers already record what they approved, why, and what happened; those decisions become the tacit knowledge needed to evaluate rubric thresholds and, eventually, train a model that must beat the deterministic baseline before replacing it.

Another immediate follow-up is the cross-track connection in C01: the former champion now works at prospect P01, creating a warm, evidence-based handover between Customer Success and Sales.

## Team

**Positif dan Professional**

- Krisna Panca Dewa — team chair
- Muhammad Lucky Ramdhan
- Aditya Fadni Athaullah

Advisor: **Aji Seto Arifianto**

Built for Hackathon PENS 2026, Context Graphs in Customer Success and Sales track.
