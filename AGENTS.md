# Relasi

> Instruksi untuk AI coding assistant. Onboarding awal: 9 Okt 2026. Docs belum ACC.

## Wajib sebelum ngoding

Baca `docs/00-BRIEF.md` sampai `docs/08-DESIGN.md` yang tersedia, lalu ikuti `docs/07-RULES.md`. `docs/05-PITCH.md` menjelaskan demo dan klaim yang boleh dibuat.

## Aplikasi

Relasi membantu CSM menemukan sinyal churn lintas call, melihat bukti dan konteks historis, kemudian menyetujui save plan. Next.js sudah dipilih; SQLite dan dependency lain masih usulan. Jev mengklasifikasi di write time; kode memakai ambang dan menghitung risk index. SalesTranscriptQA menguji retrieval, bukan prediksi churn. Synthetic usage/invoice harus selalu ditandai.

## Verifikasi

Perintah sesudah scaffold tercantum dalam `docs/03-ARCHITECTURE.md`; sebelum T1, test/build/typecheck/lint/dead-code belum tersedia. Jangan klaim sudah lolos.

## Aturan Ringkas

- Setiap perubahan: test, build, typecheck, lint, dead-code, fungsi terkait; UI juga browser 375/768/1440.
- Error: cari akar penyebab, perbaiki, ulangi semua cek. Tidak skip/suppress test atau klaim tanpa bukti.
- Ikuti YAGNI/ponytail; dependency baru dengan izin.
- UI wajib mengikuti `docs/08-DESIGN.md`, termasuk Standar UI anti tampilan AI: tanpa emoji, palet dari token, satu layar satu tugas, tanpa elemen tanpa fungsi. Pakai impeccable bila tersedia.
- AI calls untuk ekstraksi/klasifikasi/skor/agent: ikuti §4b `docs/03-ARCHITECTURE.md`, `docs/JEV-LENS.md`, dan klien/pola `docs/JEV-KIT.md`. Jev memberi output bertipe; kode memutuskan.
- Tidak ada outreach/email nyata; approval CSM ditulis sebagai append-only Decision.
- Jangan commit secret/API key/dataset penuh. SalesTranscriptQA CC BY-NC 4.0, hackathon nonkomersial dengan atribusi.
- Update `docs/04-TODO.md` saat progres berubah; laporan akhir mengikuti `docs/07-RULES.md`.

## Baca sesuai kebutuhan

Study case → `docs/00-BRIEF.md`; scope/demo → `docs/01-PRD.md`; konvensi → `docs/02-AGENT.md`; build/stack → `docs/03-ARCHITECTURE.md`; tugas → `docs/04-TODO.md`; pitch → `docs/05-PITCH.md`; workflow → `docs/06-WORKFLOW.md`; aturan → `docs/07-RULES.md`; UI → `docs/08-DESIGN.md`; Jev → `docs/JEV-LENS.md` dan `docs/JEV-KIT.md`.
