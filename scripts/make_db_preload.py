"""
make_db_preload.py
====================
Converte DB Arcoiris Dashboard.xlsx in sombra_spa_db.json e db_preload.js.
Puo essere eseguito manualmente in locale o da GitHub Actions.

Uso: python scripts/make_db_preload.py
"""
import openpyxl
import json
import os
from datetime import datetime

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX_PATH = os.path.join(BASE_DIR, "DB Arcoiris Dashboard.xlsx")
JSON_PATH = os.path.join(BASE_DIR, "sombra_spa_db.json")
PRELOAD_PATH = os.path.join(BASE_DIR, "db_preload.js")

print(f"Leggo ricavi da: {XLSX_PATH}")

wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))

if not rows:
    print("ERRORE: Foglio vuoto!")
    exit(1)

headers = [str(c).strip() if c is not None else f"col_{i}" for i, c in enumerate(rows[0])]
valid_headers = headers[:18]

db_records = []
for r in rows[1:]:
    if all(v is None for v in r):
        continue
    if r[0] is None and r[2] is None:
        continue
    rec = {}
    for h, val in zip(valid_headers, r[:18]):
        if isinstance(val, datetime):
            val = val.strftime('%Y-%m-%d')
        rec[h] = val
    db_records.append(rec)

print(f"Totale record ricavi estratti: {len(db_records)}")

# 1. Scrivi sombra_spa_db.json
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(db_records, f, ensure_ascii=False, indent=2)
print(f"Scritto: {JSON_PATH}")

# 2. Scrivi db_preload.js
data_json = json.dumps(db_records, ensure_ascii=False)
preload_js = f"""// AUTO-GENERATO — NON MODIFICARE MANUALMENTE
// Fonte: DB Arcoiris Dashboard.xlsx
// Generato il: {datetime.now().strftime('%Y-%m-%d %H:%M')}
// Record totali: {len(db_records)}
(function() {{
    try {{
        var data = {data_json};
        localStorage.setItem('sombra_spa_db', JSON.stringify(data));
        console.log('[Preload Ricavi] ' + data.length + ' record caricati con successo.');
    }} catch(e) {{
        console.error('[Preload Ricavi] Errore:', e);
    }}
}})();
"""

with open(PRELOAD_PATH, "w", encoding="utf-8") as f:
    f.write(preload_js)
print(f"Scritto: {PRELOAD_PATH}")
print("OK - Ricavi aggiornati con successo!")
