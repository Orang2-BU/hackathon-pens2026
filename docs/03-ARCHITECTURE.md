# 03 — ARCHITECTURE & Rencana Build

> Turunan dari 01-PRD. Prioritas: golden demo path stabil. Stack usulan; Next.js dikunci user. ID sama dengan 04-TODO.

## 1. Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Bahasa/framework | TypeScript strict + Next.js App Router (dashboard dan route handlers) | Sudah dipilih; satu codebase/deploy |
| Package manager | pnpm | Install cepat/reproducible melalui lockfile |
| Graph store | SQLite + tabel node/edge/provenance, query recursive CTE | Tidak perlu service/container; cukup untuk demo, relasi eksplisit dan temporal |
| Decision model | Jev / TypeSafe `jev-latest` | Fokus penilaian; endpoint/pola lihat `docs/JEV-KIT.md`, validasi respons dengan Zod |
| Generatif | Provider belum ditentukan; satu model hanya untuk jawaban/draf save plan | Konfirmasi akses, harga dan izin dahulu. Default tanpa provider: jawaban extractive dan save plan template berbukti; tidak menentukan risiko/approval | Scoring risiko tetap deterministik |
| UI | Tailwind CSS v4, server components dahulu | Next.js default; tokens diekspor dari 08-DESIGN |
| Graph/data visual | React Flow (`@xyflow/react`) untuk peta kecil; HTML table untuk perbandingan benchmark | Graph sebagai bukti; jangan pakai chart dekoratif |
| Ikon | `lucide-react`, outline satu gaya | Tanpa emoji |
| Hosting | Vercel atau lokal untuk demo [opsi; deployment belum diwajibkan] | Jangan deploy sebelum deliverable dikonfirmasi |

### Dependency yang disetujui sebagai rencana (bukan terpasang)

`next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@tailwindcss/postcss`, `lucide-react`, `@xyflow/react`, `better-sqlite3`, `zod`, `tsx`, `vitest`, `knip`. Tidak menambah ORM, graph DB server, vector DB, charting, atau wrapper LLM sebelum kebutuhan terukur. `@google/design.md` hanya tooling dokumen desain.

## 2. Perintah Verifikasi (sesudah scaffold)

```powershell
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec knip
pnpm exec tsx scripts/benchmark.ts
```

| Cek | Perintah |
|---|---|
| Dev | `pnpm dev` |
| Seed/compile | `pnpm exec tsx scripts/seed.ts` lalu `pnpm exec tsx scripts/compile.ts` |
| Test | `pnpm test` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Dead code | `pnpm exec knip` |
| Benchmark | `pnpm exec tsx scripts/benchmark.ts` → JSONL aktual |
| Golden demo | Jalankan `pnpm dev`, ikuti 01-PRD §5 dari data ingest sampai query pasca-approval |

Nama script menunggu package scaffold dan harus direalisasikan di `package.json`; jangan klaim siap sebelum itu.

## 3. Skema Context Graph

Implementasi SQLite minimal; properti fleksibel JSON hanya di `attrs`, relasi/fakta inti dinormalisasi.

**Node**: `id`, `type`, `attrs_json`, `valid_from`, `valid_to`, `created_at`, `source_id`, `quote`, `confidence`, `extracted_by`, `synthetic`.

| Label | Properti kunci | Sumber |
|---|---|---|
| Account | `name`, `domain`, `contract_value`, `currency`, `renewal_date` | Metadata SalesTranscriptQA; nilai kontrak/usage overlay sintetis |
| Contact | `name`, `email`, `role`, `valid_from/to` | Metadata/call; alias |
| Opportunity | `stage`, `value`, `close_date` | Metadata dataset; beri label sintetis bila overlay |
| Conversation | `call_id`, `occurred_at`, `text`, `dataset_split` | Calls dataset |
| Signal | `kind`, `severity`, `confidence`, `quote`, `source_id`, `status` | Jev write-time; status active/review/rejected |
| UsageEvent | `metric`, `value`, `period`, `synthetic` | Seed sintetis yang ditandai eksplisit |
| Invoice | `amount`, `currency`, `due_at`, `paid_at`, `synthetic` | Seed sintetis |
| Decision | `action`, `rationale`, `actor`, `created_at`, `outcome`, `source_ids`, `version` | Approval manusia; append-only |
| Evidence | `quote`, `source_id`, `span_start/end`, `occurred_at` | Kutipan asli dan offset |

**Edge**: `HAS_CONTACT`, `HAS_OPPORTUNITY`, `HAS_CONVERSATION`, `MENTIONS`, `HAS_SIGNAL`, `HAS_USAGE`, `HAS_INVOICE`, `ABOUT`, `BASED_ON`, `APPROVED_BY`, `SIMILAR_TO`. Semua edge punya `source_id`, `confidence`, `valid_from`, `valid_to`; edge `BASED_ON` mempertahankan call/time dan kutipan.

**Tabel inti**: `nodes(id PK,type,attrs_json,valid_from,valid_to,created_at,source_id,quote,confidence,extracted_by,synthetic)`; `edges(id PK,src,dst,type,valid_from,valid_to,source_id,confidence)`; `documents(id PK,content_hash,source_type,source_ref,content,synthetic,ingested_at)`; `decisions(id PK,account_id,action,rationale,actor,created_at,source_ids_json,version)`; `jev_runs(id PK,document_id,primitive,model,prompt_version,input_hash,output_json,input_tokens,output_tokens,elapsed_ms,error)`.

Fakta temporal tidak di-overwrite: tutup `valid_to`, tambah node/edge baru. Query `as_of` mengecek rentang valid. `content_hash` + source id mencegah ingest duplikat. Approval disimpan transaksi SQLite append-only; idempotency key unik.

## 4. Pipeline Data

1. **Ingest** calls dan metadata SalesTranscriptQA. Validasi JSONL, source ID, lisensi dan split; idempotency hash.
2. **Chunk** per turn atau 2.000 karakter dengan overlap 20%; simpan offset agar kutipan bisa diverifikasi.
3. **Kandidat entitas** dari metadata; normalisasi nama/domain tanpa merge fuzzy otomatis. Bila kandidat ragu, satu batch `noul` Jev `entity_match`.
4. **Ekstraksi batch Jev** per chunk: noul champion exit, competitor mention, negative sentiment; score urgency 0–3. Pertanyaan berlabel independen; response runtime divalidasi Zod.
5. **Control flow**: noul ≥0,85 tulis; 0,50–0,85 review; <0,50 abaikan. Entity merge ≥0,95 hanya jika tidak ada identifier keras bertentangan; 0,60–0,95 review; <0,60 pisah. Score severity ≥2 dan confidence ≥0,80 tulis; sisanya review. Ambang konfigurasi terpusat di `src/lib/thresholds.ts`.
6. **Graph write** transaksi per dokumen: node/edge, kutipan, confidence, model/prompt version; simpan biaya, latensi dan error. Retry idempotent terbatas; jangan retry 401/403.
7. **Cache** berdasarkan content hash + nama/version model + rubrik version. Cache tidak menggantikan evaluasi; cache hit tercatat.
8. **Cadangan demo**: dataset dan hasil kompilasi terverifikasi lokal; tidak membuat hasil evaluasi palsu. API down → tampilkan cache dengan label, atau jelaskan benchmark tidak dapat dijalankan.

## 4b. Peta Panggilan AI (lensa Jev)

| Titik | Primitif | Input JSON | Control flow / ambang | Evaluasi & eskalasi |
|---|---|---|---|---|
| Champion resign | noul | `{call_id, quote, account_id}` | p≥.85 tulis; .50–.85 review; lainnya discard | 30 label; human review zona tengah |
| Kompetitor disebut | noul | `{call_id, quote}` | sama, simpan kutipan | Precision/recall pada label |
| Sentimen | score 0–3 dengan rubrik | `{call_id, quote, prior_signal?}` | expected score, confidence≥.80 dan score≥2 tulis | 30 label; sensitivitas sinonim |
| Urgensi | score 0–3 | `{call_id, quote, time_context}` | prioritas review; bukan skor churn | 30 label |
| Entity match | noul | `{entity_a, entity_b, domain_a, domain_b}` | ≥.95 merge tanpa konflik identifier; .60–.95 review | 30 pasangan + hard negatives |
| Evidence relevance | score 0–3 | `{question, candidate_chunk}` | skor≥2 dan confidence≥.80 masuk konteks | Same subset/judge; cap 6 chunk kedua arm |
| QA judgment | noul | `{question, reference_answer, answer, evidence}` | threshold .5 untuk label benar/salah | Jev judge; audit referensi dan disagreement manusia |
| Expansion (Should) | noul | `{account, quote}` | p≥.85 sinyal expansion terpisah | 30 label jika waktu tersedia |
| Draft save plan | Generatif, bukan keputusan | `{signals, evidence, precedent}` | output schema; CSM wajib edit/approve | Tidak menilai churn; gagal → template extractive |

- Endpoint: `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`; API key hanya `JEV_API_KEY` dalam `.env.local`, jangan commit.
- Validasi respons Zod; cap concurrency 4 (asumsi konservatif), batch pertanyaan sejenis; 429/5xx retry 3 kali exponential backoff; timeout 60s. Jangan retry auth error.
- Biaya: panggilan + input/output tokens + elapsed ms per primitive/document/question. Rate token harus diambil dari pricing aktual; jangan hardcode asumsi USD.
- Catat model string persis dari response, versi rubrik (`signal-v1`), versi prompt, hash input, split, timestamp. `jev-latest` alias dapat berubah; sebelum benchmark simpan respons dan jalankan ulang eval bila alias berganti.
- Eval primitif: minimal 20–50 contoh berlabel per primitif; target awal H2 PRD. Uji urutan field/sinonim/urutan batch pada subset. Nilai probabilitas confidence calibration dengan bins; jangan menyebut calibrated tanpa bukti.
- Benchmark utama: 50 pertanyaan holdout B2B multi-call [asumsi]; baseline grep dan graph pada corpus, answerer, token/context budget sama; judge Jev sama. Laporkan jawaban tepat, biaya query, biaya kompilasi per pertanyaan amortisasi terpisah, latensi median/p95, retrieved call IDs. Jangan leak source call dari metadata label ke index/retriever.

## 5. Alur Sistem

```text
Call / metadata
 → hash + validasi + chunk
 → Jev primitives (batched)
 → kode: write / review / discard
 → Account—Opportunity—Conversation—Signal—Evidence
 → user asks question
 → SQL recursive traversal / multi-call retrieval
 → Jev relevance score (bila diperlukan)
 → jawaban extractive/generative + bukti + abstain jika bukti tak cukup
 → draf save plan + preseden
 → CSM edit + approve
 → append-only Decision + edges (transaction)
```

**Multi-hop**: `Account → Opportunity → Conversation(t1,t2) → Evidence/Signal`, menampilkan dua call yang melengkapi jawaban. **Preseden**: `Decision → Account → Signal/Outcome`, urut berdasarkan kedekatan fitur yang deterministik; jika pakai Jev similarity, score dan threshold harus tampak.

**Baseline**: grep atas seluruh corpus dan RAG opsional hanya bila sempat; corpus sama, pertanyaan sama, budget jawaban sama. Benchmark utama baseline grep sesuai arahan mentor.

## 6. Data

- Utama: SalesTranscriptQA revision `183bd79178a3555351d25400225001a9b27ecc2f`, B2B multi-call. Data CC BY-NC 4.0 (Salesforce + Endgame Labs attribution); CLI MIT. Hanya dipakai untuk hackathon, tidak didistribusikan ke produk komersial.
- Usage/invoice overlay: 3–5 akun sintetis [asumsi] dengan data sintetis berlabel pada UI dan pitch. Jangan menyajikan sinyal/kontrak overlay seolah berasal dari dataset.
- Benchmark: holdout sample deterministik 50 pertanyaan, seed dan IDs dicatat; semua sumber terindeks agar tidak bocor label.
- Jika dataset fetch gagal, tampilkan subset seed transparan untuk demo, tetapi benchmark tandai tidak representatif/tidak selesai.

## 7. Rencana Build

Task 30–120 menit, owner belum ditentukan. Urutan T1 wajib setup repo + tokens; T2 write-time compile; T3 benchmark.

| ID | Task | Pemilik | Target | Fitur | Selesai bila |
|---|---|---|---|---|---|
| T1 | Scaffold Next.js, SQLite, tokens, nav | — | — | — | Dev/build/test jalan; data schema dan token tersedia |
| T2 | Fetch data, compile Jev signals + entity review | — | — | F1 | Source/hash/citation; 20+ label eval; cost log; seed fallback |
| T3 | Benchmark grep vs graph, Jev judge | — | — | F5 | Same 50 IDs/split, answer, score, cost, p50/p95 JSONL/report; no leakage |
| T4 | Graph queries + evidence path + risk | — | — | F2–F4 | Query multi-call returns two source calls; deterministic formula test |
| T5 | Review/save plan/Decision write-back | — | — | F6 | approve transaction/idempotent; no email sent; next query sees decision |
| T6 | UI screens + responsive + golden path | — | — | all Must | UI states and 375/768/1440 checked; complete demo path |
| T7 | Polish benchmark/pitch/fallback | — | — | pitch | Reproduce numbers, label synthetic data, backup local demo |

Feature freeze: belum ditentukan; tanya panitia/tim.

## 8. Risiko & Cadangan

| Risiko | Cadangan |
|---|---|
| Jev API/credential gagal | Verifikasi health-check awal; cache hasil kompilasi; jangan klaim live call |
| Merge entitas salah | Hard identifiers menang; ragu masuk review; merge audit/undo via alias, bukan hapus node sumber |
| Dataset besar/time limit | Prioritaskan 50 QA dan subset calls yang tetap index seluruh corpus yang disetujui; jika subset korpus dipakai, tandai benchmark eksploratif |
| Benchmark salah/leak | Holdout question IDs; seluruh dokumen tersedia; source IDs emas hanya untuk judge pasca-jawaban |
| Biaya ingest menghapus penghematan query | Laporkan cost/query dan total-cost break-even terpisah |
| Overlay sintetis disangka nyata | Tanda `synthetic` di DB, UI, fixture dan pitch |
| DB write approval ganda | Transaction + unique idempotency key; append-only Decision |
| Model/rubrik berubah | Pin versi rubrik dan simpan output; rerun eval sebelum demo |
| Screenshot gelap sulit dibaca | Token foreground diuji WCAG AA; hijau tidak menjadi satu-satunya pembeda |

## 9. Q&A Keputusan

| # | Pertanyaan | Keputusan | Jam |
|---|---|---|---|
| Q1 | Graph DB khusus atau relational? | SQLite edge table + recursive CTE tercepat; migrasi hanya jika traversal/performa terbukti tidak cukup | 9 Okt |
| Q2 | Deploy wajib? | Belum diketahui; lokal sebagai fallback | 9 Okt |
