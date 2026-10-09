# 01 — PRD: Relasi untuk KasirNusa

> Status: ACC — QA joko, 9 Okt 2026. Catatan ACC: (1) istilah mengikuti ADR-0002 (parameter risiko & skor prioritas, bukan probabilitas churn); (2) F5/autentikasi cakupan minimal agar tidak memblokir F2–F4; (3) target 22.00 dan deadline resmi masih menunggu klarifikasi (lihat §8). Sumber data demo: `dataset_kasirnusa/` (15 file data sintetis dan README; ZIP serta ekstraknya diabaikan Git). Snapshot 1 Oktober 2026. Rincian graph dan contoh akun ada di `09-BUILD-PLAN-KASIRNUSA.md`; peta kolom, pengukuran, dan batasan aktual ada di `10-DATA-PROFILE-KASIRNUSA.md`.

## 1. Masalah dan tujuan

Account Manager/CSM KasirNusa perlu menyatukan perubahan pemakaian, tiket, interaksi, relasi champion, kontrak, dan keputusan terdahulu sebelum menentukan akun yang perlu ditangani. Relasi mengompilasi sumber itu menjadi graph bertanggal dengan jalur bukti, menyusun prioritas, dan membantu manusia menyetujui save plan. Fokus penilaian demo: 40 pelanggan, terutama C01–C06; pertanyaan juri baru harus dapat dijawab dari graph tanpa jawaban hardcode.

Target kerja pertama dari user adalah 9 Oktober 2026 pukul 22.00; jenis deliverable pada jam itu belum jelas. Deadline submit resmi belum terkonfirmasi. Rencana KasirNusa mencatat PPT, GitHub, aplikasi demo yang berjalan dan dapat diakses, serta video sebagai deliverable. Jangan menyamakan target 22.00 dengan tenggat submit resmi.

## 2. Pengguna dan hak akses

| Peran | Kebutuhan dan hak |
|---|---|
| Pengunjung demo publik | Membaca data demo yang diizinkan dan jalur bukti; endpoint publik diberi batas laju |
| Pengguna aplikasi terautentikasi (CSM/Account Manager) | Mengingest data berizin, memeriksa bukti, memberi feedback, menyunting serta menyetujui/menolak rencana |
| Admin | Hak pengguna aplikasi, mengelola akses dan menanggapi feedback |

Feedback dua arah mencatat penulis, waktu, akun/rencana terkait, isi, status, dan tanggapan CSM/admin. Feedback tidak otomatis mengubah parameter, skor, atau `Decision`. Approval menjadi `Decision` append-only, atomik, idempotent, dan tidak mengirim outreach. Akses pelanggan akhir sebagai aktor tersendiri masih perlu keputusan produk.

## 3. Data dan kontrak penalaran

- KasirNusa menyediakan 15 file data sintetis dari enam kelompok sumber: CRM, interaksi email/meeting, pemakaian produk, support, kontrak/billing, dan log keputusan. README menyebut histori operasional 1 Okt 2025–30 Sep 2026; log keputusan/deal lebih panjang. Verifikasi cakupan per akun saat ingest.
- Kode menghitung angka numerik (transaksi per hari, umur tiket/janji, keterlambatan bayar, waktu menuju renewal) dan menyimpan periode, unit, sumber, serta cakupan.
- Jev menilai teks ambigu dengan noul/score saat ingest. Kode memvalidasi output dan memakai ambang write/review/discard; confidence bukan kalibrasi churn.
- Kode menggabungkan **parameter risiko** menjadi skor prioritas 0–100 yang deterministik dan berversi. UI mengutamakan faktor dan level Rendah/Sedang/Tinggi/Kritis; jika angka ditampilkan, labelnya *skor prioritas*. Ini bukan probabilitas churn.
- Bobot percobaan pertama: pemakaian 30%, gangguan layanan 25%, relasi champion 20%, janji dan engagement 15%, pembayaran 10%. Uji C01–C06 dan seluruh 40 pelanggan; periksa bukti, cakupan, kasus offline, serta perubahan peringkat saat bobot digeser. Ambang level dan aturan data kosong menunggu profiling. Data hilang bukan nol; penurunan transaksi akibat gagal sinkron tidak dihitung dua kali.
- Renewal, NPS, dan nilai kontrak adalah konteks urutan tindakan. Jika nilai tertimbang ditampilkan: `nilai_tahunan × skor_prioritas / 100`, berlabel *nilai tertimbang untuk prioritas*, bukan kerugian yang diprediksi.
- LLM menerima paket fakta, hitungan, kutipan, asumsi, dan preseden Decision. Ia memfrasa jawaban, skenario, dan draf tindakan; kode memvalidasi angka/rujukan. Jika bukti kurang, jawaban abstain. Promo/profit/referral hanya dibahas dengan data biaya, margin, outcome, atau relasi yang mendukung; jika tidak ada, nyatakan asumsi tanpa klaim hasil.

## 4. Fitur MVP

| ID | Fitur | Kriteria terima |
|---|---|---|
| F1 | Ingest 15 file → graph terkompilasi | Source ID, waktu, hash, provenance, idempotensi, statistik node/relasi; data penuh tidak masuk Git |
| F2 | Parameter risiko dan peringkat | 40 pelanggan; C01–C06 dapat ditinjau; skor dan jalur bukti deterministik; data kosong/offline jelas |
| F3 | Detail akun dan tanya graph | Jalur minimal tiga sumber untuk rekomendasi; pertanyaan baru dijawab dari graph dengan sitasi atau abstain |
| F4 | Save plan dan preseden | Draf mengutip decision log; penyimpangan preseden dijelaskan; approval menghasilkan Decision append-only |
| F5 | Feedback dua arah | Pengguna aplikasi menyampaikan pendapat; CSM/admin menanggapi; audit waktu/penulis; terpisah dari approval |
| F6 | Demo publik | Read sesuai izin, write memerlukan autentikasi/otorisasi, rate limit; aplikasi berjalan dan dapat diakses saat demo |

**Urutan prioritas MVP (ACC 9 Okt):** F1 → F2 → F3 → F4 diselesaikan lebih dulu. F5 dan autentikasi pada F6 diimplementasikan seminimal mungkin (satu peran terautentikasi demo) selama tidak menggeser empat fitur inti.

SalesTranscriptQA boleh dipakai sebagai benchmark retrieval tambahan dengan izin/lisensi yang sesuai; hasilnya tidak membuktikan prediksi churn KasirNusa. Outcome churn historis dan evaluasi kalibrasi belum tersedia untuk klaim probabilitas.

## 5. Golden Demo Path

1. Tunjukkan ingest KasirNusa dan graph terkompilasi: jumlah node/relasi, satu sinyal Jev dengan sumber dan status write/review, serta biaya aktual bila ada.
2. Buka peringkat 40 pelanggan, pilih C01–C06, lalu buka parameter risiko, cakupan data, dan jalur bukti lintas CRM, pemakaian, support, interaksi, kontrak, atau keputusan. Jangan samakan transaksi outlet offline yang tak tersinkron dengan churn pasti.
3. Ajukan pertanyaan baru ke graph; jawaban memakai node/relasi/sumber yang dapat dibuka, atau menyatakan bukti belum cukup.
4. Tinjau draf save plan dan preseden `decision_log`; pengguna terautentikasi menyunting lalu menyetujui/menolak. Tunjukkan Decision baru dapat ditemukan pada pertanyaan berikutnya. Tidak ada email/outreach terkirim.
5. Tunjukkan pendapat pengguna dan tanggapan CSM/admin sebagai feedback terpisah, tanpa mengubah skor atau Decision otomatis.

## 6. Layar

| Layar | Tugas utama |
|---|---|
| Peringkat risiko | Menentukan akun yang perlu ditinjau dari parameter, prioritas, dan cakupan |
| Detail akun | Memeriksa jalur bukti, timeline, tanya graph, serta rencana tindakan |
| Review/save plan | Mengedit dan memutuskan rencana, melihat preseden dan Decision |
| Data | Melihat sumber, ingest, status Jev, error, dan biaya aktual |

Feedback hadir dalam konteks akun/rencana; jangan menambah halaman kosong. Ikuti `08-DESIGN.md`: satu layar satu tugas, data bersumber, responsif 375/768/1440, tanpa emoji atau elemen dekoratif tanpa fungsi.

## 7. Klaim dan batas MVP

Demo membuktikan kompilasi graph, jalur bukti, jawaban pertanyaan baru, scoring yang dapat diaudit, feedback, dan approval yang tersimpan jika benar-benar diuji. Demo tidak membuktikan churn turun, probabilitas churn terkalibrasi, profit promo, atau referral tanpa data/outcome relevan. Semua angka KasirNusa berasal dari dataset sintetis dan diberi label demikian. Tidak ada outreach nyata, CRM produksi, atau akses pelanggan akhir sampai scope dan otorisasinya diputuskan.

## 8. Pertanyaan terbuka

- Apakah target 9 Okt 22.00 adalah checkpoint, batas fitur utama, atau submit pertama? Apa deadline submit resmi?
- Apakah "user" pemberi pendapat berarti CSM/pengguna aplikasi atau pelanggan akhir yang membutuhkan akun sendiri?
- Setelah uji 40 akun, bobot, ambang level, dan aturan data kosong mana yang disetujui tim?
- Provider hosting, mekanisme identitas, library PostgreSQL, dan batas biaya aktual belum dipilih.

## 9. Riwayat

| Tanggal | Perubahan |
|---|---|
| 9 Okt 2026 | Menyelaraskan PRD ke KasirNusa, parameter risiko, bobot uji, feedback dua arah, dan target 22.00; menggantikan draf SalesTranscriptQA sebagai demo utama |
| 9 Okt 2026 | ACC QA (joko): status disahkan; catatan cakupan MVP F5/autentikasi dan urutan prioritas F1–F4 ditambahkan |
