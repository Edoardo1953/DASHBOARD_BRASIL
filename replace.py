import re
import sys
import os

file_path = r'c:\Users\Edoardo\.gemini\antigravity\scratch\DASHBOARD_BRASIL\index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define mapping for static HTML texts to their i18n keys
# Only replace elements where we can safely match tags
mapping = [
    (r'<h2>Accesso Riservato</h2>', r'<h2 data-i18n="login.title">Accesso Riservato</h2>'),
    (r'<p style="color: var\(--text-secondary\); margin-bottom: 1.5rem;">Inserisci le tue credenziali per continuare</p>', r'<p style="color: var(--text-secondary); margin-bottom: 1.5rem;" data-i18n="login.subtitle">Inserisci le tue credenziali per continuare</p>'),
    (r'<label style="font-weight: 600; color: var\(--text-primary\);">Username \(ID\)</label>', r'<label style="font-weight: 600; color: var(--text-primary);" data-i18n="login.username">Username (ID)</label>'),
    (r'<label style="font-weight: 600; color: var\(--text-primary\);">Password</label>', r'<label style="font-weight: 600; color: var(--text-primary);" data-i18n="login.password">Password</label>'),
    (r'<div id="login-error" class="status-msg error" style="display: none; margin-top: 1rem; text-align: center;">Credenziali errate</div>', r'<div id="login-error" class="status-msg error" style="display: none; margin-top: 1rem; text-align: center;" data-i18n="login.error">Credenziali errate</div>'),
    (r'<button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; justify-content: center;">Accedi</button>', r'<button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; justify-content: center;" data-i18n="login.button">Accedi</button>'),
    
    (r'<span>Dashboard</span>', r'<span data-i18n="nav.dashboard">Dashboard</span>'),
    (r'<span>Storico Annuale</span>', r'<span data-i18n="nav.yearlyHistory">Storico Annuale</span>'),
    (r'<span>Comparatore</span>', r'<span data-i18n="nav.comparator">Comparatore</span>'),
    (r'<span>Analisi Dati</span>', r'<span data-i18n="nav.dataAnalysis">Analisi Dati</span>'),
    (r'<span>Analisi per Area</span>', r'<span data-i18n="nav.areaAnalysis">Analisi per Area</span>'),
    (r'<span>Dettaglio Dati</span>', r'<span data-i18n="nav.dataDetail">Dettaglio Dati</span>'),
    (r'<span>Inserisci Dati</span>', r'<span data-i18n="nav.insertData">Inserisci Dati</span>'),
    (r'<span>Importa / Esporta</span>', r'<span data-i18n="nav.importExport">Importa / Esporta</span>'),
    (r'<span>Gestione Utenti</span>', r'<span data-i18n="nav.userManagement">Gestione Utenti</span>'),
    (r'<span>Logout</span>', r'<span data-i18n="nav.logout">Logout</span>'),
    
    (r'<span class="hamburger-label">MENU</span>', r'<span class="hamburger-label" data-i18n="sidebar.menu">MENU</span>'),
    (r'<p style="margin: 0;">Panoramica finanziaria e operativa</p>', r'<p style="margin: 0;" data-i18n="header.subtitle">Panoramica finanziaria e operativa</p>'),
    (r'<label style="white-space: nowrap; font-weight: 600;">Filtra Anni:</label>', r'<label style="white-space: nowrap; font-weight: 600;" data-i18n="header.filterYears">Filtra Anni:</label>'),
    (r'<button id="restoreYearsBtnTop" class="btn-multi-select" style="margin-top: 0;"><i class="ph ph-arrow-counter-clockwise"></i> Ripristina anni nascosti</button>', r'<button id="restoreYearsBtnTop" class="btn-multi-select" style="margin-top: 0;"><i class="ph ph-arrow-counter-clockwise"></i> <span data-i18n="header.restoreYears">Ripristina anni nascosti</span></button>'),
    (r'<button id="toggle-multi-select" class="btn-multi-select" style="margin-top: 0;">Attiva Selezione Multipla</button>', r'<button id="toggle-multi-select" class="btn-multi-select" style="margin-top: 0;" data-i18n="header.enableMultiSelect">Attiva Selezione Multipla</button>'),
    
    (r'<i class="ph ph-printer"></i> Esporta PDF <i class="ph ph-caret-down"></i>', r'<i class="ph ph-printer"></i> <span data-i18n="header.exportPdf">Esporta PDF</span> <i class="ph ph-caret-down"></i>'),
    (r'<i class="ph ph-file-pdf"></i> PDF \(Verticale\)', r'<i class="ph ph-file-pdf"></i> <span data-i18n="header.pdfPortrait">PDF (Verticale)</span>'),
    (r'<i class="ph ph-file-pdf"></i> PDF \(Orizzontale\)', r'<i class="ph ph-file-pdf"></i> <span data-i18n="header.pdfLandscape">PDF (Orizzontale)</span>'),
    (r'<i class="ph ph-crop"></i> Ritaglia Area \(PDF\)', r'<i class="ph ph-crop"></i> <span data-i18n="header.pdfCrop">Ritaglia Area (PDF)</span>'),
    
    (r'<h3>Fatturato Totale \(Net Sales\)</h3>', r'<h3 data-i18n="kpi.totalRevenueNet">Fatturato Totale (Net Sales)</h3>'),
    (r'<h3>Ricavi Diarias</h3>', r'<h3 data-i18n="kpi.revenueDiarias">Ricavi Diarias</h3>'),
    (r'<h3>Occupazione Media</h3>', r'<h3 data-i18n="kpi.avgOccupancy">Occupazione Media</h3>'),
    (r'<h3>Fatturato Totale \(Gross\)</h3>', r'<h3 data-i18n="kpi.totalRevenueGross">Fatturato Totale (Gross)</h3>'),
    
    (r'<h3 id="monthlyChartTitle">Andamento Mensile Fatturato</h3>', r'<h3 id="monthlyChartTitle" data-i18n="chart.monthlyRevenue">Andamento Mensile Fatturato</h3>'),
    (r'<h3>Fatturato Ultimi 5 Anni</h3>', r'<h3 data-i18n="chart.yearlyRevenue">Fatturato Ultimi 5 Anni</h3>'),
    (r'<h3>Andamento Fatturato Annuo \(NET\)</h3>', r'<h3 data-i18n="chart.yearlyTrendNet">Andamento Fatturato Annuo (NET)</h3>'),
    (r'<h3 id="yearlyCompositionChartTitle">Composizione Ricavi</h3>', r'<h3 id="yearlyCompositionChartTitle" data-i18n="chart.revenueComposition">Composizione Ricavi</h3>'),
    
    (r'<option value="bar">Barre</option>', r'<option value="bar" data-i18n="selector.bar">Barre</option>'),
    (r'<option value="line">Linea</option>', r'<option value="line" data-i18n="selector.line">Linea</option>'),
    (r'<option value="doughnut">Ciambella</option>', r'<option value="doughnut" data-i18n="selector.doughnut">Ciambella</option>'),
    (r'<option value="pie">Torta</option>', r'<option value="pie" data-i18n="selector.pie">Torta</option>'),
    (r'<option value="polarArea">Area Polare</option>', r'<option value="polarArea" data-i18n="selector.polarArea">Area Polare</option>'),
    
    (r'<h2>Storico Annuale</h2>', r'<h2 data-i18n="nav.yearlyHistory">Storico Annuale</h2>'),
    (r'<h3>Tabella Aggregata per Anno</h3>', r'<h3 data-i18n="nav.yearlyHistory">Tabella Aggregata per Anno</h3>'),
    (r'<th>Anno</th>', r'<th data-i18n="table.year">Anno</th>'),
    (r'<th>Diarias</th>', r'<th data-i18n="table.diarias">Diarias</th>'),
    (r'<th>A&B</th>', r'<th data-i18n="table.fb">A&B</th>'),
    (r'<th>Spa</th>', r'<th data-i18n="table.spa">Spa</th>'),
    (r'<th>Outros</th>', r'<th data-i18n="table.others">Outros</th>'),
    (r'<th>Net Sales</th>', r'<th data-i18n="table.netSales">Net Sales</th>'),
    (r'<th>Taxas</th>', r'<th data-i18n="table.taxes">Taxas</th>'),
    (r'<th>Brut Sales</th>', r'<th data-i18n="table.grossSales">Brut Sales</th>'),
    (r'<th>Diaria Media</th>', r'<th data-i18n="table.avgDiaria">Diaria Media</th>'),
    (r'<th>N\. Diarie</th>', r'<th data-i18n="table.numDiarie">N. Diarie</th>'),
    (r'<th>% Occup\.</th>', r'<th data-i18n="table.occupancy">% Occup.</th>'),
    
    (r'<h3 style="margin:0;"><i class="ph ph-scales" style="color: var\(--accent-blue\); margin-right: 8px;"></i> Comparatore Annuale</h3>', r'<h3 style="margin:0;"><i class="ph ph-scales" style="color: var(--accent-blue); margin-right: 8px;"></i> <span data-i18n="comparator.title">Comparatore Annuale</span></h3>'),
    (r'<label style="font-weight: 600; font-size: 1.1rem;">Anno 1:</label>', r'<label style="font-weight: 600; font-size: 1.1rem;" data-i18n="comparator.year1">Anno 1:</label>'),
    (r'<label style="font-weight: 600; font-size: 1.1rem;">Anno 2:</label>', r'<label style="font-weight: 600; font-size: 1.1rem;" data-i18n="comparator.year2">Anno 2:</label>'),
    (r'<th>Mesi</th>', r'<th data-i18n="comparator.months">Mesi</th>'),
    (r'<th>Variazione %</th>', r'<th data-i18n="comparator.variation">Variazione %</th>'),
    (r'<div style="background-color: #cbd5e1; padding: 0.75rem; text-align: center; font-weight: bold; font-size: 0.9rem; color: #1e293b;">ANNO IN CORSO VS PRECEDENTE \(YTD\)</div>', r'<div style="background-color: #cbd5e1; padding: 0.75rem; text-align: center; font-weight: bold; font-size: 0.9rem; color: #1e293b;" data-i18n="comparator.ytd">ANNO IN CORSO VS PRECEDENTE (YTD)</div>'),
    (r'<strong>Info YTD:</strong> La comparazione "Anno in corso vs Precedente" calcola il totale tenendo conto esclusivamente dei mesi in cui sono presenti i dati per l\'anno più recente, scartando i mesi successivi dell\'anno più vecchio per garantire un confronto a parità di periodo.', r'<span data-i18n="comparator.info"><strong>Info YTD:</strong> La comparazione "Anno in corso vs Precedente" calcola il totale tenendo conto esclusivamente dei mesi in cui sono presenti i dati per l\'anno più recente, scartando i mesi successivi dell\'anno più vecchio per garantire un confronto a parità di periodo.</span>'),
    (r'<h3>Andamento Mensile Comparato</h3>', r'<h3 data-i18n="comparator.monthlyTrend">Andamento Mensile Comparato</h3>'),
    
    (r'<h2 style="margin: 0;">Analisi Dati</h2>', r'<h2 style="margin: 0;" data-i18n="nav.dataAnalysis">Analisi Dati</h2>'),
    (r' Nr\. Diarie', r' <span data-i18n="analysis.numDiarie">Nr. Diarie</span>'),
    (r' Diaria Media', r' <span data-i18n="analysis.avgDiaria">Diaria Media</span>'),
    (r' Occupazione %', r' <span data-i18n="analysis.occupancy">Occupazione %</span>'),
    (r'<div style="background-color: var\(--accent-blue\); padding: 0.75rem; text-align: center; font-weight: bold; font-size: 1rem; color: white;" id="analisi-table-title">NR DIARIE</div>', r'<div style="background-color: var(--accent-blue); padding: 0.75rem; text-align: center; font-weight: bold; font-size: 1rem; color: white;" id="analisi-table-title" data-i18n="analysis.numDiarie">NR DIARIE</div>'),
    (r'<h3 id="analisi-chart-title">Andamento Annuo</h3>', r'<h3 id="analisi-chart-title" data-i18n="analysis.yearlyTrend">Andamento Annuo</h3>')
]

for pattern, replacement in mapping:
    content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing HTML static strings.")
