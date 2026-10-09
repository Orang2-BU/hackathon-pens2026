# Lensa Jev — video referensi panitia Track 3

Sumber: Latent Space, "Why I couldn't build Jev at OpenAI — Diogo Almeida, TypeSafe Co-founder & CEO" (youtu.be/cFx9Z3ZXca0, 2:22). Panitia Track 3 meminta peserta menyimak video ini, jadi juri kemungkinan menilai apakah tim memahami cara berpikirnya. File ini berisi pemahaman dengan kata-kata sendiri, bukan transkrip.

## 0. Arahan mentor di Technical Meeting (9 Okt 2026) — prioritas tertinggi

Mentor Track 3: **Kyle Wild** (CTO Endgame Labs, GitHub `dorkitude`). Bila bertentangan dengan bagian lain, bagian ini menang kecuali ada aturan tertulis panitia yang berbeda.

### Penilaian
- Ide seleksi boleh tetap dibangun; yang dinilai adalah seberapa baik **Jev** dipakai sebagai bagian stack.
- Cari **input fuzzy**, gunakan AI untuk klasifikasi, lalu kembalikan keputusan ke **control flow kode nyata**.
- Ukur **akurasi**, **biaya menjawab pertanyaan**, dan **kegunaan bagi agent**.
- Context graph dipakai bila esensial bagi ide.

### Jev API
- Request: `state` JSON kecil + `questions`.
- `noul`: ya/tidak → P(ya).
- `score`: rubrik level berurutan → skor, confidence, probabilitas per level.
- Hasil tervalidasi tipe. Latensi target <100 ms; murah untuk klasifikasi massal.
- Jangan suruh Jev mengambil keputusan bisnis langsung. Beri rubrik, lalu kode memakai ambang dan `if`/sort.
- Eval menggunakan Jev, bukan LLM-as-judge.

### Context graph
- RAG membayar di read time: mencari dan merangkai teks setiap pertanyaan.
- Context graph membayar sekali saat write time: data diklasifikasi, diberi tag, dan disimpan sebagai memori terstruktur untuk agent.
- Graph mengalahkan RAG bila jawaban perlu relasi multi-hop, penelusuran waktu, atau preseden keputusan.

### Data
- SalesTranscriptQA: 10.829 transkrip, 2.962 QA; 428 B2B multi-call. Paling cocok untuk CS/Sales.
- EnronQA: alternatif berbasis email.
- Hybrid RAG publik: 87,5% overall; 63,3% B2B multi-call. Dengan reranker: 96,3% overall; 81,3% multi-call. Judge berbeda, bukan pembanding langsung.

## 1. Tesis inti

AI paling banyak dipanggil oleh kode. Jev adalah "System One model": cepat, murah, intuitif, dan dipakai sebagai komponen kecil yang terukur. Metrik utamanya intelligence per dollar dan intelligence per second. Tugas multi-hop sulit untuk model kecil; pecah masalahnya, jangan paksa satu panggilan besar.

## 2. Primitif AI sebagai kontrol alur

| Primitif | Kode | Contoh Relasi |
|---|---|---|
| `choice` | `switch` | tipe sinyal: champion pergi / kompetitor / sentimen / urgensi |
| `noul` + probabilitas | `if p >= threshold` | kutipan mengandung sinyal churn? |
| `score` | sort / threshold | keparahan sinyal atau kemiripan preseden |

Aturan:
- `state` JSON terstruktur, bukan prompt panjang.
- Banyak pertanyaan kecil jalan paralel.
- Ambang tinggi ditulis ke graph; zona ragu masuk review; rendah dibuang.
- Model besar hanya untuk teks bebas atau kasus ragu.
- Versi model, rubrik, input, confidence, dan sumber dicatat sebagai provenance.

## 3. Kualitas

- Eval internal per primitif lebih penting daripada klaim generik.
- Targetkan reliabilitas dalam "nines"; mulai 20–50 contoh berlabel per primitif.
- Uji robustness: urutan field, sinonim, dan urutan pertanyaan berubah tanpa hasil material berubah.
- Kunci versi model; jangan melatih data pelanggan tanpa izin.

## 4. Penerapan untuk Relasi

1. Pada write time, setiap call/tiket dipecah per giliran bicara atau ±2.000 karakter.
2. Jev menilai `is_champion_exit`, `mentions_competitor`, `negative_sentiment`, `is_urgent`, `is_expansion`, dan `entity_match`.
3. Kode menulis `Signal` bila confidence memenuhi ambang; sisanya ke review.
4. Normalisasi nama/domain memberi kandidat entity resolution; Jev `noul` mengonfirmasi pasangan ragu.
5. Risk score dihitung deterministik dari sinyal terverifikasi, usage, dan invoice. Jev tidak memutuskan risiko akhir.
6. Graph menyimpan kutipan, waktu, sumber, confidence, dan `Decision` approval CSM.
7. Benchmark: baseline grep/RAG versus traversal graph pada subset B2B multi-call yang sama; ukur akurasi Jev, token/biaya, dan latensi per pertanyaan.

## 5. Kalimat pitch

- "Kami tidak meminta satu chatbot menebak semuanya. Kami memecah pekerjaan CSM menjadi keputusan kecil yang bisa diukur; setiap keputusan punya confidence dan bukti."
- "Yang yakin masuk graph, yang ragu ke manusia. Keputusan manusia ikut tersimpan sehingga sistem tahu kenapa tindakan sebelumnya diambil."
- "RAG membayar mahal setiap pertanyaan. Kami mengompilasi context saat data masuk, lalu pertanyaan multi-call cukup menelusuri graph."
- "Context graph adalah memori terstruktur untuk AI, bukan tumpukan teks."
