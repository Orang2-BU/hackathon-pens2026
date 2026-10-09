# ADR-0004: Usulan tooling dan akses backend minimal Tessera

**Status:** Proposed

**Tanggal:** 9 Oktober 2026

**Pemutus:** Cecep/tim, belum disetujui

## Context

ADR-0001 menetapkan PostgreSQL untuk deployment demo publik; Next.js sudah dipilih. Belum ada `package.json`, lockfile, koneksi database, migrasi, autentikasi, provider generatif, hosting, atau batas biaya yang disetujui. T1 memerlukan pilihan kecil yang bisa diuji tanpa menyetujui provider secara diam-diam. Semua nama paket di bawah adalah **usulan, belum izin instalasi**.

## Options considered

| Area | Option | Pros | Cons | Fits us? |
|---|---|---|---|---|
| PostgreSQL | `pg` + SQL migrations berversi via skrip Node | Dependency kecil, SQL dan transaksi eksplisit | Tim menulis runner/rollback dan mapping row sendiri | **Usulan MVP** |
| PostgreSQL | `drizzle-orm` + `drizzle-kit` + `pg` | Tipe schema/query dan migrasi terstruktur | Paket/konsep lebih banyak, migrasi SQL tetap perlu review | Cadangan bila query manual menghambat |
| PostgreSQL | Prisma + CLI | Developer experience tinggi | Generator dan runtime lebih besar; pola query graph SQL tetap khusus | Belum perlu |
| Test/scaffold | Next.js App Router + TypeScript strict, `vitest`, Node native `fetch` | Sesuai pilihan web, unit cepat, minim wrapper | Integration PostgreSQL/route perlu setup manual | **Usulan MVP** |
| Test/scaffold | Node test runner bawaan | Dependency lebih sedikit | TypeScript, watch, dan coverage perlu setup tambahan | Alternatif hemat paket |
| Auth demo | Identitas terkelola, role CSM/admin server-side | Tidak menyimpan password aplikasi | Provider, biaya, deployment perlu dipilih | **Usulan bila disetujui** |
| Auth demo | Session lokal dengan credential demo, cookie aman | Tanpa vendor identitas | Implementasi/session/CSRF/rate limit sensitif dan perlu review Bimo | Alternatif bila provider tak tersedia |
| Generatif | Satu API provider yang disetujui melalui `fetch` server-side | Tidak menambah SDK, mudah diganti | Provider, model, harga, izin kirim dataset belum ditetapkan | **Usulan setelah izin** |
| Generatif | Template deterministik bersumber | Demo lokal bisa berjalan tanpa API eksternal | Penjelasan bahasa bebas lebih terbatas | Fallback transparan |

## Decision proposed

- Ajukan paket runtime `next`, `react`, `react-dom`, `pg`, `zod`; dev `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg`, `vitest`, `eslint`, `eslint-config-next`, `knip`, dan `tsx` **hanya bila skrip CLI TypeScript benar-benar dibutuhkan**. `pnpm` dan lockfile wajib saat scaffold. Versi pin dipilih dan diverifikasi saat T1; tidak ditentukan di ADR ini.
- Ajukan migrasi SQL forward-only per versi dengan file rollback/plan eksplisit, tabel riwayat migrasi, satu runner server-side, dan transaksi bila DDL mendukung. Koneksi `pg` server-only, prepared/parameter-bound query, pool terbatas sesuai kapasitas hosting kelak. Jangan melakukan migration otomatis pada request publik.
- Ajukan satu identitas operator demo terkelola dan role server-side untuk write. Bila provider tidak disetujui, T1 boleh menyiapkan interface auth dan tetap menutup seluruh write; implementasi session lokal memerlukan desain/review Bimo tersendiri. CSRF, cookie aman, penguncian brute force, dan audit actor wajib sebelum membuka write.
- Ajukan adapter generatif berbasis `fetch` server-side setelah tim memilih provider/model, data sharing, dan batas biaya. Sampai itu terjadi, retrieval tetap mengembalikan EvidencePackage/abstain dan draft bisa memakai template deterministik berlabel. Jev dipakai hanya setelah izin credential dan layanan; tidak ada call eksternal saat pengembangan kontrak.

## Consequences

- Scope T1 tetap kecil dan dapat dipisahkan dari provider. Dibutuhkan persetujuan dependency sebelum instalasi; rekomendasi ini bukan approval.
- SQL manual memudahkan audit graph dan migrasi tetapi menambah tanggung jawab review schema. Bila query makin banyak, adopsi Drizzle menjadi ADR berikutnya, bukan refactor diam-diam.
- Demo write tetap terkunci sampai identitas disepakati. Read publik tetap memerlukan allowlist data sintetis dan rate limiting yang sesuai provider deployment.
- Hosting, biaya PostgreSQL/Jev/LLM, dan rate limit efektif belum dapat diklaim tanpa pilihan provider dan pengukuran.

## Open questions for Cecep/tim

- Paket mana yang disetujui untuk T1, khususnya `pg` + SQL runner versus Drizzle?
- Provider hosting/PostgreSQL dan identitas operator mana yang disetujui, beserta batas biaya dan data demo yang boleh dipublikasikan?
- Provider/model generatif mana yang boleh menerima cuplikan dataset sintetis, dan berapa pagu biaya aktualnya?
