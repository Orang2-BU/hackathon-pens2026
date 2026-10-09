# 04 — TODO: Progres Build KasirNusa

> Kanban adalah sumber status tiket; dokumen ini hanya memetakan milestone T1–T7 ke tiket, bukan sistem status kedua. ID milestone mengikuti `03-ARCHITECTURE.md`. Status berikut adalah snapshot kanban 9 Okt 2026 setelah dispatch.

**Legenda:** ⬜ Todo · 🟦 In Progress · ✅ Done · ⛔ Blocked · ✂️ Dipotong

**Target kerja pertama:** 9 Okt 2026, 22.00 [dari user; bukan deadline resmi dan jenis deliverable belum jelas] · **Deadline submit resmi:** belum terkonfirmasi · **Feature freeze:** belum ditetapkan · **Update terakhir:** 9 Okt 2026, pemetaan T1–T7 ke tiket setelah dispatch

## Task

| ID | Milestone | Tiket Kanban (owner; status saat snapshot) | Batas scope / kriteria selesai |
|---|---|---|---|
| T1 | Fondasi, kontrak data, scaffold minimal | TASK-001 Gatot (In Progress); TASK-002 Rini (In Progress); TASK-004 Sugeng (Backlog) | Perintah dev/test/build/typecheck/lint/knip tersedia setelah scaffold. Dependency baru, hosting, dan identitas menunggu keputusan/izin. Desain/UI tidak termasuk backlog non-frontend ini. |
| T2 | Skema/persistensi, ingest graph temporal, Jev | TASK-005 Bejo (Backlog); TASK-006 Sugeng (Backlog); TASK-007 Tejo (Backlog); QA fixture TASK-003 Jessica (In Progress) | Statistik ingest, provenance/hash, kutipan valid, idempotensi, output Jev bertipe dan evaluasi berlabel. TASK-001/003 yang berjalan adalah kontrak/fixture, bukan implementasi fitur selesai. Sesuai dependensi kanban, setelah prasyarat TASK-005 dan fixture TASK-003 landed, TASK-006 dan TASK-007 dapat dikerjakan paralel. |
| T3 | Parameter dan skor prioritas deterministik | TASK-008 Sugeng (Backlog); QA fixture TASK-003 Jessica (In Progress) | TASK-008 menunggu TASK-006 dan TASK-007; setelah prasyarat masing-masing landed, TASK-008 dan TASK-009 dapat dikerjakan paralel. Uji bobot percobaan 30/25/20/15/10 pada C01–C06 dan 40 pelanggan; jelaskan data kosong/offline, sensitivitas, dan kasus QA §6 dokumen 09. Skor bukan probabilitas churn. |
| T4 | Peringkat, detail, dan tanya graph bersitasi | TASK-010 Sugeng (Backlog); QA fixture TASK-003 Jessica (In Progress) | Pertanyaan baru dijawab dari graph; jalur bukti minimal tiga sumber bila ada rekomendasi; abstain bila bukti tidak cukup. |
| T5 | Save plan, Decision append-only, dan feedback | TASK-011 Tejo (Backlog); TASK-012 Tejo (Backlog); autentikasi prasyarat TASK-009 Tejo (Backlog) | Preseden dikutip; approval atomik/idempotent menjadi Decision baru tanpa outreach; balasan feedback tercatat terpisah dan tidak mengubah skor/Decision otomatis. |
| T6 | Demo publik dan verifikasi alur terintegrasi | TASK-009 Tejo (Backlog); TASK-013 Adit (Backlog); TASK-014 Bimo (Backlog); TASK-015 Jono (Backlog) | Read sesuai izin, write terautentikasi/terotorisasi, rate limit, golden path §5 PRD, lalu review berurutan sesuai gate. **Pekerjaan frontend belum ditugaskan;** tidak ada tiket implementasi UI pada peta non-frontend ini. Uji browser menunggu frontend tersedia. |
| T7 | Paket rilis, pitch, dan benchmark bila dijalankan | TASK-016 Agus (Backlog) | Rencana deliverable mencakup PPT, GitHub, aplikasi demo berjalan/terakses, dan video; jadwal resmi belum dikonfirmasi. Hanya klaim/angka dari run aktual. SalesTranscriptQA tetap benchmark retrieval terpisah bila dipakai. |

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
| 9 Okt 2026 | Kanban setelah dispatch: TASK-001/002/003 In Progress; TASK-004–016 Backlog. Implementasi aplikasi belum dibuktikan selesai. Belum ada scaffold/package manifest/test runner di worktree; perintah build belum tersedia. Pekerjaan frontend belum ditugaskan. |
| 9 Okt 2026 | Peta owner mengikuti board: TASK-004/006/008/010 Sugeng; TASK-007/009/011/012 Tejo; TASK-005 Bejo. Seluruh tiket implementasi tersebut masih Backlog. TASK-006/007 paralel setelah prasyarat, lalu TASK-008/009 paralel setelah dependensi masing-masing. |
| 9 Okt 2026 | `git diff --check` lulus pada perubahan dokumentasi sebelumnya. Design lint dan perintah scaffold belum tersedia; package manifest/dependency belum ada. Jangan perlakukan pemeriksaan lama sebagai hasil untuk perubahan kode. |
| 9 Okt 2026 | Profil read-only seluruh 15 file data selesai; peta kolom→parameter, periode 90 hari, batasan NPS/invoice/bug/promo/referral, dan SHA-256 arsip dicatat di `10-DATA-PROFILE-KASIRNUSA.md`. Skor dan benchmark belum dijalankan. |
