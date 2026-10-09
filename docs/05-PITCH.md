# 05 — PITCH & Demo: Relasi

> Kerangka dari study case dan asumsi. Isi angka aktual sesudah T3; jangan mengubah placeholder menjadi klaim.

## 1. Alur Cerita (usulan 5 menit [asumsi; sesuaikan durasi panitia])

| Waktu | Bagian | Kalimat inti |
|---|---|---|
| 0:00–0:40 | Masalah | “CSM tahu akun berisiko sering setelah renewal lewat. Sinyalnya tersebar dalam beberapa call, tiket, dan angka pemakaian.” [ide finalis; bukan data statistik] |
| 0:40–1:10 | Pendekatan | “Relasi mengompilasi bukti menjadi graph saat data masuk. Jev memutuskan properti fuzzy; kode yang mengatur ambang dan skor.” |
| 1:10–3:35 | Demo | Lima langkah golden path §2; satu pertanyaan multi-call sama pada dua metode. |
| 3:35–4:20 | Reliabilitas | Tunjukkan hasil T3 aktual, eval set per primitif, ukuran sampel, biaya query dan ingest, latensi. |
| 4:20–4:45 | Dampak | Waktu review dan harga adalah asumsi, bukan penurunan churn yang terukur. |
| 4:45–5:00 | Next | Pilot tim CS dengan data berizin, ukur waktu review dan kualitas keputusan sebelum menjanjikan churn turun. |

## 2. Script Demo

| # | Aksi di layar | Kalimat |
|---|---|---|
| 1 | Data: ingest call baru; buka source span dan log Jev | “Jev menjawab pertanyaan kecil: apakah champion pergi, kompetitor disebut, dan seberapa mendesak. Kode menulis sinyal yang yakin, menahan yang ragu. Biaya kompilasi ini dibayar sekali.” |
| 2 | Akun: urutkan risiko; buka Detail, ajukan pertanyaan lintas call | “Skor ini indeks prioritas deterministik, bukan probabilitas churn. Nilai kontrak tertimbang membantu mengurutkan; dua call dan jalur buktinya terlihat.” |
| 3 | Benchmark: pilih pertanyaan sama pada grep dan graph | “Subset, corpus, answerer, budget, dan judge identik. Ini akurasi, biaya per query dan latensi run kami; biaya ingest juga ditampilkan.” |
| 4 | Review: tunjukkan sinyal ragu, buat/edit plan, preseden | “Yang ragu masuk manusia. Agent menyusun draf dengan kutipan; CSM memutuskan.” |
| 5 | Setujui, lalu query “Apa yang disetujui dan mengapa?” | “Tidak ada email terkirim. Persetujuan menjadi Decision dengan alasan dan bukti; query berikutnya sudah menggunakannya.” |

**Momen wow:** dua call yang masing-masing tidak lengkap menjadi alasan tunggal yang dapat diaudit; keputusan manusia yang baru langsung menjadi memori graph.

### Tabel benchmark — isi hanya dari run aktual T3

| Arm pada subset yang sama | Akurasi Jev | Biaya/query | Biaya total/query termasuk amortisasi ingest | Latensi p50/p95 | N |
|---|---:|---:|---:|---:|---:|
| Agent + grep | Belum diukur | Belum diukur | Belum diukur | Belum diukur | Target 50 [asumsi] |
| Context graph + Jev | Belum diukur | Belum diukur | Belum diukur | Belum diukur | Target 50 [asumsi] |

**Eval primitif:** champion exit, competitor, sentiment, urgency, entity match: akurasi/precision/recall **belum diukur**; target ≥90% akurasi, auto-merge precision ≥95% pada 30 contoh berlabel per primitif [asumsi]. Jangan mengklaim “dua nines” dari sampel sekecil ini.

**Konteks publik** [riset: `https://github.com/Endgame-Labs/SalesTranscriptQA`]: Hybrid RAG 87,5% overall/63,3% multi-call; +reranker 96,3%/81,3%. Jawaban dan judge berbeda dari run internal, jadi **bukan perbandingan langsung**. Dataset CC BY-NC 4.0, atribusi Salesforce dan Endgame Labs.

**Cadangan:** cache output ingest/benchmark berlabel waktu dan versi + demo lokal. Video cadangan hanya jika dibuat dan diminta panitia; tidak ada path/video saat ini.

## 3. Outline Deck

1. **Relasi:** “Kenali sinyal sebelum terlambat; setiap tindakan punya bukti.”
2. **Masalah:** fragmentasi call/tiket/usage; contoh sintetis berlabel, bukan klaim pasar.
3. **Jev di stack:** input fuzzy → noul/score + confidence → `if` kode → Signal/Review; satu diagram.
4. **Context graph:** write-time compilation dan traversal lintas dua call + Decision/temporal provenance.
5. **Live demo:** lima langkah §2, termasuk approval write-back.
6. **Benchmark:** akurasi/biaya/latensi internal vs baseline yang sama; total cost termasuk ingest.
7. **Bisnis & batasan:** CSM/VP CS, pricing dan ROI berlabel asumsi; QA ≠ churn prediction.
8. **Roadmap:** expansion signal; lookalike dan promosi hanya ide, bukan fitur berjalan.

## 4. Pemetaan Kriteria Juri

| Kriteria TM | Bukti |
|---|---|
| Jev sebagai decision model | Log tiap primitif/rubrik, threshold di kode, review zone |
| Akurasi | Run subset B2B multi-call dengan judge Jev sama untuk kedua arm |
| Biaya | Token/rate aktual, biaya/query, biaya ingest, break-even |
| Kegunaan agent | Jawaban bersumber, nilai prioritas, save plan, approval dan query lanjutan |
| Context graph | Traversal multi-hop, provenance, temporal, Decision write-back |

Bobot kriteria dan deliverable resmi masih harus dikonfirmasi panitia.

## 5. Persiapan Q&A

| Pertanyaan | Jawaban ringkas |
|---|---|
| Kenapa graph, bukan RAG/CRM? | Graph kami mengompilasi relasi saat ingest sehingga dua call dalam satu opportunity bisa ditemukan bersama. RAG berstruktur juga mungkin; kami ukur perbedaannya di subset dan judge sama. |
| Apa hubungan dengan video Jev? | AI menjadi primitif kecil di kode. Jev memberi noul/score plus confidence; ambang kode menentukan write/review/discard. Graph adalah memori yang disusun sebelum query. |
| Mengapa bukan satu model besar? | Model besar dipakai hanya untuk teks bebas. Klasifikasi kecil dengan rubrik dapat diuji per properti dan dipakai ulang; biaya harus dibuktikan, bukan diasumsikan. |
| Bagaimana jika Jev salah? | Kutipan + span bisa diaudit, hard ID tidak boleh konflik, merge ragu ditahan, approval manusia. Eval set dan false positives ditampilkan apa adanya. |
| Bukankah data sintetik? | SalesTranscriptQA adalah dataset transkrip sintetis berjawaban emas [riset: repo dataset]. Usage/invoice overlay kami sintetis dan ditandai. Kami tidak mengklaim churn historis nyata. |
| Apakah angka uang berisiko berarti rugi pasti? | Tidak. `contract_value × risk_index` adalah indeks pembobot untuk urutan kerja, bukan estimasi probabilitas/kerugian. |
| Siapa membayar? | Hipotesis: Head/VP CS membeli Rp1,5 juta/workspace/bulan [asumsi]. Perlu validasi willingness-to-pay di pilot. |
| Kompetitor besar bisa meniru? | Bisa. Pembeda awal adalah implementasi ringan, keputusan yang bisa diaudit, dan validasi workflow tim kecil, bukan moat terbukti. |
| Privasi? | Data API server-side, key tidak di browser, PII disanitasi, data pilot hanya dengan izin, data CC BY-NC tidak dipakai produk komersial. |
| Seberapa akurat? | Tunjukkan skor aktual T3 dan jumlah contoh. Jika belum ada, katakan belum diukur. Jangan mengklaim reliabilitas tinggi dari 30 label. |
| Apa hasil tindakan? | CSM approve rencana, Decision tersimpan. Sistem tidak mengirim email; outcome retensi memerlukan pilot. |
| Jika biaya graph lebih mahal saat sedikit query? | Laporkan biaya awal dan titik impas `biaya_ingest / (biaya_baseline_query − biaya_graph_query)` jika selisih positif; jika negatif, belum impas. |

## 6. Kartu Contekan Bisnis

**Versi awam:** Tim Customer Success kesulitan membaca semua percakapan pelanggan. Relasi menandai sinyal penting sejak data datang, menunjukkan alasan prioritas, lalu membantu menyiapkan tindakan yang tetap disetujui manusia. Kita belum membuktikan churn benar-benar turun.

**Analogi graph:** peta hubungan: akun → beberapa call → kutipan → sinyal → keputusan. Mesin tidak hanya mencari kalimat mirip, tetapi mengikuti hubungan yang sudah disiapkan.

| Angka | Nilai | Sumber | Cara hitung |
|---|---:|---|---|
| Harga calon | Rp1.500.000/workspace/bulan | [asumsi] | Hipotesis pilot, bukan survei harga |
| Hemat waktu | 33,3 jam/bulan | [asumsi] | 100 review × 20 menit / 60 |
| Nilai waktu | Rp3.333.333/bulan | [asumsi] | 33,3 jam × Rp100.000/jam |
| ROI waktu | 122% | [asumsi] | (3.333.333−1.500.000)/1.500.000 |
| Kredit Jev | $5 | [study case] | Kredit eksperimen, bukan ongkos produksi |
| Multi-call publik | 428 QA | [riset: `https://github.com/Endgame-Labs/SalesTranscriptQA`] | Kategori B2B multi-call |

**Kalau belum tahu:** “Itu asumsi kami; kami akan mengujinya pada pilot berizin dan melaporkan hasilnya.”

| Istilah | Arti |
|---|---|
| Churn | Pelanggan berhenti memperpanjang layanan |
| CSM | Orang yang membantu pelanggan memakai produk dan tetap mendapat nilai |
| ARR | Nilai pendapatan langganan setahun |
| Renewal | Perpanjangan langganan |
| NRR/GRR | Pendapatan pelanggan lama setelah perubahan; GRR tidak menghitung upgrade, NRR menghitung upgrade |
| Context graph | Peta hubungan fakta, waktu, sumber, dan keputusan |
| Decision | Catatan tindakan yang disetujui: siapa, kapan, alasan dan bukti |
| Preseden | Keputusan terdahulu pada kondisi serupa beserta hasilnya |
| Entity resolution | Menyatukan nama berbeda yang merujuk akun/kontak sama |
| Jev noul/score | Jawaban ya/tidak berupa peluang, atau skor rubrik berurutan |
| Threshold/ambang | Batas angka untuk tindakan otomatis atau review manusia |
| RAG | AI mencari potongan dokumen relevan saat pertanyaan datang |
| Eval set | Contoh berlabel yang dipakai untuk mengukur benar/salah |
| Risk index | Skor aturan untuk memprioritaskan akun; bukan peluang churn |
| ROI | Manfaat dibanding biaya; asumsi waktu tidak sama dengan uang tunai terselamatkan |
| GTM | Cara menemukan pembeli dan menjual produk |
