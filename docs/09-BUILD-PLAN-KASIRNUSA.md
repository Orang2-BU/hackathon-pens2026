# 09 — BUILD PLAN: Churn Early Warning Graph (KasirNusa)

> Pivot dari Relasi/SalesTranscriptQA ke case resmi panitia: PT KasirNusa Teknologi.
> Baca `AGENTS.md` + `PRODUCT.md`, lalu file ini sebagai sumber eksekusi.
> Prinsip: graph dikompilasi saat ingest (write time). Keputusan = kode deterministik.
> LLM hanya untuk frasa jawaban & draft save plan — tidak pernah untuk skor/keputusan.

## 0. Konteks yang wajib dipegang

- Perusahaan fiktif: PT KasirNusa (SaaS POS B2B, Surabaya). Snapshot data: 1 Okt 2026.
- Tugas tim (Tim 1, CS track): akun C01–C06 — peringkat risiko churn + jalur bukti + tindakan retensi.
- Brief resmi mewajibkan: minimal 3 sumber terhubung; tiap rekomendasi menyebut node/relasi bukti;
  bila rekomendasi menyimpang dari preseden `decision_log`, jelaskan alasannya.
- Penilaian: graph 25%, dampak bisnis 25%, AI reasoning/explainability 20%, eksekusi teknis 20%, UX 10%.
  Demo: juri memberi pertanyaan BARU secara live — jangan hardcode jawaban; graph harus bisa di-query.
- Dataset (15 file, folder `dataset_kasirnusa`): crm_accounts, crm_contacts,
  contact_employment_history, crm_deals, contracts_billing, decision_log, interactions.jsonl,
  outlets, product_usage_daily, feature_usage_monthly, support_tickets, bugs, releases,
  features, employees.

## Jadwal, checkpoint & aturan main (dari TM, 9 Okt 2026)

- Semua tim mulai dari nol; ide seleksi digantikan case ini. Panitia menyediakan data; tim develop aplikasinya.
- **Checkpoint mentoring (ada poin per checkpoint, tidak wajib): CP1 hari ini 14:00–16:00 ·
  CP2 malam ini 20:00–22:00 · CP3 besok 08:00–09:00.** Mentoring menggali pemahaman proses:
  PRD, relationship diagram, skematik — tim wajib bisa menjelaskan desainnya (bukan 100% AI).
- Riwayat commit repo **diperiksa** — commit bertahap per langkah, jangan menumpuk sekali jadi.
- **4 deliverable: PPT, GitHub, demo application (wajib running & bisa diakses), video.**
- Pitching besok: 2 jam untuk 5 tim presentasi.
- Fokus penilaian utama: problem solving, bukan sekadar kecanggihan stack.
- Bonus: poin khusus adopsi teknologi (detail tanyakan ke LO/mentor saat checkpoint).

## 1. Skema graph

Node: `Akun, Outlet, Kontak, Karyawan, Deal, Kontrak, Interaksi, Tiket, Bug, Rilis, Fitur, Keputusan, Kompetitor`

Relasi minimal (nama boleh disesuaikan, makna jangan):
- Akun -MEMILIKI-> Outlet | Kontrak | Deal
- Kontak -BEKERJA_DI-> Akun (jabatan saat ini) ; Kontak -PERNAH_BEKERJA_DI-> Akun/OrgLain (dengan tanggal mulai/selesai)
- Kontak -CHAMPION_DARI-> Akun (dari `champion_contact_id`); turunkan status: aktif / sudah pindah
- Kontak & Karyawan -TERLIBAT_DI-> Interaksi (dari `peserta`, `dari`, `ke` by email match)
- Akun -DIPEGANG_OLEH-> Karyawan (`account_owner_id`); Deal -DIMILIKI_OLEH-> Karyawan (`owner_id`)
- Tiket -DIBUKA_OLEH-> Kontak (`pelapor_contact_id`); Tiket -TERJADI_DI-> Outlet; Tiket -DISEBABKAN_OLEH-> Bug
  (dari `bug_id` bila ada; bila kosong, turunkan dari versi aplikasi + outlet offline + jendela waktu rilis — tandai sebagai relasi `derived` dengan confidence)
- Bug -MUNCUL_DI-> Rilis (versi)
- Keputusan -BERLAKU_UNTUK-> Akun/Deal; Keputusan -DISETUJUI_OLEH-> Karyawan (`diputuskan_oleh`);
  Keputusan -MENJANJIKAN-> Fitur (`fitur_dijanjikan`); Keputusan -DIDASARKAN_PADA-> Interaksi (`bukti_interaction_id`)
- Interaksi -MENYEBUT-> Kompetitor (scan teks: KasirPro, dsb.)
- Akun -MEMAKAI-> Fitur (`feature_usage_monthly`, dengan tren pengguna aktif)

Simpan graph sebagai artefak terkompilasi (mis. `graph.json` / SQLite) hasil ingest — UI & scoring membaca dari situ.

## 2. Scoring risiko (deterministik, per akun, snapshot 1 Okt 2026)

Output per akun: `probabilitas` (desimal 0–1), `level` (Rendah/Sedang/Tinggi/Kritis),
flag boolean per faktor, dan daftar jalur bukti (node→relasi→node) untuk tiap faktor aktif.

Faktor (normalisasi 0–1, bobot awal — tuning boleh, rumus jangan ganti diam-diam):
1. Penurunan usage: Δ transaksi/hari 90 hari terakhir vs 90 hari sebelumnya (per akun).
   Sub-flag terpisah: penurunan terkonsentrasi di outlet offline → catat sebagai "kemungkinan data
   tidak terekam", jangan dihitung dobel sebagai churn murni.
2. Risiko champion: champion sudah pindah (1.0); champion CRM basi (mismatch kontak saat ini);
   decision-maker baru < 6 bulan di akun (0.5).
3. Janji tidak tertunaikan: janji_fitur terbuka dari `decision_log` (jumlah + umur janji),
   fitur yang dipakai akun targetnya bergeser (`target_awal` vs `target_terkini`).
4. Beban tiket: tiket terbuka, tiket 90 hari, tiket terkait bug, rasio belum selesai.
5. Perilaku bayar: `keterlambatan_bayar_12bln` (0 / 1 / 2+).
6. Engagement dingin: hari sejak interaksi terakhir; email renewal tanpa balasan (rantai `membalas_id`).
7. NPS terakhir (rendah = penguat).
8. Kedekatan renewal: hari menuju `tanggal_renewal` sebagai pengganda urgensi.

Plus: `health_score_dashboard` (CRM) vs risiko graph → flag `mismatch` boolean.
Nilai berisiko (Rp) = `nilai_tahunan` kontrak × probabilitas.

## 3. Tindakan retensi

Per akun risiko atas: hasilkan draft tindakan dari faktor terkuat (template deterministik),
wajib cek preseden di `decision_log` (diskon/eskalasi/janji yang pernah disetujui untuk pola serupa)
dan kutip `decision_id`-nya. Bila usulan menyimpang dari preseden, tulis alasan penyimpangannya.
Draft boleh difrasa LLM; keputusan akhir: manusia (CSM) approve/reject → tersimpan append-only.

## 4. Layar aplikasi (Next.js, mode Operate: dark, padat data, satu layar satu tugas)

1. **Peringkat risiko**: 40 akun terurut; C01–C06 terpin; kolom probabilitas, level, Rp berisiko,
   flag mismatch; filter per level.
2. **Detail akun**: visualisasi sub-graph bukti (jalur per faktor bisa di-highlight), breakdown
   faktor + jalur buktinya, timeline (pindah champion, tiket, keputusan, interaksi).
3. **Tanya graph**: input pertanyaan bebas → query terstruktur ke graph → jawaban difrasa LLM
   dengan sitasi node bukti. Ini senjata untuk pertanyaan live juri.
4. **Save plan**: draft tindakan + sitasi preseden → approve/reject (append-only, tercatat siapa & kapan).

## 5. Langkah eksekusi (commit per langkah, jangan ditumpuk)

- S0 — Samakan `01-PRD.md` ke scope KasirNusa (PRODUCT.md sudah dipivot; jangan pakai asumsi SalesTranscriptQA lagi), commit docs.
- S1 — Ingest: 15 file → graph terkompilasi + laporan statistik build (jumlah node/relasi per tipe).
- S2 — Scoring engine + cek validasi (butir 6 di bawah harus lulus).
- S3 — Layar peringkat risiko.
- S4 — Detail akun + visualisasi graph.
- S5 — Tanya graph (query + frasa + sitasi).
- S6 — Save plan + approval append-only.
- S7 — Deploy (demo wajib running & bisa diakses), README cara jalan, seed demo.

Setiap langkah: test/build/typecheck hijau dulu, baru commit. Dataset penuh jangan ikut ke-commit.

## 6. Kriteria lulus QA (dari profiling data 9 Okt 2026)

- C03 masuk 3 besar risiko; jalur buktinya memuat BUG-412: 6 outlet offline di v4.12,
  transaksi tersinkron ~45→5/hari sejak Juli, tiket integrasi/sinkron belum tertaut bug di data mentah.
- C05 ter-flag `mismatch` (dashboard Hijau): pola BUG-412 sama, 6/6 tiket terakhir belum selesai,
  interaksi terakhir 31 Jul.
- C01 menampilkan jalur champion: Rina Hapsari (K017) CHAMPION_DARI C01 → sudah pindah, kini bekerja di prospek P01; plus janji fitur FEAT-07 yang belum tertunaikan dan flag `mismatch` (dashboard Hijau, nilai kontrak Rp149,9 jt, renewal 15 Des 2026).
- C04 ter-flag kedekatan renewal (5 Nov 2026, paling dekat) dengan NPS 6 dan 2x telat bayar — dataset max.
- Peringkat mencakup seluruh 40 pelanggan (bukan hanya 6 fokus); setiap akun berisiko punya minimal satu jalur bukti yang bisa dibuka dari UI.
- Tidak ada klaim backtest dua akun churn: data tidak memuat renewal Closed Lost; preseden kalah yang sah hanya DL-006 (C23, kalah harga dari KasirPro, Mar 2025).
