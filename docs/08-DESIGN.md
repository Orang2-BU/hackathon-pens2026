version: alpha
name: "Tessera"
description: "Dashboard CS gelap bernuansa olive dengan aksen lime, sidebar tergrup, kartu radius besar, padat bukti."
colors:
  primary: "#A3E635"
  on-primary: "#1A2405"
  secondary: "#232619"
  on-secondary: "#EDF2E4"
  neutral: "#0B0D06"
  surface: "#16180F"
  surface-raised: "#1E2113"
  on-surface: "#F2F5EA"
  on-surface-muted: "#A7ADA0"
  outline: "#2C2F1E"
  hero-gradient-from: "#5A6B2F"
  hero-gradient-to: "#333F14"
  success: "#A3E635"
  warning: "#E9C681"
  danger: "#F08A80"
  on-danger: "#2A0F0C"
  focus-ring: "#D3F36B"
  graph-account: "#A3E635"
  graph-conversation: "#86BBD8"
  graph-signal: "#E9C681"
  graph-decision: "#CFB1E3"
  graph-evidence: "#A7ADA0"
typography:
  headline-lg:
    fontFamily: "Inter"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline-md:
    fontFamily: "Inter"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  metric:
    fontFamily: "Inter"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
  label-caps:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "44px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: "44px"
  search-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-hero:
    backgroundColor: "{colors.hero-gradient-to}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  sidebar:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  nav-active:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.full}"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.full}"
  divider:
    backgroundColor: "{colors.outline}"
  focus-ring:
    backgroundColor: "{colors.focus-ring}"
---

# Tessera — Design System

> Sumber kebenaran UI. Format [Google DESIGN.md spec](https://github.com/google-labs-code/design.md) alpha; nilai resmi pada YAML. Status: disesuaikan 9 Okt 2026 dengan referensi visual baru (screenshot dashboard "InsightX") dan nama produk **Tessera** (sebelumnya Relasi).

## Overview

Mode **Operate** untuk CSM/AM yang memeriksa bukti dan bertindak sepanjang hari. Bahasa visual mengikuti referensi: kanvas nyaris hitam bernuansa olive, sidebar tergrup dengan item aktif pill putih, kartu radius besar (20px), satu kartu hero bergradien olive untuk ringkasan terpenting, aksen lime jenuh untuk grafik dan state terpilih, angka metrik besar dan tegas.

Referensi dipakai sebagai **bahasa visual** (warna, radius, sidebar, kartu, grafik), bukan sebagai isi: layar Tessera tetap diturunkan dari tugas CS (peringkat risiko, bukti, save plan), bukan dashboard revenue generik. Tidak menyalin nama/brand referensi, KPI revenue/conversion, promo card, atau feed notifikasi global.

- **Mode:** dark saja.
- **Kontras:** lime #A3E635 untuk aksen/grafik/state; teks aksi di atas lime memakai #1A2405. Teks isi tetap #F2F5EA/#A7ADA0 agar AA.

## Colors

Palet netral hampir hitam dengan bias olive untuk konten berjam-jam; lime muncul pada aksi utama, state terpilih, garis grafik, dan node Account.

- **Primary #A3E635 / on-primary #1A2405:** satu aksi utama per layar, state aktif, garis tren, node Account.
- **Hero gradient #5A6B2F → #333F14:** hanya kartu ringkasan teratas satu layar (mis. total nilai tertimbang prioritas); jangan seluruh layar menjadi hijau.
- **Secondary #232619 / on-secondary #EDF2E4:** kontrol sekunder dan panel fokus.
- **Neutral #0B0D06 / surface #16180F / surface-raised #1E2113:** kanvas, kartu, kartu di atas kartu. Teks #F2F5EA / muted #A7ADA0, outline #2C2F1E.
- **Status:** success #A3E635, warning #E9C681, danger #F08A80 — selalu dengan label tekstual dan nilai; risiko tidak direduksi menjadi warna saja.
- **Graph:** Account lime, Conversation biru #86BBD8, Signal amber, Decision ungu, Evidence abu-abu. Edge default `outline`; jalur bukti terpilih `focus-ring`, node lain diredupkan, bukan disembunyikan. Legend selalu berlabel.

## Typography

Inter, fallback `system-ui, sans-serif`. Satu keluarga; angka tabular untuk uang, skor, biaya, waktu. Angka metrik memakai token `metric` (28px/700) seperti referensi.

- Headline 32/1.2 dan 24/1.25; title 18/1.3; body 16/1.5; pendukung 14/1.5.
- Label kecil abu-abu di atas angka besar; delta ditulis teks berwarna (naik lime, turun danger) tanpa pill berat.
- Judul mengidentifikasi tugas layar (mis. "Peringkat Risiko"), bukan label generik.

## Layout

- **Kerangka aplikasi (mengikuti referensi):** sidebar kiri ±240px berisi logo/nama produk, grup navigasi berlabel section (mis. Utama: Peringkat Risiko, Detail Akun; Kerja: Review, Save Plan; Sistem: Data, Pengaturan), dan kartu pengguna di bawah. Konten di kanan: top bar berisi judul layar + search pill + aksi ikon, lalu grid kartu.
- **Grid:** konten max 1280px, 12 kolom desktop, gutter 24px. Kartu ringkasan (termasuk hero) satu baris di atas; grafik/tabel utama di bawahnya.
- **Breakpoint & navigasi:**

| Nama | Lebar | Grid | Navigasi |
|---|---|---|---|
| Mobile | <768px | 1 kolom, margin/gutter 16px | Burger 44×44 + drawer |
| Tablet | 768–1199px | 2 kolom, gutter 16px | Burger + drawer |
| Desktop | ≥1200px | 12 kolom, max 1280px | Sidebar Peringkat / Review / Save Plan / Data |

- **Drawer:** kiri, ≤85vw, scrim; tutup via scrim/close/Esc/memilih item. `aria-expanded` dan `aria-controls`; fokus masuk dan terkunci selama terbuka; scroll halaman terkunci. Header sticky.
- **Mobile:** urutan Peringkat = prioritas → parameter/bukti → daftar; Detail = nama/nilai kontrak → jawaban → bukti → save plan → histori/feedback. Graph kecil menjadi daftar jalur bukti tekstual; bukan canvas geser horizontal. Tabel lebar memakai detail per baris, bukan page overflow.
- Target sentuh ≥44×44 di bawah 1200px, ≥36px desktop. Body ≥16px mobile. Tanpa scroll horizontal pada 360px.

| Layar | Tugas | Pola | Informasi utama | Sekunder |
|---|---|---|---|---|
| Peringkat risiko | Prioritaskan | Hero ringkasan + tabel terurut | Nama akun, parameter risiko, level prioritas, nilai tertimbang | Cakupan data, tanggal renewal |
| Detail akun | Periksa bukti dan tindak | Jawaban + jalur bukti, tab Sumber/Keputusan/Save plan | Kutipan, alasan prioritas, grafik tren akun | Confidence, timestamp |
| Review/save plan | Putuskan | Satu item, preseden di samping, dua pilihan jelas | Bukti, dampak approve/reject | Model/rubrik |
| Data | Kompilasi | Daftar job/sumber sederhana | Status ingest, jumlah sinyal, biaya Jev | Hash/model, error |

## Elevation & Depth

Permukaan tonal bertingkat (neutral < surface < surface-raised) dan divider tipis. Kartu hero memakai gradien olive dua arah. Popover/dialog memakai shadow `0 8px 24px rgba(0,0,0,.28)` dan border outline. Tanpa glow dekoratif di luar kartu hero.

## Shapes

- **Radius:** sm 8px tag/chip, md 12px kontrol & item navigasi, lg 20px kartu/sidebar/panel; full hanya pill status dan search.
- **Ikon:** `lucide-react`, outline stroke 1.75, default 18–20px, di dalam chip persegi radius sm bila perlu seperti referensi. Tanpa emoji sebagai ikon. Tombol ikon wajib accessible name.
- **Grafik:** garis lime 2px dengan area fill lime transparan; garis pembanding putus-putus abu-abu; tooltip kartu surface-raised. Bubble/donut hanya bila datanya nyata (mis. komposisi parameter), memakai rumpun olive→lime.
- **Graph relasi:** node 8px berlabel jenis + timestamp; edge 1px, highlight jalur 2px; maksimal neighborhood relevan. Daftar bukti HTML sebagai alternatif keyboard/screen reader.
- **Gambar:** tidak ada ilustrasi/stock photo. Avatar hanya pada kartu pengguna sidebar bila identitas demo tersedia; selain itu kartu teks sederhana.

## Components

- **Button:** primary lime satu per layar; hover mengubah luminance, active tertekan halus, focus ring 2px dengan offset, disabled + alasan, loading dengan label tetap. Approval berbunyi "Setujui rencana — tanpa mengirim email"; tidak menciptakan kesan outreach otomatis.
- **Search pill:** radius full, ikon kaca pembesar, placeholder tugas ("Cari akun, kontak, tiket…"); bukan aksi utama.
- **Input:** label terlihat; error menjelaskan masalah dan cara memperbaiki.
- **Kartu metrik:** label kecil muted di atas, angka `metric`, delta teks berwarna, subjudul muted satu baris. Ikon chip di kanan atas + menu ⋯ hanya bila berfungsi.
- **Akun row:** nilai uang rata kanan, risiko di samping nama, kontrak/ID kecil. Kontrak sintetis berlabel di dekat nilai.
- **Evidence:** kutipan asli + ID sumber, waktu, confidence, asal sintetis/real; node graph highlight serentak saat dipilih. Bukti tak cukup → tulis "Bukti belum cukup".
- **Review:** pasangan entitas berdampingan; approve/reject berkonsekuensi eksplisit; tidak ada bulk approve.
- **Feedback:** input pendapat terkait akun/rencana + riwayat tanggapan CSM/admin; tampilkan penulis, waktu, status. Tidak mengubah prioritas/Decision otomatis.
- **Motion:** 180ms ease-out pada disclosure/selection; reduced-motion mematikan transisi. Tidak ada animasi dekoratif.
- **Empty/error:** empty menautkan langkah ingest; error Jev membedakan key/limit/jaringan; draft tidak hilang saat gagal; toast singkat hanya setelah tindakan berhasil.

## Do's and Don'ts

### Prinsip UX 1–9

| # | Prinsip | Penerapan |
|---|---|---|
| 1 | Tahan variasi konten | Nama panjang wrap; data kosong/partial/berlabel sintetis; jawaban tanpa bukti tampil sebagai abstain; graf dibatasi neighborhood |
| 2 | Konsisten | Satu grid, satu font Inter, satu set Lucide, token sama pada semua layar |
| 3 | Hierarki | Risiko dan nilai tertimbang besar; kutipan dekat jawaban; aksen lime bukan dekorasi |
| 4 | Info di titik keputusan | Confidence, sumber, masa berlaku tepat di samping Signal; preseden di samping save plan |
| 5 | Konsekuensi sebelum aksi | Tombol menyebut approval tidak mengirim email; dampak merge/reject di Review |
| 6 | Kurangi hambatan | Aksi plan tetap terlihat saat scroll; filter siap pakai; search pill global |
| 7 | Hapus berlebih | Tidak ada promo, feed notifikasi global, KPI berulang, menu setting kosong |
| 8 | Detail premium | Divider tipis, angka tabular, spacing dekat untuk bukti+kutipan |
| 9 | Aksi utama jelas | Satu primary pada tiap layar, tenang tanpa teks all-caps |

### Anti tampilan AI — Standar UI A1–A8

| Standar | Penerapan konkret |
|---|---|
| A1 Tanpa emoji | Semua ikon Lucide outline, label tombol tetap eksplisit |
| A2 Palet bukan bawaan AI | Palet olive-lime dari referensi tim; graph categorical dari token; glow hanya di kartu hero yang berfungsi |
| A3 Satu layar satu tugas | Peringkat prioritaskan, Detail buktikan/tindak, Review putuskan, Data ingest |
| A4 Navigasi fokus | Sidebar tergrup mengikuti tugas: Peringkat / Review / Save Plan / Data |
| A5 Rapikan keramaian | Aksi sekunder dalam ⋯; label panjang jadi detail/tooltip; angka rata kanan; nominal penting dominan |
| A6 Tanpa elemen kosong | Tombol/card/badge hanya bila berfungsi; tak ada chart revenue, promo tier, avatar dekoratif |
| A7 Wadah sesuai isi | Persetujuan singkat di modal; save plan panjang dalam tab; graph dapat diganti daftar bukti |
| A8 Data kaya dan banding | Tren akun vs periode sebelumnya berdampingan; graph untuk jalur bukti, timeline untuk waktu |

### Aksesibilitas dan review

- Do: target WCAG AA teks ≥4.5:1, teks besar/elemen UI ≥3:1; fokus terlihat; akses keyboard, Escape dan focus trap pada drawer/dialog; setiap input berlabel; status tidak warna saja. Uji 375/768/1440, tanpa overflow.
- Don't: node berwarna tanpa nama, nominal tanpa mata uang, angka biaya tanpa N, alert tanpa sumber, modal yang tidak bisa ditutup keyboard.
- Checklist: hanya token YAML; hover/focus/disabled/loading/empty/error; data ekstrem; lint 0 error tanpa warning `contrast-ratio`; Standar UI A1–A8 terpenuhi.

## Deviations from Reference

| Aspek | Screenshot referensi | Tessera | Alasan |
|---|---|---|---|
| Brand & isi | "InsightX", revenue/conversion, donut revenue | Tessera; peringkat risiko, nilai tertimbang, jalur bukti | Referensi hanya bahasa visual; isi dari PRD KasirNusa |
| Kartu hero | Gradien olive untuk Total Revenue | Gradien olive untuk ringkasan prioritas tertinggi | Mempertahankan bahasa visual tanpa KPI generik |
| Navigasi | Overview/Analytics/Reports dst. | Peringkat / Detail / Review / Save Plan / Data | A3/A4/A6 |
| Grafik | Tren penjualan tahunan | Tren transaksi akun 12 bulan + perbandingan periode | Data nyata dari dataset |

## Implementation

Ekspor token dari YAML; jangan tulis ulang nilai warna di source. Tailwind v4:

```sh
npx -p @google/design.md designmd lint docs/08-DESIGN.md
npx -p @google/design.md designmd export --format css-tailwind docs/08-DESIGN.md > src/app/theme.css
```

`theme.css` dibuat saat scaffold, tidak dibuat saat docs.

## Changelog

| Tanggal | Perubahan |
|---|---|
| 9 Okt 2026 | Dokumen awal (hackathon) |
| 9 Okt 2026 | Nama produk menjadi Tessera; bahasa visual disesuaikan referensi baru (kanvas olive-hitam, lime #A3E635, kartu radius 20px, sidebar tergrup, kartu hero gradien olive) |
...[truncated 2491 chars]