"""
make_costi_preload.py
=====================
Converte Uploads/spese.xlsx in costi_preload.js.
Viene eseguito automaticamente da GitHub Actions ogni volta che spese.xlsx viene aggiornato.
Può essere eseguito anche manualmente in locale.

Uso: python scripts/make_costi_preload.py
"""
import openpyxl
import json
import os
from datetime import datetime

# Percorsi relativi alla root del progetto
BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX_PATH = os.path.join(BASE_DIR, "Uploads", "spese.xlsx")
OUT_PATH  = os.path.join(BASE_DIR, "costi_preload.js")

print(f"Leggo: {XLSX_PATH}")

wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
print(f"Fogli trovati: {wb.sheetnames}")

all_rows = []

def sheet_to_rows(ws, macro_type):
    rows = []
    headers = None
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = [str(c).strip() if c is not None else f"col_{i}" for i, c in enumerate(row)]
            continue
        if all(v is None for v in row):
            continue
        record = {}
        for h, v in zip(headers, row):
            if isinstance(v, datetime):
                v = v.strftime('%Y-%m-%d')
            record[h] = v
        record["MacroType"] = macro_type
        rows.append(record)
    return rows

for sheet_name, macro_type in [
    ("Spese Ordinarie (25-26)", "Spesa Ordinaria"),
    ("Immobilizzato (25-26)",   "Immobilizzato"),
]:
    if sheet_name in wb.sheetnames:
        rows = sheet_to_rows(wb[sheet_name], macro_type)
        print(f"  '{sheet_name}': {len(rows)} righe")
        all_rows.extend(rows)
    else:
        print(f"  ATTENZIONE: foglio '{sheet_name}' non trovato!")

print(f"Totale record: {len(all_rows)}")

data_json = json.dumps(all_rows, ensure_ascii=False)

preload_js = f"""// AUTO-GENERATO — NON MODIFICARE MANUALMENTE
// Fonte: Uploads/spese.xlsx
// Generato il: {datetime.now().strftime('%Y-%m-%d %H:%M')} UTC
// Record totali: {len(all_rows)} ({sum(1 for r in all_rows if r.get('MacroType')=='Spesa Ordinaria')} spese + {sum(1 for r in all_rows if r.get('MacroType')=='Immobilizzato')} immobilizzazioni)
(function() {{
    try {{
        var existing = localStorage.getItem('sombra_costi_data');
        var data = {data_json};
        if (!existing || JSON.parse(existing).length === 0) {{
            localStorage.setItem('sombra_costi_data', JSON.stringify(data));
            console.log('[Preload Costi] ' + data.length + ' record caricati.');
        }} else {{
            console.log('[Preload Costi] Dati gia presenti in localStorage, skip.');
        }}
    }} catch(e) {{
        console.error('[Preload Costi] Errore:', e);
    }}
}})();
"""

with open(OUT_PATH, "w", encoding="utf-8") as f:
    f.write(preload_js)

size_kb = len(preload_js) / 1024
print(f"Scritto: {OUT_PATH} ({size_kb:.1f} KB)")
print("OK")
