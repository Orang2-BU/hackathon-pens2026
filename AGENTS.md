# Tessera

> Instruksi untuk AI coding assistant. Onboarding awal: 9 Okt 2026. PRD ACC 9 Okt 2026.

## Wajib sebelum ngoding

Baca `docs/00-BRIEF.md` sampai `docs/08-DESIGN.md` yang tersedia, lalu ikuti `docs/07-RULES.md`. `docs/05-PITCH.md` menjelaskan demo dan klaim yang boleh dibuat.

## Aplikasi

Tessera memakai dataset sintetis KasirNusa (`dataset_kasirnusa/`, dari ZIP lokal yang diabaikan Git) untuk membantu CSM memprioritaskan akun, menelusuri bukti lintas CRM, interaksi, pemakaian, tiket, kontrak, dan keputusan, lalu menyetujui save plan. Stack: Next.js 16 di `frontend/`, backend service `node:http` terpisah di `backend/` (ADR-0005/0006, kontrak `docs/13-BACKEND-CONTRACT.md`), PostgreSQL via postgres.js, VPS Docker Compose, satu akun demo (ADR-0001, `docs/adr/0003-stack-hosting-auth-llm.md`). Jev mengklasifikasi sinyal teks saat ingest; kode menghitung parameter numerik dan skor prioritas; penjelasan dan draf dirangkai template dari query graph (tanpa LLM dulu). SalesTranscriptQA hanya opsi benchmark retrieval terpisah, bukan validasi churn.

## Verifikasi

Perintah di `docs/03-ARCHITECTURE.md` §2, dijalankan di `frontend/`. Jangan klaim lolos tanpa menjalankannya.

## Aturan Ringkas

- Setiap perubahan: test, build, typecheck, lint, dead-code, fungsi terkait; UI juga browser 375/768/1440.
- Error: cari akar penyebab, perbaiki, ulangi semua cek. Tidak skip/suppress test atau klaim tanpa bukti.
- Ikuti YAGNI/ponytail; dependency baru dengan izin.
- UI wajib mengikuti `docs/08-DESIGN.md`, termasuk Standar UI anti tampilan AI: tanpa emoji, palet dari token, satu layar satu tugas, tanpa elemen tanpa fungsi. Pakai impeccable bila tersedia.
- AI calls untuk ekstraksi/klasifikasi/skor/agent: ikuti §4b `docs/03-ARCHITECTURE.md`, `docs/JEV-LENS.md`, dan klien/pola `docs/JEV-KIT.md`. Jev memberi output bertipe; kode memutuskan.
- Tidak ada outreach/email nyata; approval pengguna terautentikasi (CSM/admin) ditulis sebagai append-only Decision. Feedback dua arah terpisah dari approval dan tidak mengubah skor otomatis.
- Jangan commit secret/API key/dataset penuh; ZIP dan ekstraknya harus tetap diabaikan Git. Semua data KasirNusa sintetis. Jika SalesTranscriptQA dipakai, ikuti CC BY-NC 4.0 dan atribusi.
- Update `docs/04-TODO.md` saat progres berubah; laporan akhir mengikuti `docs/07-RULES.md`.

## Baca sesuai kebutuhan

Study case → `docs/00-BRIEF.md`; scope/demo → `docs/01-PRD.md`; konvensi → `docs/02-AGENT.md`; build/stack → `docs/03-ARCHITECTURE.md`; tugas → `docs/04-TODO.md`; pitch → `docs/05-PITCH.md`; workflow → `docs/06-WORKFLOW.md`; aturan → `docs/07-RULES.md`; UI → `docs/08-DESIGN.md`; rencana KasirNusa → `docs/09-BUILD-PLAN-KASIRNUSA.md`; kolom, parameter, dan batasan dataset → `docs/10-DATA-PROFILE-KASIRNUSA.md`; Jev → `docs/JEV-LENS.md` dan `docs/JEV-KIT.md`.
