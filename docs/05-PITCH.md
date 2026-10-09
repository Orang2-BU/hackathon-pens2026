# 05 — PITCH & Demo: Tessera untuk KasirNusa

> Kerangka, bukan klaim hasil. Durasi pitch dan deadline resmi belum terkonfirmasi. Target pertama dari user: 9 Okt 2026 pukul 22.00, jenis deliverable belum jelas. Data KasirNusa dalam demo bersifat sintetis. Isi metrik aktual hanya setelah run terverifikasi.

## 1. Cerita singkat

“Tim Customer Success KasirNusa perlu melihat sinyal dari CRM, transaksi, support, interaksi, kontrak, dan keputusan sebelumnya dalam satu tempat. Tessera mengompilasi hubungan itu saat data masuk. Jev menilai ungkapan yang ambigu dan memetakan pertanyaan ke intent; kode menghitung angka dan prioritas, lalu menyusun jawaban dan draf tindakan dari graph dengan sitasi. CSM tetap memutuskan, dan pengguna dapat menyampaikan pendapat yang ditanggapi.”

Klaim yang boleh dibuat sesudah diuji: graph menghubungkan minimal tiga sumber untuk rekomendasi, 40 pelanggan dapat ditinjau, pertanyaan baru mendapat jawaban bersitasi atau abstain, dan Decision approval dapat ditemukan pada query berikutnya. Jangan klaim penurunan churn, probabilitas terkalibrasi, profit promo, atau penghematan biaya tanpa data dan pengukuran.

## 2. Script demo (`01-PRD.md` §5)

| Langkah | Aksi | Narasi yang aman |
|---|---|---|
| 1 | Ingest satu data, lihat graph dan sinyal Jev | “Sinyal teks dinilai saat ingest; kode memutuskan tulis atau review. Sumber, rubrik, dan biaya aktual terlihat.” |
| 2 | Buka peringkat 40 pelanggan, pilih C01–C06 | “Parameter risiko menunjukkan faktor dan bukti; level prioritas membantu urutan kerja. Bobot masih percobaan, bukan probabilitas churn.” |
| 3 | Ajukan pertanyaan baru ke graph | “Jawaban menunjuk node, relasi, dan sumber. Bila bukti kurang, sistem menyatakan belum cukup.” |
| 4 | Periksa preseden dan save plan, approve | “Draf ini dapat diedit. Approval menyimpan Decision baru, tanpa mengirim email; pertanyaan berikutnya dapat menemukannya.” |
| 5 | Tampilkan feedback dan tanggapan | “Pendapat pengguna dibalas dan tercatat; feedback tidak diam-diam mengubah parameter atau keputusan.” |

Kasus QA dari `09-BUILD-PLAN-KASIRNUSA.md` §6: C03/C05 dan BUG-412 dengan outlet offline; C01 champion pindah dan janji FEAT-07; C04 renewal dekat. Tunjukkan hanya jalur yang benar-benar dibangun dan terverifikasi. Saat menyebut nilai kontrak tertimbang, gunakan `nilai_tahunan × skor_prioritas / 100` dan sebut sebagai alat prioritas, bukan estimasi kerugian.

## 3. Bukti yang disiapkan

| Bukti | Harus berasal dari |
|---|---|
| Jumlah node/edge, cakupan 40 pelanggan | Output ingest aktual dan versi dataset |
| Faktor, bobot, sensitivitas peringkat | Run scoring aktual, versi formula, kasus data kosong/offline |
| Jawaban dan jalur ≥3 sumber | Query graph, source ID, kutipan/span yang valid |
| Decision dan feedback | Catatan append-only beserta actor/timestamp dan tanggapan |
| Token, biaya, latensi, akurasi | Log provider/eval aktual, N, model/rubrik, timestamp; jangan isi angka rekaan |

SalesTranscriptQA boleh dipakai hanya sebagai benchmark retrieval terpisah bila benar-benar dijalankan, dengan korpus/pertanyaan/answerer/judge dan budget yang sepadan, biaya ingest terpisah, serta lisensi CC BY-NC 4.0 dan atribusi Salesforce + Endgame Labs. Hasilnya tidak mengukur peluang churn KasirNusa.

## 4. Jawaban untuk juri

| Pertanyaan | Jawaban |
|---|---|
| Mengapa graph? | Akun, outlet, kontak, tiket, bug, interaksi, kontrak, dan Decision terkait melalui ID/waktu/sumber. Jalur itu dapat diperiksa pada pertanyaan baru. |
| Peran Jev, dan kenapa tanpa LLM? | Jev menilai properti teks kecil dan memetakan pertanyaan ke intent; kode menentukan ambang, aritmetika, prioritas, dan menyusun jawaban bersitasi dari template. Tanpa LLM generatif tidak ada angka yang dikarang, dan biaya per pertanyaan nyaris nol. |
| Momen wow? | C05: dashboard CRM Hijau, Tessera level Tinggi + `mismatch`; jalur Tiket → Outlet offline → v4.12 → BUG-412, lalu C03 terdampak bug yang sama. |
| Apakah prioritas berarti kemungkinan churn? | Tidak. Skor 0–100 adalah indeks heuristik untuk urutan tinjau. Probabilitas memerlukan outcome historis dan kalibrasi yang belum tersedia. |
| Mengapa transaksi turun belum tentu churn? | Outlet offline/gagal sinkron dapat membuat transaksi server tidak lengkap. Itu ditandai sebagai kualitas data dan gangguan layanan agar tidak dihitung ganda. |
| Siapa boleh menyetujui? | Pengguna aplikasi terautentikasi berperan CSM atau admin; approval append-only dan tidak mengirim outreach. |
| Bagaimana opini pengguna masuk? | Feedback terkait akun/rencana diberi tanggapan oleh CSM/admin; keputusan tetap melalui approval terpisah. Akses pelanggan akhir masih perlu diputuskan. |
| Apakah dampak finansial terbukti? | Nilai kontrak ada dalam dataset sintetis; nilai tertimbang hanya konteks prioritas. Profit promo/referral tidak diklaim tanpa biaya, margin, outcome, dan relasi terkait. |

## 4b. Slide masalah

Agent CRM terbaik di benchmark CRMArena-Pro (Salesforce) hanya sekitar 58% benar pada tugas satu giliran dan sekitar 35% pada multi-giliran `[riset: CRMArena-Pro, dikutip mentor TM 9 Okt; verifikasi angka dari paper sebelum slide final]`. Kalimat pitch: "Tessera menunjukkan akun mana yang perlu ditangani lebih dulu dan kenapa, dan setiap alasannya bisa ditelusuri ke sumbernya." Jangan memakai "uang yang akan hilang".

## 5. Deliverable dan fallback

Rencana KasirNusa mencatat PPT, GitHub, aplikasi demo yang berjalan/dapat diakses, dan video. Pastikan jadwal resmi serta cakupan target 22.00. Siapkan demo lokal dan hasil ingest terverifikasi sebagai fallback bila jaringan/provider gagal; labeli cache dengan waktu/versi. Jangan menyebut cache sebagai panggilan live. Tidak deploy, push, memakai layanan berbayar, atau mengirim outreach tanpa otorisasi yang berlaku.
