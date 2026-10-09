# 06 — WORKFLOW: Aturan Main Hackathon

> Golden demo path harus tetap dapat dijalankan. Tiga fitur stabil lebih baik daripada enam fitur setengah jadi.

## 1. Alur per Task

1. Ambil task tertinggi yang tidak terblokir dari `04-TODO`; isi owner; ubah ke 🟦.
2. Baca bagian terkait di `03-ARCHITECTURE`, `01-PRD`, dan `08-DESIGN` untuk UI.
3. Tulis kriteria selesai atau test yang gagal. Implementasikan jalur paling sederhana.
4. Jalankan test terkait lebih dahulu, lalu seluruh pemeriksaan `07-RULES`.
5. Jalankan golden demo path bila task menyentuh ingest, graph, benchmark, risk, approval, atau route utama.
6. Update `04-TODO` dengan bukti aktual. Commit hanya bila user meminta/otorisasi workflow mengizinkan.

## 2. Boleh Jalan Sendiri

- Task yang sudah ada di `04-TODO`, perbaikan error dari perubahan sendiri, dan seed fixture kecil.
- Menjalankan test/build/lint/typecheck/dead-code/design lint serta health-check lokal.
- Mengurangi kode/boilerplate tanpa mengubah perilaku atau scope.

## 3. Wajib Minta Izin

- Dependency baru, pergantian Next.js/SQLite/Jev, graph schema yang mematahkan data, atau perubahan golden path.
- Dataset/provider baru, biaya API di luar kredit, deploy, push, mengirim data/hasil ke layanan eksternal.
- Outreach/email nyata, operasi destruktif, penghapusan dataset/cache besar, atau scope cut.
- Penggunaan data pelanggan nyata; minta konfirmasi izin dan sanitasi dahulu.

## 4. Prioritas dan Timebox

1. T1 setup + token.
2. T2 compile write-time dengan bukti, review, eval kecil.
3. T3 benchmark aktual sebelum UI penuh.
4. T4 query/risk, T5 approval/write-back, T6 UI.
5. T7 pitch/fallback; Should/Could hanya setelah seluruh Must stabil.

Task 30–120 menit. Jika melewati timebox, pilih versi lebih sederhana yang tetap memenuhi kriteria; jangan menambah lapisan baru untuk menyelamatkan desain yang salah.

## 5. Definition of Done

- Kriteria `03-ARCHITECTURE` terpenuhi dan bukti dicatat.
- Test, build, typecheck, lint, dead code hijau.
- Perubahan UI diuji 375/768/1440, keyboard, state, dan A1–A8.
- Golden path masih berjalan; benchmark memakai data/run aktual tanpa angka placeholder.
- Tidak ada secret, data sensitif, dead code, debug log, atau klaim evaluasi yang tidak ditopang file hasil.
- `04-TODO` diperbarui.

## 6. Pembagian Tim yang Disarankan

Setelah skill anggota diketahui: satu owner ingest/Jev, satu graph/benchmark, satu UI/demo/pitch. Schema, fixtures, dan format benchmark disepakati setelah T1 agar ketiganya tidak saling menunggu. Semua anggota wajib dapat menjalankan golden path lokal.

## 7. Konflik Aturan

`07-RULES` > instruksi user > `00-BRIEF` > `01-PRD` > `08-DESIGN` untuk UI > dokumen ini > `03-ARCHITECTURE` > `02-AGENT`.
