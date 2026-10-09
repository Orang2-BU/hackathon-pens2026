# ADR-0005: Library DB, hosting, autentikasi, dan LLM untuk Tessera

- **Status:** Accepted — user (dewaaa), 9 Okt 2026
- **Hubungan:** menjawab pertanyaan terbuka ADR-0004 (library DB, hosting, identitas, provider generatif). Bila berbeda dengan usulan ADR-0004, ADR ini yang berlaku. Kontrak data tetap mengikuti ADR-0003.
- **Konteks:** 03-ARCHITECTURE §1 dan PRD §8 masih mencatat library PostgreSQL, hosting, identitas, dan provider LLM "belum dipilih". Frontend sudah ada di `frontend/` (Next.js 16, TypeScript, Tailwind v4, lucide-react, @xyflow/react, Vitest, knip, pnpm).

## Keputusan

| Area | Pilihan | Alasan |
|---|---|---|
| Akses PostgreSQL | `postgres` (postgres.js), SQL langsung; migrasi berupa file `.sql` berurutan | Satu dependency kecil; graph disimpan sebagai tabel node/edge/provenance dan di-query dengan SQL (termasuk CTE rekursif) tanpa lapisan ORM |
| Hosting demo + DB | VPS sendiri dengan Docker Compose: service `web` (Next.js `next start`) dan `db` (PostgreSQL) | Kontrol penuh atas data sintetis dan biaya; tidak bergantung free tier |
| Autentikasi | Satu akun demo: password dari env `DEMO_PASSWORD`, sesi cookie HTTP-only yang ditandatangani HMAC dengan `SESSION_SECRET` | PRD mengizinkan auth minimal (satu peran terautentikasi); tanpa dependency baru |
| LLM generatif | Belum dipakai. Jawaban "Tanya graph" dan draf save plan dirangkai template deterministik dari hasil query graph, dengan sitasi node | Tanpa biaya API dan tanpa risiko halusinasi angka; LLM dapat ditambah lewat ADR baru |
| Klasifikasi teks | Jev/TypeSafe (tetap) | Arahan TM; output bertipe, kode memutuskan |

## Konsekuensi

- Dependency baru yang disetujui: `postgres` saja. Selain itu tetap butuh izin.
- Env wajib: `DATABASE_URL`, `JEV_API_KEY`, `DEMO_PASSWORD`, `SESSION_SECRET`. Disimpan di `.env` (diabaikan Git) dan `.env.example` tanpa nilai.
- Endpoint write (ingest, approve, feedback) memeriksa sesi; endpoint read publik diberi rate limit sederhana di server.
- Teks jawaban template harus jujur saat bukti kurang (abstain), sesuai PRD §3.
- Deploy ke VPS memerlukan izin user tiap kali (07-RULES §4).
