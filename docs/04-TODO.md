# 04 — TODO: Progres Build KasirNusa

> Perbarui saat status berubah. ID mengikuti `03-ARCHITECTURE.md`. Frontend seed dan kontrak backend BE-01 tersedia; operasi DB dan alur persisten belum diimplementasikan. Rencana backend: [11-BACKEND-PLAN.md](11-BACKEND-PLAN.md); task, dependensi, acceptance dan bukti: [12-BACKEND-TASKS.md](12-BACKEND-TASKS.md); kontrak v1: [13-BACKEND-CONTRACT.md](13-BACKEND-CONTRACT.md).

**Legenda:** ⬜ Todo · 🟦 In Progress · ✅ Done · ⛔ Blocked · ✂️ Dipotong

**Target pertama:** 9 Okt 2026, 22.00 [dari user; jenis deliverable belum jelas] · **Deadline submit resmi:** belum terkonfirmasi · **Feature freeze:** belum ditetapkan · **Update terakhir:** 9 Okt 2026, BE-01 selesai dengan kontrak v1 dan quality gates lokal

## Task

| ID | Task | Pemilik | Status | Bukti / kriteria selesai |
|---|---|---|---|---|
| T1 | Scaffold Next.js, koneksi PostgreSQL, desain token, kontrak data | — | 🟦 | BE-02 membuat service, schema, dan migration runner dalam `backend/`; unit 6/6. Integrasi aktual menunggu PostgreSQL disposable; milestone T1 belum Done. Frontend tidak diubah. |
| T2 | Ingest 15 file KasirNusa, graph temporal, Jev signals, review | — | ⬜ | Statistik baris/node/edge, source/hash, kutipan valid, idempotensi, eval primitif berlabel |
| T3 | Parameter dan skor prioritas deterministik | — | ⬜ | Bobot 30/25/20/15/10 diuji pada C01–C06 dan 40 pelanggan; data kosong/offline jelas; sensitivitas bobot; QA §6 dokumen 09 |
| T4 | Peringkat, detail, tanya graph dengan sitasi | — | ⬜ | Pertanyaan baru dijawab dari graph lewat router intent Jev; jalur bukti ≥3 sumber bila rekomendasi; abstain bila tidak cukup; eval routing 30 pertanyaan berlabel |
| T5 | Save plan, Decision append-only, feedback dua arah | — | ⬜ | Preseden dikutip; approval atomik/idempotent; reply feedback tercatat; tidak ada outreach |
| T6 | Demo publik dan verifikasi UI/golden path | — | 🟦 | Read sesuai izin, write terautentikasi, rate limit, browser 375/768/1440, golden path §5 PRD. 9 Okt: shell + 5 layar sesuai 08-DESIGN, browser 375/768/1440 tanpa scroll horizontal, drawer lulus; data masih seed sintetis (belum KasirNusa). |
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
