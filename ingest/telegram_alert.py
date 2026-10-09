#!/usr/bin/env python3
"""
Tessera -> Telegram early-warning sender (Python stdlib saja, tanpa pip install).

Env wajib (simpan di ~/tessera/.env di server, JANGAN di repo):
  TELEGRAM_BOT_TOKEN   token dari @BotFather
  TELEGRAM_CHAT_ID     chat id tujuan (personal/grup)

Pakai:
  python3 telegram_alert.py --digest ~/tessera/ingest_out/scores_from_db.json
  python3 telegram_alert.py --alert "Sinyal baru C01: competitor disebut (0.87)"
  python3 telegram_alert.py --digest scores.json --dry-run   # tampilkan saja

--digest membaca ekspor skor dari DB (scores_from_db.json) atau JSON sejenis
dan mengirim ringkasan akun level Kritis saja.
--alert mengirim satu pesan bebas (untuk pemicu sinyal Jev nanti).
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

APP_URL = os.environ.get("TESSERA_URL", "https://tessera.kandu.kr")


def rp_jt(v: int) -> str:
    return f"Rp{v / 1e6:,.1f} jt".replace(",", "_").replace(".", ",").replace("_", ".")


def send(text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        sys.exit("ERROR: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID belum di-set di env.")
    data = urllib.parse.urlencode({"chat_id": chat_id, "text": text}).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=data)
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read())
    if not body.get("ok"):
        sys.exit(f"ERROR Telegram: {body}")
    print("Terkirim. message_id:", body["result"]["message_id"])


def build_digest(rows) -> str:
    rows = list(rows)
    kritis = [r for r in rows if str(r.get("level", "")).lower() == "kritis"]
    kritis.sort(key=lambda r: -float(r["skor"]))
    total = sum(int(r.get("nilai_tertimbang") or 0) for r in kritis)
    snap = kritis[0].get("snapshot", "") if kritis else ""
    lines = [f"🚨 TESSERA — EARLY WARNING ({snap})".rstrip(" ()"),
             f"{len(kritis)} akun KRITIS dari {len(rows)} akun · total nilai tertimbang {rp_jt(total)}",
             ""]
    for i, r in enumerate(kritis, 1):
        sig = r.get("signals") or []
        if isinstance(sig, str):
            try:
                sig = json.loads(sig)
            except json.JSONDecodeError:
                sig = [sig]
        prio = ("champion", "janji", "tiket", "transaksi", "telat bayar", "offline", "tanpa kontak")
        sig = sorted(sig, key=lambda s: next((i for i, k in enumerate(prio) if k in s.lower()), 99))
        top = f" · {sig[0]}" if sig else ""
        lines.append(
            f"{i}. {r['account_id']} {r['nama']} — skor {float(r['skor']):g}"
            f" · renewal {r.get('tanggal_renewal') or r.get('renewal', '')}"
            f" · nilai tertimbang {rp_jt(int(r.get('nilai_tertimbang') or 0))}{top}")
        lines.append(f"   {APP_URL}/accounts/{r['account_id']}")
    lines += ["", "Skor prioritas dari pipeline Tessera (bukan notifikasi ke pelanggan)."]
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="Kirim early-warning Tessera ke Telegram")
    ap.add_argument("--digest", metavar="JSON", help="path ekspor skor dari DB")
    ap.add_argument("--alert", metavar="TEKS", help="kirim satu pesan alert bebas")
    ap.add_argument("--dry-run", action="store_true", help="cetak pesan, jangan kirim")
    a = ap.parse_args()
    if a.digest:
        rows = json.load(open(a.digest))
        text = build_digest(rows)
    elif a.alert:
        text = a.alert
    else:
        ap.error("pilih --digest atau --alert")
    if a.dry_run:
        print(text)
    else:
        send(text)


if __name__ == "__main__":
    main()
