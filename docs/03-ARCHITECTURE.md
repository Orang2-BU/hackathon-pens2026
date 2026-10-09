# 03 — ARCHITECTURE & Rencana Build: KasirNusa

> Turunan `01-PRD.md` dan `09-BUILD-PLAN-KASIRNUSA.md`. Produk: **Tessera**. Stack final: ADR-0001 (PostgreSQL), ADR-0003 (postgres.js, VPS Docker, akun demo, tanpa LLM dulu). ADR-0002 (parameter dan penjelasan) masih Proposed. Scaffold frontend ada di `frontend/`.

## 1. Stack dan batas keputusan

| Lapisan | Keputusan / usulan | Catatan |
|---|---|---|
| Web | Next.js 16 App Router, TypeScript strict, pnpm | Di `frontend/`; server lebih dulu; UI ikuti `08-DESIGN.md` |
| Data | PostgreSQL (ADR-0001) via `postgres` (postgres.js) (ADR-0003) | Graph = tabel node/edge/provenance, query SQL + CTE rekursif; migrasi file `.sql` berurutan |
| AI klasifikasi | Jev/TypeSafe | Sinyal teks ambigu saat ingest; output bertipe, ambang dan keputusan di kode |
| Penjelasan & draf | Template deterministik dari hasil query graph (ADR-0003) | Tanpa LLM dulu; jawaban menyebut node/sumber atau abstain. LLM hanya lewat ADR baru |
| UI | Tailwind v4, `lucide-react` (ikon), `@xyflow/react` (graph), `next/font` Inter | Token hasil export `08-DESIGN.md` → `frontend/src/app/theme.css`; dependency baru memerlukan izin |
| Test & kualitas | Vitest, ESLint (next config), `tsc`, knip | Script di `frontend/package.json` |
| Hosting | VPS sendiri, Docker Compose (`web` + `db`) (ADR-0003) | Deploy butuh izin user; read publik diberi rate limit |
| Auth | Satu akun demo: `DEMO_PASSWORD` + cookie sesi HMAC `SESSION_SECRET` (ADR-0003) | Wajib untuk ingest, approve, feedback |
| Env | `DATABASE_URL`, `JEV_API_KEY`, `DEMO_PASSWORD`, `SESSION_SECRET` | `.env` diabaikan Git; `.env.example` tanpa nilai |

Arsip `dataset_kasirnusa.zip` dan hasil ekstrak `dataset_kasirnusa/` diabaikan Git. README menyebut 15 file data sintetis, 40 pelanggan + 5 prospek, histori operasional 1 Okt 2025–30 Sep 2026, snapshot 1 Okt 2026. Peta kolom, cakupan terukur, rumus parameter, dan keterbatasan terdapat di `10-DATA-PROFILE-KASIRNUSA.md`. Jangan commit dataset penuh, secret, atau cache berisi data pelanggan.

## 2. Perintah verifikasi (jalankan di `frontend/`)

| Cek | Perintah |
|---|---|
| Dev | `pnpm dev` |
| Test | `pnpm test` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Dead code | `pnpm exec knip` |
| Golden demo | Jalankan `pnpm dev`, ikuti `01-PRD.md` §5 |
| Benchmark bila retrieval/model berubah | `pnpm exec tsx scripts/benchmark.ts`, simpan output aktual |

Script dev/test/build/typecheck/lint/knip sudah ada; `scripts/benchmark.ts` belum (hanya bila benchmark retrieval dipakai). Jangan klaim cek lulus sebelum dijalankan. UI juga diperiksa di browser 375/768/1440, keyboard, state, dan Standar UI A1–A8. Jika `08-DESIGN.md` berubah, lint design tokens menurut `07-RULES.md`.

## 3. Data dan graph

Enam kelompok sumber berasal dari 15 file data: CRM (`crm_accounts`, `crm_contacts`, riwayat kerja, deals, employees), interaksi JSONL, pemakaian/outlet/fitur, support/bug/rilis, kontrak/billing, dan `decision_log`. Join utama: `account_id`, `contact_id`, `employee_id`, `outlet_id`, `bug_id`, `feature_id`, dan ID interaksi/keputusan. Email historis tidak selalu sama dengan email saat ini; konflik hard ID tidak boleh di-merge otomatis.

Node kandidat: Akun, Outlet, Kontak, Karyawan, Deal, Kontrak, Interaksi, Tiket, Bug, Rilis, Fitur, Keputusan, Kompetitor, Signal, Evidence. Relasi minimal dan contoh C01–C06 dijabarkan di `09-BUILD-PLAN-KASIRNUSA.md`. Setiap fakta/edge menyimpan source ID, waktu, status sintetis, dan bila berasal dari Jev: rubrik, model, confidence, kutipan/span. Hubungan turunan seperti tiket→bug yang tak punya `bug_id` ditandai `derived` dengan alasan dan confidence; jangan menyamakan dengan hard link.

Tabel konseptual: `sources`, `nodes`, `edges`, `signals`, `jev_runs`, `plans`, `decisions`, `feedback`, `feedback_replies`. Skema final menunggu T1. Fakta temporal menambah versi baru; sumber lama tidak dihapus. Hash + source ID mencegah ingest duplikat. Ingest dan approval memakai transaksi; Decision append-only dan idempotency key unik. Feedback menyimpan actor, waktu, konteks, isi/status; reply tersimpan tanpa mengubah Decision/score secara otomatis.

## 4. Pipeline dan skor

1. Baca CSV/JSONL dari direktori lokal yang diabaikan Git; validasi skema, ID, tanggal, encoding, dan duplikasi. Simpan laporan baris, node, edge, error, serta cakupan per akun.
2. Kompilasi hard link dari ID. Ambiguitas teks kecil (niat pindah, keluhan, urgensi, penyebutan kompetitor) dikirim ke Jev dengan rubrik berversi. Validasi respons; tulis/review/discard lewat ambang kode. Kutipan harus cocok source span.
3. Kode/SQL menghitung perubahan transaksi per hari 90 hari terakhir vs 90 hari sebelumnya, tiket terbuka/umur/kaitan bug, champion/decision-maker, janji dan engagement, serta keterlambatan bayar 12 bulan. Pembacaan dilakukan pada snapshot 1 Okt 2026; faktor menyimpan sumber, periode, nilai, status data, dan alasan bila tak tersedia.
4. Bobot uji pertama: pemakaian 30%, gangguan layanan 25%, relasi champion 20%, janji dan engagement 15%, pembayaran 10%. Kode menghasilkan skor prioritas 0–100 dan level, berversi. Ambang level dan aturan data kosong diputuskan setelah profiling; data kosong tidak menjadi nol. Gangguan sinkronisasi ditandai sebagai masalah layanan/kualitas data agar penurunan transaksi tak dihitung dua kali.
5. Renewal, NPS, dan nilai kontrak ditampilkan sebagai konteks. Jika nilai tertimbang digunakan: `nilai_tahunan × skor_prioritas / 100`; tidak boleh disebut prediksi kerugian. Skor tidak disebut probabilitas churn tanpa outcome historis dan kalibrasi.
6. Traversal graph mengembalikan node/relasi/sumber untuk pertanyaan baru. LLM hanya menerima paket fakta terpilih dengan hitungan kode, sumber, kutipan, asumsi, dan preseden Decision. Validasi angka dan sitasi sebelum ditampilkan; tanpa bukti cukup, abstain. Draf save plan disunting pengguna, lalu persetujuan ditulis sebagai Decision.

## 4b. Peta panggilan AI dan evaluasi

| Titik | Primitif/input ringkas | Control flow kode | Evaluasi |
|---|---|---|---|
| Niat pindah/kompetitor/janji belum ditepati/keluhan | Jev `noul` per pertanyaan, satu batch per dokumen (`interactions.jsonl` eksternal + teks tiket), kutipan bersumber | p≥0,85 tulis; 0,50–0,85 review; lainnya abaikan sebagai sinyal aktif | Label contoh KasirNusa, audit false positive/negative |
| Urgensi/berat keluhan, sentimen | Jev `score` 0–3 (urgensi) dan 4 level (sentimen) dengan rubrik | confidence≥0,80 dan skor≥2 tulis; ambigu review | Rubrik dan sampel berlabel berversi |
| Sinyal ekspansi (Should) | Jev `noul` "pelanggan menyebut butuh tambahan outlet/user/fitur?" | p≥0,85 tulis sebagai sinyal peluang, terpisah dari skor risiko | Sampel berlabel; tidak masuk skor prioritas |
| Identitas ambigu | Jev `noul` pasangan entitas + hard identifiers | p≥0,95 dan tanpa konflik ID: merge; 0,60–0,95 review; lainnya pisah | Hard negatives, precision auto-merge |
| Router pertanyaan (tanya graph) | Jev `noul` paralel: `{"question": ...}` × satu pertanyaan per intent di katalog (±10: faktor risiko akun X, akun terdampak bug Y, champion pindah, janji fitur belum ditepati, tiket terbuka, renewal terdekat, preseden diskon/eskalasi, mismatch dashboard, interaksi terakhir, akun pemakai fitur Z) | Ambil p tertinggi; p≥0,70 dan selisih ≥0,15 dari urutan kedua → jalankan query SQL template; entitas (C01, BUG-412, FEAT-07, nama akun) diambil kode lewat pencocokan ID/nama; selain itu abstain dan tampilkan intent yang didukung | 30 pertanyaan parafrase berlabel intent; laporkan akurasi routing dan rasio abstain |
| Penjelasan/save plan | Template deterministik dari faktor terkuat + preseden `decision_log` (ADR-0003) | Kode mengisi angka dan sitasi; manusia approve | Setiap kalimat jawaban punya sitasi node |

Ikuti pola API dan respons di `JEV-KIT.md`, rubrik di `JEV-LENS.md`. Semua provider dipanggil server-side; kunci dari environment. Retry terbatas hanya 429/5xx, bukan 401/403. Catat model string persis, versi rubrik/prompt, input hash, token, latensi, error, dan biaya dengan rate aktual. Confidence Jev adalah output primitif, bukan probabilitas churn dan belum tentu terkalibrasi pada domain ini. Eval primitif minimal 20–50 contoh berlabel per pertanyaan kecil; laporkan ukuran sampel serta kesalahan, tanpa klaim akurasi sebelum run.

Benchmark retrieval, bila dibuat, memakai pertanyaan/korpus/answerer/judge dan budget identik; laporkan biaya query serta ingest/amortisasi terpisah. SalesTranscriptQA boleh menjadi benchmark eksternal terpisah sesuai lisensi, tidak dipakai untuk klaim churn KasirNusa. Pertanyaan live KasirNusa harus dijawab dari graph aktual dan jalur bukti, bukan jawaban hardcode.

### Estimasi panggilan Jev `[asumsi, ganti dengan log]`

Kode menyaring dulu: hanya interaksi eksternal dan tiket berteks yang belum punya hard link yang dikirim. Batas atas ≈ (350 interaksi + 640 tiket) × 2–3 pertanyaan per dokumen, di-batch per id seperti `JEV-KIT.md` §2. Hasil di-cache per hash input, jadi ingest ulang tanpa perubahan = 0 panggilan. Per pertanyaan live: ±10 panggilan router paralel, sisanya SQL.

## 4c. Backend (ADR-0001, ADR-0003)

Tidak ada server terpisah: backend adalah server Next.js yang sama (monolit), cukup untuk satu VPS dan 40 akun.

| Bagian | Pilihan | Alasan |
|---|---|---|
| Read publik | Route Handlers `app/api/*` (GET) + rate limit in-memory per IP | Satu instance VPS; batasnya ditandai `ponytail:` di kode, ganti ke tabel/Redis bila multi-instance |
| Write (login, approve, reject, feedback, reply) | Server Actions dengan `requireSession()` | Form native, tanpa API client tambahan |
| Ingest | Skrip CLI `node scripts/ingest.ts --dir ../dataset_kasirnusa` (Node 22.18+ menjalankan TS langsung) | 226.300 baris usage tidak cocok lewat upload HTTP, dan dataset tidak boleh dikirim ke server publik. Tabel mentah diisi dengan `COPY` postgres.js |
| Migrasi | `db/migrations/NNN_nama.sql` + `node scripts/migrate.ts` (tabel `schema_migrations`) | Tanpa dependency migrasi |
| Akses DB | `src/server/db.ts` mengekspor satu instance `postgres(DATABASE_URL)` | Hanya diimpor dari kode server |
| Jev | `src/server/jev.ts`: `fetch` ke `https://api.typesafe.ai/v1/systemone`, timeout, retry 429/5xx maksimal 2×, tanpa retry 401/403, log ke `jev_runs`, cache per hash input | Pola `JEV-KIT.md` §1 |
| Scoring | `src/server/scoring.ts`: fungsi murni baris faktor → skor 0–100 + level + flag, dengan `FORMULA_VERSION` | Bisa di-test Vitest tanpa DB |
| Graph query | `src/server/graph.ts`: jalur bukti dengan CTE rekursif di `edges`, kedalaman maksimum 4 | Mengembalikan node/edge/source untuk UI dan sitasi |
| Intent | `src/server/intents.ts`: katalog intent → pertanyaan Jev + query SQL template + kalimat template | Satu tempat untuk menambah pertanyaan yang didukung |
| Auth | `src/server/auth.ts`: bandingkan `DEMO_PASSWORD` secara timing-safe; cookie HTTP-only `SameSite=Lax` berisi `exp` + HMAC-SHA256 (`SESSION_SECRET`, Web Crypto) | Tanpa dependency |
| Deploy | `output: "standalone"`, Dockerfile multi-stage, `docker-compose.yml` dengan `web` + `postgres:16` (volume), migrasi saat start | ADR-0003; deploy butuh izin |

**Struktur folder** (di `frontend/`; nama dipertahankan agar riwayat Git tidak pecah): `src/app` (UI + route), `src/server/{db,jev,auth,scoring,graph,intents}.ts`, `db/migrations/*.sql`, `scripts/{migrate,ingest}.ts`.

**Tabel inti:** `sources(id, file, sha256, rows, ingested_at)`; `nodes(id, type, key, props jsonb, valid_from, valid_to, source_id)`; `edges(id, type, src, dst, props jsonb, valid_from, valid_to, derived bool, confidence, source_id)`; `usage_daily` (salinan kolom `product_usage_daily`, agregasi lewat SQL, bukan node per baris); `signals(id, node_id, rubric_version, model, p, outcome, quote, span)`; `jev_runs(id, input_hash, model, latency_ms, tokens, cost, error, created_at)`; `account_factors(account_id, snapshot, formula_version, factor, value, status, evidence jsonb)`; `plans`; `decisions(..., idempotency_key unique)` append-only; `feedback`, `feedback_replies`.

**Prasyarat lokal:** Node ≥22.18, pnpm, PostgreSQL 16 (Docker Desktop atau instalasi native). Per 9 Okt, Docker belum terpasang di laptop dewaaa.

## 5. Hak akses, approval, dan feedback

- Read publik hanya untuk data demo yang diizinkan, dengan rate limit. Jangan tampilkan secret atau dataset di log/client bundle.
- Ingest dan approval: pengguna aplikasi terautentikasi (CSM/Account Manager) atau admin. Endpoint memeriksa peran server-side.
- Approval/reject menambah `Decision` dengan actor, waktu, sumber, versi rencana, dan idempotency key. Tidak mengirim email/outreach.
- Feedback: pengguna aplikasi memberi pendapat/usulan pada akun/rencana; CSM/admin menanggapi. Simpan actor, waktu, konteks, isi/status, dan reply. Feedback tidak otomatis mengubah graph fakta, parameter, skor, atau Decision. Jika yang dimaksud pengguna adalah pelanggan akhir, desain akses baru perlu keputusan tersendiri.

## 6. Rencana build dan QA

ID mengikuti `04-TODO.md`. T1 scaffold dan kontrak data; T2 ingest/graph/Jev; T3 skor dan uji C01–C06 + 40 pelanggan; T4 peringkat/detail/tanya graph; T5 save plan/Decision/feedback; T6 demo publik, verifikasi UI dan golden path; T7 pitch/artefak demo serta benchmark aktual bila dibuat. Setiap perubahan mengikuti `07-RULES.md`.

QA kasus wajib dari `09-BUILD-PLAN-KASIRNUSA.md` §6: C03 dan C05 terkait BUG-412/offline, C01 champion pindah + FEAT-07, C04 renewal dekat, dan semua 40 pelanggan masuk peringkat. Jangan memakai dua akun churn historis sebagai backtest: data tidak memuat outcome Closed Lost renewal yang cukup. Hasil uji dan bobot akhir harus dicatat sebelum klaim demo.

## 7. Keputusan tertunda

Hosting, identitas, library DB, migrasi, dan LLM sudah diputuskan di ADR-0003 dan §4c. Tertunda: batas biaya Jev aktual; ambang level/aturan data kosong; jenis deliverable 9 Okt 22.00 dan deadline submit resmi; apakah feedback dari pengguna aplikasi atau pelanggan akhir. Jangan mengubah ADR Accepted diam-diam; perubahan pilihan penyimpanan perlu ADR baru.
