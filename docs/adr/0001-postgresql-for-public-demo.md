# ADR-0001: PostgreSQL untuk demo publik Relasi

**Status:** Accepted
**Tanggal:** 9 Oktober 2026

## Context

Next.js telah dipilih. Demo harus dapat diakses publik, sehingga usulan SQLite lokal dalam `docs/03-ARCHITECTURE.md` tidak lagi menjadi pilihan utama. Repo belum memiliki scaffold aplikasi. Provider hosting, library koneksi, dan data deployment belum ditentukan.

## Decision

Gunakan PostgreSQL sebagai penyimpanan utama. Simpan fakta, sumber, relasi, dan `Decision` append-only dalam satu database. Akses database hanya dari proses server. Query memakai parameter binding; setiap write dan approval yang mengubah beberapa tabel memakai transaksi. Kredensial disimpan pada environment server dan divalidasi saat startup.

Demo publik boleh membaca data demo yang berizin. Ingest, review, dan approval memerlukan autentikasi serta otorisasi; endpoint publik diberi rate limit. Keputusan provider, mekanisme identitas demo, dan library database dicatat terpisah sebelum implementasi.

## Consequences

- Deploy memerlukan layanan PostgreSQL dan pengelolaan koneksi, migrasi, backup, serta biaya operasional.
- Model relasi tetap dapat ditelusuri dengan SQL; tidak perlu database graph khusus untuk MVP.
- Demo lokal dan publik harus memakai skema serta data demo yang konsisten.
- Dokumentasi lama yang masih menyebut SQLite perlu diselaraskan sebelum T1.

## Alternatives considered

| Option | Reason not selected for primary deployment |
|---|---|
| SQLite lokal | Tidak memenuhi kebutuhan database persisten bersama pada demo publik tanpa rancangan hosting tambahan. |
| Database graph khusus | Menambah operasi dan biaya sebelum ada kebutuhan traversal yang terbukti. |

## Open questions

- Di mana PostgreSQL dan aplikasi akan di-host?
- Bagaimana identitas CSM demo dan pembatasan hak ingest/approval diterapkan?
- Dataset mana yang berizin untuk ditampilkan pada deployment publik?
