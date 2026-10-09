# Jev Kit — API, pola, dan benchmark hari H

Sumber: link mentor Kyle Wild / Endgame Labs, dibaca 9 Okt 2026. Cocokkan lagi dengan quickstart TypeSafe saat hari H karena API dapat berubah.

> Dataset demo utama sekarang KasirNusa sintetis di `dataset_kasirnusa/`; bagian SalesTranscriptQA adalah opsi benchmark retrieval terpisah. Ambang implementasi terkini mengikuti `03-ARCHITECTURE.md` §4b dan `07-RULES.md`.

## 1. Jev API

```http
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer $JEV_API_KEY
Content-Type: application/json
```

```json
{
  "model": "jev-latest",
  "state": { "text": "hello world" },
  "questions": {
    "is_greeting": {
      "type": "noul",
      "instructions": "Is the text a greeting?"
    }
  }
}
```

- `state`: JSON bebas, kirim sekecil mungkin; batas sekitar 32k token.
- `questions`: map nama pertanyaan. Batch banyak pertanyaan dalam satu request.
- `score`: `criteria` berurutan dari nilai rendah ke tinggi.
- `noul`: probabilitas jawaban ya tanpa field confidence terpisah.
- `score`: `score`, `confidence`, `probabilities`. Jangan mengasumsikan properti response lain selain kontrak yang terverifikasi.
- Catat `usage.input_tokens` / `usage.output_tokens`; waktu request diukur aplikasi.
- Retry 429, 5xx, dan jaringan maksimal 3 kali: 0,5 s, 1 s, 2 s. Timeout 60 s.

### TypeScript minimal

```ts
export async function jev(state: unknown, questions: unknown) {
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JEV_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "jev-latest", state, questions }),
  });
  if (!response.ok) throw new Error(`Jev ${response.status}`);
  return response.json();
}
```

Health-check: `state: { text: "hello world" }` dan `noul: "Is the text a greeting?"`.

## 2. Pola implementasi Tessera

### Kompilasi write time

```text
interaksi JSONL / deskripsi tiket KasirNusa
  → potong per giliran bicara atau ±2.000 karakter
  → satu batch Jev per chunk:
     - champion pergi? (noul)
     - kompetitor disebut? (noul)
     - sentimen memburuk? (score)
     - urgensi? (score)
     - peluang expansion? (noul)
  → kode menerapkan ambang pada keluaran sesuai primitif; Signal menyimpan keluaran Jev, kutipan, dan sumber
```

### Entity resolution dua tahap

```text
normalisasi nama + domain email
  → kandidat pasangan serupa
  → Jev noul: “Apakah dua entitas ini sama?”
  → p ≥ 0,95 dan tanpa konflik hard ID: merge; 0,60–0,95 review; <0,60 pisah
```

### Query time

```text
pertanyaan CSM
  → traversal Akun → Interaksi/Tiket/Outlet/Kontrak → Signal / Decision
  → Jev score: chunk ini relevan untuk jawaban?
  → 3–6 bukti + jalur graph
  → LLM generatif hanya menyusun jawaban / draf save plan
```

## 3. SalesTranscriptQA

Perintah di bawah adalah contoh dari catatan benchmark, bukan perintah yang sudah diverifikasi atau dijalankan di repository ini. Eksekusinya tetap opsional dan menunggu keputusan penggunaan dataset/lisensi yang sesuai.

- 10.829 transkrip verbatim dan 2.962 QA direview.
- B2B multi-call: 428 pertanyaan, masing-masing perlu dua call dalam satu opportunity.
- Lisensi data: **CC BY-NC 4.0**; layak untuk hackathon, bukan distribusi/produk komersial. Atribusi Salesforce + Endgame Labs.
- CLI: MIT.

```sh
uv tool install git+https://github.com/Endgame-Labs/SalesTranscriptQA.git
salestranscriptqa fetch --repo EndgameLabs/SalesTranscriptQA --revision 183bd79178a3555351d25400225001a9b27ecc2f --data-dir salestranscriptqa-data
salestranscriptqa documents export --domain b2b --output calls.jsonl
salestranscriptqa questions export --domain b2b --question-class multi_call --output multicall.jsonl
salestranscriptqa validate answers.jsonl --domain b2b
salestranscriptqa score answers.jsonl --domain b2b --judgments judgments.jsonl --output scores.json
```

Jawaban: `{"question_id":"...","answer":"...","retrieved_call_ids":["CALL_1","CALL_2"]}`.

Penilaian: buat paket `judge-input`; Jev `noul` menilai jawaban terhadap referensi; tulis `judgments.jsonl`; jalankan `score`. Index seluruh korpus, jangan membatasi call ke label sumber.

| Konfigurasi publik | Overall | Multi-call |
|---|---:|---:|
| Hybrid RAG | 87,5% | 63,3% |
| Hybrid + reranker | 96,3% | 81,3% |
| Oracle | 99,9% | 100% |

Bandingkan hanya run internal pada subset dan judge yang sama. Angka publik hanya konteks.

## 4. Checklist benchmark

Per arm dan per pertanyaan, simpan: jawaban, `retrieved_call_ids`, keputusan Jev, token masuk/keluar, harga token bila tersedia, latensi, dan error. Ringkas menjadi: akurasi, biaya/pertanyaan, median/p95 latensi, jumlah call terambil benar. Tampilkan baseline grep/RAG berdampingan dengan context graph + Jev.
