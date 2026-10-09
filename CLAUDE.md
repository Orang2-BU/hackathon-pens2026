# Tessera

> Dibuat oleh `project-setup-01` pada 9 Okt 2026. Ringkasan projek hackathon Track 3; PRD ACC 9 Okt 2026 (QA).

## Aplikasi

Tessera mengompilasi 15 file data sintetis KasirNusa dari `dataset_kasirnusa/` ke context graph agar CSM memprioritaskan 40 pelanggan, memeriksa bukti lintas sumber, menjawab pertanyaan baru, lalu menyetujui save plan. Jev menilai sinyal teks saat ingest; kode menghitung parameter numerik, ambang, dan skor prioritas; penjelasan dan draf save plan dirangkai template dari hasil query graph (tanpa LLM dulu, ADR-0005). Feedback pengguna dan tanggapan admin/CSM terpisah dari Decision. SalesTranscriptQA hanya opsi benchmark retrieval terpisah; hasil belum diukur.

## Stack & Verifikasi

- **Stack:** Next.js 16 + TypeScript + pnpm di `frontend/`, Tailwind v4, lucide-react, @xyflow/react, Vitest, knip; PostgreSQL via postgres.js; Jev; VPS Docker Compose; satu akun demo (ADR-0001, ADR-0005).
- Perintah dev/test/build/lint/typecheck/dead code ada di `docs/03-ARCHITECTURE.md` §2, dijalankan di `frontend/`.

## Aturan Wajib

@docs/07-RULES.md

## Aturan Main

@docs/06-WORKFLOW.md

## Konvensi

- Baca `docs/00-BRIEF.md` untuk study case/aturan; `docs/01-PRD.md` untuk scope; `docs/03-ARCHITECTURE.md` untuk task/teknis.
- UI wajib mengikuti `docs/08-DESIGN.md`, termasuk Standar UI anti tampilan AI: tanpa emoji, palet dari token, satu layar satu tugas, tanpa elemen tanpa fungsi.
- Saat membuat panggilan AI (ekstraksi, klasifikasi, skor, agent), ikuti §4b `docs/03-ARCHITECTURE.md`, `docs/JEV-LENS.md`, dan klien/pola di `docs/JEV-KIT.md`.
- Decision model memberi score/noul; kode yang memutuskan. Tidak menyebut indeks risk sebagai probabilitas churn.
- Semua kutipan dan tindakan punya source/provenance; human approval wajib; aplikasi tidak mengirim outreach.
- Beri label angka: `[study case]`, `[asumsi]`, `[riset: URL]`. Jangan membuat klaim benchmark sebelum ada run.
- Dataset KasirNusa sintetis; ZIP dan ekstraknya diabaikan Git. Jika SalesTranscriptQA dipakai, ikuti CC BY-NC 4.0, atribusi, dan penggunaan hackathon/nonkomersial.
- Status task berubah → update `docs/04-TODO.md` dengan bukti.

## Baca Dokumen

- Study case: `docs/00-BRIEF.md`
- Strategi, demo, layar: `docs/01-PRD.md`
- Pola kode: `docs/02-AGENT.md`
- Build plan + stack + Jev: `docs/03-ARCHITECTURE.md`
- Status: `docs/04-TODO.md`
- Pitch: `docs/05-PITCH.md`
- Workflow: `docs/06-WORKFLOW.md`
- Rules: `docs/07-RULES.md`
- Design: `docs/08-DESIGN.md`
- Lensa & API Jev: `docs/JEV-LENS.md`, `docs/JEV-KIT.md`
