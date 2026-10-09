# ADR-0002: Kontrak parameter, skenario, dan penjelasan Tessera

**Status:** Proposed
**Tanggal:** 9 Oktober 2026

## Context

> Catatan 9 Okt 2026: bagian LLM pada ADR ini ditangguhkan oleh ADR stack (`adr/0003-stack-hosting-auth-llm.md`) (MVP tanpa LLM generatif; penjelasan dan draf dari template). Kontrak parameter tetap berlaku.

Tim ingin Jev dan LLM bekerja bersama untuk menunjukkan risiko akun, alasan, skenario dampak, dan usulan tindakan. `dataset_kasirnusa.zip` tersedia dan telah diekstrak lokal: 15 file data dan README, semuanya sintetis dan diabaikan Git. README menyebut histori operasional 1 Oktober 2025–30 September 2026 dan snapshot 1 Oktober 2026. Kolom transaksi, kontrak, tiket, interaksi, dan keputusan tersedia; validasi isi tiap file serta cakupan per akun masih diperlukan. PRD, arsitektur, dan rencana KasirNusa kini memakai istilah parameter risiko/prioritas; teks lama `probabilitas` tidak lagi menjadi kontrak aplikasi.

## Decision proposed

1. Jev menilai subparameter **fuzzy** dari teks dengan `noul`/`score` dan rubrik berversi. Kode memvalidasi output, menerapkan ambang, dan menahan kasus ragu untuk review.
2. Kode/SQL menghitung subparameter **numerik** dari data mentah, termasuk perubahan pemakaian, umur tiket/janji, keterlambatan bayar, dan hari menuju renewal. Setiap nilai menyimpan periode, unit, sumber, serta status data nyata/sintetis.
3. Istilah untuk pengguna adalah **parameter risiko** (faktor beserta bukti) dan **prioritas** (Rendah/Sedang/Tinggi/Kritis). Kode boleh menghitung skor gabungan 0–100 secara internal, dengan versi formula dan cakupan data; angka yang ditampilkan harus berlabel *skor prioritas*, bukan probabilitas churn. Nilai hilang tidak otomatis bernilai nol. Data transaksi yang mungkin tidak terekam karena outlet offline tidak boleh dihitung dua kali sebagai penurunan pemakaian dan gangguan layanan.
4. Kedekatan renewal dan nilai kontrak ditampilkan sebagai urgensi dan besaran akun, terpisah dari bukti risiko. Jika nilai tertimbang ditampilkan, rumusnya `nilai_tahunan × skor_prioritas / 100` dan labelnya *nilai tertimbang untuk prioritas*, bukan prediksi kerugian.
5. Skenario pendapatan memerlukan seri historis yang relevan; manfaat promo memerlukan biaya, margin, dan bukti efektivitas. Tanpa data tersebut, tampilkan asumsi atau tidak tampilkan nominal. Dampak referral hanya boleh dibahas bila relasi referral tersedia.
6. LLM menerima paket fakta terstruktur, kutipan bersumber, hasil hitungan, asumsi, dan preseden `Decision`. LLM menyusun penjelasan dan draf tindakan; kode memvalidasi angka/rujukan dalam output. Pengguna terautentikasi dengan peran CSM atau admin dapat mengingest dan menyetujui rencana; approval menjadi `Decision` append-only. Tidak ada outreach otomatis.
7. Pendapat atau usulan perbaikan dari pengguna dicatat sebagai `Feedback` bertanggal, dengan penulis, akun/rencana terkait, isi, dan status tanggapan. Admin/CSM dapat menanggapi; umpan balik tidak mengubah parameter, bukti, maupun `Decision` secara otomatis. Alur feedback dua arah ini terpisah dari approval. Untuk demo publik, pembacaan dapat terbuka sesuai izin data; penulisan feedback memerlukan identitas dan batas laju. Akses pelanggan akhir di luar akun pengguna aplikasi perlu keputusan produk tersendiri.

## Parameter candidates for KasirNusa MVP

| Parameter | Subparameter awal | Peran |
|---|---|---|
| Pemakaian | Perubahan transaksi/hari 90 hari vs 90 hari sebelumnya; cakupan outlet; status sinkronisasi | Risiko, bila data lengkap |
| Gangguan layanan | Tiket terbuka dan usianya; kaitan bug/rilis; keluhan eksplisit dari interaksi | Risiko; Jev hanya untuk teks ambigu |
| Relasi champion | Status kerja champion; pergantian pengambil keputusan; niat pindah yang disebut dalam interaksi | Risiko; identitas keras dari data, niat dari Jev |
| Janji dan engagement | Janji fitur yang belum selesai; umur janji; hari sejak interaksi; email renewal tanpa balasan | Risiko/aksi |
| Pembayaran | Keterlambatan bayar dalam 12 bulan | Risiko pendukung |
| Konteks urgensi dan dampak | NPS terakhir tanpa tanggal survei; hari menuju renewal; nilai kontrak. Biaya intervensi belum tersedia | Urutan tindakan/skenario, bukan probabilitas churn |

Bobot percobaan pertama: pemakaian 30%, gangguan layanan 25%, relasi champion 20%, janji dan engagement 15%, pembayaran 10%. Ini hipotesis, bukan bobot yang sudah tervalidasi. Peta kolom, rumus, dan cakupan awal terprofil di `../10-DATA-PROFILE-KASIRNUSA.md`. Jalankan pada C01–C06 dan seluruh 40 pelanggan; periksa jalur bukti, cakupan data, perubahan peringkat saat bobot digeser, serta kasus outlet offline. Tentukan ambang level dan aturan data kosong setelah profiling; bila faktor penting tidak tersedia, tampilkan cakupan dan tahan skor yang tidak dapat dipertanggungjawabkan. Evaluasi SalesTranscriptQA tetap hanya untuk retrieval lintas call jika dataset itu dipakai; tidak memvalidasi prediksi churn atau pendapatan KasirNusa.

## Consequences

- Setiap angka dan kalimat dapat ditelusuri ke sumber, rumus, versi, dan asumsi.
- Implementasi membutuhkan kontrak input/output yang ketat antara Jev, kode, dan LLM.
- Skenario finansial bisa tidak tersedia pada akun yang datanya kurang; UI harus menyatakan alasannya.

## Alternatives rejected for MVP

| Option | Reason |
|---|---|
| Jev/LLM menghitung angka bisnis langsung dari teks mentah | Sulit diuji, dapat menghasilkan aritmetika atau sumber yang tidak cocok. |
| Model churn terkalibrasi | Belum ada bukti label outcome historis dan evaluasi yang memadai. |
| Prediksi profit promo/referral tanpa data biaya dan outcome | Menghasilkan kepastian palsu. |

## Open questions

- Verifikasi per akun: cakupan histori transaksi, billing, promo, margin, referral, dan outcome renewal dalam ZIP. README hanya memastikan rentang operasional keseluruhan.
- Setelah percobaan, bobot, ambang prioritas, dan perlakuan data kosong mana yang disetujui Cecep/tim?
- Jika panitia kelak mewajibkan istilah `probabilitas`, perlu klarifikasi dan bukti outcome/kalibrasi sebelum dipakai sebagai klaim numerik. Saat ini gunakan parameter risiko/prioritas.
- Apakah "user" yang memberi feedback berarti pengguna aplikasi (CSM/admin) atau pelanggan akhir dengan akses sendiri?
