# 07 — RULES: Aturan Wajib

> Aturan tertinggi projek. Berlaku bagi setiap AI dan setiap perubahan kode.

## 1. Tuntaskan Permintaan

Kerjakan sampai kriteria selesai terpenuhi. Jangan menyerahkan pekerjaan setengah jadi sebagai selesai. Jangan mengembangkan fitur di luar PRD/TODO tanpa izin.

## 2. Verifikasi Wajib

Jalankan di `frontend/`:

| Cek | Perintah |
|---|---|
| Test | `pnpm test` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Dead code | `pnpm exec knip` |
| Design tokens jika 08 berubah | `npx -p @google/design.md designmd lint docs/08-DESIGN.md` |
| Golden demo path | `pnpm dev`, jalankan `docs/01-PRD.md` §5 end-to-end |
| Benchmark jika data/retrieval/model berubah | `node scripts/benchmark.ts` (belum ada; dibuat bila benchmark dijalankan) dan simpan output aktual |

Script test/build/typecheck/lint/knip sudah ada. Script yang belum ada dilaporkan sebagai belum tersedia; jangan mengarang hasil.

## 3. Siklus Error

1. Reproduksi dan baca error lengkap.
2. Temukan akar penyebab serta semua caller/path terkait.
3. Perbaiki penyebab; tambah satu test regresi bila logika nontrivial.
4. Jalankan ulang test terkait dan seluruh pemeriksaan wajib.
5. Berhenti hanya ketika hijau atau laporkan blocker nyata beserta risikonya.

## 4. Dilarang

- Skip/menonaktifkan test, melonggarkan assertion, `any`, `@ts-ignore`, `eslint-disable`, atau suppress error agar lolos.
- Mengarang hasil, biaya, akurasi, latency, data, kutipan, atau sumber.
- Membocorkan answer/source label ke retrieval benchmark.
- Menyebut risk score sebagai probabilitas churn atau nilai kontrak tertimbang sebagai kerugian pasti.
- Mengubah parameter, skor, atau Decision otomatis berdasarkan Feedback; pendapat pengguna harus ditinjau terpisah.
- Menyajikan overlay sintetis sebagai data dataset/real.
- Mengirim email/outreach, deploy, push, atau memakai layanan berbayar tanpa izin.
- Menaruh secret/API key di source, browser bundle, log, docs, screenshot, atau commit.

## 5. Kejujuran dan Reproducibility

Pemeriksaan yang tidak dapat dijalankan harus menyebutkan perintah, alasan, dan risiko. Setiap angka pitch mencantumkan `[study case]`, `[asumsi]`, atau `[riset: URL]`. Hasil benchmark mencatat corpus revision/hash, question IDs/seed, N, model string, prompt/rubric version, judge, token/context budget, errors, timestamp, dan raw output.

## 6. Data, Keamanan, dan Privasi

- SalesTranscriptQA hanya untuk hackathon/nonkomersial sesuai CC BY-NC 4.0; atribusi Salesforce + Endgame Labs.
- Dataset KasirNusa sintetis dari ZIP lokal; ZIP dan folder ekstrak harus diabaikan Git dan tidak dimasukkan ke commit.
- Data pelanggan nyata memerlukan izin; minimalkan, redaksi PII yang tidak dibutuhkan, jangan commit/upload tanpa persetujuan.
- Semua request provider berjalan server-side. Validasi input dan respons. Retry hanya error sementara; jangan retry 401/403.
- Approval Decision atomik, idempotent, append-only. Merge entitas tidak menghapus sumber.
- Ingest dan approval hanya untuk pengguna aplikasi terautentikasi (CSM/admin). Feedback dua arah menyimpan penulis, waktu, konteks, dan tanggapan; akses tulis publik tidak dibuka tanpa identitas dan pembatasan laju.
- Kutipan harus cocok dengan source span; jawaban tanpa bukti cukup abstain.

## 7. Nol Dead Code dan Ponytail

- Tidak ada import, export, fungsi, komponen, route, file, dependency, feature flag mati, debug log, atau kode commented-out yang tak dipakai.
- Urutan solusi: tidak perlu dibuat → reuse → stdlib → platform/framework → dependency yang ada → dependency baru dengan izin.
- Kode minimum yang benar; tanpa abstraksi, layer, atau config untuk kebutuhan hipotetis.
- Logika bisnis nontrivial meninggalkan satu test runnable. Kesederhanaan tidak mengorbankan validasi boundary, data loss prevention, security, accessibility, atau requirement eksplisit.

## 8. UI/UX

- Ikuti `docs/08-DESIGN.md`; hanya token resmi, export theme, tidak hardcode warna/radius/spacing di luar kebutuhan runtime data.
- Pakai `impeccable` untuk UI dan `ponytail` untuk implementasi bila tersedia.
- Responsif 375px, 768px, 1440px; tidak ada horizontal page scroll.
- WCAG AA: teks normal ≥4.5:1; teks besar dan elemen UI ≥3:1; focus terlihat; keyboard lengkap; target ≥44px di bawah 1200px.
- Semua state: hover, active, focus, disabled, loading, empty, error; label input; `aria-label` untuk ikon tanpa teks.
- Lulus Prinsip UX 1–9 dan **Standar UI A1–A8** di Do's and Don'ts 08-DESIGN: tanpa emoji, palet token, satu layar satu tugas, navigasi fokus, tanpa elemen tanpa fungsi, data dapat dibandingkan.
- Verifikasi browser desktop/mobile dan alur drawer: buka, focus trap, Escape, focus kembali, scroll lock.

## 9. Jev dan Benchmark

- Ikuti `03-ARCHITECTURE` §4b, `docs/JEV-LENS.md`, `docs/JEV-KIT.md`.
- Jev mengklasifikasi/memberi score/noul; kode memutuskan write/review/discard atau risk formula.
- Confidence bukan bukti kalibrasi. Ukur pada eval set berlabel; laporkan sample size dan uncertainty.
- Baseline dan graph memakai corpus, questions, answerer, judge dan budget sama. Laporkan biaya query dan biaya ingest/amortisasi terpisah.
- Jangan mengubah eval set setelah melihat hasil tanpa mencatat perubahan/version.

## 10. Output Perintah Hemat

Pakai RTK untuk git, package manager, test, build, lint, Docker, dan output besar bila tersedia. Jika output ringkas kosong/bertentangan/rusak, jalankan raw atau `rtk proxy`. Gabungkan cek terkait tanpa menyembunyikan error.

## 11. Laporan Akhir

```markdown
### Perubahan
- file: perubahan dan alasan

### Pemeriksaan
| Cek | Perintah | Hasil |
|---|---|---|
| Test | ... | ... |
| Build | ... | ... |
| Typecheck | ... | ... |
| Lint | ... | ... |
| Dead code | ... | ... |
| Golden demo path | ... | ... |
| UI: Standar UI A1–A8 | browser 375/768/1440 | ... |
| Benchmark (jika terdampak) | ... | ... |

### Tidak bisa dijalankan / catatan
- Tidak ada, atau blocker + risiko.
```
