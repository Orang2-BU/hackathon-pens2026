#!/usr/bin/env python3
"""
Tessera ingest -> PostgreSQL (jalan di server, sekali jalan, idempotent).
1) Muat 15 file dataset ke tabel raw_* apa adanya.
2) Hitung skor prioritas dari tabel mentah itu (logika sama dengan scoring_v1.py).
3) Tulis account_scores + account_signals, lalu ekspor balik dari DB sebagai bukti round-trip.

Env:
  DATASET_DIR  folder dataset_kasirnusa (default: /work/dataset)
  OUT_DIR      folder ekspor JSON (default: /work/ingest_out)
  DB_HOST (db) DB_PORT (5432) POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB
Deps: pandas sqlalchemy psycopg2-binary
"""
import json
import os
import pandas as pd
from sqlalchemy import create_engine, text

DS = os.environ.get("DATASET_DIR", "/work/dataset")
OUT = os.environ.get("OUT_DIR", "/work/ingest_out")
SNAP = pd.Timestamp("2026-10-01")

url = "postgresql+psycopg2://{}:{}@{}:{}/{}".format(
    os.environ.get("POSTGRES_USER", "tessera"),
    os.environ["POSTGRES_PASSWORD"],
    os.environ.get("DB_HOST", "db"),
    os.environ.get("DB_PORT", "5432"),
    os.environ.get("POSTGRES_DB", "tessera"),
)
engine = create_engine(url)

# ---------- 1) muat tabel mentah ----------
raw_files = {
    "raw_crm_accounts": "crm_accounts.csv",
    "raw_crm_contacts": "crm_contacts.csv",
    "raw_contact_employment_history": "contact_employment_history.csv",
    "raw_crm_deals": "crm_deals.csv",
    "raw_contracts_billing": "contracts_billing.csv",
    "raw_decision_log": "decision_log.csv",
    "raw_outlets": "outlets.csv",
    "raw_product_usage_daily": "product_usage_daily.csv",
    "raw_feature_usage_monthly": "feature_usage_monthly.csv",
    "raw_support_tickets": "support_tickets.csv",
    "raw_bugs": "bugs.csv",
    "raw_releases": "releases.csv",
    "raw_features": "features.csv",
    "raw_employees": "employees.csv",
}
frames = {}
for table, fn in raw_files.items():
    df = pd.read_csv(os.path.join(DS, fn))
    df.to_sql(table, engine, if_exists="replace", index=False)
    frames[table] = df
    print(f"{table}: {len(df)} baris")

inter = pd.DataFrame([json.loads(l) for l in open(os.path.join(DS, "interactions.jsonl"))])
inter.to_sql("raw_interactions", engine, if_exists="replace", index=False)
print(f"raw_interactions: {len(inter)} baris")

# ---------- 2) hitung skor dari frame yang sama ----------
acc = frames["raw_crm_accounts"]
contracts = frames["raw_contracts_billing"]
tickets = frames["raw_support_tickets"].copy()
tickets["dibuat"] = pd.to_datetime(tickets["dibuat"])
employ = frames["raw_contact_employment_history"].copy()
employ["mulai"] = pd.to_datetime(employ["mulai"])
employ["selesai"] = pd.to_datetime(employ["selesai"])
decisions = frames["raw_decision_log"]
contacts = frames["raw_crm_contacts"]
outlets = frames["raw_outlets"].copy()
usage = frames["raw_product_usage_daily"].copy()
usage["tanggal"] = pd.to_datetime(usage["tanggal"])
inter = inter.copy()
inter["tanggal"] = pd.to_datetime(inter["tanggal"])

ids = contracts["account_id"].tolist()
nama = dict(zip(acc.account_id, acc.nama))
champ = dict(zip(acc.account_id, acc.champion_contact_id))
contact_nama = dict(zip(contacts.contact_id, contacts.nama)) if "nama" in contacts else {}
nilai = dict(zip(contracts.account_id, contracts.nilai_tahunan))
renewal = dict(zip(contracts.account_id, contracts.tanggal_renewal))
late = dict(zip(contracts.account_id, contracts.keterlambatan_bayar_12bln))

u = usage.groupby(["account_id", "tanggal"])["jumlah_transaksi"].sum().reset_index()
prev = u[(u.tanggal >= "2026-04-04") & (u.tanggal <= "2026-07-02")].groupby("account_id")["jumlah_transaksi"].mean()
recent = u[(u.tanggal >= "2026-07-03") & (u.tanggal <= "2026-09-30")].groupby("account_id")["jumlah_transaksi"].mean()
outlets["mode_offline_aktif"] = outlets.mode_offline_aktif.astype(str).str.lower().isin(["ya", "true", "1"])
offline_outlets = outlets[outlets.mode_offline_aktif].groupby("account_id").size()
offline_ids = set(outlets[outlets.mode_offline_aktif].outlet_id)
tickets["teks"] = (tickets.judul.fillna("") + " " + tickets.deskripsi.fillna("")).str.lower()
tickets["bug_terkait"] = (tickets.bug_id == "BUG-412") | (
    tickets.outlet_id.isin(offline_ids)
    & (tickets.dibuat >= "2026-07-03")
    & tickets.teks.str.contains("sinkron|selisih|laporan tidak sesuai|offline")
)


def champ_left(cid, account_id):
    if not isinstance(cid, str) or not cid:
        return None
    rows = employ[employ.contact_id == cid].sort_values("mulai")
    if rows.empty:
        return None
    cur = rows[rows.selesai.isna()]
    row = cur.iloc[-1] if not cur.empty else rows.iloc[-1]
    if row.account_id != account_id:
        return (row.organisasi, row.mulai)
    return None


inter["dari"] = inter["dari"].fillna("")
inbound = inter[~inter.dari.str.endswith("@kasirnusa.id")]
last_in = inbound.groupby("account_id")["tanggal"].max()

score_rows, signal_rows = [], []
for aid in ids:
    sig = []
    p, r = prev.get(aid, 0), recent.get(aid, 0)
    rel = (r - p) / p if p and p > 0 else None
    pakai = max(0.0, min(100.0, -rel * 200)) if rel is not None else 0.0
    if rel is not None and rel <= -0.10:
        sig.append(f"Transaksi/hari turun {abs(rel)*100:.0f}% (90 hari terakhir vs 90 hari sebelumnya)")
    n_off = int(offline_outlets.get(aid, 0))
    if n_off:
        sig.append(f"{n_off} outlet mode offline aktif (rawan isu sinkronisasi)")
    t = tickets[tickets.account_id == aid]
    t_open = t[t.status == "Terbuka"]
    t_90 = t[t.dibuat >= "2026-07-03"]
    t_bug = t_open[t_open.bug_terkait]
    t_prio = t_open[t_open.prioritas.str.lower().isin(["tinggi", "high", "urgent", "kritis"])]
    layanan = min(100.0, min(len(t_open) * 12, 48) + min(len(t_90) * 4, 24) + min(len(t_bug) * 10, 20) + min(len(t_prio) * 5, 8))
    if len(t_open):
        extra = f", {len(t_bug)} terkait isu sinkron/BUG-412 (derived)" if len(t_bug) else ""
        sig.append(f"{len(t_open)} tiket masih terbuka{extra}; {len(t_90)} tiket dalam 90 hari terakhir")
    left = champ_left(champ.get(aid), aid)
    champ_score = 100.0 if left else 0.0
    if left:
        org, sejak = left
        cname = contact_nama.get(champ.get(aid), champ.get(aid))
        sig.append(f"Champion {cname} pindah ke {org} (sejak {sejak.date()}); CRM belum diperbarui")
    d = decisions[(decisions.account_id == aid) & (decisions.status_janji == "Belum ditepati")]
    li = last_in.get(aid)
    days = int((SNAP - li).days) if pd.notna(li) else 365
    janji = min(100.0, min(len(d) * 40, 80) + min(days, 100) * 0.3)
    if len(d):
        sig.append(f"{len(d)} janji belum ditepati (" + ", ".join(d.fitur_dijanjikan.dropna().astype(str)) + ")")
    if days >= 45:
        sig.append(f"{days} hari tanpa kontak masuk dari pelanggan")
    nlate = int(late.get(aid, 0))
    bayar = 0.0 if nlate == 0 else (50.0 if nlate == 1 else 100.0)
    if nlate:
        sig.append(f"Riwayat telat bayar {nlate}x dalam 12 bulan")

    total = 0.30 * pakai + 0.25 * layanan + 0.20 * champ_score + 0.15 * janji + 0.10 * bayar
    level = "Kritis" if total >= 30 else ("Tinggi" if total >= 15 else ("Sedang" if total >= 11 else "Rendah"))
    score_rows.append({
        "account_id": aid, "nama": nama.get(aid, aid), "skor": round(total, 1), "level": level,
        "skor_pakai": round(pakai, 1), "skor_layanan": round(layanan, 1),
        "skor_champion": round(champ_score, 1), "skor_janji": round(janji, 1),
        "skor_bayar": round(bayar, 1),
        "nilai_tahunan": int(nilai.get(aid, 0)),
        "nilai_tertimbang": int(nilai.get(aid, 0) * total / 100),
        "tanggal_renewal": str(renewal.get(aid, "")),
        "snapshot": "2026-10-01", "versi_skor": "v1",
    })
    for i, s in enumerate(sig[:4]):
        signal_rows.append({"account_id": aid, "urutan": i + 1, "signal": s})

scores = pd.DataFrame(score_rows).sort_values("skor", ascending=False)
scores.to_sql("account_scores", engine, if_exists="replace", index=False)
pd.DataFrame(signal_rows).to_sql("account_signals", engine, if_exists="replace", index=False)

# ---------- 3) ekspor balik dari DB (bukti data mengalir dari Postgres) ----------
os.makedirs(OUT, exist_ok=True)
with engine.connect() as c:
    back = [dict(r) for r in c.execute(text(
        "SELECT s.*, COALESCE(json_agg(g.signal ORDER BY g.urutan) FILTER (WHERE g.signal IS NOT NULL), '[]') AS signals "
        "FROM account_scores s LEFT JOIN account_signals g USING (account_id) "
        "GROUP BY s.account_id, s.nama, s.skor, s.level, s.skor_pakai, s.skor_layanan, s.skor_champion, "
        "s.skor_janji, s.skor_bayar, s.nilai_tahunan, s.nilai_tertimbang, s.tanggal_renewal, s.snapshot, s.versi_skor "
        "ORDER BY s.skor DESC")).mappings()]
json.dump(back, open(os.path.join(OUT, "scores_from_db.json"), "w"), ensure_ascii=False, indent=1, default=str)

print("\nTOP 5 dari account_scores (di DB):")
print(scores[["account_id", "nama", "skor", "level"]].head(5).to_string(index=False))
print(f"\nEkspor DB -> {OUT}/scores_from_db.json ({len(back)} akun). Selesai.")
