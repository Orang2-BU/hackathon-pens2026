# 12 — Task backend Tessera

> Turunan [11-BACKEND-PLAN](11-BACKEND-PLAN.md), 9 Oktober 2026. Backlog eksekusi, belum penugasan owner atau perubahan board `.sokudo`. Kanban tetap sumber owner/status; kolom berikut status bukti pada checkpoint dokumen ini. Referensi `TASK-*` berasal dari peta backlog historis, harus dicocokkan dengan board aktif sebelum dispatch. Workspace terpisah mengikuti permintaan user dan dicatat Proposed pada ADR-0005.

## 1. Urutan kerja

```text
BE-01 kontrak/toolchain
  → BE-02 schema → BE-04 ingest → BE-05 graph → BE-08 scoring → BE-10 query
                → BE-06 Jev → BE-07 review ────────────────┘
                → BE-09 auth ────────────────────┐
BE-03 fixture/eval mendukung semua tahap          ├→ BE-11 plan/Decision → BE-12 feedback
BE-08/09/10/11/12 → BE-13 integrasi → BE-14 deploy → BE-15 QA release → BE-16 organik
```

BE-03 dapat dimulai setelah DTO BE-01 disepakati. Query BE-10 dibangun dengan fixture sebelum Jev live tersedia; koneksi live adalah gate integrasinya. BE-14 berkas deploy dapat disiapkan setelah BE-02/09, tetapi publish menunggu BE-13 dan cek otomatis. Pekerjaan tidak perlu serial semua; pembagian orang mengikuti board, bukan otomatis menjalankan agent baru.

## 2. Backlog dan acceptance

### BE-01 — Kunci kontrak, selaraskan dokumen, buktikan toolchain

- **Trace:** T1; TASK-001/002/004. **Prerequisite:** tidak ada. **Status:** kontrak/toolchain prototype Done pada checkpoint lokal; implementasi canonical belum ada di `backend/`. Milestone T1 menunggu BE-02. Bukti prototype di §6.
- **Output:** DTO `AccountSummary`, `AccountDetail`, `RiskParameter`, `EvidencePackage`, `GraphAnswer`, `PlanRevision`, `Decision`, `Feedback`; error union dan session actor. Tetapkan snapshot/query temporal dan graph revision sesuai 11 §4.
- **Kerja:** verifikasi manifest/lockfile pada runtime lokal; driver `postgres` dipasang BE-02 ketika dibutuhkan. Kunci aturan CLI TypeScript native Node/relative imports dan buktikan impor modul kontrak langsung tanpa transpiler. Bukti `migrate`/`ingest` dalam container dimiliki BE-02/04/14 ketika skrip dan runtime tersedia; BE-01 tidak membuat placeholder atau mengklaim cek container. Selaraskan referensi ADR lengkap, usulan `pg`/Zod, LLM lama, dan lokasi modul. Status ADR Accepted tidak diganti; formula belum dianggap Accepted.
- **Lulus:** toolchain dapat install dengan frozen lockfile; test/build/typecheck/lint/knip baseline dijalankan atau blocker nyata dicatat; UI seed diberi status baseline. Contract review mencakup public fields, missing data, source refs, dan synthetic label.

### BE-02 — Runtime service, PostgreSQL, dan migrasi

- **Trace:** T1/T2; TASK-005. **Prerequisite:** BE-01. **Status:** Blocked untuk acceptance PostgreSQL; service/schema/runner dan unit tests sudah dibuat. Perlu database disposable untuk membuktikan migrasi, checksum/no-op, privileges, dan rollback.
- **Output:** keputusan runtime API, package service dalam `backend/`, endpoint health, koneksi PostgreSQL, migration runner, file SQL dan integration test DB sesuai 11 §5.
- **Kerja:** pilih runtime API sederhana tanpa mengubah frontend; migrator/runtime roles, FK/CHECK/unique/index, SQL binding, advisory lock/checksum, append-only protection, transaksi atomik.
- **Lulus:** service/command berjalan dari `backend/` tanpa import frontend; DB kosong dapat dimigrasikan; run ulang no-op; checksum mismatch gagal aman; runtime tidak bisa UPDATE/DELETE Decision; transaksi gagal rollback; migration tidak berjalan pada request publik. Test memakai DB disposable. Unit HTTP/migration-file checks pass; acceptance DB belum dibuktikan.

### BE-03 — Fixture kecil, QA oracle, eval sebelum model

- **Trace:** T2/T3/T4; TASK-003. **Prerequisite:** DTO BE-01. **Status:** In Progress; 30 intent paraphrases and integrity oracle fixtures exist. Full labeled Jev primitive sets and team label review remain before any live Jev evaluation.
- **Output:** fixture sintetis kecil, parameter oracle dan daftar pertanyaan/label versioned; bukan dataset penuh di Git.
- **Kerja:** pilih contoh C01–C06 dan counterexample dari akun lain; label ≥30 contoh per primitif yang dipakai dan 30 parafrase intent sebelum live run. Tentukan test CSV/JSONL invalid, orphan, temporal, empty/missing dan hard-ID conflict.
- **Lulus:** fixture menguji K017 C01→P01, D-2025-11→FEAT-07, D-2025-02→DL-006, BUG-412 vs BUG-415; malformed/negasi/kutipan historis ada; gold label tidak masuk state model/retrieval. Label/reviewer/version dicatat; belum ada klaim akurasi.

### BE-04 — Parser, staging, ingest 15 file

- **Trace:** T2; TASK-006. **Prerequisite:** BE-02/03. **Status:** In Progress; parser and dry-run are implemented. Publish/staging waits on the BE-02 PostgreSQL integration gate.
- **Output:** `ingest --dir ... --dry-run`, actual ingest, revision/source records, raw usage dan report counts/errors/coverage.
- **Kerja:** allowlist file/schema; parser CSV benar; JSONL per baris; stable record IDs; stream/COPY usage; validate references; transaction publish; unexpected/unknown refs dilaporkan, tidak dibuang diam-diam.
- **Lulus:** counts cocok 11 §4; 40 customer +5 prospect; 620 outlet/226.300 usage; re-ingest identik no duplicate; revisi berubah tidak menghapus sumber lama; invalid file menahan publish; inject failure tidak mengganti published graph. Snapshot cutoff dan blank NULL diuji. Dry-run counts pass; publication/idempotency remain unverified until PostgreSQL is available.

### BE-05 — Hard graph, derivasi, temporal evidence

- **Trace:** T2/T4; TASK-006/010. **Prerequisite:** BE-04. **Status:** In Progress; bounded sourced traversal and temporal oracle implemented. Dataset graph compilation/query integration waits on BE-04 publication.
- **Output:** node/edge per tipe, source refs, temporal query, bounded evidence path.
- **Kerja:** semua relasi minimum 09 §1; employment/champion/owner/reply/feature/precedent; competitor mention hanya pola atau Jev berlabel; BUG-412 derived dengan waktu, versi, offline dan gejala; email historis unresolved masuk laporan.
- **Lulus:** C01/K017/P01 dan janji fitur bisa ditelusuri; C03/C05 berbagi kandidat bug bersumber; versi 4.12 saja tidak menyebabkan false edge; hard-ID conflict tak di-merge. Query Oct 1 tidak memasukkan future events; import Oct 9 tetap terbaca. Cycles/node limit/depth≤4 diuji.

### BE-06 — Client Jev, cache, budget, enrichment dan eval

- **Trace:** T2; TASK-007. **Prerequisite:** BE-02/03; enrichment sesudah BE-04. **Status:** In Progress; typed adapter/cache/retry/chunk code and mocks implemented. Live run is Blocked by missing JEV_API_KEY, PostgreSQL store, and rubric-label review.
- **Output:** typed response validator, versioned rubric, run log/cache, chunk spans, kandidat dan signal write/review/discard; hasil eval aktual.
- **Kerja:** cek quickstart resmi + health-check; batch questions; timeout/retry 429/5xx sementara, tidak retry 401/403; limit concurrency/request/cost; cache hash input/model/rubric; provider result tidak menghitung aritmetika.
- **Lulus:** threshold exact boundary, invalid response/span, negasi, retry dan cache tests hijau; source quote match; review/discard tak aktif. Run pertama fixture/C01–C06 dicatat sebelum full enrichment; report N/error/latency/token/cost aktual. Tanpa credential, status Blocked live; mock test tidak disebut Jev live.

### BE-07 — Human review signal/alias

- **Trace:** T2; TASK-007/010. **Prerequisite:** BE-05/06 dan write auth BE-09 saat integrasi. **Status:** In Progress; deterministic candidate/merge classification is implemented. Persistent review queue/actions wait on DB and BE-09.
- **Output:** daftar review beserta sumber/output model, keputusan review append-only dengan actor/reason.
- **Kerja:** pisahkan active signal dari kandidat; approve/reject persisten; alias merge hanya jika hard-ID guard lolos dan source tetap ada.
- **Lulus:** signal baru aktif hanya setelah approval valid; reject tidak menjadi skor; double submit aman; hard-ID conflict tak dapat diapprove sebagai merge; audit model output asli tetap dapat dibaca. Dampak scoring explicit/versioned, berbeda dari feedback.

### BE-08 — Parameter, formula percobaan, ranking dan sensitivitas

- **Trace:** T3; TASK-008. **Prerequisite:** BE-04/05/03; signal aktif BE-06/07 untuk faktor teks lengkap. **Status:** In Progress (pure experiment + dataset preview implemented; persisted/approved score run still gated by PostgreSQL and reviewed signal integration).
- **Output:** parameter mentah/sumber, fungsi murni scoring, score run 40 akun, level/mismatch/coverage, report sensitivity.
- **Kerja:** windows 90+90 hari persis; blank/baseline zero/partial policy; exclude offline-related usage double count; config normalization/cutoffs/subfactor aggregation; renewal/NPS/value sebagai konteks. Hitungan IDR dan denominator coverage eksplisit.
- **Lulus:** oracle numerik dari data dibanding actual; tidak ada scoring branch khusus C01–C06; C03 tiga besar/C05-C01 mismatch diaudit sebagai hipotesis QA; C04 renewal 35 hari dari Oct 1; missing bukan zero. ±10 poin per bobot renormalized dan top-three changes disimpan. Bila target QA gagal, temuan dicatat dan hipotesis direvisi berversi, bukan hasil di-hardcode.

### BE-09 — Auth, role, origin dan rate limit

- **Trace:** T6; TASK-009. **Prerequisite:** BE-01/02. **Status:** In Progress (single-admin signed session/login prototype tested; action authorization and deployment hardening remain).
- **Output:** login/logout/session helpers, bounded limiter dan protected actions; role demo CSM sesuai ADR stack.
- **Kerja:** env validation, fixed-length timing-safe password digest compare, HMAC session/expiry; HTTP-only/Secure/SameSite; origin/CSRF, proxy/IP policy; input size cap, brute force lock/rate limit; actor dari server.
- **Lulus:** missing/expired/tampered session, salah role/origin, oversized input ditolak; read publik tetap berfungsi; login abuse 429; credential/key tak ada pada client bundle/log. Auth action dan cookie diuji di HTTPS deployment, bukan hanya localhost.

### BE-10 — Read API, katalog intent, graph answer dan sitasi

- **Trace:** T4; TASK-010. **Prerequisite:** BE-05/08/09; BE-06 untuk live router. **Status:** Todo.
- **Output:** read boundaries 11 §8, sepuluh intent, `EvidencePackage`/template answer/abstain; query application Decision.
- **Kerja:** ID/nama resolver (ambiguous → clarification), batch noul router p≥0,70/gap≥0,15, parameter-bound SQL, depth/result/time limits; timestamps/sources/derived labels, redaksi public fields.
- **Lulus:** ≥30 held-out parafrase routing dilaporkan; pertanyaan baru tidak memakai field `account.answer`; unsupported/insufficient evidence abstain; recommendation lintas ≥3 kelompok sumber bila bukti cukup; quote/currency/period cocok. Bad entity/input/SQL-like strings aman. Committed Decision dibaca, rolled-back tidak.

### BE-11 — Draft bersumber, revisi plan, Decision atomik

- **Trace:** T5; TASK-011. **Prerequisite:** BE-09/10. **Status:** Todo.
- **Output:** template draft, preseden, plan revisions, approve/reject transaction dan query Decision.
- **Kerja:** evidence/graph/formula hash; reason deviation; policy diskon >10% diarahkan VP Sales, akun demo tidak berpretensi punya role itu; Decision immutable dan no outreach; key unique actor+idempotency.
- **Lulus:** approve/reject persisten, stale revision/conflicting payload 409, retry same key same Decision, concurrent double submit satu keputusan, forced transaction failure rollback. Reload/restart tidak hilang; query berikutnya menemukan keputusan actual meski snapshot bisnis Oct 1.

### BE-12 — Feedback dua arah persisten

- **Trace:** T5; TASK-012. **Prerequisite:** BE-09/11. **Status:** Todo.
- **Output:** feedback/reply dengan actor, waktu, account/plan context, status tanggapan.
- **Kerja:** plain text escaping/length checks; authenticated submit/reply; context FK dan authorization; tidak menulis ulang skor/fakta/Decision.
- **Lulus:** thread survive refresh/restart; actor dari sesi; invalid context/unauthenticated write ditolak; sebelum/sesudah feedback memiliki score dan Decision identik. Akses pelanggan akhir belum masuk implementasi.

### BE-13 — Sambungkan UI ke backend

- **Trace:** T4/T5/T6; TASK-013. **Prerequisite:** BE-08–12. **Status:** Todo.
- **Output:** Accounts/Detail/Review/Data memakai DTO/database; action forms dan API calls nyata.
- **Kerja:** ganti tiga akun seed, jawaban hardcode, React-state approval; synthetic label/coverage/source; loading/error/empty/partial; flow draft→review→Decision; perbaiki fitur/nav yang tidak cocok PRD seperti Benchmark melalui task frontend terkait.
- **Lulus:** tepat 40 customer; C01–C06 fokus tanpa memalsukan urutan skor global; public read/signed-in write; keputusan/feedback persisten; API failure terlihat. Browser 375/768/1440, keyboard/drawer dan copy English sesuai 08. Ini pekerjaan integrasi frontend, bukan desain ulang.

### BE-14 — Packaging dan deploy ke VPS

- **Trace:** T6; TASK-013/016. **Prerequisite:** backend dan quality gates BE-13; packaging dapat dimulai lebih awal. **Status:** Todo; eksekusi publik Blocked target VPS/env.
- **Output:** Dockerfile/.dockerignore/Compose/.env.example/docs/DEPLOY.md, pinned release image/URL, health dan persistence proof.
- **Kerja:** langkah 11 §9; private dataset read-only mount, DB persistent/internal, role/backup, migration job, HTTPS/reverse proxy, env dan trusted host/IP; release SHA/tag dan rollback non-destructive.
- **Lulus:** image build, Compose validation, migration/ingest di server, readiness 200 hanya saat DB+revision siap; URL diakses dari luar host; Secure cookie/auth/429; restart tidak kehilangan data; port DB/dataset/secrets tidak publik. Jangan menandai Done karena `next dev` atau seed frontend tampil.

### BE-15 — QA release dan bukti golden path

- **Trace:** T6/T7; TASK-014/015. **Prerequisite:** tiap BE task diuji sejak awal; final gate sesudah BE-14. **Status:** Todo.
- **Output:** actual command output ringkas, test database reconciliation, golden path, defect report; timestamp/SHA/runtime/data/formula/rubric/model.
- **Kerja:** test/build/typecheck/lint/knip; parser/graph/temporal/security/concurrency; source paths; auth and DB/provider failure; readiness; duplicate ingest dan offline double count. Untuk change UI jalankan browser matrix. Benchmark opsional tetap terpisah.
- **Lulus:** semua Must acceptance terverifikasi; tidak ada data loss, unauthorized writes atau unsupported factual claim; tiap error diperbaiki pada root cause dan cek relevan diulang; manual checks yang belum dilakukan ditandai Blocked, bukan diasumsikan lulus.

### BE-16 — Testing organik dan handoff

- **Trace:** T6/T7; TASK-016. **Prerequisite:** BE-14/15. **Status:** Todo.
- **Output:** `docs/qa/backend-organic-YYYYMMDD.md` dibuat saat actual run; tester/URL/commit; O01–O15 di 11 §10; issues dan release decision.
- **Kerja:** CSM/operator memakai aplikasi, juri/public mencoba pertanyaan baru dan urutan bebas; real forms/actions; reload/restart/dua tab; tidak mengubah fixture untuk menyamakan expected dengan actual.
- **Lulus:** tiap kasus memiliki expected/actual/PASS-FAIL-BLOCKED dan bukti aman; ≥5 pertanyaan baru didukung, ≥3 unsupported; Decision baru ditemukan sesudah refresh/query; feedback dibalas; persistence restart; tidak ada outreach. User menjalankan sesi manusia bila operator/browser belum tersedia. Temuan ditutup dan regression yang relevan diulang sebelum final demo.

## 3. Definition of Done per task

1. Output dan acceptance terkait ada, tidak sekadar folder kosong atau dokumentasi yang mengatakan Done.
2. Cek sesuai 07-RULES dijalankan; perintah dan hasil aktual dicatat. Test DB/provider dibedakan dari frontend unit test/mock.
3. Evidence/provenance/synthetic label, snapshot, missing data dan auth sesuai kontrak.
4. Board di-update oleh pemilik sesuai proses tim; [04-TODO](04-TODO.md) mendapat bukti milestone. Commit kecil sesuai izin workflow yang berlaku; dataset/secret tidak ikut.
5. Blocker membawa kebutuhan yang tepat, bukan status sukses. Task kompleks dipecah bila melewati timebox 30–120 menit [pedoman workflow; bukan estimasi durasi total build].

## 4. Input eksternal dan blocker

| Kebutuhan | Menghalangi apa | Pekerjaan yang tetap bisa dilakukan |
|---|---|---|
| PostgreSQL test/local dan Docker/native runtime | BE-02 DB integration, actual ingest dan Compose validation | DTO, migration SQL, fixture, pure unit tests dan packaging |
| `JEV_API_KEY`, model/rate/budget tersedia di env server | BE-06 live eval/enrichment, BE-10 live intent | Provider validator/mock, graph hard links, numeric parameters |
| SSH target/user, deploy directory, domain/HTTPS, env VPS | BE-14 deploy publik | Backend lokal, quality gates, runbook dan container files |
| Review hasil normalization/coverage/cutoff | Final level dan klaim ranking | Raw factors dan report eksperimen, score/level nullable bila belum layak |
| Tester CSM/juri atau user yang menjalankan UAT | BE-16 sesi organik manusia | Automated integration dan skenario O01–O15 |

## 5. Bukti checkpoint penyusunan

| Pemeriksaan | Hasil |
|---|---|
| Dokumen scope/architecture/rules/data/Jev/ADR | Dibaca; konflik keputusan historis dicatat pada 11 §2 |
| File dataset/counts/hash/header | 15 file sesuai profil; SHA-256 cocok; seluruh dataset tetap diabaikan Git |
| Source preseden/champion/bug | `D-2025-02` terhubung ke `DL-006`; K017 C01→P01; BUG-412 dan BUG-415 sama-sama versi 4.12 |
| Kode backend/migration/ingest/deploy | Belum tersedia pada checkout yang diperiksa |
| VPS/credential runtime | Belum ditemukan pada konfigurasi/env proyek; target diminta dari user |
| Frozen install | `corepack pnpm install --frozen-lockfile` lulus; pnpm 10.15.0, Node 24.11.0, 410 packages; manifest/lockfile tidak berubah |
| Test | `corepack pnpm test` lulus: 1 file, 4 test seed frontend |
| Build | `corepack pnpm build` lulus: Next.js 16.4.0; hanya route UI, belum route API backend |
| Typecheck | `corepack pnpm typecheck` lulus |
| Lint | `corepack pnpm lint` lulus |
| Dead code | `corepack pnpm exec knip` lulus |
| Dokumentasi | `git diff --check` lulus untuk perubahan tracked; 12 link relatif dari dokumen 11/12 diperiksa, tidak ada target hilang |
| Production HTTP smoke lokal | `corepack pnpm start --hostname 127.0.0.1 --port 3010`; GET `/accounts`, `/accounts/nusa-retail`, `/review`, `/data` → 200. Proses dihentikan setelah pengecekan. HTTP smoke bukan browser/UAT |
| Backend health | GET `/api/health/ready` → 404; endpoint/backend memang belum dibuat, bukan readiness lulus |
| Golden path backend, browser 375/768/1440, Jev live | Belum dijalankan: backend/DB/credential/alat browser atau operator sesi belum tersedia; tidak ada perubahan UI pada task dokumentasi ini |
| Deploy dan testing organik backend | Belum dilakukan: implementasi/runtime/target belum tersedia |

Tabel §5 adalah checkpoint sebelum BE-01. Status task terbaru ada pada §2 dan bukti eksekusinya pada §6; dokumen rencana sendiri bukan alasan memindah task menjadi Done.

## 6. Eksekusi BE-01

- DTO/error/boundary v1 pernah diprototipekan di working tree `frontend/src/server/contracts.ts`; file tersebut tidak termasuk commit backend-only ini. Dokumen [13-BACKEND-CONTRACT](13-BACKEND-CONTRACT.md) adalah spesifikasi; implementasi canonical dan test backend masih perlu dibuat di `backend/`.
- Runtime Node ≥22.18 dan ESM dikunci dalam manifest; driver/DB/provider/auth/route tetap pada task pemilik berikutnya.
- Dokumen 01/02/03/05/Jev Kit/profil data diselaraskan; indeks ADR menjelaskan dua nomor 0003 dan usulan historis tanpa mengubah keputusan Accepted.
- Container/migration/ingest/DB/Jev live/golden path/backend deploy belum termasuk hasil BE-01; diuji oleh task pemilik berikutnya. Tidak ada perubahan UI atau formula scoring. Status ADR Accepted tidak diubah dan tidak ada dependency baru. Hasil cek bawah adalah bukti prototype pada working tree saat checkpoint, bukan verifikasi source backend yang committed.

| Cek | Perintah / bukti | Hasil akhir |
|---|---|---|
| Frozen install | `corepack pnpm install --frozen-lockfile` di frontend | Lulus; lockfile tetap, pnpm 10.15.0 |
| Test | `corepack pnpm test` | Lulus 47/47: 43 contract/boundary + 4 seed frontend, dua file |
| Build | `corepack pnpm build` | Lulus Next.js 16.4.0, type compilation dan route generation |
| Typecheck | `corepack pnpm typecheck` | Lulus `tsc --noEmit` |
| Lint | `corepack pnpm lint` | Lulus |
| Dead code | `corepack pnpm exec knip` | Lulus pada run mandiri setelah build |
| Native CLI contract | Child-process Node import `./contracts.ts` pada test | Lulus tanpa transpiler/alias Next; ESM tanpa module-type warning |
| Public/temporal boundary | Tests tanggal/UTC, import time vs business snapshot, extra-field projection, malformed/oversized/prototype inputs, forged actor/revision, error status union | Lulus; context hanya mengambil public fields dan request tidak memasok actor/time/revision |
| Production smoke | `corepack pnpm start --hostname 127.0.0.1 --port 3010`; GET Accounts/Detail seed/Review/Data | Empat status 200; proses dihentikan. Ini frontend seed, bukan backend golden path |
| Docs | Relative link check dokumen 11/12/13, ADR index, frontend README | 30 link valid; whitespace/diff check dijalankan |

Catatan error selama task: typecheck awal menemukan code/status error union yang kehilangan korelasi akibat object spread; diperbaiki dengan typed error constants, tanpa cast/suppression. Knip pada run paralel dengan build sempat gagal `RangeError: Array buffer allocation failed` di parser dependency; rerun mandiri setelah build lulus tanpa mengubah/suppress pemeriksaan. Error ini dicatat, tidak disajikan sebagai run pertama yang sukses.

## 7. Eksekusi BE-02 (parsial; blocker database)

- ADR-0005/0006 memisahkan workspace dan menetapkan service mandiri `node:http`; storage tetap PostgreSQL/postgres.js. Runtime source berada sepenuhnya di `backend/`.
- Implementasi: health live/readiness, koneksi postgres.js, migration CLI dengan advisory lock, SHA-256/checksum, fail closed bila applied migration hilang/berubah, schema inti, trigger append-only Decision, dan role SQL runtime/migrator.
- Pemeriksaan: `corepack pnpm install` berhasil dengan postgres.js 3.4.9; `corepack pnpm test` lulus 6/6; `corepack pnpm check` lulus (syntax check Node).
- `corepack pnpm test:integration` belum dapat berjalan: `TEST_DATABASE_URL` tidak tersedia; Docker, `psql`, dan PostgreSQL lokal tidak ditemukan. Karena itu migration execution/idempotency/checksum mismatch, privileges runtime, dan rollback belum terverifikasi; BE-02 tetap Blocked, bukan Done.
- Typecheck/build/ESLint/dead-code checker belum dikonfigurasi pada package JavaScript backend; tidak diklaim lulus. Tidak ada perubahan pada source frontend.

## 8. Eksekusi BE-03 (parsial)

- `backend/fixtures/intent-cases-v1.json`: 30 pertanyaan, 10 intent, tiga variasi per intent, label draft/versioned; tidak memuat jawaban gold atau data percakapan mentah.
- `backend/fixtures/integrity-cases-v1.json`: 8 oracle untuk duplikasi, orphan, missing numeric, temporal cutoff, hard-ID conflict, negasi, exact UTF-16 quote span, dan histori.
- Verifikasi `corepack pnpm test` lulus 8/8; `corepack pnpm check` lulus. Tidak ada Jev call dan tidak ada klaim akurasi.
- BE-03 belum Done: rubric-specific 30-sample sets untuk tiap Jev primitive yang nanti dipakai belum tersedia dan label draft perlu konfirmasi tim sebelum evaluasi live.

## 9. Eksekusi BE-04 (parsial; publish menunggu PostgreSQL)

- Parser CSV streaming menangani BOM, CRLF, comma, escaped quote, quoted newline, invalid UTF-8, malformed quote dan batas ukuran field; JSONL diparse per baris dengan schema allowlist.
- `node scripts/ingest.js --dir ../dataset_kasirnusa --dry-run` memeriksa allowlist 15 file, header/schema, primary ID, tanggal/angka, referensi, kecocokan outlet-akun, jumlah baris, SHA-256 per file dan hash revision agregat.
- Run aktual pada dataset lokal mencocokkan semua profil baris: 45 akun, 160 kontak, 217 employment, 22 deal, 10 employee, 350 interaction, 620 outlet, 226.300 usage, 1.178 feature usage, 640 ticket, 4 bug, 3 release, 8 feature, 40 kontrak, 30 decision log. `issueCount=0`, `orphanCount=0`; agregat SHA-256 `1cfe93c48be4cc588a1e6a8e0246d9e58d7fe66b7438e0b7fa575b43940069c5`.
- Test backend lulus 11/11; syntax check lulus. Tidak ada isi dataset yang dimasukkan Git.
- BE-04 belum Done: belum ada staging/publish transaksional atau re-ingest idempotency aktual karena PostgreSQL disposable belum tersedia. Tidak ada Jev call.

## 11. Eksekusi BE-06 (adapter/mocks selesai; live gate blocked)

- API contract dicocokkan dengan [TypeSafe OpenAPI](https://api.typesafe.ai/openapi.json): `POST /v1/systemone`, typed `noul`/`score`/`choice`, response `model`/`answers`/`usage`. Adapter menolak key jawaban/type/probability/token yang malformed.
- `backend/src/jev.js` memakai `fetch` server-side, timeout 60s, retry maksimal dua kali hanya untuk 429/5xx/network, tidak retry 401/403/422, batas request/concurrency/ukuran, versioned cache key dan source-preserving UTF-16 chunks <=2.000 code units.
- `backend/src/jev-store.js` menyimpan hasil valid dan error code minimal; migration `002_jev_cache.sql` menambah cache response dan key model requested. Input teks mentah tidak disimpan di `jev_runs`.
- Test fake response/retry/no-retry/cache/malformed answer/chunk offsets lulus. Keseluruhan backend `corepack pnpm test` lulus 19/19; `corepack pnpm check` lulus.
- `JEV_API_KEY` dan `TEST_DATABASE_URL` tidak tersedia di environment, sehingga tidak ada request provider, live health-check, enrichment, token/cost/latency run, atau DB cache test. Nilai biaya aktual tetap NULL; test mock bukan hasil Jev live. Tidak ada data yang dikirim keluar.

## 12. Eksekusi BE-07 (parsial)

- `backend/src/signals.js` menerapkan batas Noul tepat `>=0.85` active, `0.50–<0.85` review, `<0.50` discarded; Score active hanya confidence `>=0.80` dan severity `>=2`, confidence rendah masuk review.
- Candidate menyimpan model/rubric/run, source ID/hash, deterministik ID/input hash dan kutipan sebagai substring persis dari span UTF-16 sumber. Kutipan model tidak diterima/diciptakan.
- Entity resolution: `>=0.95` merge hanya bila tidak ada konflik hard ID; `0.60–<0.95` review; di bawah terpisah; konflik hard ID selalu blocked.
- Unit test batas, span, ID stabil, merge guard lulus; seluruh backend 23/23; syntax check lulus.
- BE-07 belum Done: persistensi daftar review, append-only actor/reason, idempotency, transisi review, dan audit output provider memerlukan DB disposable serta auth BE-09. Tidak ada UI atau frontend changes.

## 13. Eksekusi BE-08 (parsial; eksperimen numerik)

- `backend/src/scoring.js` menetapkan formula `risk-heuristic-v1` dengan bobot eksperimen pemakaian/layanan/champion/janji-engagement/pembayaran 30/25/20/15/10. Ini parameter indeks risiko, bukan probabilitas churn; level prioritas tetap `null` karena cutoffs belum disetujui.
- `backend/src/dataset-scoring.js` menghitung dua jendela 90 hari sampai 1 Okt 2026, coverage outlet/hari, tiket aktif/umur, status champion dari employment, interaksi eksternal, janji yang terukur, dan keterlambatan pembayaran dari 15 file allowlist. Outlet dengan bukti gangguan sinkronisasi dikeluarkan dari delta pemakaian dan disimpan sebagai bukti pengecualian. Skenario tidak mengklaim dampak profit.
- Preview aktual: `node scripts/score-preview.js --dir ../dataset_kasirnusa`; 40 akun, `synthetic=true`, dataset hash `1cfe93c48be4cc588a1e6a8e0246d9e58d7fe66b7438e0b7fa575b43940069c5`. Tiga teratas eksperimen C01/C05/C03; C03 masuk tiga besar; konteks renewal C04 = 35 hari. Dashboard mismatch sengaja tidak dihitung karena mapping level belum disetujui.
- Sensitivitas mengubah setiap bobot ±10 dan meratakan ulang bobot lain: 10 skenario; perubahan top-three terjadi pada usage +10, promise/engagement ±10. Variasi payment −10 menghasilkan bobot nol yang sah hanya di skenario; konfigurasi dasar seluruh bobot tetap positif. Ini analisis sensitivitas, bukan bukti prediktif.
- `corepack pnpm test` lulus 27/27; `corepack pnpm check` lulus. Preview sukses pada data yang diabaikan Git; tidak ada data mentah/score export yang dikomit.
- BE-08 belum Done: formula, bobot, saturation, dan kebijakan coverage masih perlu review tim; Jev signal belum terintegrasi ke faktor teks; hasil belum dipersistenkan/di-query dari PostgreSQL. Integration DB gate juga tetap menunggu `TEST_DATABASE_URL`. Tidak ada branch khusus C01–C06 dan tidak ada perubahan frontend.

## 14. Eksekusi BE-09 (parsial; sesi demo backend)

- `backend/src/auth.js` menyediakan password comparison constant-time atas digest tetap panjang, signed HMAC-SHA256 session dengan expiry 8 jam, cookie HttpOnly/SameSite=Lax dan Secure di luar mode development, pemeriksaan origin exact, parser cookie, dan rate limiter in-memory berbatas 1.000 key.
- HTTP backend menyediakan `POST /api/auth/login`, `POST /api/auth/logout`, dan `GET /api/auth/session`. Login menolak origin lain, membatasi body JSON 4 KiB, membatasi 5 percobaan per IP/5 menit, dan tidak membuka nilai actor dari client. Env wajib (saat auth diaktifkan): `DEMO_PASSWORD` ≥12 karakter, `SESSION_SECRET` ≥32 bytes, `PUBLIC_ORIGIN` HTTP(S). Placeholder ditambahkan ke `.env.example`; tidak ada secret.
- Test signed/expired/tampered cookie, origin, limiter, login/session/logout lulus; total `corepack pnpm test` 30/30 dan `corepack pnpm check` lulus.
- BE-09 belum Done: belum ada middleware yang melindungi ingest/review/Decision/feedback karena write endpoints belum dibangun; role masih single `admin`, bukan pemetaan actor CSM/admin yang disetujui; CSRF/HTTPS/reverse-proxy/trusted-client-IP/production rate limit belum diverifikasi pada VPS. Auth belum diaktifkan bila tiga env di atas tidak lengkap. Tidak ada frontend changes.

## 10. Eksekusi BE-05 (parsial)

- `backend/src/graph.js` menyediakan traversal terbatas depth 1–4, edge aktif pada `businessAsOf` dengan rentang valid `[validFrom, validTo)`, hop dua arah, cycle guard, status review/rejected tidak aktif, serta provenance/reason untuk edge turunan.
- Batas jumlah jalur maksimum 100; rekomendasi dapat memeriksa cakupan kelompok sumber tanpa menghitung beberapa source dari kelompok yang sama berulang.
- Test synthetic graph mencakup C05→outlet→ticket→BUG-412, edge masa depan, reverse traversal, cycle/depth guard dan derived tanpa provenance; `corepack pnpm test` lulus 14/14; syntax check lulus.
- BE-05 belum Done: belum dikompilasi terhadap seluruh relational dataset, query PostgreSQL, temporal source-facts, atau C01/C03/C05 karena BE-04 belum publish database. Fixture tidak mengklaim hubungan nyata di luar sumber dataset.
