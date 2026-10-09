# Product

## Churn Early Warning Graph (KasirNusa)

Dashboard Customer Success untuk PT KasirNusa Teknologi (SaaS POS B2B, fiktif):
mengompilasi 6 sumber data yang tersebar (CRM, email/meeting, product usage, tiket support,
kontrak & billing, log keputusan) menjadi context graph, agar Account Manager mendeteksi
risiko churn lebih awal, melihat jalur bukti lintas sumber, lalu menyetujui tindakan retensi.

- **Pengguna utama:** Account Manager / Customer Success; pembeli: VP Customer Success.
- **Tugas utama:** prioritaskan akun berisiko (fokus C01–C06), pahami bukti dan rupiah yang
  dipertaruhkan, lalu setujui tindakan retensi yang bisa ditelusuri.
- **MVP:** ingest 6 sumber → graph terkompilasi → scoring risiko deterministik → peringkat
  risiko + jalur bukti per akun → tanya-jawab bebas di atas graph (pertanyaan juri live) →
  save plan dengan approval manusia.
- **Di luar scope:** outreach otomatis ke pelanggan, sinkronisasi CRM produksi, fitur di luar
  pertanyaan inti tim (ekspansi/sales) — cukup disebut sebagai keterkaitan lintas track.
- **Mode UI:** Operate — dashboard B2B dark, padat data, fokus tindakan.

Dokumen eksekusi: `docs/09-BUILD-PLAN-KASIRNUSA.md`.
