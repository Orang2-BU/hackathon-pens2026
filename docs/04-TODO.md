# 04 — TODO: Progres Build

> AI wajib memperbarui file ini setiap status task berubah. ID sama dengan 03-ARCHITECTURE.

**Legenda:** ⬜ Todo · 🟦 In Progress · ✅ Done · ⛔ Blocked · ✂️ Dipotong

**Deadline:** 10 Okt 2026, 09.00 [asumsi; konfirmasi] · **Feature freeze:** belum ditetapkan · **Update terakhir:** 9 Okt 2026, docs draf

## Task

| ID | Task | Pemilik | Target | Status | Bukti / Catatan |
|---|---|---|---|---|---|
| T1 | Scaffold Next.js + SQLite + design tokens + nav | — | — | 🟦 | 9 Okt: 08-DESIGN disejajarkan ke referensi InsightX + PRD (lint 0 error, tanpa warning kontras). Frontend memakai token hasil export (`frontend/src/app/theme.css`), shell 4 menu + drawer `<dialog>`. test 4/4, typecheck, lint, knip, build hijau. SQLite belum. |
| T2 | Fetch/compile Jev signal + entity resolution + review | — | — | ⬜ | Wajib; uji primitif dan kutipan |
| T3 | Benchmark grep vs graph + Jev judge | — | — | ⬜ | Wajib sebelum klaim; B2B multi-call |
| T4 | Multi-hop graph query + evidence + deterministic risk | — | — | ⬜ | Must |
| T5 | Save plan review + Decision write-back | — | — | ⬜ | Must; no outreach nyata |
| T6 | UI golden path + responsive verification | — | — | 🟦 | 9 Okt: UI ulang sesuai 08-DESIGN. Browser 375/768/1440 tanpa scroll horizontal di 5 route; drawer buka/Escape/fokus kembali/scroll lock lulus; approve save plan → decision history dan review approve → hitungan turun, dicek di browser. Data masih seed sintetis, backend belum. |
| T7 | Reproduce metrics + pitch + fallback | — | — | ⬜ | Must |
| T8 | Expansion signal (noul) | — | — | ⬜ | Should |
| T9 | Bandingkan dua akun | — | — | ⬜ | Could |
| T10 | Filter jalur bukti per tipe node | — | — | ⬜ | Could |
| T11 | Preview ambang confidence → isi antrean review | — | — | ⬜ | Could; tanpa write sampai disimpan eksplisit |

## Golden Demo Path Check

| Langkah | Status | Dicek |
|---|---|---|
| 1. Data → Jev signals → graph; biaya kompilasi | ⬜ | — |
| 2. Jawaban akun dengan jalur bukti dua call | ⬜ | — |
| 3. Baseline vs graph: akurasi, biaya, latensi aktual | ⬜ | — |
| 4. Save plan, review dan approval manusia | ⬜ | — |
| 5. Decision tersimpan; query berikutnya menemukannya | ⬜ | — |

## Scope Cut

| Fitur/task | Alasan | Jam |
|---|---|---|
| Integrasi CRM, pengiriman email, multi-tenant production | Tidak melayani golden demo; risiko izin/security | 9 Okt |
| Lookalike & promosi otomatis | Roadmap/slide saja | 9 Okt |

## Log

| Tanggal | Ringkasan |
|---|---|
| 9 Okt 2026 | TODO awal; semua task belum dikerjakan |
