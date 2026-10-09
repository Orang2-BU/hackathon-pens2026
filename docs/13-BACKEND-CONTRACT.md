# 13 — Kontrak backend v1 (BE-01)

> Kontrak implementasi BE-01, 9 Oktober 2026. DTO dan boundary pertukaran ditulis di dokumen ini. Prototype awal ada di working tree frontend dari checkpoint sebelumnya; source canonical service sekarang berada di root `backend/`. HTTP runtime diputuskan pada [ADR-0006](adr/0006-standalone-backend-service.md); Verifikasi PostgreSQL lokal 10 Okt dicatat di `04-TODO.md`; deployment belum dijalankan.

## 1. Runtime dan lokasi

- UI tetap Next.js 16.4.0 di `frontend/`; service Node.js ESM terpisah di root `backend/`, memakai `node:http`.
- Backend source dan tests berada di workspace backend; API bertukar DTO JSON dan tidak mengimpor source UI.
- Driver `postgres` digunakan pada backend. Zod/`pg`/ORM/SDK bukan dependency yang dipilih. Migrasi dijalankan CLI dengan role migrator; runtime memakai kredensial dan role terpisah. PostgreSQL checks perlu environment disposable.

## 2. Konteks dan provenance

`QueryContext`: `contractVersion = "1"`, `businessAsOf` (YYYY-MM-DD), `recordedAsOf` (UTC ISO kanonis dengan milidetik), `datasetRevision`, `graphRevision`, `synthetic = true`.

- Tanggal bisnis demo: `2026-10-01`. Parameter usage membaca data sebelum tanggal tersebut; master tanpa histori diberi `snapshot_only`/`unknown_time`.
- `recordedAsOf` berasal dari server dan boleh lebih baru daripada snapshot. Import pada 9 Oktober tidak hilang dari analisis tanggal bisnis 1 Oktober. Kedua tanggal tidak disamakan.
- Request pertanyaan hanya membawa `question`. Revision, waktu pencatatan, synthetic flag dan actor tidak boleh diambil dari body publik. Selector revision/snapshot, jika kelak ditambah, harus melewati otorisasi/lookup server dan kontrak baru yang eksplisit.
- Source ref membawa ID, kelompok (`crm`, `interactions`, `usage`, `support`, `billing`, `decisions`), basename file, record ID/hash, origin (`dataset_history`/`app_decision`), status/waktu kejadian, waktu pencatatan, synthetic flag. Basename bukan path privat.
- Quote memakai offset `[start, end)` UTF-16 terhadap **field teks asli** dan source record/hash yang dipilih. Transformasi/trim teks sebelum menghitung offset tidak boleh mengubah rujukan sumber. BE-04/06 memverifikasi substring persis.
- Decision baru dibaca sampai waktu request/recording yang dipilih, dengan snapshot bisnis yang menjadi dasar keputusan tetap tercatat. Event aplikasi tidak di-backdate ke 1 Oktober.

## 3. DTO publik

| DTO | Isi dan aturan |
|---|---|
| `AccountSummary` | Pelanggan (`type: customer`), context, priority, kontrak IDR nullable, weighted value nullable, renewal/hari/NPS/dashboard nullable, mismatch nullable, coverage dan topFactor. Prospek P01–P05 hanya node graph sampai kontrak endpoint khusus tersedia |
| `RiskParameter` | Kelompok faktor, raw metrics beserta unit, period `[startInclusive,endExclusive)`, source refs/path IDs, coverage, status/reason dan normalized value nullable |
| `AccountDetail` | Summary + parameter, evidence, timeline, plan revisions, app Decisions dan feedback |
| `EvidencePackage` | Context, node/edge/path eksplisit, sumber, quote spans, facts, preseden dan limitations. Tidak ada payload raw source row/provider JSON |
| `GraphAnswer` | Context, answered/abstained/unavailable, intent nullable, text, citations dan EvidencePackage; query baru dibangun dari graph, bukan field jawaban seed |
| `PlanRevision` | Plan/account/revision, teks immutable, actor/waktu, context/formula/evidence hash, paket bukti, deviation reason dan flag kebutuhan approval Sales |
| `Decision` | Plan revision, approved/rejected, alasan, actor/waktu aktual, origin hanya `app_decision`, context/formula/evidence hash; `outreachSent` hanya `false` |
| `Feedback` | Account/optional plan revision, teks/status, actor/waktu dan replies dengan actor/waktu; tidak memuat operasi scoring/Decision |
| `SessionActor` | ID, displayName, role `csm`/`admin` hasil verifikasi sesi server. Tidak berisi token/password/secret dan tidak disusun dari field actor body |

Tipe bersifat readonly; tabel/transaksi pada BE-02/11 memberikan perlindungan persistensi. Readonly TypeScript sendiri bukan pengganti validasi runtime atau constraint DB.

**Data kosong:** `priority.status = unscored/unavailable` mewajibkan score/level `null` dan reason. Parameter `unavailable/excluded` mewajibkan normalized value `null` dan reason. Faktor available/partial boleh memiliki normalisasi NULL sebelum formula ditetapkan. Tidak ada default score nol. `mismatch = null` berarti belum dapat dibandingkan, bukan otomatis false.

Coverage membawa observed/expected/ratio; expected nol berarti ratio NULL. Parameter/count/value/range, periode, kecocokan revision, FK/path refs, dan hubungan score→level/weighted value divalidasi oleh task domain pemilik sebelum menghasilkan DTO. Nilai uang rupiah membawa `currency = IDR`; weighted value ada hanya bila score tersedia dan rumusnya `annualValue × score / 100`.

**Public projection:** tidak menyebar record database/provider dengan object spread ke response. Field yang boleh tampil ditulis eksplisit; kunci, password, signature sesi, idempotency key, lokasi privat, full provider state, email peserta dan raw row bukan field DTO publik. Source evidence boleh menampilkan kutipan sintetis berizin dengan source span; data asli tetap privat.

## 4. Boundary runtime pada BE-01

| Fungsi | Perilaku yang dikunci |
|---|---|
| `createQueryContext` | Validasi kalender tanggal, UTC kanonis, recorded time ≥ awal snapshot bisnis, revision tidak kosong; hanya proyeksikan field context publik |
| `parseGraphQuestion` | Input unknown → object dengan satu field question string; trim, nonempty, maksimum 2.000 UTF-16 code units; extra fields ditolak; server context dipertahankan |
| `parsePlanDecision` | Input unknown → planRevisionId, idempotencyKey, approved/rejected, reason; ID/key token `[A-Za-z0-9_-]` 1–128 karakter, reason trimmed 1–4.000 code units; extra actor/role/time/payload fields ditolak |
| `apiFailure` | Error code/status/message statis dan aman; tidak menerima Error provider/raw details untuk dipublikasikan |

Text SQL-like pada question/reason tetap data; validator tidak memakai blacklist SQL. Query BE-10 menggunakan parameter binding. Request size/rate/CSRF/auth/HMAC, source span validation dan transaksi idempotensi masih tanggung jawab task pemilik, bukan fitur yang diklaim selesai di sini.

`ApiResult<T>` berbentuk `{ok:true,data:T}` atau `{ok:false,error:ApiError}`. Code/status union: VALIDATION/400, UNAUTHENTICATED/401, FORBIDDEN/403, NOT_FOUND/404, CONFLICT/409, RATE_LIMITED/429, UNAVAILABLE/503, INTERNAL/500. Route Handler memakai `error.status` sebagai HTTP status; Server Action mengembalikan union ini tanpa mengklaim semua response action mempunyai status HTTP domain tersebut. Correlation ID ditambahkan boundary/log server ketika BE-09/10 membutuhkannya, tanpa membocorkan error internal.

## 5. Boundary yang diimplementasikan pada task berikutnya

| Boundary | Pemilik | Kontrak |
|---|---|---|
| `GET /api/health/live`, `/ready` | BE-02 | Proses vs DB/schema/published revision; ready 503 bila belum siap; Jev status terpisah |
| `GET /api/accounts` | BE-08/10 | Query allowlist `search`, `level`, `sort`; sort priority/weighted/renewal; urutan score descending, NULL last, renewal lalu account ID sebagai tie-break; pin fokus tidak mengubah rank global |
| `GET /api/accounts/[id]`, `/evidence` | BE-10 | Summary/detail/EvidencePackage; unknown →404; result/depth/time limit |
| `GET /api/data/status` | BE-04/06/10 | Published dataset/run counts/error/cost status; harga tidak diketahui berarti cost NULL, bukan zero |
| `askGraph` action | BE-10 | parseGraphQuestion → router Jev → query/template atau abstain; entity ambiguity dan evidence insufisien jelas |
| `login/logout` actions | BE-09 | Session actor HMAC dari server; protected writes/origin/rate limits |
| `createPlan/revisePlan/decidePlan` | BE-11 | Revisi/bukti/preseden, role check; decision input tanpa actor; idempotency payload hash dan transaksi. App Decision dipisah dari preseden dataset |
| `submitFeedback/replyFeedback` | BE-12 | Session actor, context yang valid, plain text; response Feedback; tak ada efek otomatis pada skor |
| `migrate/ingest` CLI | BE-02/04 | SSH/operator, path privat; tidak ada public upload atau command dari body HTTP |

Invariants query: graph traversal depth ≤4, cycle guard dan batas response; derived edge memuat alasan/provenance/status, bukan dianggap causal hard fact. Rekomendasi memerlukan tiga kelompok sumber bila tersedia, bukan tiga node satu file. Bobot/cutoff/missing-data policy tetap eksperimen BE-08; kontrak ini tidak mengesahkan score.

## 6. Bukti verifikasi

Prototype boundary pada checkpoint BE-01 diverifikasi dan dicatat di [12-BACKEND-TASKS](12-BACKEND-TASKS.md) §6. Service health, schema, dan migration runner dibuat pada BE-02; checkpoint 9 Okt belum memiliki database disposable. Implementasi workspace dan verifikasi PostgreSQL 10 Okt dijelaskan di §7 dan `04-TODO.md`.

## 7. Workspace terhubung (10 Okt 2026)

Bagian ini memperbarui status implementasi historis di atas; scope disetujui dalam ADR-0008.

| HTTP | DTO/perilaku |
|---|---|
| `GET /api/accounts/:id/evidence`, `GET /api/graph/evidence?entity=...&depth=1..4` | rootId, datasetRevision, businessAsOf, recordedAsOf, synthetic, nodes, edges, citations, depth, truncated. Entity dapat external key/node ID; `:` dan `.` diperbolehkan. Batas 60 node, 120 edge per putaran, 400 sitasi. Edge hard/derived dan active/review tetap eksplisit; hanya sumber dengan provenance disajikan. |
| `GET /api/accounts/:id/recommendation` | leadFactor, reason, draft, citations, sourceGroups, datasetPrecedents, app precedents, limitations. Preseden menyimpan kondisi/sourceRefs/actor/waktu/alasan/hasil; kesamaan satu faktor tidak membuktikan akar penyebab/efektivitas sama. |
| `GET /api/data/status` | Published revision, sources (basename/count/hash), node/edge counts, Jev configuration/call/error/token/cost. Cost unknown adalah NULL. |
| `GET /api/actions`, `GET /api/actions/:id/history` | Membutuhkan sesi; daftar latest event dan riwayat event yang immutable. `stuck` bila blocked atau lewat tanggal target dan belum closed, memakai waktu aktual. |
| `POST /api/actions` | CSM/admin + origin + rate limit; decisionId approved, owner, dueDate YYYY-MM-DD valid, status, note, outcome nullable. Satu action per Decision. |
| `PATCH /api/actions/:id` | Input yang sama + expectedRevision integer; event baru, bukan mutation. Revision stale atau completed/cancelled →409; completed tanpa hasil →400. |

Status action: planned, in_progress, blocked, completed, cancelled. Owner 1–120 karakter, note/outcome 1–4.000 bila diisi. Actor dari cookie server, bukan body. Progress dan feedback tidak mengubah skor otomatis. Plan context menyimpan leadFactor, scoreRunId, kondisi faktor dan source hash; Decision idempotent menolak revisi lama. Advisory transaction locks digunakan karena role runtime tidak memiliki UPDATE pada tabel immutable.

Frontend meneruskan cookie melalui relay allowlist, membatasi body 16 KiB, memeriksa origin write, dan tidak menampilkan row/provider mentah. `POST /api/graph/answer` merutekan intent melalui Jev yang dikonfigurasi server; tanpa konfigurasi sistem abstain dan Investigate tetap tersedia. Tidak ada training dari cache atau panggilan provider dalam test otomatis.
