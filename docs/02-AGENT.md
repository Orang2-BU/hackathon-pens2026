# 02 — AGENT: Instruksi untuk AI

> Konvensi minimum untuk developer dan AI pada Tessera (nama kerja sebelumnya: Relasi).

## 1. Konteks

- **Aplikasi:** Tessera — context graph untuk membantu CSM memprioritaskan akun, memeriksa bukti, dan menyetujui save plan.
- **Stack:** Next.js App Router dipilih; PostgreSQL untuk demo publik diterima pada ADR-0001. TypeScript strict, Jev, Tailwind v4, React Flow, library DB, dan hosting masih usulan/keputusan terbuka sesuai `03-ARCHITECTURE.md` dan backlog.
- **Sumber kebenaran:** `docs/07-RULES.md`, lalu instruksi user, `docs/00-BRIEF.md`, PRD dan arsitektur.

## 2. Struktur Folder

```text
src/
  app/                  # routes, layouts, route handlers
    accounts/           # daftar dan detail akun
    review/             # antrean review
    benchmark/          # hasil benchmark
    data/               # ingest/status
  components/           # komponen UI yang dipakai lebih dari satu route
  lib/
    db/                 # schema, connection, queries
    jev/                # client, schemas, primitive definitions
    graph/              # writes and traversals
    risk/               # formula deterministik
    benchmark/          # baseline, graph arm, judge, metrics
    thresholds.ts       # ambang control flow
scripts/                # fetch, seed, compile, benchmark
tests/                  # integration/golden-path tests
data/                   # gitignored dataset/cache; fixtures kecil boleh dilacak
```

Path dan folder pada peta ini adalah target rencana, belum diverifikasi sebagai file yang ada karena scaffold aplikasi belum tersedia. Buat folder hanya ketika file pertama dibutuhkan. Jangan scaffold direktori kosong.

## 3. Gaya Koding

- Komponen/type: `PascalCase`; fungsi/variabel: `camelCase`; konstanta: `UPPER_SNAKE_CASE`; file: `kebab-case.ts[x]`.
- TypeScript `strict`; `unknown` pada boundary, validasi dengan Zod, lalu narrow. Tidak memakai `any`, `@ts-ignore`, atau cast untuk menyembunyikan error.
- Server Component dahulu. Tambah `"use client"` hanya untuk interaksi browser/React Flow.
- Fungsi kecil, satu tanggung jawab. Gunakan platform/framework/stdlib sebelum dependency.
- Semua nilai uang membawa ISO currency; jangan menjumlah mata uang berbeda. Parameter risiko adalah faktor bersumber; skor prioritas 0–100 bukan probabilitas churn.
- DB writes memakai transaction dan idempotency key. Decision append-only; sumber mentah tidak dihapus saat merge.
- API error dibedakan: invalid input 400, auth/provider config 401/503, conflict 409, unexpected 500. UI mendapat pesan aman; log tidak memuat API key atau data pelanggan mentah.
- Waktu disimpan ISO-8601 UTC; format locale hanya di UI.
- Ambang di `src/lib/thresholds.ts`, bukan terselip di prompt/komponen.
- Formatter/linter: config scaffold Next.js adalah sumber kebenaran; jangan menambah Prettier jika ESLint/editor cukup.

## 4. Komentar

- Bahasa Inggris untuk code/comment; UI dan dokumentasi Indonesia.
- Komentar menjelaskan alasan, batas, atau provenance. Jangan mengulang kode.
- Gunakan `ponytail:` hanya untuk simplifikasi sengaja dengan ceiling dan upgrade path.
- Jangan simpan kode commented-out atau debug log.

## 5. Testing

- **Framework:** Vitest; file `*.test.ts` dekat modul atau `tests/` untuk integrasi.
- Wajib: ambang Jev, formula risiko, dedupe/merge guard, temporal query, idempotent approval, benchmark split/no leakage, parsing response/API error.
- Satu fixture kecil berlabel; test tidak memanggil API eksternal kecuali health-check manual.
- Test nontrivial memakai Arrange–Act–Assert; satu perilaku per test.
- Golden path manual tetap wajib setelah perubahan lintas route/data.

## 6. Dependency

- Package manager `pnpm`; lockfile wajib.
- Dependency baru memerlukan izin dan alasan. Jangan tambah ORM, state manager, chart library, graph DB, UI kit, atau wrapper AI tanpa bukti kebutuhan.
- API Jev memakai native `fetch`; Zod sudah dipakai untuk boundary validation.

## 7. Git

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.
- Branch per task bila repo sudah dibuat. Jangan push/deploy tanpa izin.
- Jangan commit `.env*`, API key, dataset penuh, cache berisi data pelanggan, atau hasil berlisensi yang tak boleh didistribusikan.

## 8. UI, Data, Keamanan

- Ikuti `docs/08-DESIGN.md` termasuk Standar UI A1–A8. Tidak ada emoji sebagai ikon.
- Bahasa UI Indonesia; ID/model/error teknis tetap aslinya.
- Semua synthetic overlay diberi label dekat nilai, bukan hanya di footer.
- Kutipan hanya berasal dari source span valid. Jawaban tanpa bukti cukup harus abstain.
- Approval tidak mengirim email; label tombol menyebut konsekuensinya.
- Dataset KasirNusa sintetis dari ZIP lokal; jangan commit ZIP atau ekstraknya. SalesTranscriptQA hanya bila dipakai sebagai benchmark retrieval terpisah, sesuai CC BY-NC 4.0.
- `JEV_API_KEY` dan key model generatif hanya dari environment server; tidak pernah dikirim ke client bundle.
