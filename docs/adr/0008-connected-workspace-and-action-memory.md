# ADR-0008 — Workspace terhubung, investigasi, dan memori tindakan

Status: Accepted untuk implementasi workspace sesuai persetujuan pengguna atas handoff pada 10 Oktober 2026. Ini tidak mengesahkan hasil bisnis atau kalibrasi model.

## Konteks

Handoff `HANDOFF-TESSERA-WORKSPACE-2026-10-09.md` dan instruksi pengguna memperluas workspace: graph node/edge yang dapat ditelusuri, skenario pendapatan kontrak, tindakan yang mandek, serta pengalaman profesional yang tetap tersedia setelah pergantian personel. Knowledge berjalan di belakang sistem, tanpa halaman tersendiri.

## Keputusan

- Enam menu tugas: Dashboard, Accounts, Investigate, Actions, Review, Data; detail akun tetap route Accounts. Investigate dan Actions memperluas daftar layar PRD/desain sebelumnya dengan izin pengguna.
- Semua data workspace dibaca dari service backend melalui relay same-origin Next.js. Cookie sesi diverifikasi backend; password dan secret tidak masuk bundle. Dataset lokal hanya lewat CLI operator.
- Investigate menampilkan node, hard/derived edge, status review, waktu, source ID/hash, serta kutipan dengan offset UTF-16. Traversal dibatasi empat hop, 60 node, dan 120 edge per putaran; batas ditampilkan, pengguna dapat melanjutkan dari node tertentu.
- Approval menjadi Decision immutable. Actions terpisah menyimpan owner, tanggal target, status, catatan, serta hasil teramati dalam event append-only. Revisi lama ditolak, dan tindakan selesai memerlukan hasil; tidak ada outreach otomatis.
- Memori menyimpan kondisi terukur, faktor utama, sumber, draf, alasan Decision, aktor, waktu, serta hasil tindakan. Pencarian awal memakai kesamaan faktor terukur utama. Draf boleh mengusulkan adaptasi tindakan sebelumnya, tetapi manusia menilai bukti akun sekarang. Ini retrieval pengalaman, bukan training model, bukti efektivitas, atau pengganti profesional.
- Nilai kontrak tahunan adalah skenario pendapatan yang tidak berlanjut bila kontrak tidak renewal. Nilai tertimbang tetap konteks prioritas, bukan prediksi kerugian/profit. Stuck berasal dari status blocked atau tanggal tindakan yang lewat, terpisah dari skor akun.
- `risk-heuristic-v2` mempertahankan bobot/formula numerik eksperimen. Level operasional mengikuti batas ekspor UI lama: Critical ≥30, High ≥15, Medium ≥11, Low <11. Skor tidak tersedia tetap NULL. Batas ini belum terkalibrasi dan harus diuji pada dataset; run v1 lama tidak diubah diam-diam.
- `kasirnusa-metrics-v2` membaca komitmen fitur dari kolom fitur/status/tanggal, termasuk janji C01 yang tercatat pada keputusan bertipe diskon. Filter lama yang hanya menerima tipe janji_fitur kehilangan bukti tersebut. Versi metrik masuk hash score run agar hasil lama tidak dipakai ulang setelah koreksi.
- Stack, provider, token desain, dan dependency tidak diganti. Jev tetap untuk klasifikasi/router, SQL/kode untuk hitungan dan template; tanpa LLM generatif.

## Verifikasi dan batas

Unit tests, PostgreSQL dengan role runtime terbatas, browser tiga ukuran, dan persistensi lintas refresh menjadi gate implementasi. Test fixture diberi label dan tidak menggantikan ingest 15 file/40 pelanggan KasirNusa. Jev live, benchmark, Docker/VPS, dan hasil bisnis hanya boleh diklaim setelah run aktual. Riwayat pemeriksaan ada di `docs/04-TODO.md`.
