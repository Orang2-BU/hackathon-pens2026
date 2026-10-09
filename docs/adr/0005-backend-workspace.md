# ADR-0005: Workspace backend terpisah

**Status:** Proposed — struktur folder diminta user pada 9 Okt 2026; runtime belum diimplementasikan.

## Konteks

Keputusan stack lama menempatkan API di monolith Next.js. User kini meminta folder backend terpisah dan pekerjaan yang tidak mengubah frontend. Checkout belum mempunyai service API/database/ingest backend.

## Keputusan yang diusulkan

- Backend-owned source, database/migrations, ingest, domain logic dan backend checks ditempatkan di root `backend/`.
- Project UI yang sudah ada di `frontend/` tidak diubah. Integrasi UI → backend melalui HTTP dipisah ke task berikutnya.
- API/runtime framework, local PostgreSQL tooling, health/readiness, origin policy dan deployment dicatat sebelum implementasi service. Keputusan tersebut tidak diasumsikan dari ADR monolith.
- PostgreSQL serta driver `postgres` tetap mengikuti keputusan storage yang sudah diterima. Dataset lokal tetap privat dan di-ingest lewat operator CLI.
- DTO HTTP mengikuti `docs/13-BACKEND-CONTRACT.md`. Backend tidak mengimpor source UI.

## Konsekuensi

- Batas source memisahkan tugas backend dari UI, tetapi membutuhkan proses build/run dan integrasi HTTP tersendiri.
- Stack monolith lama perlu diselaraskan setelah tim menerima runtime/API contract.
- Belum ada server, route, database, dependency atau perubahan UI pada scaffold ini.

## Tindak lanjut

BE-02 mengunci runtime API dan menjalankan migration/integration checks dari `backend/`. Sebelum service dibuat, perbarui `docs/11-BACKEND-PLAN.md` dan `docs/12-BACKEND-TASKS.md` sesuai keputusan runtime.
