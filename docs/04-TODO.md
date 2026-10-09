# 04 — TODO: Progres Build KasirNusa

> Perbarui saat status berubah. ID mengikuti `03-ARCHITECTURE.md`. Frontend seed dan kontrak backend BE-01 tersedia; operasi DB dan alur persisten belum diimplementasikan. Rencana backend: [11-BACKEND-PLAN.md](11-BACKEND-PLAN.md); task, dependensi, acceptance dan bukti: [12-BACKEND-TASKS.md](12-BACKEND-TASKS.md); kontrak v1: [13-BACKEND-CONTRACT.md](13-BACKEND-CONTRACT.md).

**Legenda:** ⬜ Todo · 🟦 In Progress · ✅ Done · ⛔ Blocked · ✂️ Dipotong

**Target pertama:** 9 Okt 2026, 22.00 [dari user; jenis deliverable belum jelas] · **Deadline submit resmi:** belum terkonfirmasi · **Feature freeze:** belum ditetapkan · **Update terakhir:** BE-11 mengikat formula/faktor plan ke score run yang sama; unit 58/58, PostgreSQL/deploy masih blocked

## Task

| ID | Task | Pemilik | Status | Bukti / kriteria selesai |
|---|---|---|---|---|
| T1 | Scaffold Next.js, koneksi PostgreSQL, desain token, kontrak data | — | 🟦 | BE-02 membuat service, schema, dan migration runner dalam `backend/`; unit 6/6. Integrasi aktual menunggu PostgreSQL disposable; milestone T1 belum Done. Frontend tidak diubah. |
| T2 | Ingest 15 file KasirNusa, graph temporal, Jev signals, review | — | 🟦 | BE-04 parser/dry-run + jalur transactional publish/idempotensi diimplementasikan; dry-run 15 file, 0 issue/orphan. Publish DB belum diuji; graph edges, Jev live, review persistence belum selesai. Bukti 12 §9. |
| T3 | Parameter dan skor prioritas deterministik | — | 🟦 | Eksperimen formula risiko 30/25/20/15/10 dan sensitivitas ±10 diuji pada 40 akun; C03 di tiga besar, renewal C04 35 hari. Belum disetujui, belum ada level/mismatch, sinyal Jev dan hasil DB-persisted; rincian 12 §13. |
| T4 | Peringkat, detail, tanya graph dengan sitasi | — | 🟦 | Query boundary, katalog 10 intent/threshold dan evidence gate tersedia; repository PostgreSQL, Jev live, graph sitasi dan eval reviewed masih pending. Bukti 12 §15. |
| T5 | Save plan, Decision append-only, feedback dua arah | — | 🟦 | Plan/revision/Decision + protected boundary dan feedback thread service ada; DB verification dan akun user/CSM terpisah pending. Tidak ada outreach. Bukti 12 §16–17. |
| T6 | Demo publik dan verifikasi UI/golden path | — | 🟦 | Read sesuai izin, write terautentikasi, rate limit, browser 375/768/1440, golden path §5 PRD. 9 Okt: shell + 5 layar sesuai 08-DESIGN, browser 375/768/1440 tanpa scroll horizontal, drawer lulus; data masih seed sintetis (belum KasirNusa). Backend container scaffold ada, belum build/deploy atau terhubung ke frontend. |
| T7 | Pitch, demo assets, benchmark bila dijalankan | — | ⬜ | Angka aktual dan klaim bersumber; PPT/GitHub/video sesuai jadwal resmi; SalesTranscriptQA hanya benchmark terpisah bila dipakai |

| T8 | Bandingkan dua akun berdampingan | — | ⬜ | Could (A9): faktor dan jalur bukti dua akun dalam satu tampilan |
| T9 | Filter jalur bukti per tipe node | — | ⬜ | Could (A9): sembunyikan/tampilkan Tiket, Interaksi, Keputusan |
| T10 | Tabel sensitivitas bobot | — | ⬜ | Could (A9): geser bobot ±10 poin, lihat perubahan tiga besar (bukti H1 PRD §10) |
| T11 | Sinyal ekspansi | — | ⬜ | Should: Jev `noul` kebutuhan tambahan outlet/user/fitur, ditampilkan terpisah dari risiko |

## Golden Demo Path Check

| Langkah (`01-PRD.md` §5) | Status | Bukti |
|---|---|---|
| 1. Ingest → graph → sinyal Jev bersumber | ⬜ | — |
| 2. Peringkat 40 akun → parameter dan bukti C01–C06 | ⬜ | — |
| 3. Pertanyaan baru → jawaban dengan jalur bukti/abstain | ⬜ | — |
| 4. Save plan → Decision → query berikutnya | ⬜ | — |
| 5. Feedback pengguna → tanggapan admin/CSM | ⬜ | — |

## Keputusan yang masih dibutuhkan

- Jenis deliverable pada target 9 Okt 22.00 dan deadline submit resmi.
- Apakah pemberi feedback adalah pengguna aplikasi (CSM) atau pelanggan akhir yang memerlukan akses tersendiri.
- Apakah API Jev punya tipe `choice` selain `score`/`noul` (cek quickstart typesafe.ai). Jika ada, router intent cukup satu panggilan, bukan ±10 `noul`.
- Batas biaya Jev aktual (hosting, auth, library DB, dan LLM sudah di ADR-0003).
- Bobot final, ambang level, dan perlakuan data kosong setelah uji dataset.

## Log

| Tanggal | Ringkasan |
|---|---|
| 9 Okt 2026 | ZIP KasirNusa ditemukan (15 file data + README), diekstrak ke `dataset_kasirnusa/`; ZIP dan ekstrak diabaikan Git, ZIP lama dilepas dari indeks tanpa menghapus file lokal. |
| 9 Okt 2026 | Bobot 30/25/20/15/10 dicatat sebagai percobaan; parameter risiko dan prioritas dipisahkan dari probabilitas churn; feedback dua arah dipisahkan dari Decision. |
| 9 Okt 2026 | Dokumen utama diperbarui ke KasirNusa. Belum ada scaffold atau pemeriksaan build; task T1–T7 belum dikerjakan. |
| 9 Okt 2026 | Mode Update: PRD §10 Startup Canvas, momen wow C05, router intent Jev menggantikan LLM, 03 §4c backend detail. Blocker lokal: Docker/PostgreSQL belum terpasang dan `dataset_kasirnusa/` belum ada di laptop dewaaa. |
| 9 Okt 2026 | Nama produk Tessera di semua docs. Stack final ADR-0003: postgres.js, VPS Docker Compose, satu akun demo, tanpa LLM dulu (jawaban/draf dari template query graph). 08-DESIGN mengikuti PRD §6: layar Benchmark dihapus. Frontend masih punya halaman `/benchmark` dan seed non-KasirNusa: dibereskan di T4/T6. |
| 9 Okt 2026 | `git diff --check` lulus. Lint `08-DESIGN.md` belum tersedia: `npx --no-install` melaporkan `@google/design.md` tidak terpasang; belum memasang dependency tanpa izin. |
| 9 Okt 2026 | Profil read-only seluruh 15 file data selesai; peta kolom→parameter, periode 90 hari, batasan NPS/invoice/bug/promo/referral, dan SHA-256 arsip dicatat di `10-DATA-PROFILE-KASIRNUSA.md`. Skor dan benchmark belum dijalankan. |
| 9 Okt 2026 | Rencana backend dan BE-01–BE-16 ditulis dari dokumen/kode/dataset aktual, termasuk deployment VPS dan pengujian organik O01–O15. Seluruh task implementasi masih Todo; target VPS/env belum tersedia. Counts/hash dataset diverifikasi ulang; `DL-006` adalah deal, Decision terkait `D-2025-02`. |
| 9 Okt 2026 | Frozen install berhasil; test frontend 4/4, build, typecheck, lint, knip lulus. Production HTTP smoke lokal empat halaman → 200; `/api/health/ready` → 404 karena backend belum ada. Ini bukan hasil deploy/UAT backend; bukti di dokumen 12. |
| 9 Okt 2026 | BE-01 selesai: kontrak DTO/API v1, validasi input/temporal/error dan native Node TS, Node engine/ESM, indeks ADR dan dokumen stack/Jev selaras. Test 47/47, build, typecheck, lint, knip (rerun mandiri sesudah allocation failure paralel), empat HTTP seed route →200. DB/Jev live/golden path/deploy belum diuji; bukti lengkap 12 §6. |
| 9 Okt 2026 | Workspace root `backend/` diminta user agar backend dipisahkan dan frontend tidak dikerjakan. README workspace + ADR-0005 Proposed ditambahkan. Pilihan API runtime belum dibuat; folder frontend tidak masuk commit. |
| 9 Okt 2026 | BE-02 parsial: Node HTTP service, health endpoints, PostgreSQL schema/migration runner dan role boundary dibuat; unit 6/6 + syntax check lulus. Integration DB terblokir karena tidak ada Docker/psql/PostgreSQL atau TEST_DATABASE_URL. Runtime diputuskan pada ADR-0006; source frontend tidak disentuh. |
| 9 Okt 2026 | BE-03 parsial: 30 pertanyaan intent untuk 10 kategori dan 8 fixture integrity tersedia, versi dan status draft tercatat. Unit 8/8. Rubric-specific Jev label sets dan konfirmasi tim belum ada; tidak ada Jev call atau akurasi yang diklaim. |
| 9 Okt 2026 | BE-04 parsial: streaming parser/dry-run memvalidasi seluruh dataset lokal (15 file; expected counts; 0 issue/orphan). Belum ada database staging/publish/idempotency; tidak ada data mentah masuk Git. |
| 9 Okt 2026 | BE-05 parsial: traversal graph murni dengan batas waktu/depth/cycle/provenance dan synthetic tests 14/14. Kompilasi/query graph dari dataset masih menunggu BE-04 dan PostgreSQL. |
| 9 Okt 2026 | BE-06 adapter/mock parsial: Jev API contract official diverifikasi; response validation, server fetch, retry, cache interface dan UTF-16 chunks diuji (backend 19/19). JEV_API_KEY dan TEST_DATABASE_URL tidak tersedia; live run/provider cost tidak diklaim. |
| 9 Okt 2026 | BE-07 parsial: threshold Noul/Score, exact source span, idempotent candidate ID dan hard-ID merge guard diuji; total 23/23. Review persistence/auth masih menunggu DB + BE-09. |
| 9 Okt 2026 | BE-08 parsial: formula eksperimen indeks risiko, data preview 40 akun, coverage/missing handling dan 10 sensitivitas; tests 27/27 + syntax check. Tidak mengklaim probabilitas churn; level/mismatch dan persetujuan bobot ditunda. Bukti 12 §13. |
| 9 Okt 2026 | BE-09 parsial: sesi HMAC, login/logout, validasi Origin dan rate limit bounded diuji; total backend 30/30 + syntax check. Write-action authorization, role mapping final, dan verifikasi HTTPS/proxy masih belum ada. Bukti 12 §14. |
| 9 Okt 2026 | BE-10 parsial: API read/query boundary, intent threshold, entity ambiguity dan citation abstain diuji; total backend 33/33 + syntax check. Jev live/DB query belum berjalan. Bukti 12 §15. |
| 9 Okt 2026 | BE-11 parsial: plan revision, Decision idempotency/context dan protected write boundary; backend 36/36 + syntax check. Transaction/concurrency DB gate belum dijalankan. Bukti 12 §16. |
| 9 Okt 2026 | BE-12 parsial: submit/reply/list feedback berbasis sesi; total backend 38/38 + syntax check. DB persistence dan akun CSM/user terpisah belum terverifikasi. Bukti 12 §17. |
| 9 Okt 2026 | BE-13 tidak disentuh sesuai scope backend-only. BE-14 Docker/Compose/runbook ditambahkan; Docker/target VPS tak tersedia, BE-04 ingest/publish belum ada, jadi tidak deploy. BE-15 unit/syntax checks saja (38/38); BE-16 organik belum mungkin tanpa deploy dan tester. Bukti 12 §18. |
| 9 Okt 2026 | BE-15 gate diulang setelah privilege/migration changes: unit 38/38, syntax check, migration discovery 001/002/003 lulus; `test:integration` berjalan dan berhenti karena `TEST_DATABASE_URL` tidak ada. BE-16 tetap blocked; tidak ada sesi user/deploy yang diklaim. |
| 9 Okt 2026 | BE-04 publish path ditambahkan: preflight, revision hash/idempotency, batch source/node/usage persistence dan atomic publish/rollback path. Unit backend 41/41, syntax check, dry-run data aktual 15 file, 0 issue/orphan. PostgreSQL integration belum tersedia. |
| 9 Okt 2026 | BE-05 graph compiler: unit backend 44/44 + static check; preview read-only 14 file menghasilkan 4.140 hard edges, 1.398 facts, dan 5 kandidat BUG-412 review-only (C03/C05, masing-masing 4 sumber). PostgreSQL compile/persistence/rerun belum diverifikasi. |
| 9 Okt 2026 | BE-07 review signal: service transactional/idempotent, migration 004, queue dan admin-only review endpoint. Backend unit 46/46 + static/syntax checks lulus; integration gagal sebelum tes karena `TEST_DATABASE_URL` belum disediakan. Kandidat hasil Jev belum terhubung ke ingest. |
| 9 Okt 2026 | BE-10 read repository: account list/detail dan explicit sourced evidence projection ditambahkan; unknown account 404 dan query graph abstain ketika router Jev belum ada. Backend unit 48/48 + static/syntax check lulus. PostgreSQL query/live Jev/eval masih belum diverifikasi. |
| 9 Okt 2026 | BE-15 checkpoint setelah BE-05/07/10: backend unit 48/48, `check`, syntax, dan migration discovery 001–004 lulus. Integration berhenti sebelum tes karena `TEST_DATABASE_URL` kosong. Docker serta DATABASE/Jev/deployment credentials tidak tersedia; BE-14 deploy dan BE-16 organik belum dapat dijalankan, bukan dinyatakan lulus. |
| 9 Okt 2026 | BE-11 context/repository completion: plan service derive context/formula/evidence hash server-side; write routes wired; account detail reads plan revision + Decision history. Dataset node ID validation fixed. Backend unit 51/51 + static/syntax checks pass; PostgreSQL transactions still unverified. |
| 9 Okt 2026 | BE-06 enrichment: Jev run IDs now survive cache hits; explicit bounded CLI writes provenance-backed signal candidates from interaction chunks, all gated in review until approval. Added integration coverage for DB persistence/review and isolated Compose enrichment profile. Backend 53/53 + static/syntax/scope checks pass; no Jev key or DB URL, so provider/DB integration was not executed. |
| 9 Okt 2026 | BE-07 provenance: migration 005 stores signal source record/hash/field; protected review queue now projects citation, model/rubric, and typed Jev output. Backend 54/54 + static/syntax checks pass; PostgreSQL integration remains unrun. |
| 9 Okt 2026 | BE-06 rubric correction: urgency now uses Score 0–3; sentiment uses Choice positive/neutral/negative/mixed; Noul remains for champion exit/competitor/expansion. Threshold tests + typed enrichment mocks pass 55/55; no live provider request. |
| 9 Okt 2026 | BE-10 account ranking excludes prospect nodes; actual local CSV check confirms 40 `pelanggan` + 5 `prospek`. Unit/static checks 56/56; actual DB ranking query remains unverified. |
| 9 Okt 2026 | BE-08 score persistence: migration 006 + hash-versioned transaction writes 40 results/200 factors; explicit CLI and isolated scoring profile added. Actual local preview remains C01/C05/C03, C04 renewal 35d, 10 sensitivity scenarios. Backend tests 58/58 + check/syntax pass; DB integration unavailable. |
| 9 Okt 2026 | BE-10 scoring read projection: account list/detail now join latest revision score run, include formula/status/coverage/evidence parameter run and weighted value, and sort by persisted risk/weighted value. Unscored fallback retained. Unit 58/58 + check/syntax/diff pass; PostgreSQL query still unverified. |
| 9 Okt 2026 | BE-09 auth hardening test: a non-admin claim signed with the valid HMAC secret is still rejected; actor/origin/session route checks remain covered. Unit 58/58 + check/syntax pass. Single demo-admin only; CSM/user roles, two-way feedback authorization, HTTPS/proxy, and distributed limiter remain unresolved/undeployed. |
| 9 Okt 2026 | BE-11 consistency fix: server-derived plan context now hashes factor evidence only from the latest score run used for its formula version; mock test asserts run scoping. Unit 58/58 + check/syntax/diff pass; PostgreSQL transaction checks still unavailable. |
