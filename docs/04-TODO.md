# 04 — TODO: Progres Build KasirNusa

> Perbarui saat status berubah. ID mengikuti `03-ARCHITECTURE.md`. Semua task aplikasi belum dimulai; dokumen dan dataset lokal sudah disiapkan.

**Legenda:** ⬜ Todo · 🟦 In Progress · ✅ Done · ⛔ Blocked · ✂️ Dipotong

**Target pertama:** 9 Okt 2026, 22.00 [dari user; jenis deliverable belum jelas] · **Deadline submit resmi:** belum terkonfirmasi · **Feature freeze:** belum ditetapkan · **Update terakhir:** 9 Okt 2026, profil dataset dan parameter terukur ditambahkan

## Task

| ID | Task | Pemilik | Status | Bukti / kriteria selesai |
|---|---|---|---|---|
| T1 | Scaffold Next.js, koneksi PostgreSQL, desain token, kontrak data | — | 🟦 | Dev/test/build/typecheck/lint/knip tersedia; pilih library/hosting/identitas sebelum dependency berbayar/baru. 9 Okt: `frontend/` Next.js + token export dari 08-DESIGN (`src/app/theme.css`), test/typecheck/lint/knip/build hijau. PostgreSQL dan kontrak data belum. |
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
- Batas biaya Jev aktual (hosting, auth, library DB, dan LLM sudah di ADR-0005).
- Bobot final, ambang level, dan perlakuan data kosong setelah uji dataset.

## Log

| Tanggal | Ringkasan |
|---|---|
| 9 Okt 2026 | ZIP KasirNusa ditemukan (15 file data + README), diekstrak ke `dataset_kasirnusa/`; ZIP dan ekstrak diabaikan Git, ZIP lama dilepas dari indeks tanpa menghapus file lokal. |
| 9 Okt 2026 | Bobot 30/25/20/15/10 dicatat sebagai percobaan; parameter risiko dan prioritas dipisahkan dari probabilitas churn; feedback dua arah dipisahkan dari Decision. |
| 9 Okt 2026 | Dokumen utama diperbarui ke KasirNusa. Belum ada scaffold atau pemeriksaan build; task T1–T7 belum dikerjakan. |
| 9 Okt 2026 | Mode Update: PRD §10 Startup Canvas, momen wow C05, router intent Jev menggantikan LLM, 03 §4c backend detail. Blocker lokal: Docker/PostgreSQL belum terpasang dan `dataset_kasirnusa/` belum ada di laptop dewaaa. |
| 9 Okt 2026 | Nama produk Tessera di semua docs. Stack final ADR-0005: postgres.js, VPS Docker Compose, satu akun demo, tanpa LLM dulu (jawaban/draf dari template query graph). 08-DESIGN mengikuti PRD §6: layar Benchmark dihapus. Frontend masih punya halaman `/benchmark` dan seed non-KasirNusa: dibereskan di T4/T6. |
| 9 Okt 2026 | `git diff --check` lulus. Lint `08-DESIGN.md` belum tersedia: `npx --no-install` melaporkan `@google/design.md` tidak terpasang; belum memasang dependency tanpa izin. |
| 9 Okt 2026 | Profil read-only seluruh 15 file data selesai; peta kolom→parameter, periode 90 hari, batasan NPS/invoice/bug/promo/referral, dan SHA-256 arsip dicatat di `10-DATA-PROFILE-KASIRNUSA.md`. Skor dan benchmark belum dijalankan. |
