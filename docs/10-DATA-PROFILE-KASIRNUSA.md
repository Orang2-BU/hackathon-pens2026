# 10 — Profil data dan parameter terukur KasirNusa

> Profil read-only dari `dataset_kasirnusa/` hasil ekstrak `dataset_kasirnusa.zip`, 9 Okt 2026. Semua data sintetis. SHA-256 ZIP: `966AF06DD5D59A2565FD11622C28193955200DF5CF1C610246134D1214309E48`. Snapshot analisis: **1 Okt 2026**; nilai setelah tanggal itu tidak dipakai untuk skor pada snapshot ini. Angka di bawah adalah hitungan file, bukan hasil scoring, evaluasi Jev, atau bukti churn nyata.

## Cakupan sumber

| File | Baris | Kolom yang dipakai dan catatan |
|---|---:|---|
| `crm_accounts.csv` | 45 | `account_id`, `tipe`, `champion_contact_id`, `nps_terakhir`, `health_score_dashboard`; 40 pelanggan + 5 prospek; NPS/health/champion kosong pada 5 prospek |
| `crm_contacts.csv` | 160 | `contact_id`, `account_id_saat_ini`, `jabatan_saat_ini`, `email` untuk identitas saat ini |
| `contact_employment_history.csv` | 217 | `contact_id`, `account_id`, `mulai`, `selesai`, `organisasi`; 160 baris `selesai` kosong berarti masih menjabat menurut riwayat |
| `crm_deals.csv` | 22 | `account_id`, `tipe`, `stage`, `stage_sejak`, `alasan_kalah`; satu Closed Lost adalah deal **baru** C23, bukan renewal churn |
| `contracts_billing.csv` | 40 | `account_id`, `tanggal_renewal`, `nilai_tahunan`, `diskon_pct`, `keterlambatan_bayar_12bln`; renewal 5 Nov 2026–8 Sep 2027 |
| `decision_log.csv` | 30 | `decision_id`, `tanggal`, `tipe`, `keputusan`, `bukti_interaction_id`, `fitur_dijanjikan`, `status_janji`; 3 baris punya status janji fitur |
| `interactions.jsonl` | 350 | `interaction_id`, `tanggal`, `tipe`, `account_id`, `dari`, `ke`, `peserta`, `isi`, `membalas_id`; 275 email, 4 email internal, 71 catatan meeting; 111 punya `membalas_id`; 1 tanpa `account_id` |
| `outlets.csv` | 620 | `outlet_id`, `account_id`, `mode_offline_aktif`; 30 outlet ber-mode offline |
| `product_usage_daily.csv` | 226.300 | `tanggal`, `outlet_id`, `account_id`, `jumlah_transaksi`, `transaksi_offline_tersinkron`, `versi_aplikasi`; setiap outlet punya 365 tanggal 1 Okt 2025–30 Sep 2026 |
| `feature_usage_monthly.csv` | 1.178 | `bulan`, `account_id`, `feature_id`, `pengguna_aktif`; bulan Okt 2025–Sep 2026 |
| `support_tickets.csv` | 640 | `dibuat`, `status`, `prioritas`, `kategori`, `outlet_id`, `bug_id`, `diselesaikan`; 26 `Terbuka`, 6 `Dicatat ke roadmap`, 16 punya `bug_id`, 26 punya `pelapor_contact_id` |
| `bugs.csv` | 4 | `bug_id`, `versi_terdampak`, `status`, `dibuat`, `selesai` |
| `releases.csv` | 3 | `versi`, `tanggal_rilis` |
| `features.csv` | 8 | `feature_id`, `status`, `target_awal`, `target_terkini`; 6 punya target berbentuk kuartal, bukan tanggal harian |
| `employees.csv` | 10 | `employee_id`, `jabatan`, `email` untuk pemilik akun/deal dan pengambil keputusan |

`README.md` pada dataset menyebut histori operasional 1 Okt 2025–30 Sep 2026; log keputusan lebih panjang. Hitungan baris di atas berasal dari file aktual, sehingga beberapa berbeda dari angka perkiraan di README. `product_usage_daily` mencakup 40 pelanggan dan 620 outlet; jangan mengasumsikan 45 baris CRM semuanya pelanggan aktif.

## Parameter yang dapat diukur untuk percobaan skor

| Parameter / bobot awal | Pengukuran yang bisa dihitung kode | Sumber dan batasan |
|---|---|---|
| **Pemakaian — 30%** | Transaksi per hari per akun = `SUM(jumlah_transaksi) / jumlah_hari_tercakup`; bandingkan 90 hari terakhir **3 Jul–30 Sep 2026** dengan 90 hari sebelumnya **4 Apr–2 Jul 2026**. Perubahan relatif = `(terakhir − sebelumnya) / sebelumnya` bila baseline >0; bila 0, tampilkan tidak terdefinisi dan nilai absolut. Hitung juga cakupan outlet/hari. | `product_usage_daily` + `outlets`. Semua outlet punya 365 baris harian, tetapi kelengkapan baris tidak menjamin semua transaksi berhasil sinkron. `jumlah_transaksi` adalah yang tercatat di server; jangan menjumlah `transaksi_offline_tersinkron` tanpa definisi apakah sudah termasuk di dalamnya. Pada 30 outlet offline, perubahan sinkronisasi menjadi flag kualitas data/layanan; jangan gandakan sebagai dua bukti churn. |
| **Gangguan layanan — 25%** | Jumlah tiket berstatus `Terbuka`, umur `snapshot − dibuat`, tiket dibuat 90 hari terakhir, distribusi prioritas, serta kaitan bug/rilis yang terbukti. `Dicatat ke roadmap` dicatat terpisah sampai kebijakan open/closed disetujui. Jev dapat menilai berat keluhan di `judul`/`deskripsi` dan interaksi. | `support_tickets`, `bugs`, `releases`, `outlets`, `interactions`. Hanya 16/640 tiket memiliki `bug_id`; relasi lain harus `derived` dengan bukti dan review, bukan dianggap hard link. `diselesaikan` kosong sendiri tidak cukup untuk menyimpulkan tiket terbuka. |
| **Relasi champion — 20%** | Bandingkan `champion_contact_id` dengan `account_id_saat_ini` dan riwayat kerja aktif (`selesai` kosong). Tandai champion pindah/mismatch; ukur lama jabatan baru dari `mulai` bila peran pengambil keputusan dapat diidentifikasi. Jev menilai niat pindah yang *disebut* di teks, terpisah dari fakta pekerjaan. | `crm_accounts`, `crm_contacts`, `contact_employment_history`, `interactions`. Semua 40 pelanggan punya champion CRM, tetapi jabatan “pengambil keputusan” tidak punya flag terstruktur; perlu rubrik/validasi. Email historis tidak selalu sama dengan email saat ini. |
| **Janji dan engagement — 15%** | Janji belum ditepati = baris dengan `status_janji = Belum ditepati`; hubungkan `fitur_dijanjikan` ke status fitur dan pergeseran `target_awal`→`target_terkini`. Hari sejak interaksi eksternal terakhir per akun; email renewal tanpa balasan diuji melalui `membalas_id` dan pihak pengirim/penerima. Jev menilai keluhan tentang janji. | `decision_log`, `features`, `interactions`, `feature_usage_monthly`. Hanya 3 baris log punya status janji; target fitur berupa kuartal, sehingga “hari lewat tenggat” tidak boleh dihitung tanpa aturan tanggal kuartal. Email internal dikecualikan dari engagement pelanggan. Tidak ditemukannya balasan dalam 350 interaksi tidak membuktikan pelanggan tidak pernah membalas di luar dataset. |
| **Pembayaran — 10%** | Kategori `keterlambatan_bayar_12bln`: 0, 1, atau 2+; pada 40 kontrak distribusinya 34/5/1. | `contracts_billing`. Tidak ada tanggal invoice, nominal tunggakan, atau durasi telat bayar per invoice; jangan klaim aging piutang atau pola bulanan. |

Bobot ini **hipotesis percobaan**, belum hasil validasi. Normalisasi subparameter, ambang level, dan aturan saat data penting hilang harus ditetapkan setelah uji C01–C06 serta seluruh 40 pelanggan, lalu diberi versi. Data kosong tidak boleh bernilai nol secara diam-diam. Uji sensitivitas perubahan bobot dan audit bukti setiap akun sebelum menampilkan peringkat sebagai hasil final.

## Konteks yang tersedia tetapi bukan bobot awal

| Konteks | Perhitungan yang sah | Batasan |
|---|---|---|
| Kedekatan renewal | `tanggal_renewal − 1 Okt 2026` dalam hari, untuk 40 kontrak | Urgensi tindakan, bukan bukti perilaku churn |
| Nilai kontrak | `nilai_tahunan` dan `diskon_pct`; bila diperlukan `nilai_tahunan × skor_prioritas / 100` | Perkalian itu nilai tertimbang untuk prioritas, bukan probabilitas atau kerugian yang diprediksi |
| NPS | `nps_terakhir` tersedia pada 40 pelanggan (nilai 6–10) | Tidak ada tanggal survei; jangan menyebut NPS terkini/bertanggal atau memakainya sebagai tren |
| Health dashboard | Bandingkan `health_score_dashboard` dengan level graph sebagai tanda mismatch | Ambang warna/level dashboard belum terdokumentasi di file; harus ditetapkan eksplisit |
| Pemakaian fitur | Perubahan `pengguna_aktif` per `feature_id` antarbulan | `feature_usage_monthly` bukan transaksi dan belum menjadi bobot skor awal |
| Preseden diskon/eskalasi | Temukan `decision_log` terkait dan alasan; sebut `decision_id` | Log mencatat keputusan, bukan efektivitas, margin, atau profit sesudah tindakan |

## Yang belum dapat dihitung atau diklaim

- **Probabilitas churn terkalibrasi/backtest retensi:** tidak ada label outcome renewal pelanggan yang cukup. Satu deal Closed Lost adalah deal baru C23 (DL-006), bukan churn renewal.
- **Profit promo atau ROI retensi:** ada diskon/kontrak dan preseden keputusan, tetapi tidak ada margin, biaya intervensi, atau hasil kausal promo.
- **Dampak referral:** tidak ada kolom/relasi referral pada 15 file.
- **Aging invoice dan nominal tunggakan:** hanya agregat `keterlambatan_bayar_12bln`.
- **Feedback pengguna dan approval baru:** belum ada dalam dataset awal; itu catatan aplikasi yang harus ditulis terpisah dengan actor, waktu, dan provenance.

Jev dapat mengklasifikasi pernyataan ambigu dari teks, tetapi nilai `noul`/confidence-nya bukan probabilitas churn. LLM menerima nilai dan sumber yang sudah dihitung kode; ia tidak menghitung transaksi, uang, atau skor sendiri. Semua klaim UI/pitch memakai sumber dan periode di atas.
