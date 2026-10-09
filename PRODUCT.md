# Product

## Tessera — Churn Early Warning Graph (KasirNusa)

Dashboard Customer Success untuk PT KasirNusa Teknologi (SaaS POS B2B, fiktif):
mengompilasi 6 sumber data yang tersebar (CRM, email/meeting, product usage, tiket support,
kontrak & billing, log keputusan) menjadi context graph, agar Account Manager mendeteksi
risiko churn lebih awal, melihat jalur bukti lintas sumber, lalu menyetujui tindakan retensi.

- **Pengguna utama:** Account Manager / Customer Success; admin juga dapat mengelola data dan persetujuan. Pembeli: VP Customer Success.
- **Tugas utama:** prioritaskan 40 pelanggan (fokus C01–C06) lewat parameter risiko dan bukti,
  pahami nilai kontrak sebagai konteks, lalu setujui tindakan retensi yang bisa ditelusuri.
- **MVP:** ingest 15 file data sintetis dari 6 kelompok sumber → graph terkompilasi → skor prioritas deterministik → peringkat
  risiko + jalur bukti per akun → tanya-jawab bebas di atas graph (pertanyaan juri live) →
  save plan dengan approval manusia. Jev menilai teks ambigu dan memetakan pertanyaan ke intent; jawaban dan draf disusun template dari query graph (tanpa LLM generatif di MVP, ADR-0003).
- **Akses:** pengguna terautentikasi (CSM/admin) dapat ingest dan approve. Pengguna aplikasi dapat memberi pendapat/usulan perbaikan; admin/CSM menanggapi. Feedback tidak otomatis mengubah skor atau Decision. Akses pelanggan akhir masih perlu keputusan produk.
- **Bahasa angka:** tampilkan parameter risiko dan prioritas; bobot awal 30/25/20/15/10 hanya percobaan, bukan probabilitas churn terkalibrasi.
- **Data/demo:** `dataset_kasirnusa.zip` dan `dataset_kasirnusa/` lokal diabaikan Git; demo publik hanya memakai data yang diizinkan. Target pertama yang disampaikan user: 9 Okt 2026 pukul 22.00, jenis deliverable belum jelas; deadline submit resmi belum terkonfirmasi.
- **Di luar scope:** outreach otomatis ke pelanggan, sinkronisasi CRM produksi, fitur di luar
  pertanyaan inti tim (ekspansi/sales) — cukup disebut sebagai keterkaitan lintas track.
- **Mode UI:** Operate — dashboard B2B dark, padat data, fokus tindakan.

Dokumen eksekusi: `docs/09-BUILD-PLAN-KASIRNUSA.md`.
