---
version: alpha
name: "Relasi"
description: "Dashboard CS gelap, tenang, padat bukti, dengan aksen hijau yang terukur."
colors:
  primary: "#97D977"
  on-primary: "#102018"
  secondary: "#283135"
  on-secondary: "#F0F4F0"
  neutral: "#111216"
  surface: "#1B1E21"
  on-surface: "#F0F4F0"
  on-surface-muted: "#B5BFB9"
  outline: "#505A55"
  success: "#97D977"
  warning: "#E9C681"
  danger: "#E6A49E"
  on-danger: "#241714"
  focus-ring: "#C8ED9A"
  graph-account: "#97D977"
  graph-conversation: "#86BBD8"
  graph-signal: "#E9C681"
  graph-decision: "#CFB1E3"
  graph-evidence: "#B5BFB9"
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
  sm: "4px"
  md: "8px"
  lg: "12px"
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
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
  caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
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

# Relasi — Design System

> Sumber kebenaran UI. Format [Google DESIGN.md spec](https://github.com/google-labs-code/design.md) alpha; nilai resmi pada YAML. Status: Draf — menunggu ACC · Kemiripan referensi: belum diukur (tanpa preview) · Lint: belum dijalankan.

## Overview

Mode **Operate** untuk CSM yang memeriksa bukti dan bertindak sepanjang hari. Gelap, padat, tertib, terpercaya. Screenshot pengguna hanya **referensi gaya**: tiga zona, sidebar tipis, konten data dominan, permukaan tonal dan hijau sebagai penanda. Layar Relasi diturunkan dari tugas CS, bukan disalin menjadi dashboard revenue generik.

- **Referensi:** screenshot 1200×900; ekstraksi piksel dengan `extract_colors.py` menunjukkan #111216 (~27,3%), #283135 (~10,7%), #1b1e21 (~8,8%), #6fce8e (~12,7%) dan #18b86b (~11,3%). Persentase mencakup latar dekoratif luar aplikasi; jangan menganggapnya proporsi UI. Inter dan radius 8–12px adalah perkiraan dari gambar, **bukan nilai terukur**.
- **Mode:** dark saja [asumsi sesuai screenshot]. Tidak menyalin glow/latar gradien hijau besar, promo card, chart tanpa tugas, feed notifikasi global, avatar gradasi, atau nav penuh item mati.
- **Kontras:** hijau teks/aksi memakai varian #97D977 agar AA; mint terang referensi dipertahankan hanya sebagai inspirasi hue, bukan kewajiban mereplikasi persis.

## Colors

Palet netral hampir hitam untuk konten berjam-jam; hijau muncul hanya pada aksi utama, state terpilih, atau data tervalidasi. Risiko tidak direduksi menjadi warna: selalu angka, label, kutipan.

- **Primary #97D977 / on-primary #102018:** satu aksi utama per layar, state aktif dan node Account; jangan seluruh kartu menjadi hijau.
- **Secondary #283135 / on-secondary #F0F4F0:** kontrol sekunder dan panel fokus.
- **Neutral #111216 / surface #1B1E21:** kanvas dan panel. Teks #F0F4F0 / muted #B5BFB9, outline #505A55.
- **Status:** success #97D977, warning #E9C681, danger #E6A49E dengan label tekstual dan nilai; bukan ikon dekoratif.
- **Graph:** Account hijau, Conversation biru, Signal amber, Decision ungu, Evidence abu-abu. Edge default `outline`; jalur bukti terpilih `focus-ring`, node lain diredupkan, bukan disembunyikan. Legend selalu berlabel; pola/ikon mendampingi warna.

## Typography

Inter [asumsi bentuk dari screenshot], fallback `system-ui, sans-serif`. Satu keluarga; gunakan angka tabular untuk uang, skor, biaya, waktu. Judul mengidentifikasi tugas, tidak memakai label “Overview” generik.

- Headline 32/1.2 dan 24/1.25; title 18/1.3; body 16/1.5; pendukung 14/1.5.
- ID dan metadata hanya kecil di desktop; di mobile informasi kritis tetap ≥16px. Jangan jadikan confidence atau synthetic label nyaris tak terbaca.
- Huruf kapital kecil hanya untuk label section, bukan tindakan. Nama akun dan uang tertimbang risiko paling mudah dipindai.

## Layout

- **Grid:** konten max 1280px, 12 kolom desktop, gutter 24px. Sidebar 220px; jangan paksa panel notifikasi kanan. Detail akun memakai kolom bukti utama dan konteks samping yang bisa dilipat.
- **Breakpoint & navigasi:**

| Nama | Lebar | Grid | Navigasi |
|---|---|---|---|
| Mobile | <768px | 1 kolom, margin/gutter 16px | Burger 44×44 + drawer |
| Tablet | 768–1199px | 2 kolom, gutter 16px | Burger + drawer |
| Desktop | ≥1200px | 12 kolom, max 1280px | Sidebar Akun / Review / Data; Benchmark hanya bila dibuat |

- **Drawer:** kiri, ≤85vw, scrim; tutup via scrim/close/Esc/memilih item. `aria-expanded` dan `aria-controls`; fokus masuk, terkunci selama terbuka, kembali ke burger saat tutup; scroll halaman terkunci. Tutup otomatis saat desktop. Header sticky.
- **Mobile:** urutan Akun = prioritas → parameter/bukti → daftar; Detail = nama/nilai kontrak → jawaban → bukti → save plan → histori/feedback. Graph kecil menjadi daftar jalur bukti tekstual yang dapat ditelusuri; bukan canvas yang harus digeser horizontal. Tabel lebar memakai detail per baris/kolom penting, bukan page overflow.
- Target sentuh ≥44×44 di bawah 1200px, ≥36px desktop. Body ≥16px mobile. Tanpa scroll horizontal pada 360px. Header/detail aksi penting sticky tanpa menutup kutipan.

| Layar | Tugas | Pola | Informasi utama | Sekunder |
|---|---|---|---|---|
| Akun | Prioritaskan | Daftar/tabel terurut dengan satu ringkasan di atas | Nama, parameter risiko, level prioritas | Cakupan data, nilai kontrak, umur sumber |
| Detail akun | Periksa bukti dan tindak | Jawaban + jalur bukti, tab Sumber/Keputusan/Save plan | Kutipan, alasan prioritas, aksi dan feedback terkait | Confidence, timestamp |
| Review | Putuskan item ragu | Satu item dan dua pilihan jelas | Bukti, dampak approve | Model/rubrik |
| Benchmark bila dibuat | Bandingkan retrieval | Dua kolom sepadan, tabel per pertanyaan | Akurasi, biaya query/total, latensi | Seed, corpus, N |
| Data | Kompilasi | Dropzone/daftar job sederhana | Status ingest, jumlah sinyal, biaya | Hash/model, error |

## Elevation & Depth

Permukaan tonal dan divider tipis, tanpa glowing green halo. Popover/dialog memakai shadow `0 8px 24px rgba(0,0,0,.28)` dan border outline. Kartu biasa tanpa shadow; hierarki dari konten.

## Shapes

- **Radius:** sm 4px untuk tag, md 8px kontrol, lg 12px modal/panel; full hanya pill status singkat.
- **Ikon:** `lucide-react`, outline stroke 1.75, default 18–20px. Tanpa emoji sebagai ikon. Ikon hanya saat memberi fungsi/semantik; tombol ikon wajib accessible name.
- **Graph:** node 8px dengan label jenis dan timestamp; edge 1px, highlight jalur 2px; maksimal neighborhood yang relevan, bukan web node ruwet. Daftar bukti HTML sebagai alternatif keyboard/screen reader.
- **Gambar:** tidak ada ilustrasi/stock photo. Avatar bukan kebutuhan demo. Workspace/account switcher berupa kartu teks sederhana.

## Components

- **Button:** primary satu per layar; hover mengubah luminance, active tertekan halus, focus ring 2px dengan offset, disabled + alasan, loading dengan label tetap. Approval berbunyi “Setujui rencana — tanpa mengirim email”; tidak menciptakan kesan outreach otomatis.
- **Input:** label terlihat; error menjelaskan masalah dan cara memperbaiki; pencarian tidak disamarkan sebagai aksi utama.
- **Akun row:** nilai uang rata kanan, risiko di samping nama, kontrak/ID kecil. Tidak mengulang kartu KPI di layar detail. Kontrak sintetis mendapat label di dekat nilai.
- **Evidence:** kutipan asli + call ID, waktu, confidence, asal synthetic/real; node graph highlight serentak saat dipilih. Jika bukti tak cukup, tulis “Bukti belum cukup”, bukan jawaban pasti.
- **Review:** pasangan entitas dan identifier berdampingan; reject dan approve berkonsekuensi eksplisit; tidak ada bulk approve. Save plan panjang diedit di tab; konfirmasi approval singkat dalam modal hanya jika perlu.
- **Feedback:** input pendapat terkait akun/rencana beserta riwayat tanggapan CSM/admin dalam konteks detail; tampilkan penulis, waktu, dan status. Feedback tidak mengubah prioritas atau Decision otomatis.
- **Benchmark:** angka berformat unit, N, judge, runtime; baseline dan graph setara; tidak mewarnai pemenang bila data belum ada. Skeleton status run, error parsial dan retry aman.
- **Motion:** 180ms ease-out pada disclosure/selection; reduced-motion mematikan transisi. Tidak ada animasi dekoratif.
- **Empty/error:** empty menautkan langkah ingest; error Jev membedakan key/limit/jaringan; tidak menghapus draft saat gagal; toast singkat hanya setelah tindakan berhasil.

## Do's and Don'ts

### Prinsip UX 1–9

| # | Prinsip | Penerapan |
|---|---|---|
| 1 | Tahan variasi konten | Nama panjang wrap; data kosong/partial/berlabel sintetis; jawaban tanpa bukti tampil sebagai abstain; graf dibatasi neighborhood |
| 2 | Konsisten | Satu grid, satu font Inter, satu set Lucide, token sama pada semua layar |
| 3 | Hierarki | Risiko dan nilai tertimbang besar; kutipan dekat jawaban; accent bukan dekorasi |
| 4 | Info di titik keputusan | Confidence, sumber, masa berlaku tepat di samping Signal; preseden di samping save plan |
| 5 | Konsekuensi sebelum aksi | Tombol menyebut approval tidak mengirim email; dampak merge/reject di Review |
| 6 | Kurangi hambatan | Aksi plan tetap terlihat saat scroll; filter siap pakai; input bebas jika perlu |
| 7 | Hapus berlebih | Tidak ada promo, feed notifikasi global, KPI berulang, menu setting kosong |
| 8 | Detail premium | Divider tipis, angka tabular, spacing dekat untuk bukti+kutipan |
| 9 | Aksi utama jelas | Satu primary pada tiap layar, tenang tanpa teks all-caps |

### Anti tampilan AI — Standar UI A1–A8

| Standar | Penerapan konkret |
|---|---|
| A1 Tanpa emoji | Semua ikon Lucide outline, label tombol tetap eksplisit |
| A2 Palet bukan bawaan AI | Aksen hijau referensi hanya pada state/aksi penting; graph categorical dari token; tidak ada glow |
| A3 Satu layar satu tugas | Akun prioritaskan, Detail buktikan/tindak, Review putuskan, Data ingest; benchmark terpisah bila dibuat |
| A4 Navigasi fokus | Navigasi tugas utama Akun / Review / Data; Detail route turunan; benchmark ditambah hanya bila berfungsi |
| A5 Rapikan keramaian | Aksi sekunder dalam ⋯; label panjang jadi detail/tooltip; angka rata kanan; nominal penting dominan |
| A6 Tanpa elemen kosong | Tombol/card/badge hanya bila berfungsi; tak ada chart revenue, promo tier, avatar dekoratif |
| A7 Wadah sesuai isi | Persetujuan singkat di modal; save plan panjang dalam tab; graph dapat diganti daftar bukti |
| A8 Data kaya dan banding | Benchmark dua arm berdampingan; nanti Could toggle dua akun; graph untuk jalur bukti, timeline untuk waktu |

### Aksesibilitas dan review

- Do: target WCAG AA teks ≥4.5:1, teks besar/elemen UI ≥3:1; fokus terlihat; akses keyboard, Escape dan focus trap pada drawer/dialog; setiap input berlabel; status tidak warna saja. Uji 375/768/1440, tanpa overflow.
- Don't: node berwarna tanpa nama, nominal tanpa mata uang, angka biaya tanpa N, alert tanpa sumber, modal yang tidak bisa ditutup keyboard.
- Checklist: hanya token YAML; hover/focus/disabled/loading/empty/error; data ekstrem; lint 0 error tanpa warning `contrast-ratio`; Standar UI A1–A8 terpenuhi.

## Deviations from Reference

| Aspek | Screenshot | Relasi | Alasan |
|---|---|---|---|
| Accent | Lime jenuh + latar gradient glow | Lime lebih lembut, hanya aksi/status | Kontras/ketenangan penggunaan lama |
| Navigasi | Banyak item + notifikasi/contacts kanan | Empat tugas, tanpa feed global | A3/A4/A6 |
| Dashboard | Revenue cards, donut, promo card | Akun prioritas + bukti jalur | Data relevan untuk CSM, bukan hiasan |
| Typography | Ukuran teks kecil pada gambar | Body 16px mobile, metadata 14px desktop | Keterbacaan |

## Implementation

Ekspor token dari YAML; jangan tulis ulang nilai warna di source. Tailwind v4:

```sh
npx -p @google/design.md designmd lint docs/08-DESIGN.md
npx -p @google/design.md designmd export --format css-tailwind docs/08-DESIGN.md > src/app/theme.css
```

Windows PowerShell: arahkan keluaran lewat pipeline UTF-8 sesuai encoding tool jika perlu. `theme.css` dibuat saat scaffold T1, tidak dibuat saat docs.

## Changelog

| Tanggal | Perubahan |
|---|---|
| 9 Okt 2026 | Dokumen awal (hackathon), kemiripan belum diukur |
