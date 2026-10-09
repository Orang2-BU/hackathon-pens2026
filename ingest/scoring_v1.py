#!/usr/bin/env python3
"""
Tessera skor prioritas v1 — 40 akun KasirNusa (snapshot 1 Okt 2026).
Bobot (ADR-0002 / doc-10): Pemakaian 30, Layanan 25, Champion 20, Janji 15, Bayar 10.
Ini SKOR PRIORITAS (0-100), bukan probabilitas churn.
Normalisasi v1 (hipotesis pertama, belum kalibrasi):
- pakai    : skor = clamp(-perubahan_rel_txn_per_hari * 200, 0, 100); jendela 3Jul-30Sep vs 4Apr-2Jul
- layanan  : min(100, tiket_terbuka*12(maks48) + tiket_90h*4(maks24) + tiket_terkait_bug*10(maks20) + tiket_terbuka_prioritas_tinggi*5(maks8))
             tiket_terkait_bug = bug_id=BUG-412 ATAU (derived) tiket soal sinkron/offline dari outlet mode offline aktif dibuat >=3Jul2026
- champion : 100 jika champion bekerja di organisasi lain saat snapshot; 0 jika masih di akun
- janji    : min(100, janji_belum_ditepati*40(maks80) + min(hari_sejak_kontak_masuk_terakhir,100)*0.3(maks30))
- bayar    : keterlambatan 0->0, 1->50, >=2->100
Total = 0.30*pakai + 0.25*layanan + 0.20*champion + 0.15*janji + 0.10*bayar
Level (usulan v1): Kritis >=30, Tinggi 15-30, Sedang 11-15, Rendah <11
"""
import json
import pandas as pd

DS = "/home/hatch/workspace/pens-challenge/dataset_kasirnusa"
SNAP = pd.Timestamp("2026-10-01")

acc = pd.read_csv(f"{DS}/crm_accounts.csv")
contracts = pd.read_csv(f"{DS}/contracts_billing.csv")
tickets = pd.read_csv(f"{DS}/support_tickets.csv", parse_dates=["dibuat", "diselesaikan"])
employ = pd.read_csv(f"{DS}/contact_employment_history.csv", parse_dates=["mulai", "selesai"])
decisions = pd.read_csv(f"{DS}/decision_log.csv")
contacts = pd.read_csv(f"{DS}/crm_contacts.csv")
outlets = pd.read_csv(f"{DS}/outlets.csv")
usage = pd.read_csv(f"{DS}/product_usage_daily.csv", parse_dates=["tanggal"])
inter = [json.loads(l) for l in open(f"{DS}/interactions.jsonl")]
inter = pd.DataFrame(inter)
inter["tanggal"] = pd.to_datetime(inter["tanggal"])

ids = contracts["account_id"].tolist()
nama = dict(zip(acc.account_id, acc.nama))
champ = dict(zip(acc.account_id, acc.champion_contact_id))
contact_nama = dict(zip(contacts.contact_id, contacts.nama)) if "nama" in contacts else {}
nilai = dict(zip(contracts.account_id, contracts.nilai_tahunan))
renewal = dict(zip(contracts.account_id, contracts.tanggal_renewal))
late = dict(zip(contracts.account_id, contracts.keterlambatan_bayar_12bln))

# --- pemakaian: txn/hari per akun per jendela ---
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

# --- champion saat ini ---
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

# --- interaksi masuk terakhir (dari sisi pelanggan) ---
inter["dari"] = inter["dari"].fillna("")
inbound = inter[~inter.dari.str.endswith("@kasirnusa.id")]
last_in = inbound.groupby("account_id")["tanggal"].max()

rows = []
for aid in ids:
    sig = []
    # pakai
    p, r = prev.get(aid, 0), recent.get(aid, 0)
    rel = (r - p) / p if p and p > 0 else None
    pakai = max(0.0, min(100.0, -rel * 200)) if rel is not None else 0.0
    if rel is not None and rel <= -0.10:
        sig.append(f"Transactions per day down {abs(rel)*100:.0f}% (last 90 days vs prior 90 days)")
    n_off = int(offline_outlets.get(aid, 0))
    if n_off:
        sig.append(f"{n_off} outlets in active offline mode (exposed to sync issues)")
    # layanan
    t = tickets[tickets.account_id == aid]
    t_open = t[t.status == "Terbuka"]
    t_90 = t[t.dibuat >= "2026-07-03"]
    t_bug = t_open[t_open.bug_terkait]
    t_prio = t_open[t_open.prioritas.str.lower().isin(["tinggi", "high", "urgent", "kritis"])]
    layanan = min(100.0, min(len(t_open) * 12, 48) + min(len(t_90) * 4, 24) + min(len(t_bug) * 10, 20) + min(len(t_prio) * 5, 8))
    if len(t_open):
        extra = f", {len(t_bug)} match the offline-sync/BUG-412 pattern (derived)" if len(t_bug) else ""
        sig.append(f"{len(t_open)} support tickets still open{extra}; {len(t_90)} tickets in the last 90 days")
    # champion
    left = champ_left(champ.get(aid), aid)
    champ_score = 100.0 if left else 0.0
    if left:
        org, sejak = left
        cname = contact_nama.get(champ.get(aid), champ.get(aid))
        sig.append(f"Champion {cname} moved to {org} (since {sejak.date()}); CRM not updated")
    # janji + engagement
    d = decisions[(decisions.account_id == aid) & (decisions.status_janji == "Belum ditepati")]
    li = last_in.get(aid)
    days = int((SNAP - li).days) if pd.notna(li) else 365
    janji = min(100.0, min(len(d) * 40, 80) + min(days, 100) * 0.3)
    if len(d):
        sig.append(f"{len(d)} unkept commitments (" + ", ".join(d.fitur_dijanjikan.dropna().astype(str)) + ")")
    if days >= 45:
        sig.append(f"{days} days without inbound customer contact")
    # bayar
    nlate = int(late.get(aid, 0))
    bayar = 0.0 if nlate == 0 else (50.0 if nlate == 1 else 100.0)
    if nlate:
        sig.append(f"Late payment {nlate}x in the last 12 months")

    total = 0.30 * pakai + 0.25 * layanan + 0.20 * champ_score + 0.15 * janji + 0.10 * bayar
    level = "Kritis" if total >= 30 else ("Tinggi" if total >= 15 else ("Sedang" if total >= 11 else "Rendah"))
    rows.append({
        "account_id": aid, "nama": nama.get(aid, aid),
        "skor": round(total, 1), "level": level,
        "sub": {"pakai": round(pakai, 1), "layanan": round(layanan, 1), "champion": round(champ_score, 1),
                "janji": round(janji, 1), "bayar": round(bayar, 1)},
        "nilai_tahunan": int(nilai.get(aid, 0)),
        "nilai_tertimbang": int(nilai.get(aid, 0) * total / 100),
        "renewal": str(renewal.get(aid, "")),
        "signals": sig[:4],
    })

rows.sort(key=lambda x: -x["skor"])
df = pd.DataFrame(rows)
out_cols = ["account_id", "nama", "skor", "level", "nilai_tahunan", "nilai_tertimbang", "renewal"]
df[out_cols].to_csv("/home/hatch/workspace/pens-challenge/scores_40_v1.csv", index=False)
json.dump(rows, open("/home/hatch/workspace/pens-challenge/scores_40_v1.json", "w"), ensure_ascii=False, indent=1)

print(df[out_cols].head(14).to_string(index=False))
print("\nRingkasan: mean", round(df.skor.mean(), 1), "| max", df.skor.max(), "| Kritis", (df.level == 'Kritis').sum(),
      "Tinggi", (df.level == 'Tinggi').sum(), "Sedang", (df.level == 'Sedang').sum(), "Rendah", (df.level == 'Rendah').sum())
ref = {"C01": 37.1, "C03": 32.2, "C02": 23.9, "C05": 23.3, "C04": 10.5, "C06": 9.2}
print("\nValidasi vs first-pass 16.40:")
for k, v in ref.items():
    got = df[df.account_id == k].skor.iloc[0]
    print(f"  {k}: v1={got}  referensi={v}  selisih={got-v:+.1f}")
