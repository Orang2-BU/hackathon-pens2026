# 01 — PRD: Tessera untuk KasirNusa

> Status: ACC — QA joko, 9 Okt 2026. Catatan ACC: (1) istilah parameter risiko dan skor prioritas mengikuti usulan ADR-0002, yang masih Proposed; (2) F5/autentikasi cakupan minimal agar tidak memblokir F2–F4; (3) target 22.00 dan deadline resmi masih menunggu klarifikasi (lihat §8). ADR-0001 menerima PostgreSQL untuk demo publik; library koneksi/migrasi, hosting, dan identitas belum dipilih. Sumber data demo: `dataset_kasirnusa/` (15 file data sintetis dan README; ZIP serta ekstraknya diabaikan Git). Snapshot 1 Oktober 2026. Rincian graph dan contoh akun ada di `09-BUILD-PLAN-KASIRNUSA.md`; peta kolom, pengukuran, dan batasan aktual ada di `10-DATA-PROFILE-KASIRNUSA.md`.

## 1. Masalah dan tujuan

Account Manager/CSM KasirNusa perlu menyatukan perubahan pemakaian, tiket, interaksi, relasi champion, kontrak, dan keputusan terdahulu sebelum menentukan akun yang perlu ditangani. Tessera mengompilasi sumber itu menjadi graph bertanggal dengan jalur bukti, menyusun prioritas, dan membantu manusia menyetujui save plan. Fokus penilaian demo: 40 pelanggan, terutama C01–C06; pertanyaan juri baru harus dapat dijawab dari graph tanpa jawaban hardcode.

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
- Jev menilai teks ambigu dengan `noul`/`score` saat ingest. `noul` memberi probabilitas jawaban ya tanpa field confidence terpisah; `score` memberi skor, confidence, dan probabilitas per level. Kode memvalidasi output dan menerapkan ambang write/review/discard; confidence bukan kalibrasi churn.
- Kode menggabungkan **parameter risiko** menjadi skor prioritas 0–100 yang deterministik dan berversi. UI mengutamakan faktor dan level Rendah/Sedang/Tinggi/Kritis; jika angka ditampilkan, labelnya *skor prioritas*. Ini bukan probabilitas churn.
- Bobot percobaan pertama: pemakaian 30%, gangguan layanan 25%, relasi champion 20%, janji dan engagement 15%, pembayaran 10%. Uji C01–C06 dan seluruh 40 pelanggan; periksa bukti, cakupan, kasus offline, serta perubahan peringkat saat bobot digeser. Ambang level dan aturan data kosong menunggu profiling. Data hilang bukan nol; penurunan transaksi akibat gagal sinkron tidak dihitung dua kali.
- Renewal, NPS, dan nilai kontrak adalah konteks urutan tindakan. Jika nilai tertimbang ditampilkan: `nilai_tahunan × skor_prioritas / 100`, berlabel *nilai tertimbang untuk prioritas*, bukan kerugian yang diprediksi.
- Tanpa LLM generatif di MVP (ADR-0005). Pertanyaan bebas dipetakan ke katalog intent oleh Jev (`noul` per intent; kode memilih yang tertinggi di atas ambang), lalu dijawab template dari hasil query SQL graph dengan sitasi node. Draf save plan disusun template dari faktor terkuat dan preseden. Jika intent atau bukti tidak cukup, jawaban abstain dan menyebut pertanyaan yang didukung. Promo/profit/referral hanya dibahas dengan data biaya, margin, outcome, atau relasi yang mendukung; jika tidak ada, nyatakan asumsi tanpa klaim hasil.

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

**Momen wow:** C05 tercatat *Hijau* di health dashboard CRM, tetapi Tessera menaruhnya di level Tinggi dengan flag `mismatch`. Satu klik membuka jalur Tiket → Outlet offline → versi v4.12 → BUG-412, dan satu hop lagi menunjukkan C03 terkena bug yang sama. Dashboard per akun tidak bisa melihat hubungan lintas akun ini.

1. Tunjukkan ingest KasirNusa dan graph terkompilasi: jumlah node/relasi, satu sinyal Jev dengan sumber dan status write/review, serta biaya aktual bila ada.
2. Buka peringkat 40 pelanggan, pilih C01–C06, lalu buka parameter risiko, cakupan data, dan jalur bukti lintas CRM, pemakaian, support, interaksi, kontrak, atau keputusan. Jangan samakan transaksi outlet offline yang tak tersinkron dengan churn pasti.
3. Ajukan pertanyaan baru ke graph; jawaban memakai node/relasi/sumber yang dapat dibuka, atau menyatakan bukti belum cukup.
4. Tinjau draf save plan dan preseden `decision_log`; pengguna terautentikasi menyunting lalu menyetujui/menolak. Tunjukkan Decision baru dapat ditemukan pada pertanyaan berikutnya. Tidak ada email/outreach terkirim.
5. Tunjukkan pendapat pengguna dan tanggapan CSM/admin sebagai feedback terpisah, tanpa mengubah skor atau Decision otomatis.

## 6. Layar

| Layar | Tugas utama |
|---|---|
| Dashboard | Melihat kondisi portofolio sekilas: KPI, sebaran level, renewal 90 hari ke depan, keputusan terbaru (ditambah 9 Okt atas permintaan user, menunggu ACC tim) |
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
- Hosting, identitas, library PostgreSQL, dan LLM diputuskan di ADR-0005 (VPS Docker, akun demo, postgres.js, tanpa LLM dulu). Batas biaya Jev aktual belum diketahui.

## 10. Startup Canvas (Mode Update 9 Okt, menunggu ACC)

### Strategi

| Elemen | Isi |
|---|---|
| Vision | Setiap keputusan retensi KasirNusa bisa ditelusuri ke bukti lintas sumber dan preseden keputusan sebelumnya. |
| Segmen utama | Account Manager/CSM KasirNusa yang memegang 40 pelanggan POS multi-outlet dengan renewal 5 Nov 2026–8 Sep 2027 `[study case]`. Pembeli: VP Customer Success. |
| Pekerjaan (JTBD) | "Setiap Senin, tentukan akun yang harus saya hubungi minggu ini dan apa yang saya tawarkan, lengkap dengan buktinya." |
| Sebelum | Sinyal tersebar di 6 sumber. Health dashboard CRM bisa menyesatkan: C05 dan C01 *Hijau* padahal bermasalah `[study case, 09 §6]`. Cek manual per akun `[asumsi: 20–30 menit/akun; ukur dengan mencatat waktu cek manual C01 saat latihan demo]`. |
| Bagaimana | Graph dikompilasi saat ingest, Jev menilai teks ambigu, kode menghitung parameter dan skor prioritas, setiap faktor punya jalur bukti, approval menjadi Decision. |
| Sesudah | 40 akun terurut di satu layar; setiap akun berisiko punya ≥1 jalur bukti yang bisa dibuka; mismatch dashboard ter-flag; rencana disetujui dengan preseden dikutip. |
| Kenapa context graph | (1) Multi-hop lintas akun: bug → outlet offline → akun lain yang terdampak. (2) Temporal: champion K017 pindah dari C01 ke prospek P01, hanya terlihat lewat riwayat kerja bertanggal. (3) Preseden: `decision_log` (mis. DL-006) dihubungkan ke pola serupa. (4) Memori terstruktur yang diisi banyak panggilan Jev kecil saat ingest, bukan satu chatbot yang membaca ulang semua teks setiap pertanyaan. |
| Alternatif | Health score CRM bawaan; platform CS (Gainsight, ChurnZero, Totango); spreadsheet manual. |
| Pembeda | Jalur bukti per faktor, flag mismatch terhadap dashboard, preseden keputusan dikutip, skor deterministik berversi yang bisa diaudit. |
| Biaya rendah vs nilai unik | Murah: PostgreSQL + Next.js di satu VPS, Jev hanya untuk teks ambigu. Unik: penjelasan lintas sumber yang bisa diperiksa juri secara live. |
| Trade-off | Tidak memprediksi probabilitas churn; tidak mengirim outreach; bobot heuristik; tanpa LLM, pertanyaan di luar katalog intent dijawab abstain. |
| North Star | Jumlah akun level Tinggi/Kritis yang punya rencana disetujui ≥60 hari sebelum renewal. |
| Dibuktikan di demo | Kriteria QA 09 §6 (C03 tiga besar, C05/C01 mismatch, C04 renewal terdekat); pertanyaan baru dijawab atau abstain; Decision ditemukan pada query berikutnya. |
| Cara mendapat pengguna | Pilot internal di tim CS KasirNusa (pengguna = AM/CSM), disponsori VP CS (pembeli). |
| Bangun vs partner | Bangun: compiler graph, scoring, UI. Partner: Jev/TypeSafe untuk klasifikasi teks. |
| Kenapa pemain besar sulit meniru | Platform CS besar menghitung health score dari data yang sudah rapi di sistem mereka dan jarang menunjukkan jalur bukti lintas sumber internal (tiket, bug, rilis, decision log). Mereka bisa meniru; keunggulan kita adalah kecepatan dan explainability di data perusahaan sendiri, bukan teknologi yang tak bisa disalin. |

### Bisnis `[asumsi, belum divalidasi]`

| Elemen | Isi |
|---|---|
| Struktur biaya | VPS 2 vCPU/4 GB ± Rp150–300 rb/bulan `[asumsi: harga VPS lokal]`. Jev: batas atas ±1.000 panggilan per ingest penuh (350 interaksi + 640 tiket `[study case]`, hanya teks yang lolos filter kode); harga per panggilan diisi dari log `jev_runs`, bukan ditebak. |
| Pricing | Rp750 rb per kursi CSM/bulan `[asumsi]`. |
| ROI pelanggan | 3 kursi × Rp750 rb × 12 = Rp27 jt/tahun, lebih kecil dari satu kontrak C01 (Rp149,9 jt `[study case]`). Cukup satu renewal terselamatkan per tahun untuk balik modal. Ini skenario, bukan klaim retensi. |

### Validasi

| Hipotesis berisiko | Cara membuktikan |
|---|---|
| H1. Skor heuristik menempatkan kasus QA dengan benar dan stabil | Test kriteria 09 §6 + tabel sensitivitas: geser tiap bobot ±10 poin, catat perubahan tiga besar |
| H2. Primitif Jev cukup akurat pada teks Indonesia KasirNusa | 30 contoh berlabel per primitif, dilabeli sebelum run; laporkan benar/salah dan N |
| H3. Graph menjawab pertanyaan baru lebih benar dan lebih murah dari baseline | 15–20 pertanyaan ditulis tim sebelum melihat hasil; baseline = health dashboard + `grep` interaksi; dinilai Jev; catat akurasi, biaya, latensi |

### 5 pertanyaan juri tersulit

| Pertanyaan | Jawaban terbaik |
|---|---|
| Kenapa graph, bukan dashboard CRM? | Tunjukkan C05: dashboard Hijau, graph menemukan BUG-412 lewat outlet offline dan akun lain yang kena bug sama. Itu traversal lintas akun. |
| Kenapa tidak satu LLM besar saja? | LLM besar membaca ulang semua teks setiap pertanyaan (mahal, tidak stabil). Kami memakai primitif Jev kecil saat ingest dan menyimpan hasilnya; kode memutuskan dengan ambang. Biaya per pertanyaan tinggal query. |
| Juri bertanya hal baru, padahal tanpa LLM? | Jev memetakan pertanyaan ke katalog intent (`noul` per intent); kode menjalankan query dan menyitasi node. Di luar katalog, sistem abstain dengan jujur dan menunjukkan pertanyaan yang didukung. |
| Apakah skor 82 berarti 82% churn? | Tidak. Itu skor prioritas heuristik berversi; tanpa outcome historis tidak ada kalibrasi. |
| Apa dampak bisnisnya? | Skenario ROI: satu kontrak seperti C01 (Rp149,9 jt) melebihi biaya 3 kursi setahun. Kami tidak mengklaim churn turun; kami memperlihatkan bukti yang selama ini tersembunyi. |

## 9. Riwayat

| Tanggal | Perubahan |
|---|---|
| 9 Okt 2026 | Menyelaraskan PRD ke KasirNusa, parameter risiko, bobot uji, feedback dua arah, dan target 22.00; menggantikan draf SalesTranscriptQA sebagai demo utama |
| 9 Okt 2026 | ACC QA (joko): status disahkan; catatan cakupan MVP F5/autentikasi dan urutan prioritas F1–F4 ditambahkan |
| 9 Okt 2026 | Mode Update (project-setup-01): nama Tessera; tanpa LLM (ADR-0005) dengan router intent Jev; momen wow C05; §10 Startup Canvas, bisnis, hipotesis, pertanyaan juri. Menunggu ACC ulang. |
