#!/usr/bin/env python3
"""
Tessera text classifier — baca teks bebas (email/catatan/tiket), keluar sinyal bertipe.
Endpoint-agnostic (OpenAI-compatible): Jev/TypeSafe atau Groq, tinggal ganti env.

Env:
  LLM_API_KEY    wajib untuk panggilan asli (simpan di .env server, JANGAN di repo)
  LLM_BASE_URL   default https://api.groq.com/openai/v1
  LLM_MODEL      default llama-3.3-70b-versatile
  DATASET_DIR    default /work/dataset (folder dataset_kasirnusa di server)
  DB_HOST/DB_PORT/POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB  untuk --write-db

Pakai:
  python3 groq_classify.py --text "..." --account C01
  python3 groq_classify.py --source interactions --write-db
  python3 groq_classify.py --source tickets --limit 100 --write-db
  python3 groq_classify.py --source interactions --dry-run

Gerbang confidence: >=0.80 -> graph, 0.50-0.80 -> review, <0.50 -> dropped.
Stdlib saja untuk panggilan LLM; --write-db butuh psycopg2-binary (sudah dipakai ingest).
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("LLM_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
MODEL = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")
DATASET = os.environ.get("DATASET_DIR", "/work/dataset")
TYPES = ["competitor_mentioned", "vendor_evaluation", "unkept_commitment",
         "dissatisfaction", "churn_risk_statement", "expansion_interest",
         "praise", "neutral_routine", "other"]

SYSTEM = """Kamu mengklasifikasikan pesan pelanggan untuk sistem early-warning churn.
Untuk SETIAP pesan, tentukan satu signal_type dari daftar ini:
competitor_mentioned (menyebut produk/pesaing lain), vendor_evaluation (sedang menilai/membandingkan vendor),
unkept_commitment (menagih janji/fitur yang belum diberikan), dissatisfaction (keluhan/ketidakpuasan),
churn_risk_statement (isyarat berhenti/pindah/tidak perpanjang), expansion_interest (minat tambah outlet/fitur/langganan),
praise (kepuasan eksplisit), neutral_routine (operasional biasa), other (di luar itu).
Balas HANYA JSON: {"results":[{"id":"<id input>","signal_type":"...","confidence":0.0-1.0,"quote":"kutipan persis maks 120 karakter"}]}
confidence = seberapa yakin kamu, jujur. Jangan mengarang isi di luar teks."""

BATCH = 8


def call_llm(items):
    payload = {
        "model": MODEL,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": json.dumps({"messages": items}, ensure_ascii=False)},
        ],
    }
    req = urllib.request.Request(
        f"{BASE}/chat/completions",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json",
                 "Authorization": f"Bearer {os.environ['LLM_API_KEY']}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.loads(resp.read())
    text = body["choices"][0]["message"]["content"].strip()
    if text.startswith("```"):
        text = text.strip("`").removeprefix("json").strip()
    return json.loads(text)["results"]


def classify(items):
    """items: [{id, account_id, text}] -> rows with status gate applied."""
    out = []
    for i in range(0, len(items), BATCH):
        chunk = items[i:i + BATCH]
        try:
            results = call_llm(chunk)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(12)
                results = call_llm(chunk)
            else:
                raise
        by_id = {str(r.get("id")): r for r in results}
        for it in chunk:
            r = by_id.get(str(it["id"])) or {}
            conf = float(r.get("confidence") or 0)
            status = "graph" if conf >= 0.80 else ("review" if conf >= 0.50 else "dropped")
            out.append({
                "source_id": it["id"], "account_id": it["account_id"],
                "signal_type": r.get("signal_type", "other"), "confidence": round(conf, 2),
                "quote": (r.get("quote") or "")[:200], "status": status, "model": MODEL,
            })
        time.sleep(2.2)
    return out


def load_items(source, limit):
    if source == "interactions":
        rows = [json.loads(l) for l in open(os.path.join(DATASET, "interactions.jsonl"))]
        items = [{"id": r["interaction_id"], "account_id": r["account_id"],
                  "text": f"{r.get('subjek') or ''} — {r.get('isi') or ''}"} for r in rows]
    else:
        items = []
        with open(os.path.join(DATASET, "support_tickets.csv"), newline="") as f:
            for r in csv.DictReader(f):
                items.append({"id": r["ticket_id"], "account_id": r["account_id"],
                              "text": f"{r.get('judul') or ''} — {r.get('deskripsi') or ''}"})
    return items[:limit] if limit else items


def write_db(rows, source):
    import psycopg2
    conn = psycopg2.connect(
        host=os.environ.get("DB_HOST", "db"), port=os.environ.get("DB_PORT", "5432"),
        user=os.environ.get("POSTGRES_USER", "tessera"),
        password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ.get("POSTGRES_DB", "tessera"))
    cur = conn.cursor()
    cur.execute("""CREATE TABLE IF NOT EXISTS llm_signals (
        id serial PRIMARY KEY, source_table text, source_id text, account_id text,
        signal_type text, confidence real, quote text, status text, model text,
        created_at timestamptz DEFAULT now())""")
    cur.execute("DELETE FROM llm_signals WHERE source_table = %s", (source,))
    cur.executemany(
        "INSERT INTO llm_signals (source_table, source_id, account_id, signal_type, confidence, quote, status, model) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        [(source, r["source_id"], r["account_id"], r["signal_type"], r["confidence"],
          r["quote"], r["status"], r["model"]) for r in rows])
    conn.commit()
    cur.close()
    conn.close()


def main():
    ap = argparse.ArgumentParser(description="Klasifikasi teks KasirNusa via LLM (OpenAI-compatible)")
    ap.add_argument("--source", choices=["interactions", "tickets"])
    ap.add_argument("--text")
    ap.add_argument("--account", default="")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--write-db", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="tampilkan item pertama, jangan panggil LLM")
    a = ap.parse_args()

    if a.text:
        items = [{"id": "live-1", "account_id": a.account, "text": a.text}]
    elif a.source:
        items = load_items(a.source, a.limit)
    else:
        ap.error("pilih --source atau --text")

    if a.dry_run:
        print(f"model={MODEL} base={BASE} items={len(items)}")
        print(json.dumps(items[:2], ensure_ascii=False, indent=1))
        return

    if "LLM_API_KEY" not in os.environ:
        sys.exit("ERROR: LLM_API_KEY belum di-set.")

    rows = classify(items)
    source = a.source or "live"
    if a.write_db:
        write_db(rows, source)
    counts = {}
    for r in rows:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    print(f"sumber={source} total={len(rows)} per-status={counts}")
    for r in sorted(rows, key=lambda x: -x["confidence"])[:5]:
        print(f"  [{r['status']}] {r['account_id']} {r['signal_type']} {r['confidence']} :: {r['quote'][:90]}")


if __name__ == "__main__":
    main()
