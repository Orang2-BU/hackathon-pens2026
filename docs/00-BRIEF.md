# 00 — BRIEF: Relasi · Track 3 Context Graphs in Customer Success & Sales

> Sumber kebenaran aturan lomba dan study case. Prioritas: `07-RULES` > instruksi user > dokumen ini > dokumen lain.

## 1. Info Lomba

| Item | Isi |
|---|---|
| Deadline submit | 10 Okt 2026, 09.00 [asumsi: default skill; tanya panitia] |
| Deliverable | Belum diberikan panitia: tanya apakah demo live, video, deck, dan/atau repo diwajibkan |
| Durasi pitch + Q&A | Tanya panitia |
| Tools/sponsor/data wajib | Jev/TypeSafe; tim maksimal 3; kredit Jev $5, top-up lewat mentor; SalesTranscriptQA direkomendasikan |
| Aturan kode pra-lomba | Build dari nol; framework/library/scaffold publik boleh kecuali panitia melarang |
| Status ide finalis | Boleh diintegrasikan; arahan mentor: sebaiknya tetap dibangun lalu diberi titik Jev/context graph |

## 2. Study Case — Teks Asli

> Track 3 — Context Graphs in Customer Success & Sales.
>
> Arahan Technical Meeting 9 Okt (mentor Kyle Wild, Endgame Labs):
> - Boleh bangun ide seleksi, tapi DINILAI dari seberapa baik memakai decision model Jev (TypeSafe) di dalam stack: input fuzzy → Jev → control flow di kode.
> - Hasil diukur: akurasi & biaya menjawab pertanyaan, kegunaan bagi agent.
> - Context graph = kompilasi data saat masuk (write time), bukan RAG saat ditanya.
> - Jev pakai rubrik (score/noul), kode yang memutuskan; eval dinilai Jev, bukan LLM-as-judge.
> - Dataset saran: SalesTranscriptQA (utama, B2B multi-call), EnronQA.
> - Tim 3 orang, kredit Jev $5 (top-up via mentor).
> Deliverable & deadline: {{isi dari panitia; default 09.00 esok hari}}

## 3. Study Case — Ringkasan

- **Masalah inti:** sinyal churn tersebar di percakapan; CSM melihatnya terlambat dan sulit menjelaskan alasan rekomendasi.
- **Pihak terdampak:** CSM sebagai pengguna utama; VP CS sebagai pembeli dan pemantau risiko retensi.
- **Data tersedia:** SalesTranscriptQA B2B; seed usage/invoice sintetis transparan yang ditempelkan ke akun dataset.
- **Batasan:** tim 3; kredit Jev $5; build waktu hackathon; Next.js sudah dipilih untuk dashboard.
- **Ambigu / perlu ditanyakan:** deadline dan deliverable persis; format/versi quickstart Jev; apakah deployment wajib; durasi demo; aturan penggunaan dataset/LLM generatif.

## 3b. Referensi Panitia

- **Video Jev**: AI dipanggil kode sebagai primitif kecil; masukan JSON kecil; confidence dan threshold menentukan write/review/discard; evaluasi Jev bukan LLM-as-judge; graph adalah memori terstruktur yang dikompilasi saat write time. Lihat `docs/JEV-LENS.md`.
- **Arahan TM 9 Okt 2026:** nilai utama: Jev di control flow, akurasi/biaya jawaban, dan kegunaan agent. Lihat `docs/JEV-KIT.md`.
- **Akun Jev/TypeSafe:** kredit $5 disebut tersedia; status pendaftaran tim: **tanya tim**. Top-up: hubungi mentor di chat grup.
- **Dataset:** SalesTranscriptQA, CC BY-NC 4.0; CLI MIT; atributkan Salesforce + Endgame Labs.

## 4. Kriteria Penilaian

| Kriteria | Bobot | Cara Relasi memenuhinya |
|---|---:|---|
| Jev di stack | Belum diumumkan | Jev ekstraksi sinyal + entity resolution + relevansi bukti; kode memakai ambang/risk formula |
| Akurasi | Belum diumumkan | Benchmark B2B multi-call: baseline versus graph pada subset/judge identik |
| Biaya | Belum diumumkan | Token, estimasi biaya, dan latensi per pertanyaan dicatat per arm |
| Kegunaan agent | Belum diumumkan | Jawaban punya jalur bukti, uang berisiko, save plan, preseden, dan approval manusia |
| Context graph write time | Belum diumumkan | Signal/Decision/entitas dikompilasi sebelum pertanyaan; traversal query-time |

## 5. Tim

| Nama | Skill | Peran |
|---|---|---|
| — | Next.js/dashboard [diketahui] | Frontend / demo flow [asumsi] |
| — | Belum diinformasikan | Backend/data [asumsi] |
| — | Belum diinformasikan | Jev/benchmark/pitch [asumsi] |

## 6. Keputusan Ide

- **Ide finalis:** Relasi — context graph untuk mencegah churn melalui relasi customer, kontak, call/tiket, usage, dan invoice.
- **Keputusan:** **Integrasi**.

| Dimensi | Skor / 5 | Catatan |
|---|---:|---|
| Relevansi CS/Sales | 5 | Masalah churn adalah inti Customer Success |
| Graph esensial | 5 | Jawaban multi-call, sumber bukti, waktu, dan preseden butuh traversal relasi |
| Jev/control flow | 5 | Sinyal fuzzy dan entity resolution punya input/rubrik/ambang jelas |
| Bisa didemokan | 5 | Dataset benchmark + seed terkontrol menyediakan cerita sebelum/sesudah |
| Nilai bisnis | 4 | Uang berisiko dan save plan menjadikan sinyal dapat ditindaklanjuti |

- **Alasan:** ide finalis dipertahankan sesuai arahan mentor; scope dipersempit ke satu jalur: sinyal write time → risiko explainable → jawaban multi-call → save plan berapproval → benchmark.

## 7. Klarifikasi Panitia/Mentor

| Waktu | Pertanyaan | Jawaban | Dari |
|---|---|---|---|
| 9 Okt 2026 | Apakah Jev/TypeSafe wajib? | Jev menjadi fokus penilaian; gunakan sesuai API/quickstart terbaru | TM / mentor |
| — | Deliverable, deadline, durasi pitch? | Belum diketahui | Tanya panitia |
| — | Model Jev/quickstart final dan credential? | Belum diketahui | Tanya mentor/panitia |
