# ADR-0007: Text classifier uses Jev for now

- **Status:** Accepted — user (dewaaa), 9 Okt 2026
- **Context:** Commit `e804c54` added `ingest/groq_classify.py`, an OpenAI-compatible classifier whose default endpoint is Groq (`llama-3.3-70b-versatile`) and which can also point at Jev/TypeSafe. The stack ADR (`0003-stack-hosting-auth-llm.md`) keeps generative LLMs out of the MVP, and the organizer's technical meeting scores teams on how they use the Jev decision model. The backend already has a Jev adapter (`backend/src/jev.js`, `JEV_API_KEY`) and an enrichment CLI (`backend/scripts/enrich-signals.js`).

## Decision

- Text signals from interactions and tickets are classified with **Jev** through the backend adapter. Jev returns typed `score`/`noul` outputs; code applies the write/review/discard thresholds.
- `ingest/groq_classify.py` is **not part of the active pipeline**. It is not run for the demo and its output is not written to the graph. It stays in the repo as the team's experiment until the team decides to remove it or to adopt it through a new ADR.
- Groq or any other generative endpoint may be reconsidered only through a new ADR that records provider, model, cost limit, data-sharing permission, and how results stay comparable with Jev.

## Consequences

- One classifier path is evaluated and reported: Jev, with the labelled samples described in `03-ARCHITECTURE.md` §4b.
- Jev credit is limited ($5 at registration, top-up through the mentor). Enrichment runs in bounded batches (`--limit`) after the rubric and spend limit are approved; unused credit is not a reason to switch providers silently.
- If Jev is unavailable during the demo, Tessera shows signals as not enriched instead of substituting another model.
