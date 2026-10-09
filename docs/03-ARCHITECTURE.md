# 03 — ARCHITECTURE & Rencana Build: KasirNusa

> Turunan `01-PRD.md` dan `09-BUILD-PLAN-KASIRNUSA.md`. Next.js dipilih; PostgreSQL untuk demo publik diterima dalam ADR-0001. ADR-0002 (parameter dan penjelasan) masih Proposed. Belum ada scaffold, provider hosting, library DB, atau identitas demo yang dipilih.

## 1. Stack dan batas keputusan

| Lapisan | Keputusan / usulan | Catatan |
|---|---|---|
| Web | Next.js App Router, TypeScript strict [Next.js dipilih; TypeScript usulan] | Server lebih dulu; UI ikuti `08-DESIGN.md` |
| Data | PostgreSQL untuk demo publik (ADR-0001) | Graph melalui tabel node/edge/provenance dan query SQL; library koneksi/migrasi belum dipilih |
| AI klasifikasi | Jev/TypeSafe | Sinyal teks ambigu saat ingest; output bertipe, ambang dan keputusan di kode |
| AI generatif | Satu provider yang disetujui tim | Penjelasan, skenario berasumsi, dan draf tindakan; tidak menghitung skor/approve |
| UI | Tailwind v4 dan visual graph kecil [usulan] | Token resmi di `08-DESIGN.md`; dependency baru memerlukan izin |
| Hosting/auth | Belum dipilih | Demo publik membaca data berizin; ingest, feedback, dan approval butuh identitas dan otorisasi; rate limit |

Arsip `dataset_kasirnusa.zip` dan hasil ekstrak `dataset_kasirnusa/` diabaikan Git. README menyebut 15 file data sintetis, 40 pelanggan + 5 prospek, histori operasional 1 Okt 2025–30 Sep 2026, snapshot 1 Okt 2026. Peta kolom, cakupan terukur, rumus parameter, dan keterbatasan terdapat di `10-DATA-PROFILE-KASIRNUSA.md`. Jangan commit dataset penuh, secret, atau cache berisi data pelanggan.

## 2. Perintah verifikasi setelah scaffold

| Cek | Perintah |
|---|---|
| Dev | `pnpm dev` |
| Test | `pnpm test` |
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Dead code | `pnpm exec knip` |
| Golden demo | Jalankan `pnpm dev`, ikuti `01-PRD.md` §5 |
| Benchmark bila retrieval/model berubah | `pnpm exec tsx scripts/benchmark.ts`, simpan output aktual |

Nama script adalah kontrak scaffold, belum tersedia. Jangan klaim cek lulus sebelum dijalankan. UI juga diperiksa di browser 375/768/1440, keyboard, state, dan Standar UI A1–A8. Jika `08-DESIGN.md` berubah, lint design tokens menurut `07-RULES.md`.

## 3. Data dan graph

Enam kelompok sumber berasal dari 15 file data: CRM (`crm_accounts`, `crm_contacts`, riwayat kerja, deals, employees), interaksi JSONL, pemakaian/outlet/fitur, support/bug/rilis, kontrak/billing, dan `decision_log`. Join utama: `account_id`, `contact_id`, `employee_id`, `outlet_id`, `bug_id`, `feature_id`, dan ID interaksi/keputusan. Email historis tidak selalu sama dengan email saat ini; konflik hard ID tidak boleh di-merge otomatis.

Node kandidat: Akun, Outlet, Kontak, Karyawan, Deal, Kontrak, Interaksi, Tiket, Bug, Rilis, Fitur, Keputusan, Kompetitor, Signal, Evidence. Relasi minimal dan contoh C01–C06 dijabarkan di `09-BUILD-PLAN-KASIRNUSA.md`. Setiap fakta/edge menyimpan source ID, waktu, status sintetis, dan bila berasal dari Jev: rubrik, model, confidence, kutipan/span. Hubungan turunan seperti tiket→bug yang tak punya `bug_id` ditandai `derived` dengan alasan dan confidence; jangan menyamakan dengan hard link.

Tabel konseptual: `sources`, `nodes`, `edges`, `signals`, `jev_runs`, `plans`, `decisions`, `feedback`, `feedback_replies`. Skema final menunggu T1. Fakta temporal menambah versi baru; sumber lama tidak dihapus. Hash + source ID mencegah ingest duplikat. Ingest dan approval memakai transaksi; Decision append-only dan idempotency key unik. Feedback menyimpan actor, waktu, konteks, isi/status; reply tersimpan tanpa mengubah Decision/score secara otomatis.

## 4. Pipeline dan skor

1. Baca CSV/JSONL dari direktori lokal yang diabaikan Git; validasi skema, ID, tanggal, encoding, dan duplikasi. Simpan laporan baris, node, edge, error, serta cakupan per akun.
2. Kompilasi hard link dari ID. Ambiguitas teks kecil (niat pindah, keluhan, urgensi, penyebutan kompetitor) dikirim ke Jev dengan rubrik berversi. Validasi respons; tulis/review/discard lewat ambang kode. Kutipan harus cocok source span.
3. Kode/SQL menghitung perubahan transaksi per hari 90 hari terakhir vs 90 hari sebelumnya, tiket terbuka/umur/kaitan bug, champion/decision-maker, janji dan engagement, serta keterlambatan bayar 12 bulan. Pembacaan dilakukan pada snapshot 1 Okt 2026; faktor menyimpan sumber, periode, nilai, status data, dan alasan bila tak tersedia.
4. Bobot uji pertama: pemakaian 30%, gangguan layanan 25%, relasi champion 20%, janji dan engagement 15%, pembayaran 10%. Kode menghasilkan skor prioritas 0–100 dan level, berversi. Ambang level dan aturan data kosong diputuskan setelah profiling; data kosong tidak menjadi nol. Gangguan sinkronisasi ditandai sebagai masalah layanan/kualitas data agar penurunan transaksi tak dihitung dua kali.
5. Renewal, NPS, dan nilai kontrak ditampilkan sebagai konteks. Jika nilai tertimbang digunakan: `nilai_tahunan × skor_prioritas / 100`; tidak boleh disebut prediksi kerugian. Skor tidak disebut probabilitas churn tanpa outcome historis dan kalibrasi.
6. Traversal graph mengembalikan node/relasi/sumber untuk pertanyaan baru. LLM hanya menerima paket fakta terpilih dengan hitungan kode, sumber, kutipan, asumsi, dan preseden Decision. Validasi angka dan sitasi sebelum ditampilkan; tanpa bukti cukup, abstain. Draf save plan disunting pengguna, lalu persetujuan ditulis sebagai Decision.

## 4b. Peta panggilan AI dan evaluasi

| Titik | Primitif/input ringkas | Control flow kode | Evaluasi |
|---|---|---|---|
| Niat pindah/kompetitor/keluhan | Jev `noul` pada kutipan bersumber | p≥0,85 tulis; 0,50–0,85 review; lainnya abaikan sebagai sinyal aktif | Label contoh KasirNusa, audit false positive/negative |
| Urgensi/berat keluhan | Jev `score` 0–3 dengan rubrik | confidence≥0,80 dan skor≥2 tulis; ambigu review | Rubrik dan sampel berlabel berversi |
| Identitas ambigu | Jev `noul` pasangan entitas + hard identifiers | p≥0,95 dan tanpa konflik ID: merge; 0,60–0,95 review; lainnya pisah | Hard negatives, precision auto-merge |
| Relevansi bukti untuk tanya graph | Jev `score` 0–3 bila perlu | skor≥2 dan confidence≥0,80 masuk konteks | Query dan korpus sama untuk perbandingan |
| Penjelasan/save plan | LLM generatif, paket fakta tersumber | Kode memeriksa angka/sitasi; manusia approve | Audit ketepatan sumber dan abstain |

Ikuti pola API dan respons di `JEV-KIT.md`, rubrik di `JEV-LENS.md`. Semua provider dipanggil server-side; kunci dari environment. Retry terbatas hanya 429/5xx, bukan 401/403. Catat model string persis, versi rubrik/prompt, input hash, token, latensi, error, dan biaya dengan rate aktual. Confidence Jev adalah output primitif, bukan probabilitas churn dan belum tentu terkalibrasi pada domain ini. Eval primitif minimal 20–50 contoh berlabel per pertanyaan kecil; laporkan ukuran sampel serta kesalahan, tanpa klaim akurasi sebelum run.

Benchmark retrieval, bila dibuat, memakai pertanyaan/korpus/answerer/judge dan budget identik; laporkan biaya query serta ingest/amortisasi terpisah. SalesTranscriptQA boleh menjadi benchmark eksternal terpisah sesuai lisensi, tidak dipakai untuk klaim churn KasirNusa. Pertanyaan live KasirNusa harus dijawab dari graph aktual dan jalur bukti, bukan jawaban hardcode.

## 5. Hak akses, approval, dan feedback

- Read publik hanya untuk data demo yang diizinkan, dengan rate limit. Jangan tampilkan secret atau dataset di log/client bundle.
- Ingest dan approval: pengguna aplikasi terautentikasi (CSM/Account Manager) atau admin. Endpoint memeriksa peran server-side.
- Approval/reject menambah `Decision` dengan actor, waktu, sumber, versi rencana, dan idempotency key. Tidak mengirim email/outreach.
- Feedback: pengguna aplikasi memberi pendapat/usulan pada akun/rencana; CSM/admin menanggapi. Simpan actor, waktu, konteks, isi/status, dan reply. Feedback tidak otomatis mengubah graph fakta, parameter, skor, atau Decision. Jika yang dimaksud pengguna adalah pelanggan akhir, desain akses baru perlu keputusan tersendiri.

## 6. Rencana build dan QA

ID mengikuti `04-TODO.md`. T1 scaffold dan kontrak data; T2 ingest/graph/Jev; T3 skor dan uji C01–C06 + 40 pelanggan; T4 peringkat/detail/tanya graph; T5 save plan/Decision/feedback; T6 demo publik, verifikasi UI dan golden path; T7 pitch/artefak demo serta benchmark aktual bila dibuat. Setiap perubahan mengikuti `07-RULES.md`.

QA kasus wajib dari `09-BUILD-PLAN-KASIRNUSA.md` §6: C03 dan C05 terkait BUG-412/offline, C01 champion pindah + FEAT-07, C04 renewal dekat, dan semua 40 pelanggan masuk peringkat. Jangan memakai dua akun churn historis sebagai backtest: data tidak memuat outcome Closed Lost renewal yang cukup. Hasil uji dan bobot akhir harus dicatat sebelum klaim demo.

## 7. Keputusan tertunda

Provider hosting dan identitas demo; library PostgreSQL dan migrasi; batas biaya; ambang level/aturan data kosong; jenis deliverable 9 Okt 22.00 dan deadline submit resmi; apakah feedback dari pengguna aplikasi atau pelanggan akhir. Jangan mengubah ADR Accepted diam-diam; perubahan pilihan penyimpanan perlu ADR baru.
