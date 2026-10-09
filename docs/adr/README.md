# Indeks ADR Tessera

Nomor 0003 dipakai dua dokumen historis berbeda. Referensi wajib memakai **nama file lengkap**, agar kontrak Proposed tidak tertukar dengan keputusan stack Accepted. Penomoran lama tidak diubah pada BE-01.

| Dokumen | Status pada dokumen | Pedoman implementasi |
|---|---|---|
| [0001-postgresql-for-public-demo](0001-postgresql-for-public-demo.md) | Accepted | PostgreSQL, server-only, transaksi, approval append-only |
| [0002-parameter-and-explanation-contract](0002-parameter-and-explanation-contract.md) | Proposed | Kontrak parameter sebagai hipotesis; bagian LLM ditangguhkan oleh ADR stack |
| [0003-backend-contract-t1-t5](0003-backend-contract-t1-t5.md) | Proposed | Riwayat usulan backend; DTO implementasi BE-01 ada di dokumen 13; referensi §8–§12 arsitektur historis sudah tidak sesuai layout terkini |
| [0003-stack-hosting-auth-llm](0003-stack-hosting-auth-llm.md) | Accepted | postgres.js, VPS Compose, satu akun demo/sesi HMAC, template tanpa LLM |
| [0004-minimal-backend-tooling-and-access](0004-minimal-backend-tooling-and-access.md) | Proposed | Alternatif tooling lama; `pg`/Zod/managed auth/LLM bukan pilihan build aktif |
| [0005-backend-workspace](0005-backend-workspace.md) | Proposed | Workspace backend root terpisah; pilihan runtime/API belum dibuat |

BE-01 tidak mengganti status atau isi keputusan Accepted. Usulan workspace terpisah dicatat pada ADR-0005; runtime API masih perlu diputuskan sebelum implementasi. Backend mengikuti [13-BACKEND-CONTRACT](../13-BACKEND-CONTRACT.md), [11-BACKEND-PLAN](../11-BACKEND-PLAN.md), dan task pemilik. Perubahan keputusan Accepted kelak dicatat pada ADR baru dengan rationale dan tautan supersedes.
