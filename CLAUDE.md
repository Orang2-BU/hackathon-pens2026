# Relasi

> Dibuat oleh `project-setup-01` pada 9 Okt 2026. Ringkasan projek hackathon Track 3; status docs masih menunggu ACC.

## Aplikasi

Relasi mengompilasi sinyal call/tiket ke context graph agar CSM memprioritaskan risiko, memeriksa bukti lintas call, lalu menyetujui save plan. Jev dipakai untuk klasifikasi dan entity resolution di write time; kode menghitung risk score dan mengatur threshold. Benchmark utama SalesTranscriptQA B2B multi-call melawan baseline grep/RAG; hasil belum diukur. Usage/invoice seed sintetis dilabeli terbuka.

## Stack & Verifikasi

- **Stack tetap:** Next.js. **Usulan:** TypeScript, SQLite, Jev, Tailwind v4, React Flow.
- Perintah dev/test/build/lint/typecheck/dead code dicatat di `docs/03-ARCHITECTURE.md`; belum bisa dijalankan sebelum scaffold T1.

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
- SalesTranscriptQA CC BY-NC 4.0: atribusi, hackathon/nonkomersial saja.
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
