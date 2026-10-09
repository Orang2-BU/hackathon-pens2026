# ADR-0005: Workspace backend terpisah

**Status:** Accepted for implementation under the user's backend-only direction, 9 Okt 2026.

## Konteks

Keputusan stack lama menempatkan API di monolith Next.js. User meminta folder backend terpisah dan pekerjaan yang tidak mengubah frontend, serta mendelegasikan implementasi backend sampai task terakhir.

## Keputusan

- Backend-owned source, database/migrations, ingest, domain logic dan backend checks ditempatkan di root `backend/`.
- Project UI yang sudah ada di `frontend/` tidak diubah. Integrasi UI → backend melalui HTTP dipisah ke task berikutnya.
- API runtime dicatat pada ADR-0006; local PostgreSQL tooling, origin policy dan deployment tetap pada task pemilik.
- PostgreSQL serta driver `postgres` tetap mengikuti keputusan storage yang sudah diterima. Dataset lokal tetap privat dan di-ingest lewat operator CLI.
- DTO HTTP mengikuti `docs/13-BACKEND-CONTRACT.md`. Backend tidak mengimpor source UI.

## Konsekuensi

- Batas source memisahkan tugas backend dari UI, tetapi membutuhkan proses build/run dan integrasi HTTP tersendiri.
- Stack service/backend dipisahkan sesuai ADR-0006; API contract dijelaskan pada dokumen 13.
- Workspace terpisah memerlukan service dan deployment sendiri. Frontend tetap tidak disentuh dalam task backend.

## Tindak lanjut

BE-02 mengimplementasikan service/runtime dan menjalankan migration/integration checks dari `backend/`; verifikasi PostgreSQL masih membutuhkan database disposable.
