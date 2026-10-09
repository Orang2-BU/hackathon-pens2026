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
| T4 | Peringkat, detail, tanya graph dengan sitasi | — | ⬜ | Pertanyaan baru dijawab dari graph; jalur bukti ≥3 sumber bila rekomendasi; abstain bila tidak cukup |
| T5 | Save plan, Decision append-only, feedback dua arah | — | ⬜ | Preseden dikutip; approval atomik/idempotent; reply feedback tercatat; tidak ada outreach |
| T6 | Demo publik dan verifikasi UI/golden path | — | 🟦 | Read sesuai izin, write terautentikasi, rate limit, browser 375/768/1440, golden path §5 PRD. 9 Okt: shell + 5 layar sesuai 08-DESIGN, browser 375/768/1440 tanpa scroll horizontal, drawer lulus; data masih seed sintetis (belum KasirNusa). |
| T7 | Pitch, demo assets, benchmark bila dijalankan | — | ⬜ | Angka aktual dan klaim bersumber; PPT/GitHub/video sesuai jadwal resmi; SalesTranscriptQA hanya benchmark terpisah bila dipakai |

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
- Provider hosting, mekanisme autentikasi, library PostgreSQL, batas biaya.
- Bobot final, ambang level, dan perlakuan data kosong setelah uji dataset.

## Log

| Tanggal | Ringkasan |
|---|---|
| 9 Okt 2026 | ZIP KasirNusa ditemukan (15 file data + README), diekstrak ke `dataset_kasirnusa/`; ZIP dan ekstrak diabaikan Git, ZIP lama dilepas dari indeks tanpa menghapus file lokal. |
| 9 Okt 2026 | Bobot 30/25/20/15/10 dicatat sebagai percobaan; parameter risiko dan prioritas dipisahkan dari probabilitas churn; feedback dua arah dipisahkan dari Decision. |
| 9 Okt 2026 | Dokumen utama diperbarui ke KasirNusa. Belum ada scaffold atau pemeriksaan build; task T1–T7 belum dikerjakan. |
| 9 Okt 2026 | `git diff --check` lulus. Lint `08-DESIGN.md` belum tersedia: `npx --no-install` melaporkan `@google/design.md` tidak terpasang; belum memasang dependency tanpa izin. |
| 9 Okt 2026 | Profil read-only seluruh 15 file data selesai; peta kolom→parameter, periode 90 hari, batasan NPS/invoice/bug/promo/referral, dan SHA-256 arsip dicatat di `10-DATA-PROFILE-KASIRNUSA.md`. Skor dan benchmark belum dijalankan. |
