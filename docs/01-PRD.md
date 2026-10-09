# 01 — PRD: Relasi

> Strategi, bisnis, dan scope demo. Status: Draf — menunggu ACC. Tanggal: 9 Oktober 2026.

## 1. Pitch Satu Kalimat

Untuk CSM B2B SaaS yang harus menyatukan bukti pelanggan sebelum renewal, Relasi menyusun percakapan menjadi peta konteks bertanggal sehingga prioritas risiko dan save plan bisa diperiksa, disetujui, dan ditelusuri kembali.

## 2. Strategi (Startup Canvas)

| # | Bagian | Isi |
|---|---|---|
| 1 | Vision | Tidak ada intervensi retensi tanpa alasan dan sumber yang dapat diperiksa. Pencegahan churn adalah tujuan, bukan hasil yang sudah terbukti. |
| 2 | Segmen utama & JTBD | CSM di B2B SaaS dengan 50–200 akun per tim [asumsi segmen awal]. Pekerjaan: memutuskan akun mana perlu ditangani dahulu dan menyiapkan langkah retensi. Pembeli: Head/VP CS. |
| 3 | Value proposition | Sebelum: 30 menit membaca berbagai sumber per review akun. Sesudah: target 10 menit dengan bukti dan draf siap diperiksa. Hemat 20 menit × 100 review/bulan = 33,3 jam [asumsi; uji waktu tugas dengan 5 CSM, bukan klaim hasil demo]. |
| 4 | Kenapa context graph | Account → Opportunity → beberapa Conversation → Evidence → Signal → Decision menghubungkan fakta lintas call, alasan prioritas, dan tindakan sebelumnya. Graph adalah memori terstruktur hasil banyak pertanyaan kecil Jev di write time. SQL dapat merepresentasikan graph; bukan klaim bahwa RAG atau relational DB mustahil melakukan traversal. Nilai tambah yang harus diuji adalah retrieval bukti lintas call dan histori keputusan. |
| 5 | Alternatif & pembeda | CRM + spreadsheet: penyatuan manual. Gong: intelligence percakapan; Gainsight/ChurnZero: workflow CS; Salesforce/HubSpot: platform CRM luas. Pembeda yang diusulkan: compile-time Signal, provenance, review, Decision write-back dalam satu demo terukur. Tidak mengklaim pesaing tidak memiliki fungsi sejenis. |
| 6 | Relative costs | Nilai unik: bukti dan kontrol manusia, bukan sekadar harga murah. Biaya klasifikasi dibayar di ingest; query hanya membaca subgraph. Biaya total termasuk ingest tetap wajib ditampilkan. |
| 7 | Trade-off | Satu workspace lokal, satu provider generatif, graph dalam SQLite. Tidak membangun konektor CRM, auth multi-tenant, pengiriman email, vector DB, maupun Neo4j untuk MVP. |
| 8 | Key metrics | North Star calon produk: save plan berbukti yang benar-benar ditindaklanjuti CSM per minggu. Demo membuktikan approval tersimpan, retrieval dua call, akurasi QA, biaya query/total, latensi, dan kualitas primitif; bukan penurunan churn nyata. |
| 9 | Growth / GTM | Pilot pendampingan 3 tim CS lewat komunitas SaaS/relasi founder [asumsi]. Pembeli Head CS, pengguna CSM. Wawancara dahulu, uji 2 minggu memakai data berizin; bandingkan waktu review, bukan menjanjikan revenue terselamatkan. |
| 10 | Capabilities | Bangun ingest, traversal, risk formula, evidence UI, approval dan benchmark sendiri. Jev partner klasifikasi noul/score; probabilitas serta ambang ada di kode. Model generatif hanya menyusun teks jawaban/draf, bukan risk score atau keputusan approval. |
| 11 | Can't/Won't | Pemain besar bisa meniru. Belum ada moat terbukti. Fokus awal tim kecil, pemasangan ringan, rubrik spesifik dan histori keputusan pelanggan berizin bisa menjadi diferensiasi; validasi melalui pilot. |

## 3. Model Bisnis

Seluruh angka bagian ini [asumsi], bukan validasi harga pasar.

- **Pricing calon:** Rp1.500.000/workspace/bulan untuk 3 CSM dan 100 akun; batas dokumen/query ditetapkan sesudah mengukur biaya, bukan unlimited.
- **ROI waktu:** 100 review × (30−10) menit / 60 × Rp100.000/jam = Rp3.333.333 nilai waktu. ROI = (3.333.333−1.500.000)/1.500.000 = 122%; manfaat/biaya 2,22×. Ini nilai kapasitas, bukan penghematan tunai pasti; tidak menambahkan klaim churn agar tidak menghitung ganda.
- **Biaya bulanan:** infrastruktur Rp300.000 [asumsi anggaran] + API aktual dari formula §4b arsitektur + support 4 jam × Rp100.000 = Rp400.000 [asumsi]. Sebelum API, kontribusi Rp800.000; biaya API maksimum Rp350.000 agar kontribusi ≥Rp450.000 (30%). Pajak, pengembangan dan akuisisi pelanggan belum termasuk.
- **API:** biaya/dokumen = biaya seluruh panggilan ingest dibagi dokumen; biaya/akun = jumlah biaya dokumen akun + query + draft. Harga token belum diverifikasi; dilarang mengubah token menjadi dolar tanpa rate valid. Kredit Jev $5 adalah batas eksperimen, bukan harga operasional.
- **Data:** dataset benchmark nonkomersial tidak dibawa ke produk berbayar; pilot menggunakan data sendiri berizin.

## 4. Hipotesis Berisiko

| # | Hipotesis | Cara uji dan kriteria |
|---|---|---|
| H1 | Graph lebih akurat dan murah dibanding baseline pada multi-call | Target [asumsi]: akurasi ≥80%, ≥10 poin persentase di atas baseline, biaya query ≤70% baseline. 50 pertanyaan holdout yang sama, corpus B2B sama, answerer/judge sama. Sertakan biaya ingest dan break-even; bila gagal, laporkan gagal. |
| H2 | Sinyal dan penggabungan entitas cukup dapat dipercaya | 30 contoh berlabel per primitif; target akurasi ≥90% dan precision auto-merge ≥95% [asumsi]. Audit hard negatives, coverage dan false merges. Sampel ini tidak cukup membuktikan 99% reliabilitas produksi. |
| H3 | CSM dapat mengambil tindakan lebih cepat tanpa kehilangan kontrol | Demo: cek bukti, edit rencana, approve, Decision muncul pada query berikutnya. Target waktu 30→10 menit perlu pilot 5 CSM; demo internal belum membuktikannya. |

Koherensi: QA sales membuktikan kemampuan retrieval, bukan prediksi churn. Risk score adalah indeks heuristik, bukan probabilitas churn. Data usage/invoice dan outcome preseden sintetis selalu ditandai. Penurunan churn memerlukan pengamatan renewal nyata.

## 5. Golden Demo Path

1. **Data:** ingest satu call tambahan; tampilkan Jev noul/score, confidence, kutipan persis dan biaya kompilasi. Corpus benchmark sudah dikompilasi sebelumnya dengan log.
2. **Akun → Detail akun:** pilih akun prioritas. Tampilkan skor risiko, nilai kontrak, dan *nilai kontrak tertimbang risiko*. Ajukan pertanyaan lintas call; jawaban mencantumkan dua bukti dan jalur Account–Opportunity–Conversation.
3. **Benchmark:** pertanyaan sama di baseline agent + grep versus graph. Tampilkan hasil run aktual, akurasi, biaya query, total dengan ingest, dan latensi. Jangan isi angka rekaan.
4. **Detail/Review:** buat save plan dari bukti dan preseden berlabel; kasus ragu ditahan. CSM mengedit lalu menyetujui melalui tombol “Setujui rencana — tanpa mengirim email”.
5. **Write-back:** Decision append-only tersimpan bersama bukti, actor, alasan dan versi. Query berikutnya “Apa yang telah disetujui untuk akun ini?” mengambil keputusan baru.

**Wow:** perubahan informasi di dua call menjelaskan prioritas akun; setelah approval, graph juga bisa menjawab apa yang diputuskan dan mengapa. Bukan animasi graph semata.

## 5a. Titik Keputusan Fuzzy (Jev)

| Masukan | Primitif/rubrik | Control flow kode |
|---|---|---|
| Ujaran champion meninggalkan posisi / kompetitor disebut | Satu noul per properti, bukan satu choice ordinal untuk kategori tak berurutan | p≥0,85 tulis Signal; 0,50–0,85 review; lainnya tidak ditulis sebagai sinyal aktif |
| Nada negatif / urgensi | score 0–3 dengan kriteria konkret | confidence≥0,80 dan severity≥2/3 tulis; ambigu review; formula risiko tetap deterministik |
| Alias entitas ragu | noul same entity dengan konteks dan hard identifiers | p≥0,95 serta tidak ada ID bertentangan: merge; ≥0,60 review; lainnya pisah |
| Bukti membantu menjawab QA | score relevansi 0–3 | Pilih skor≥2 dan confidence≥0,80, budget bukti identik kedua arm |
| Peluang expansion (Should) | Satu pertanyaan noul tambahan | Simpan terpisah; tidak mengurangi risiko churn |

## 5b. Daftar Layar

| Layar | Tugas | Utama | Pendukung | Aksi utama | Sekunder ⋯ |
|---|---|---|---|---|---|
| Akun | Menentukan akun prioritas | Nama, skor risiko, uang tertimbang | Sumber/umur data, kontrak, cakupan data | Buka akun | Filter/urutkan |
| Detail akun (route turunan, bukan menu) | Memeriksa bukti lalu menyusun tindakan | Jawaban, kutipan, peta jalur, save plan | Timestamp, ID, confidence, histori | Buat/periksa save plan | Lihat sumber, tab Keputusan |
| Review | Memutuskan item yang ditahan | Bukti pasangan/sinyal atau isi rencana, konsekuensi | Alasan ditahan, versi | Setujui item terpilih | Tolak/edit; bukan approve massal |
| Benchmark | Membandingkan dua metode | Tabel berpasangan akurasi/biaya/latensi | Corpus hash, model, seed, N, error | Lihat hasil run | Unduh hasil |
| Data | Memasukkan data dan melihat kompilasi | Dokumen, progress, biaya, gagal/sukses | Model/rubrik/hash | Impor data berizin | Retry gagal saja |

Navigasi: **Akun, Review, Benchmark, Data**. Detail akun dari baris akun. Tidak ada feed notifikasi global atau halaman Settings kosong. Alert adalah daftar sinyal bertanggal dalam Detail akun, bukan layar tambahan.

## 6. Fitur

| ID | Fitur | Prioritas | Demo | Kriteria juri | Kriteria terima |
|---|---|---|---|---|---|
| F1 | Ingest Jev + Signal + entity resolution | Must | 1 | Decision model/write time | Kutipan valid, idempotent, kasus ragu ditahan, biaya tercatat |
| F2 | Graph temporal + provenance | Must | 1–2 | Context berguna | Dua call terkait opportunity bisa diambil, query as-of menghormati waktu |
| F3 | Risiko explainable + nilai tertimbang | Must | 2 | Kegunaan agent | Rumus deterministik, dedupe, missing data jelas, mata uang tidak dicampur |
| F4 | QA + evidence path | Must | 2 | Akurasi | Jawaban menyebut source ID valid; tidak ada bukti cukup berarti abstain |
| F5 | Benchmark + eval primitif | Must | 3 | Akurasi/biaya | Corpus sama, label QA tidak bocor, hasil run dapat direproduksi |
| F6 | Save plan, review, Decision write-back | Must | 4–5 | Agent bermanfaat | Approval idempotent/atomic; tidak mengirim email; query membaca Decision baru |
| F7 | Expansion noul | Should | Opsional | Kegunaan | Kolom sinyal terpisah, tidak mengubah risiko |
| F8 | Perbandingan 2 akun | Could | Opsional | Kegunaan | Perbandingan sumber/risiko, bukan dashboard baru |
| F9 | Filter evidence per tipe | Could | Opsional | Explainability | Jalur aktif tetap dapat dibaca |
| F10 | Preview ambang review | Could | Opsional | Control flow | Preview lokal, tidak reclassify diam-diam atau mengubah benchmark |

## 7. Di Luar Scope

Pengiriman outreach nyata; CRM sync; multi-tenant production; billing; forecasting churn terkalibrasi; Neo4j/vector DB; lookalike customer dan strategi promosi (slide roadmap saja). UI benchmark tidak menawarkan tombol run mahal tanpa batas biaya.

## 8. Simulasi Juri

| Pertanyaan | Jawaban |
|---|---|
| Kenapa graph, bukan RAG/CRM? | Relasi disusun sebelum query; dua call dan keputusan dapat ditelusuri lewat opportunity. Ini diuji melawan baseline sendiri. RAG berstruktur bisa melakukan hal serupa; kami tidak mengklaim keunikan matematis graph. |
| Hubungan dengan Jev? | Sinyal dan identitas diberi noul/score, kode memilih tulis/review/buang; bukan meminta model memutuskan siapa pasti churn. |
| Kenapa tidak satu model besar? | Rubrik kecil dapat diaudit dan dipakai berulang; generatif tetap dipakai saat perlu teks bebas. Keunggulan biaya baru sah sesudah dihitung termasuk ingest. |
| Bukankah uang berisiko menyesatkan? | Nilai kontrak × indeks risiko adalah nilai tertimbang untuk prioritas, bukan estimasi kerugian atau peluang churn. Label ini tampil dekat angka. |
| Apakah dataset membuktikan churn turun? | Tidak. SalesTranscriptQA sintetis menguji QA sales; overlay usage/invoice mengilustrasikan alur CS. Dampak retensi perlu pilot. |
| Bagaimana jika Jev salah? | Bukti persis, validasi, ambang review dan audit false merge; confidence belum otomatis berarti sudah terkalibrasi pada domain kita. |

## 9. Riwayat Perubahan

| Tanggal | Perubahan |
|---|---|
| 9 Okt 2026 | Draf integrasi Relasi; risiko bukan probabilitas; benchmark dipisahkan dari klaim retensi |
