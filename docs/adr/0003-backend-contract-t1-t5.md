# ADR-0003: Kontrak backend Tessera untuk T1–T5

**Status:** Proposed

**Tanggal:** 9 Oktober 2026

**Pemutus:** Cecep/tim, belum disetujui

## Context

PRD KasirNusa telah ACC, Next.js dipilih, dan PostgreSQL Accepted dalam ADR-0001. Repository belum mempunyai source, migrasi, atau test runner. T1–T5 memerlukan kontrak bersama supaya ingest, Jev, skor, retrieval, dan approval dapat dikerjakan tanpa mengubah semantik data di tengah jalan. ADR-0002 tentang parameter dan penjelasan tetap Proposed; ADR ini mengusulkan bentuk pertukaran data dan batas modul, bukan bobot/normalisasi final.

## Options considered

| Option | Pros | Cons | Fits us? |
|---|---|---|---|
| Satu PostgreSQL dengan tabel Source/Node/Edge/Signal dan payload bertipe | Satu transaksi, provenance dapat ditelusuri, cocok ADR-0001 dan tim kecil | Perlu disiplin versi dan query temporal | **Usulan MVP** |
| Database graph terpisah | Traversal khusus tersedia | Sinkronisasi dua penyimpanan, biaya dan operasi tambahan | Tidak untuk MVP |
| JSON bebas per akun tanpa edge bersumber | Cepat untuk satu demo statis | Pertanyaan baru, sitasi, dan histori sukar diverifikasi | Tidak memenuhi F1/F3 |

## Decision proposed

1. Gunakan identitas stabil `(datasetRevision, sourceType, externalId)` untuk setiap Source; revisi isi baru bersifat append-only. Node dan Edge memakai ID internal serta referensi Source; Edge `hard` dan `derived` dibedakan, dan konflik hard ID masuk review. Semua fakta menyimpan `validAt` (waktu kejadian) dan `recordedAt` (waktu masuk sistem) bila tersedia. Snapshot memfilter keduanya; nilai tanpa waktu kejadian berstatus `unknown_time`, bukan dianggap tepat pada snapshot.
2. `Signal` hanya aktif bila validasi kutipan dan ambang kode terpenuhi. `noul` menyimpan `yesProbability` tanpa `confidence` terpisah; `score` menyimpan `score`, `confidence`, dan distribusi `probabilities`. Kasus review dicatat terpisah dari signal aktif; discard tetap mempunyai jejak run tanpa menjadi bukti risiko.
3. `RiskParameter` menyimpan nilai mentah, unit, jendela waktu, sumber, cakupan, dan status data. `priorityScore` dan `level` boleh `null` selama aturan normalisasi, data kosong, dan ambang belum disetujui; tidak pernah disebut probabilitas churn. Renewal, NPS, dan nilai kontrak adalah konteks. Bukti outlet offline mencegah penurunan transaksi yang sama dihitung ganda.
4. `EvidencePackage` adalah keluaran traversal terbatas, dengan jalur Node–Edge, Source, span kutipan, waktu snapshot, fakta terhitung, dan `precedentRefs[]` bertag `dataset_history` atau `app_decision`. Jawaban/draf memakai paket itu dan abstain saat sitasi atau cakupan tidak cukup. LLM tidak membuat fakta, skor, atau approval.
5. `Plan` memiliki revisi immutable. Keputusan approve/reject adalah `Decision` append-only dengan actor, revisi Plan, waktu, idempotency key, dan referensi bukti dalam satu transaksi. `Feedback` dan reply terpisah; keduanya tidak menulis ulang Decision atau skor. Tidak ada outreach.
6. Route handler hanya validasi/auth/rate limit/pemetaan error. Logika domain ada di modul server: `db`, `graph/ingest`, `jev`, `risk`, `graph/query`, `plans/decisions`, `feedback`. Batas API, pemilik tiket, dan contoh payload ada di `../03-ARCHITECTURE.md` §8–§12.

### Ownership dan handoff yang diusulkan

| Tahap | Pemilik | Batas handoff |
|---|---|---|
| Fondasi runtime → schema | TASK-004 Sugeng → TASK-005 Bejo | 004 memiliki package/tooling/config; 005 memiliki `db`, migrasi dan kontrak bersama setelah approval dependency |
| Source/graph → Jev | TASK-006 Sugeng ↔ TASK-007 Tejo | Keduanya dapat berjalan paralel setelah 005 dan fixture 003 landed. 006 menyerahkan Source committed + versi/hash/span bertipe; 007 hanya menulis run/Signal, tidak mengubah Source/Node/Edge |
| Graph/Signal → parameter | TASK-006/007 → TASK-008 Sugeng | 008 membaca graph dan hanya Signal active; review/discard tidak menjadi skor |
| Auth + parameter → query | TASK-009 Tejo dan TASK-008 → TASK-010 Sugeng | 009 memasok helper identitas/role/rate limit; 010 memiliki query/read route, paket bukti dan pembacaan preseden |
| Paket bukti → Decision → feedback | TASK-010 Sugeng → TASK-011/012 Tejo | 011 mengikat Plan ke hash bukti dan menulis Decision atomik lewat repository 005; query 010 membaca Decision committed tanpa import writer; 012 terpisah dari skor/approval |

Pemilik dan prerequisite mengikuti Kanban saat usulan ditulis; tabel ini tidak menerima keputusan produk atau mengubah status tiket. Kontrak `listTextCandidates` dan `findPrecedents` dijabarkan di `../03-ARCHITECTURE.md` §10. Query 010 dapat diuji dengan fixture Decision sintetis sebelum 011 ada; setelah 011 landed, integration test memastikan Decision baru terbaca pada snapshot yang tepat dan rollback tidak terbaca.

## Consequences

- TASK-004 perlu menyediakan tooling sesudah dependency disetujui; TASK-005 perlu mengunci migrasi awal dan kontrak tipe sebelum TASK-006/007/009 menulis atau membaca database. Nama tabel/kolom fisik boleh disesuaikan, tetapi semantik dan versioning harus tetap sesuai.
- Source historis tidak dihapus saat koreksi. Kueri snapshot lebih rumit dan memerlukan fixture temporal serta integration test.
- Konsistensi approval bergantung pada unique constraint `(actorId, idempotencyKey)` bersama transaksi dan penguncian revisi Plan. Kunci yang sama dengan payload berbeda menghasilkan konflik.
- Tabel graph PostgreSQL cukup untuk MVP; bila traversal nanti terbukti lambat, ukur query dengan `EXPLAIN (ANALYZE, BUFFERS)` sebelum menambah index/cache/penyimpanan lain.
- Risiko migrasi: perubahan enum/kontrak API atau backfill tanpa provenance dapat mengubah makna historis. Gunakan migrasi additive, backfill terverifikasi, rollback non-destruktif, dan jangan `DROP`/`TRUNCATE` tanpa persetujuan statement dan rencana pemulihan.

## Alternatives rejected for MVP

| Alternative | Reason |
|---|---|
| Event sourcing seluruh aplikasi | Terlalu banyak proyeksi/operasi untuk hackathon; hanya Source/Decision yang perlu histori append-only |
| Menyimpan output LLM sebagai fakta graph | Tidak bisa dijamin cocok dengan Source dan melanggar batas penalaran |
| Menganggap `noul` punya confidence terpisah | Tidak sesuai kontrak respons yang dicatat di `JEV-KIT.md`; ambang `noul` memakai probabilitas ya |

## Open questions for Cecep/tim

- Setujukah identitas/temporal contract ini sebagai dasar migrasi T1, termasuk kebijakan retensi dan koreksi Source?
- Setelah profiling C01–C06 dan 40 pelanggan, apa normalisasi, bobot final, ambang level, serta aturan skor untuk data partial/offline?
- Apakah pemberi Feedback tetap pengguna aplikasi demo, atau pelanggan akhir memerlukan identitas dan izin tersendiri?
