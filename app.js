let monthlyChartInstance = null;
let yearlyChartInstance = null;
let yearlyTrendChartInstance = null;
let yearlyCompositionChartInstance = null;
let comparatorChartInstance = null;
let analisiDatiChartInstance = null;
const DB_KEY = 'sombra_spa_db';
try { /* Chart.register(ChartDataLabels); */ } catch (e) { console.warn("Chart.js non caricato:", e); }
let selectedYears = new Set();
let isMultiSelect = false;
let hiddenYears = [];

function loadRoleSpecificSettings() {
    if (!currentUsername) return;
    const userKey = currentUsername;
    
    hiddenYears = JSON.parse(localStorage.getItem(`sombra_spa_hidden_years_${userKey}`) || '[]').map(Number);
    
    // Rimosso il caricamento inziale da localStorage per forzare sempre il default desiderato
    selectedYears = null; // Segnaposto per far scattare la logica di default
    
    isMultiSelect = false; // Disabilita la selezione multipla per default
    
    const toggleMultiSelectBtn = document.getElementById('toggle-multi-select');
    if (toggleMultiSelectBtn) {
        toggleMultiSelectBtn.classList.remove('active');
    }
}

function saveRoleSpecificSettings() {
    if (!currentUsername) return;
    const userKey = currentUsername;
    localStorage.setItem(`sombra_spa_hidden_years_${userKey}`, JSON.stringify(hiddenYears));
    localStorage.setItem(`sombra_spa_selected_years_${userKey}`, JSON.stringify(selectedYears ? Array.from(selectedYears) : []));
    localStorage.setItem(`sombra_spa_is_multi_select_${userKey}`, JSON.stringify(isMultiSelect));
}

// Mesi ordinati
const MONTHS_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Auth Config
function getUsers() {
    const defaultUsers = {
        'admin': { password: 'admin123', role: 'ADMIN' },
        'user': { password: 'user123', role: 'USER' }
    };
    try {
        const stored = localStorage.getItem('sombra_spa_users');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error parsing users from local storage", e);
    }
    return defaultUsers;
}

function saveUsers(usersObj) {
    localStorage.setItem('sombra_spa_users', JSON.stringify(usersObj));
}

let currentUserRole = null;
let currentUsername = null;

function bootApp() {
    try { initAuth(); } catch(e) { alert("Errore in initAuth: " + e.message); }
    try { setupAuthListeners(); } catch(e) { alert("Errore in setupAuthListeners: " + e.message); }
    try { initNavigation(); } catch(e) { alert("Errore in initNavigation: " + e.message); }
    try { initDB(); } catch(e) { alert("Errore in initDB: " + e.message); }
    try { setupEventListeners(); } catch(e) { alert("Errore in setupEventListeners: " + e.message); }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootApp);
} else {
    bootApp();
}

// --- Auth & Roles ---
function initAuth() {
    const role = sessionStorage.getItem('sombra_user_role');
    const uname = sessionStorage.getItem('sombra_username');
    const overlay = document.getElementById('login-overlay');
    if(role && uname) {
        currentUserRole = role;
        currentUsername = uname;
        if(overlay) overlay.style.display = 'none';
        loadRoleSpecificSettings();
        // Per gli USER (non ADMIN): forza default a solo l'anno più recente e selezione singola
        if(currentUserRole === 'USER') {
            selectedYears = null; // Verrà impostato all'anno più recente da populateYearSelector
            isMultiSelect = false;
            const toggleMultiSelectBtn = document.getElementById('toggle-multi-select');
            if (toggleMultiSelectBtn) toggleMultiSelectBtn.classList.remove('active');
            saveRoleSpecificSettings();
        }
        applyRoleRestrictions();
    } else {
        if(overlay) overlay.style.display = 'flex';
    }
}

function setupAuthListeners() {
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('login-username').value.trim().toLowerCase();
            const p = document.getElementById('login-password').value.trim();
            const errorEl = document.getElementById('login-error');
            
            const usersObj = getUsers();
            if(usersObj[u] && usersObj[u].password === p) {
                sessionStorage.setItem('sombra_user_role', usersObj[u].role);
                sessionStorage.setItem('sombra_username', u);
                errorEl.style.display = 'none';
                try {
                    initAuth(); // Carica le impostazioni specifiche del ruolo
                } catch (err) {
                    console.error("Error in initAuth:", err);
                    alert("Errore in initAuth: " + err.message);
                }
                try {
                    initDB(); // Re-inizializza la UI
                } catch (err) {
                    console.error("Error in initDB:", err);
                    alert("Errore in initDB: " + err.message);
                }
                const dashBtn = document.querySelector('.nav-item[data-view="dashboard-view"]');
                if(dashBtn) dashBtn.click();
            } else {
                errorEl.style.display = 'block';
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('sombra_user_role');
            sessionStorage.removeItem('sombra_username');
            currentUserRole = null;
            currentUsername = null;
            location.reload();
        });
    }
}

function applyRoleRestrictions() {
    const navInput = document.getElementById('nav-input');
    const navSettings = document.getElementById('nav-settings');
    const navTable = document.getElementById('nav-table');
    const navUsers = document.getElementById('nav-users');
    
    // Nascondiamo per tutti l'inserimento manuale e l'importazione,
    // dato che ora si gestisce centralmente tramite GitHub
    if(navInput) navInput.style.display = 'none';
    if(navSettings) navSettings.style.display = 'none';

    if(currentUserRole === 'USER') {
        if(navTable) navTable.style.display = 'none';
        if(navUsers) navUsers.style.display = 'none';
    } else {
        if(navTable) navTable.style.display = 'flex';
        if(navUsers) navUsers.style.display = 'flex';
    }
}

// --- Navigazione ---
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');
            
            // Rimuovi active da tutti
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));
            
            // Aggiungi active al selezionato
            item.classList.add('active');
            document.getElementById(targetView).classList.add('active');
            
            // Se andiamo in dashboard, aggiorniamo i dati
            if(targetView === 'dashboard-view') {
                updateDashboard();
            } else if (targetView === 'table-view') {
                updateTable();
            } else if (targetView === 'yearly-history-view') {
                updateYearlyHistory();
            } else if (targetView === 'comparator-view') {
                updateComparator();
            } else if (targetView === 'analisi-dati-view') {
                updateAnalisiDati();
            } else if (targetView === 'users-view') {
                renderUsersTable();
            }
            
            // Chiudi la sidebar su mobile dopo aver cliccato una voce
            if (window.innerWidth <= 768 && targetView) {
                const sidebar = document.querySelector('.sidebar');
                const overlay = document.getElementById('mobile-sidebar-overlay');
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    if (overlay) overlay.classList.remove('active');
                }
            }
        });
    });
}

// --- Mobile UI ---
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
};

// --- Database & Local Storage ---
function initDB() {
    // Scarica automaticamente il file excel dal server GitHub Pages
    fetch('DB Arcoiris Dashboard.xlsx?t=' + new Date().getTime())
        .then(response => {
            if(!response.ok) throw new Error("Network response was not ok");
            return response.arrayBuffer();
        })
        .then(data => {
            try {
                const workbook = XLSX.read(new Uint8Array(data), {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                if(json.length > 0) {
                    saveDB(json); // Aggiorna il localStorage con i nuovi dati centrali
                    populateYearSelector(getDB());
                    updateDashboard();
                    if(document.getElementById('dataTableBody')) updateTable();
                    if(document.getElementById('yearlyTableBody')) updateYearlyHistory();
                    if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
                    if(document.getElementById('analisi-area-tbody')) {
                        if(typeof updateAnalisiArea === "function") updateAnalisiArea();
                    }
                }
            } catch (e) {
                console.error("Errore nel parsing del file Excel:", e);
                fallbackLoadDB();
            }
        })
        .catch(error => {
            console.error("Errore nel caricamento del file Excel dal server:", error);
            fallbackLoadDB();
        });
}

function fallbackLoadDB() {
    const data = getDB();
    if(data.length > 0) {
        populateYearSelector(data);
        updateDashboard();
        if(document.getElementById('dataTableBody')) updateTable();
    } else {
        alert("Benvenuto! Non è stato possibile caricare i dati dal server. Assicurati che il file DB Arcoiris Dashboard.xlsx esista sul repository GitHub.");
    }
}

function getDB() {
    const data = localStorage.getItem(DB_KEY);
    let parsed = data ? JSON.parse(data) : [];
    
    // Normalizza i mesi e gli anni se arrivano come stringhe (es. dall'Excel)
    let needsSave = false;
    parsed = parsed.map(item => {
        if (item["ANNO"] !== undefined) {
            const y = parseInt(item["ANNO"]);
            if (!isNaN(y) && item["ANNO"] !== y) {
                item["ANNO"] = y;
                needsSave = true;
            }
        }
        let mese = item["MESE"];
        if (mese !== undefined && !isNaN(mese)) {
            const m = parseInt(mese);
            if (m >= 1 && m <= 12) {
                item["MESE"] = MONTHS_ORDER[m - 1];
                needsSave = true;
            }
        }
        return item;
    });
    
    if (needsSave) saveDB(parsed);
    return parsed;
}

let dbHistoryStack = [];
function saveDB(dataArray, isUndo = false) {
    if(!isUndo) {
        const currentData = localStorage.getItem(DB_KEY);
        if(currentData) dbHistoryStack.push(currentData);
        if(dbHistoryStack.length > 5) dbHistoryStack.shift();
    }
    localStorage.setItem(DB_KEY, JSON.stringify(dataArray));
}

window.undoLastAction = function() {
    if (dbHistoryStack.length > 0) {
        const prevState = dbHistoryStack.pop();
        localStorage.setItem(DB_KEY, prevState);
        updateDashboard();
        if(document.getElementById('dataTableBody')) updateTable();
        if(document.getElementById('yearlyTableBody')) updateYearlyHistory();
        if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
        alert('Azione annullata con successo!');
    } else {
        alert('Nessuna azione da annullare.');
    }
}

// --- Event Listeners ---
function setupEventListeners() {


    // Ripristina Anni Nascosti
    const restoreHandler = () => {
        hiddenYears = [];
        saveRoleSpecificSettings();
        alert("Tutti gli anni nascosti sono stati ripristinati!");
        populateYearSelector(getDB());
        updateDashboard();
        updateTable();
        updateYearlyHistory();
        if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
    };
    const restoreBtn1 = document.getElementById('restoreYearsBtn');
    if (restoreBtn1) restoreBtn1.addEventListener('click', restoreHandler);
    const restoreBtn2 = document.getElementById('restoreYearsBtnTop');
    if (restoreBtn2) restoreBtn2.addEventListener('click', restoreHandler);

    // Cambio Anno gestito nei pill

    // Toggle Selezione Multipla
    document.getElementById('toggle-multi-select').addEventListener('click', (e) => {
        e.target.classList.toggle('active');
        isMultiSelect = e.target.classList.contains('active');
        saveRoleSpecificSettings();
        
        // Se disabilitiamo la selezione multipla, e abbiamo più anni selezionati,
        // teniamo solo l'anno più recente
        if(!isMultiSelect && selectedYears.size > 1) {
            const maxYear = Math.max(...Array.from(selectedYears));
            selectedYears.clear();
            selectedYears.add(maxYear);
            saveRoleSpecificSettings();
            populateYearSelector(getDB());
            updateDashboard();
            updateTable();
            updateYearlyHistory();
            if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
        }
    });

    // Form Inserimento Dati
    document.getElementById('dataInputForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newEntry = {
            "ANNO": parseInt(document.getElementById('input-anno').value),
            "MESE": document.getElementById('input-mese').value,
            "Diarias": parseFloat(document.getElementById('input-diarias').value || 0),
            "A&B": parseFloat(document.getElementById('input-ab').value || 0),
            "Spa": parseFloat(document.getElementById('input-spa').value || 0),
            "Outros": parseFloat(document.getElementById('input-outros').value || 0),
            "Taxas (ISS, servicos)": parseFloat(document.getElementById('input-taxas').value || 0),
            "% occup.": parseFloat(document.getElementById('input-occup').value || 0),
            "Diaria media": parseFloat(document.getElementById('input-diaria-media').value || 0),
            "n. diarie": parseFloat(document.getElementById('input-n-diarie').value || 0)
        };
        
        // Calcolo Net Sales
        newEntry["Total (Net sales)"] = newEntry["Diarias"] + newEntry["A&B"] + newEntry["Spa"] + newEntry["Outros"];

        let db = getDB();
        
        // Controlla se esiste già questo mese/anno e aggiornalo, altrimenti aggiungi
        const existingIndex = db.findIndex(item => item["ANNO"] == newEntry["ANNO"] && item["MESE"] == newEntry["MESE"]);
        if(existingIndex >= 0) {
            db[existingIndex] = {...db[existingIndex], ...newEntry};
        } else {
            db.push(newEntry);
        }
        
        saveDB(db);
        alert("Dati salvati con successo!");
        document.getElementById('dataInputForm').reset();
        
        populateYearSelector(db);
        updateDashboard();
    });
}

// --- Funzionalità Importazione/Esportazione ---
function handleExcelUpload(e) {
    const file = e.target.files[0];
    if(!file) return;

    const statusEl = document.getElementById('import-status');
    statusEl.textContent = "Lettura file in corso...";
    statusEl.className = "status-msg";

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // Prendiamo il primo foglio
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertiamo in JSON
            const json = XLSX.utils.sheet_to_json(worksheet);
            
            if(json.length > 0) {
                // Sostituiamo il DB
                saveDB(json);
                statusEl.textContent = `Importazione completata: trovati ${json.length} record!`;
                statusEl.className = "status-msg success";
                
                populateYearSelector(json);
                
                setTimeout(() => {
                    document.querySelector('.nav-item[data-view="dashboard-view"]').click();
                }, 1500);
            } else {
                statusEl.textContent = "Errore: il file sembra vuoto.";
                statusEl.className = "status-msg error";
            }
        } catch (error) {
            console.error(error);
            statusEl.textContent = "Errore durante la lettura del file Excel.";
            statusEl.className = "status-msg error";
        }
    };
    reader.readAsArrayBuffer(file);
}

function exportData() {
    const db = getDB();
    if(db.length === 0) {
        alert("Nessun dato da esportare.");
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "sombra_spa_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function populateYearSelector(db) {
    if(!db || db.length === 0) return;
    
    let years = [...new Set(db.map(item => item["ANNO"]).filter(y => y))].sort((a,b) => b-a);
    
    // Se primo avvio/default, nascondiamo automaticamente gli anni più vecchi dei primi 6
    if (selectedYears === null) {
        hiddenYears = [];
        if (years.length > 6) {
            hiddenYears = years.slice(6);
        }
    }

    // Filtra gli anni nascosti
    years = years.filter(y => !hiddenYears.includes(y));

    const container = document.getElementById('year-filters');
    if(!container) return;
    
    container.innerHTML = '';
    
    // Se prima volta, seleziona solo l'anno più recente (es. 2026)
    if(selectedYears === null) {
        if(years.length > 0) {
            selectedYears = new Set([Math.max(...years)]);
        } else {
            selectedYears = new Set();
        }
        saveRoleSpecificSettings();
    } else if(selectedYears.size === 0 && years.length > 0) {
        selectedYears.add(years[0]);
        saveRoleSpecificSettings();
    }
    
    // Se l'anno selezionato è stato nascosto e non c'è altro, rimpiazziamo
    if(years.length > 0) {
        let hasActive = false;
        years.forEach(y => { if(selectedYears.has(y)) hasActive = true; });
        if(!hasActive) {
            selectedYears.clear();
            selectedYears.add(years[0]);
            saveRoleSpecificSettings();
        }
    }
    
    years.forEach(year => {
        const btn = document.createElement('button');
        btn.className = 'year-pill';
        if(selectedYears.has(year)) {
            btn.classList.add('active');
        }
        
        btn.innerHTML = `${year} <span class="hide-year" title="Nascondi ${year} dal cruscotto" style="color:var(--accent-red); margin-left:6px; font-size:1.1rem; opacity:0.6; padding:0 4px;">&times;</span>`;
        
        btn.addEventListener('click', (e) => {
            // Se clicca sulla X rossa
            if(e.target.classList.contains('hide-year')) {
                e.stopPropagation();
                if(confirm(`Sei sicuro di voler nascondere l'anno ${year}? I dati non verranno cancellati dal database.`)) {
                    hiddenYears.push(year);
                    selectedYears.delete(year);
                    saveRoleSpecificSettings();
                    populateYearSelector(db);
                    updateDashboard();
                    updateTable();
                    updateYearlyHistory();
                    if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
                }
                return;
            }

            if(isMultiSelect) {
                // Modalità Multipla
                if(selectedYears.has(year)) {
                    if(selectedYears.size > 1) {
                        selectedYears.delete(year);
                        btn.classList.remove('active');
                    }
                } else {
                    selectedYears.add(year);
                    btn.classList.add('active');
                }
            } else {
                // Modalità Singola
                if(!selectedYears.has(year)) {
                    selectedYears.clear();
                    selectedYears.add(year);
                    // Aggiorniamo visivamente tutti i bottoni
                    container.querySelectorAll('.year-pill').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                }
            }
            saveRoleSpecificSettings();
            updateDashboard();
            updateTable();
            updateYearlyHistory();
            if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
        });
        
        container.appendChild(btn);
    });
}

// --- Funzionalità Dashboard ---

const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatPercent = (value) => {
    // Se il valore nel DB è es. 0.80 per l'80% o direttamente 80
    let val = parseFloat(value || 0);
    if(val < 1 && val > 0) val = val * 100;
    return val.toFixed(2) + '%';
};

function updateDashboard() {
    const db = getDB();
    if(db.length === 0) return;
    
    const currentYearData = db.filter(item => selectedYears.has(item["ANNO"]));
    
    // Calcola Totali Anno Corrente
    const totalNetSales = currentYearData.reduce((sum, item) => sum + (parseFloat(item["Total (Net sales)"]) || 0), 0);
    const totalDiarias = currentYearData.reduce((sum, item) => sum + (parseFloat(item["Diarias"]) || 0), 0);
    let totalTaxes = 0;
    let totalGross = 0;
    currentYearData.forEach(item => {
        const net = parseFloat(item["Total (Net sales)"]) || 0;
        let tax = parseFloat(item["Taxas (ISS, servicos)"]) || 0;
        let gross = parseFloat(item["Total Bruto"]) || 0;
        const altCol = parseFloat(item["Total (gross taxes)"]) || 0;
        
        if (tax === 0 && altCol > 0) {
            if (altCol >= net && net > 0) {
                gross = gross || altCol;
                tax = gross - net;
            } else {
                tax = altCol;
            }
        }
        totalTaxes += tax;
        totalGross += gross || (net + tax);
    });
    
    // Media Occupazione
    const validOccupancy = currentYearData.filter(item => {
        const occ = parseFloat(item["% occup."] || item["Ocupação %"]) || 0;
        const net = parseFloat(item["Total (Net sales)"]) || parseFloat(item["Diarias"]) || 0;
        return occ > 0 || net > 0;
    });
    const avgOccupancy = validOccupancy.length > 0 ? 
        validOccupancy.reduce((sum, item) => sum + (parseFloat(item["% occup."] || item["Ocupação %"]) || 0), 0) / validOccupancy.length : 0;
    
    // Calcola Totale Anno Precedente per il Trend (solo sugli stessi mesi disponibili nell'anno corrente)
    let prevTotalNetSales = 0;
    selectedYears.forEach(year => {
        const yNum = parseInt(year, 10);
        
        // Troviamo i mesi effettivamente presenti (con fatturato > 0) per questo anno selezionato
        const currentYearMonths = currentYearData
            .filter(item => parseInt(item["ANNO"], 10) === yNum && (parseFloat(item["Total (Net sales)"]) > 0 || parseFloat(item["Diarias"]) > 0))
            .map(item => item["MESE"]);

        const prevYearData = db.filter(item => 
            parseInt(item["ANNO"], 10) === (yNum - 1) && 
            currentYearMonths.includes(item["MESE"])
        );
        prevTotalNetSales += prevYearData.reduce((sum, item) => sum + (parseFloat(item["Total (Net sales)"]) || 0), 0);
    });
    
    // Aggiorna UI KPIs
    document.getElementById('kpi-total-revenue').textContent = formatCurrency(totalNetSales);
    document.getElementById('kpi-diarias').textContent = formatCurrency(totalDiarias);
    
    const diariasPercEl = document.getElementById('kpi-diarias-perc');
    if(diariasPercEl) {
        if(totalNetSales > 0) {
            const diariasPct = (totalDiarias / totalNetSales) * 100;
            diariasPercEl.textContent = `(${diariasPct.toFixed(1)}%)`;
        } else {
            diariasPercEl.textContent = `(0%)`;
        }
    }

    document.getElementById('kpi-occupancy').textContent = formatPercent(avgOccupancy);
    
    const kpiGrossEl = document.getElementById('kpi-gross-sales');
    if (kpiGrossEl) kpiGrossEl.textContent = formatCurrency(totalGross);
    else document.getElementById('kpi-taxes').textContent = formatCurrency(totalTaxes);

    // Aggiorna Titolo Grafico Mensile
    const chartTitleEl = document.getElementById('monthlyChartTitle');
    if(chartTitleEl) {
        if(isMultiSelect && selectedYears.size > 0) {
            chartTitleEl.textContent = `Andamento Mensile Fatturato (${Array.from(selectedYears).sort().join(', ')})`;
        } else if(selectedYears.size > 0) {
            chartTitleEl.textContent = `Andamento Mensile Fatturato (${Array.from(selectedYears)[0]})`;
        } else {
            chartTitleEl.textContent = `Andamento Mensile Fatturato`;
        }
    }
    
    // Trend UI
    const trendEl = document.getElementById('kpi-revenue-trend');
    if(prevTotalNetSales > 0) {
        const trendPct = ((totalNetSales - prevTotalNetSales) / prevTotalNetSales) * 100;
        if(trendPct >= 0) {
            trendEl.className = 'trend positive';
            trendEl.innerHTML = `<i class="ph ph-trend-up"></i> ${trendPct.toFixed(2)}% vs anno prec. (stessi mesi)`;
        } else {
            trendEl.className = 'trend negative';
            trendEl.innerHTML = `<i class="ph ph-trend-down"></i> ${Math.abs(trendPct).toFixed(2)}% vs anno prec. (stessi mesi)`;
        }
    } else {
        trendEl.innerHTML = `Nessun dato anno prec.`;
        trendEl.className = 'trend';
    }

    // Disegna Grafici
    drawMonthlyChart(db);
    drawYearlyChart(db);
}

function updateTable() {
    const db = getDB();
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    // Filtriamo in base agli anni selezionati
    let filteredDb = db.filter(item => selectedYears.has(item["ANNO"]));
    
    // Ordina per Anno decrescente e poi per Mese decrescente
    const sortedDb = [...filteredDb].sort((a, b) => {
        if(a["ANNO"] !== b["ANNO"]) return b["ANNO"] - a["ANNO"];
        return MONTHS_ORDER.indexOf(b["MESE"]) - MONTHS_ORDER.indexOf(a["MESE"]);
    });

    let sumDiarias = 0;
    let sumAB = 0;
    let sumSpa = 0;
    let sumOutros = 0;
    let sumNetSales = 0;
    let sumTaxas = 0;
    let sumBrutSales = 0;
    let sumNDiarie = 0;

    sortedDb.forEach(item => {
        const netSales = parseFloat(item["Total (Net sales)"]) || 0;
        let taxas = parseFloat(item["Taxas (ISS, servicos)"]) || 0;
        let brutSales = parseFloat(item["Total Bruto"]) || 0;
        const altCol = parseFloat(item["Total (gross taxes)"]) || 0;
        
        if (taxas === 0 && altCol > 0) {
            if (altCol >= netSales && netSales > 0) {
                brutSales = brutSales || altCol;
                taxas = brutSales - netSales;
            } else {
                taxas = altCol;
            }
        }
        brutSales = brutSales || (netSales + taxas);
        const diariaMedia = parseFloat(item["Diaria media"]) || 0;
        const nDiarie = parseFloat(item["n. diarie"]) || 0;
        
        sumDiarias += parseFloat(item["Diarias"]) || 0;
        sumAB += parseFloat(item["A&B"]) || 0;
        sumSpa += parseFloat(item["Spa"]) || 0;
        sumOutros += parseFloat(item["Outros"]) || 0;
        sumNetSales += netSales;
        sumTaxas += taxas;
        sumBrutSales += brutSales;
        sumNDiarie += nDiarie;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item["MESE"] || '-'} ${item["ANNO"] || ''}</strong></td>
            <td>${formatCurrency(item["Diarias"])}</td>
            <td>${formatCurrency(item["A&B"])}</td>
            <td>${formatCurrency(item["Spa"])}</td>
            <td>${formatCurrency(item["Outros"])}</td>
            <td><strong>${formatCurrency(netSales)}</strong></td>
            <td>${formatCurrency(taxas)}</td>
            <td><strong>${formatCurrency(brutSales)}</strong></td>
            <td>${formatCurrency(diariaMedia)}</td>
            <td>${nDiarie}</td>
            <td>${formatPercent(item["% occup."])}</td>
            <td>${formatCurrency(item["RevPar"])}</td>
            <td>
                ${currentUserRole === 'ADMIN' ? `
                <button class="btn-action edit-btn" onclick="openEditModal(${item["ANNO"]}, '${item["MESE"]}')"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-action delete-btn" onclick="deleteRow(${item["ANNO"]}, '${item["MESE"]}')"><i class="ph ph-trash"></i></button>
                ` : `<span style="color: #cbd5e1; font-size: 0.8rem;">Solo Lettura</span>`}
            </td>
        `;
        tableBody.appendChild(tr);
    });

    if(sortedDb.length > 0) {
        const trTotal = document.createElement('tr');
        trTotal.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
        trTotal.innerHTML = `
            <td><strong>TOTALE SELEZIONE</strong></td>
            <td><strong>${formatCurrency(sumDiarias)}</strong></td>
            <td><strong>${formatCurrency(sumAB)}</strong></td>
            <td><strong>${formatCurrency(sumSpa)}</strong></td>
            <td><strong>${formatCurrency(sumOutros)}</strong></td>
            <td><strong>${formatCurrency(sumNetSales)}</strong></td>
            <td><strong>${formatCurrency(sumTaxas)}</strong></td>
            <td><strong>${formatCurrency(sumBrutSales)}</strong></td>
            <td></td>
            <td><strong>${sumNDiarie}</strong></td>
            <td></td>
            <td></td>
        `;
        tableBody.appendChild(trTotal);
    }
}

// ==========================================
// YEARLY HISTORY LOGIC
// ==========================================

window.updateYearlyHistory = function() {
    let db = getDB();
    
    // Filtra per anni selezionati/nascosti — usa sempre selectedYears
    if(selectedYears && selectedYears.size > 0) {
        db = db.filter(item => selectedYears.has(item["ANNO"]));
    } else {
        db = db.filter(item => !hiddenYears.includes(item["ANNO"]));
    }

    const yearlyData = {};

    db.forEach(item => {
        const y = parseInt(item["ANNO"], 10);
        if(!y || isNaN(y)) return;

        if(!yearlyData[y]) {
            yearlyData[y] = {
                anno: y,
                diarias: 0, ab: 0, spa: 0, outros: 0,
                netSales: 0, taxas: 0, brutSales: 0,
                diariaMediaSum: 0, nDiarie: 0, occupazioneSum: 0,
                count: 0,
                dataCount: 0
            };
        }
        
        yearlyData[y].diarias += parseFloat(item["Diarias"]) || 0;
        yearlyData[y].ab += parseFloat(item["A&B"]) || 0;
        yearlyData[y].spa += parseFloat(item["Spa"]) || 0;
        yearlyData[y].outros += parseFloat(item["Outros"]) || 0;
        
        const localNetSales = parseFloat(item["Total (Net sales)"]) || 0;
        let tax = parseFloat(item["Taxas (ISS, servicos)"]) || 0;
        let gross = parseFloat(item["Total Bruto"]) || 0;
        const altCol = parseFloat(item["Total (gross taxes)"]) || 0;
        
        if(tax === 0 && altCol > 0) {
            if(altCol >= localNetSales && localNetSales > 0) {
                gross = gross || altCol;
                tax = gross - localNetSales;
            } else {
                tax = altCol;
            }
        }
        
        yearlyData[y].netSales += localNetSales;
        yearlyData[y].taxas += tax;
        yearlyData[y].brutSales += gross || (localNetSales + tax);
        
        yearlyData[y].diariaMediaSum += parseFloat(item["Diaria media"]) || 0;
        yearlyData[y].nDiarie += parseFloat(item["n. diarie"]) || 0;
        yearlyData[y].occupazioneSum += parseFloat(item["% occup."] || item["Ocupação %"]) || 0;
        yearlyData[y].count += 1;
        
        if (parseFloat(item["Diaria media"]) > 0 || parseFloat(item["% occup."] || item["Ocupação %"]) > 0 || parseFloat(item["Diarias"]) > 0 || parseFloat(item["Total (Net sales)"]) > 0) {
            yearlyData[y].dataCount += 1;
        }
    });

    const years = Object.keys(yearlyData).sort((a,b) => a-b);
    
    // 1. Populate Table
    const tbody = document.getElementById('yearlyTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        
        const tableYears = [...years].reverse();
        tableYears.forEach(y => {
            const d = yearlyData[y];
            const activeMonths = d.dataCount > 0 ? d.dataCount : d.count;
            const avgDiaria = activeMonths > 0 ? d.diariaMediaSum / activeMonths : 0;
            const avgOccup = activeMonths > 0 ? d.occupazioneSum / activeMonths : 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${y}</strong></td>
                <td>${formatCurrency(d.diarias)}</td>
                <td>${formatCurrency(d.ab)}</td>
                <td>${formatCurrency(d.spa)}</td>
                <td>${formatCurrency(d.outros)}</td>
                <td><strong>${formatCurrency(d.netSales)}</strong></td>
                <td>${formatCurrency(d.taxas)}</td>
                <td><strong>${formatCurrency(d.brutSales)}</strong></td>
                <td>${formatCurrency(avgDiaria)}</td>
                <td>${d.nDiarie}</td>
                <td>${formatPercent(avgOccup)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 2. Charts
    drawYearlyTrendChart(years, yearlyData);
    drawYearlyCompositionChart(years, yearlyData);
};

function drawYearlyTrendChart(years, dataObj) {
    const canvas = document.getElementById('yearlyTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = years.map(y => dataObj[y].netSales === 0 ? null : dataObj[y].netSales);
    
    if(yearlyTrendChartInstance) {
        yearlyTrendChartInstance.destroy();
    }

    yearlyTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Net Sales (R$)',
                data: data,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            layout: { padding: { left: 50, right: 50, top: 30, bottom: 10 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    formatter: function(value) {
                        if (!value) return '';
                        if (value >= 1000) {
                            return 'R$ ' + (value / 1000).toFixed(1) + 'k';
                        }
                        return 'R$ ' + value.toFixed(0);
                    },
                    font: { weight: 'bold', size: 10 },
                    color: '#475569'
                },
                tooltip: {
                    callbacks: { label: c => formatCurrency(c.raw) }
                }
            },
            scales: {
                y: { beginAtZero: true, grace: '15%', grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { offset: true }
            }
        }
    });
}

function drawYearlyCompositionChart(years, dataObj) {
    const canvas = document.getElementById('yearlyCompositionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if(years.length === 0) return;
    
    const activeYears = years.filter(y => selectedYears.has(parseInt(y, 10)));
    if(activeYears.length === 0) return;
    
    let totalDiarias = 0, totalAb = 0, totalSpa = 0, totalOutros = 0;
    activeYears.forEach(y => {
        const d = dataObj[y];
        if(d) {
            totalDiarias += d.diarias || 0;
            totalAb += d.ab || 0;
            totalSpa += d.spa || 0;
            totalOutros += d.outros || 0;
        }
    });
    
    const titleEl = document.getElementById('yearlyCompositionChartTitle');
    if(titleEl) {
        titleEl.textContent = `Composizione Ricavi (${activeYears.join(', ')})`;
    }
    
    if(yearlyCompositionChartInstance) {
        yearlyCompositionChartInstance.destroy();
    }

    yearlyCompositionChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Diarias', 'A&B', 'Spa', 'Outros'],
            datasets: [{
                data: [totalDiarias, totalAb, totalSpa, totalOutros],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                datalabels: {
                    color: '#fff',
                    font: { weight: 'bold', size: 14 },
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => { sum += data; });
                        if (!sum) return '';
                        if (!value) return '';
                        let percentage = (value * 100 / sum).toFixed(1) + "%";
                        return percentage;
                    }
                },
                tooltip: {
                    callbacks: { label: c => c.label + ': ' + formatCurrency(c.raw) }
                }
            }
        }
    });
}


// ==========================================
// PDF EXPORT & SNIPPING TOOL LOGIC
// ==========================================

// Toggle Dropdown
const pdfBtn = document.getElementById('pdf-export-btn');
const pdfMenu = document.getElementById('pdf-export-menu');

if (pdfBtn && pdfMenu) {
    pdfBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pdfMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
        pdfMenu.classList.remove('show');
    });
}

// Native Print with Orientation
window.exportNativePDF = function(orientation) {
    pdfMenu.classList.remove('show');
    
    // Inject @page CSS
    let style = document.getElementById('print-orientation');
    if(!style) {
        style = document.createElement('style');
        style.id = 'print-orientation';
        document.head.appendChild(style);
    }
    style.innerHTML = `@media print { @page { size: ${orientation}; } }`;
    
    // Slight delay to allow CSS to apply before opening dialog
    setTimeout(() => {
        window.print();
    }, 100);
};

// Snipping Tool Logic
let snippingOverlay, snippingBox;
let isSnipping = false;
let startX, startY;

window.startSnippingTool = function() {
    pdfMenu.classList.remove('show');
    snippingOverlay = document.getElementById('snipping-overlay');
    snippingBox = document.getElementById('snipping-box');
    
    if(!snippingOverlay || !snippingBox) return;
    
    snippingOverlay.style.display = 'block';
    document.body.style.userSelect = 'none'; // Prevent text selection
};

// Esc to cancel
document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && snippingOverlay && snippingOverlay.style.display === 'block') {
        snippingOverlay.style.display = 'none';
        snippingBox.style.display = 'none';
        document.body.style.userSelect = 'auto';
    }
});

if(document.getElementById('snipping-overlay')) {
    const overlay = document.getElementById('snipping-overlay');
    const box = document.getElementById('snipping-box');
    
    overlay.addEventListener('mousedown', (e) => {
        isSnipping = true;
        startX = e.clientX;
        startY = e.clientY;
        
        box.style.left = startX + 'px';
        box.style.top = startY + 'px';
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
    });
    
    overlay.addEventListener('mousemove', (e) => {
        if(!isSnipping) return;
        
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        box.style.width = width + 'px';
        box.style.height = height + 'px';
        box.style.left = (currentX < startX ? currentX : startX) + 'px';
        box.style.top = (currentY < startY ? currentY : startY) + 'px';
    });
    
    overlay.addEventListener('mouseup', async (e) => {
        if(!isSnipping) return;
        isSnipping = false;
        
        // Get final coordinates
        const rect = box.getBoundingClientRect();
        
        // Hide overlay immediately so it's not in the screenshot
        overlay.style.display = 'none';
        box.style.display = 'none';
        document.body.style.userSelect = 'auto';
        
        if(rect.width < 50 || rect.height < 50) {
            alert("Area troppo piccola. Riprova.");
            return;
        }
        
        // Small delay to ensure overlay is gone from DOM render
        setTimeout(async () => {
            try {
                const w = Math.round(rect.width);
                const h = Math.round(rect.height);
                const x = Math.round(rect.left + window.scrollX);
                const y = Math.round(rect.top + window.scrollY);

                // html2canvas capture
                const canvas = await html2canvas(document.body, {
                    x: x,
                    y: y,
                    width: w,
                    height: h,
                    scale: 2, // High quality
                    allowTaint: true,
                    useCORS: true,
                    backgroundColor: '#ffffff', // Prevent transparent to black/washed out issues in JPEG
                    logging: false
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                
                // Determine orientation based on aspect ratio
                const orientation = w > h ? 'l' : 'p';
                
                // Create PDF matching the exact pixel dimensions of the snippet
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: orientation,
                    unit: 'px',
                    format: [w, h]
                });
                
                pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
                
                // Aggiungiamo un timestamp per evitare che Acrobat blocchi il file se è già aperto
                const timestamp = new Date().getTime();
                pdf.save(`Sombra_Spa_Ritagliato_${timestamp}.pdf`);
                
            } catch (error) {
                console.error("Errore durante il ritaglio:", error);
                alert("Errore durante la creazione del PDF. Se stai aprendo il file in locale, il browser potrebbe bloccare la lettura delle immagini. Errore: " + error.message);
            }
        }, 150);
    });
}

// --- Grafici Chart.js ---
function drawMonthlyChart(db) {
    const ctx = document.getElementById('monthlyRevenueChart').getContext('2d');
    
    if(monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    const datasets = [];
    const colors = [
        ['rgba(59, 130, 246, 0.8)', 'rgba(99, 102, 241, 0.4)'], // Blue
        ['rgba(20, 184, 166, 0.8)', 'rgba(13, 148, 136, 0.4)'], // Teal
        ['rgba(245, 158, 11, 0.8)', 'rgba(217, 119, 6, 0.4)'], // Orange
        ['rgba(239, 68, 68, 0.8)', 'rgba(220, 38, 38, 0.4)'] // Red
    ];
    
    let colorIndex = 0;
    
    // Ordiniamo gli anni in modo crescente per il grafico (es. 2024 a sinistra di 2025)
    const sortedSelectedYears = Array.from(selectedYears).sort((a,b) => a-b);

    sortedSelectedYears.forEach(year => {
        const yearData = db.filter(item => item["ANNO"] === year);
        const monthlySales = Array(12).fill(null);
        
        yearData.forEach(item => {
            const monthIndex = MONTHS_ORDER.indexOf(item["MESE"]);
            if(monthIndex !== -1) {
                let val = parseFloat(item["Total (Net sales)"] || item["Diarias"]) || 0;
                monthlySales[monthIndex] = val === 0 ? null : val;
            }
        });
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        const c = colors[colorIndex % colors.length];
        gradient.addColorStop(0, c[0]);
        gradient.addColorStop(1, c[1]);
        
        datasets.push({
            label: `Fatturato ${year} (R$)`,
            data: monthlySales,
            backgroundColor: gradient,
            borderRadius: 6,
            borderWidth: 0,
        });
        
        colorIndex++;
    });

    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: MONTHS_ORDER,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: datasets.length > 1 },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: function(value) {
                        if (!value) return '';
                        if (value >= 1000) {
                            return 'R$ ' + (value / 1000).toFixed(1) + 'k';
                        }
                        return 'R$ ' + value.toFixed(0);
                    },
                    font: { weight: 'bold', size: 10 },
                    color: '#475569'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '15%',
                    grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }
                },
                x: {
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });
}

function drawYearlyChart(db) {
    const ctx = document.getElementById('yearlyRevenueChart').getContext('2d');
    
    // Raggruppa per anno — filtra in base agli anni selezionati
    const yearlyTotals = {};
    
    db.forEach(item => {
        const y = parseInt(item["ANNO"], 10);
        if(y && !isNaN(y) && selectedYears && selectedYears.has(y)) {
            if(!yearlyTotals[y]) yearlyTotals[y] = 0;
            yearlyTotals[y] += parseFloat(item["Total (Net sales)"] || item["Diarias"]) || 0;
        }
    });

    // Prendi solo gli ultimi 5 anni disponibili tra quelli selezionati
    const labels = Object.keys(yearlyTotals).sort((a,b) => a-b).slice(-5);
    const data = labels.map(y => yearlyTotals[y] === 0 ? null : yearlyTotals[y]);

    if(yearlyChartInstance) {
        yearlyChartInstance.destroy();
    }

    yearlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fatturato Totale (R$)',
                data: data,
                backgroundColor: 'rgba(99, 102, 241, 0.8)', // Più solido e visibile
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            layout: { padding: { left: 50, right: 50, top: 30, bottom: 10 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    formatter: function(value) {
                        if (!value) return '';
                        if (value >= 1000) {
                            return 'R$ ' + (value / 1000).toFixed(1) + 'k';
                        }
                        return 'R$ ' + value.toFixed(0);
                    },
                    font: { weight: 'bold', size: 10 },
                    color: '#475569'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grace: '15%',
                    grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }
                },
                x: {
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });
}

// ==========================================
// EDIT MODAL LOGIC
// ==========================================

window.calcEditSales = function() {
    const getVal = id => parseFloat(document.getElementById(id).value) || 0;
    const diarias = getVal('edit-diarias-val');
    const ab = getVal('edit-ab');
    const spa = getVal('edit-spa');
    const outros = getVal('edit-outros');
    const taxas = getVal('edit-taxas');
    
    const netSales = diarias + ab + spa + outros;
    const brutSales = netSales + taxas;
    
    // Mostriamo fino a 2 decimali nei campi auto-calcolati
    document.getElementById('edit-netsales').value = netSales.toFixed(2);
    document.getElementById('edit-bruto').value = brutSales.toFixed(2);
};

window.openEditModal = function(anno, mese) {
    try {
        const db = getDB();
        const record = db.find(r => r["ANNO"] == anno && r["MESE"] == mese);
        if(!record) {
            alert("Errore: Impossibile trovare i dati per " + mese + " " + anno);
            return;
        }
        
        document.getElementById('edit-anno').value = record["ANNO"];
        document.getElementById('edit-mese').value = record["MESE"];
        
        const parseValue = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
        };

        // Ricavi e tasse
        document.getElementById('edit-diarias-val').value = parseValue(record["Diarias"]);
        document.getElementById('edit-ab').value = parseValue(record["A&B"]);
        document.getElementById('edit-spa').value = parseValue(record["Spa"]);
        document.getElementById('edit-outros').value = parseValue(record["Outros"]);
        document.getElementById('edit-taxas').value = parseValue(record["Taxas (ISS, servicos)"] || record["Total (gross taxes)"]);
        
        // Calcola automaticamente i totali in base ai ricavi
        calcEditSales();
        
        // Performance
        document.getElementById('edit-ndiarie').value = parseValue(record["n. diarie"]);
        document.getElementById('edit-diariamedia').value = parseValue(record["Diaria media"]);
        document.getElementById('edit-revpar').value = parseValue(record["RevPar"]);
        document.getElementById('edit-occupazione').value = parseValue(record["% occup."] || record["Ocupação %"]);
        
        document.getElementById('edit-modal').style.display = 'flex';
    } catch (error) {
        alert("Si è verificato un errore durante l'apertura del modulo: " + error.message);
        console.error(error);
    }
};

window.closeEditModal = function() {
    document.getElementById('edit-modal').style.display = 'none';
};

window.saveEditData = function() {
    const anno = document.getElementById('edit-anno').value;
    const mese = document.getElementById('edit-mese').value;
    
    const db = getDB();
    const index = db.findIndex(r => r["ANNO"] == anno && r["MESE"] == mese);
    
    if(index !== -1) {
        // Ricavi e Tasse
        db[index]["Diarias"] = parseFloat(document.getElementById('edit-diarias-val').value) || 0;
        db[index]["A&B"] = parseFloat(document.getElementById('edit-ab').value) || 0;
        db[index]["Spa"] = parseFloat(document.getElementById('edit-spa').value) || 0;
        db[index]["Outros"] = parseFloat(document.getElementById('edit-outros').value) || 0;
        db[index]["Taxas (ISS, servicos)"] = parseFloat(document.getElementById('edit-taxas').value) || 0;
        
        // Totali (letti dai campi auto-calcolati)
        db[index]["Total (Net sales)"] = parseFloat(document.getElementById('edit-netsales').value) || 0;
        db[index]["Total Bruto"] = parseFloat(document.getElementById('edit-bruto').value) || 0;
        
        // Performance
        db[index]["n. diarie"] = parseInt(document.getElementById('edit-ndiarie').value) || 0;
        db[index]["Diaria media"] = parseFloat(document.getElementById('edit-diariamedia').value) || 0;
        db[index]["RevPar"] = parseFloat(document.getElementById('edit-revpar').value) || 0;
        db[index]["% occup."] = parseFloat(document.getElementById('edit-occupazione').value) || 0;
        
        saveDB(db);
        
        closeEditModal();
        updateDashboard();
        updateTable(); // Aggiorna anche la tabella stessa
        updateYearlyHistory();
        if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
    }
};

window.deleteRow = function(anno, mese) {
    if(confirm(`Sei sicuro di voler azzerare i dati per ${mese} ${anno}?`)) {
        const db = getDB();
        const index = db.findIndex(r => r["ANNO"] == anno && r["MESE"] == mese);
        if(index !== -1) {
            db[index]["Diarias"] = 0;
            db[index]["A&B"] = 0;
            db[index]["Spa"] = 0;
            db[index]["Outros"] = 0;
            db[index]["Taxas (ISS, servicos)"] = 0;
            db[index]["Total (Net sales)"] = 0;
            db[index]["Total Bruto"] = 0;
            db[index]["n. diarie"] = 0;
            db[index]["Diaria media"] = 0;
            db[index]["RevPar"] = 0;
            db[index]["% occup."] = 0;
            saveDB(db);
            updateDashboard();
            updateTable();
            updateYearlyHistory();
            if(document.getElementById('analisi-dati-tbody')) updateAnalisiDati();
        }
    }
};

// ==========================================
// USER MANAGEMENT LOGIC
// ==========================================

window.renderUsersTable = function() {
    const usersObj = getUsers();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    Object.keys(usersObj).forEach(uname => {
        const user = usersObj[uname];
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${uname}</strong></td>
            <td>${user.password || ''}</td>
            <td>${user.role}</td>
            <td>
                <button class="btn-action edit-btn" onclick="openEditUserModal('${uname}', '${user.role}')"><i class="ph ph-pencil-simple"></i></button>
                ${uname !== currentUsername ? `<button class="btn-action delete-btn" onclick="deleteUser('${uname}')"><i class="ph ph-trash"></i></button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.openAddUserModal = function() {
    document.getElementById('user-modal-title').textContent = 'Nuovo Utente';
    document.getElementById('user-input-username').value = '';
    document.getElementById('user-input-username').disabled = false;
    document.getElementById('user-input-password').value = '';
    document.getElementById('user-input-role').value = 'USER';
    document.getElementById('user-modal').style.display = 'flex';
};

window.openEditUserModal = function(username, role) {
    document.getElementById('user-modal-title').textContent = 'Modifica Utente';
    document.getElementById('user-input-username').value = username;
    document.getElementById('user-input-username').disabled = true;
    document.getElementById('user-input-password').value = ''; // Leave blank to keep current
    document.getElementById('user-input-role').value = role;
    document.getElementById('user-modal').style.display = 'flex';
};

window.closeUserModal = function() {
    document.getElementById('user-modal').style.display = 'none';
};

window.saveUserData = function() {
    const uname = document.getElementById('user-input-username').value.trim().toLowerCase();
    const p = document.getElementById('user-input-password').value.trim();
    const r = document.getElementById('user-input-role').value;
    
    if(!uname) return alert('Username obbligatorio');
    
    const usersObj = getUsers();
    
    // Se è un utente esistente ma non ha inserito password, manteniamo la vecchia
    if (usersObj[uname] && !p) {
        usersObj[uname].role = r;
    } else {
        if(!p) return alert('Password obbligatoria per nuovo utente');
        usersObj[uname] = { password: p, role: r };
    }
    
    saveUsers(usersObj);
    closeUserModal();
    renderUsersTable();
    alert('Utente salvato con successo!');
};

window.deleteUser = function(uname) {
    if (uname === currentUsername) {
        return alert('Non puoi eliminare il tuo stesso account.');
    }
    
    if(confirm(`Sei sicuro di voler eliminare l'utente ${uname}?`)) {
        const usersObj = getUsers();
        delete usersObj[uname];
        saveUsers(usersObj);
        renderUsersTable();
    }
};

window.changeChartType = function(chartId, newType) {
    let instance = null;
    if (chartId === 'monthlyRevenueChart') instance = monthlyChartInstance;
    else if (chartId === 'yearlyRevenueChart') instance = yearlyChartInstance;
    else if (chartId === 'yearlyTrendChart') instance = yearlyTrendChartInstance;
    else if (chartId === 'yearlyCompositionChart') instance = yearlyCompositionChartInstance;

    if (instance) {
        instance.config.type = newType;
        
        // Applicare stili specifici se cambiamo a linea
        if (newType === 'line' && (chartId === 'monthlyRevenueChart' || chartId === 'yearlyRevenueChart')) {
            const fallbackColors = ['rgba(59, 130, 246, 1)', 'rgba(20, 184, 166, 1)', 'rgba(245, 158, 11, 1)', 'rgba(239, 68, 68, 1)'];
            instance.data.datasets.forEach((ds, i) => {
                ds.fill = false;
                ds.tension = 0.4;
                ds.borderWidth = 2;
                ds.borderColor = typeof ds.backgroundColor === 'string' ? ds.backgroundColor : fallbackColors[i % fallbackColors.length];
            });
        } else if (newType === 'bar' && (chartId === 'monthlyRevenueChart' || chartId === 'yearlyRevenueChart')) {
            // Revert per grafici mensili/annuali standard
            instance.data.datasets.forEach(ds => {
                ds.fill = true;
                ds.borderWidth = 0;
            });
        } else if (newType === 'bar' && chartId === 'yearlyTrendChart') {
            instance.data.datasets.forEach(ds => {
                ds.backgroundColor = 'rgba(59, 130, 246, 0.8)';
            });
        } else if (newType === 'line' && chartId === 'yearlyTrendChart') {
            instance.data.datasets.forEach(ds => {
                ds.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                ds.fill = true;
                ds.tension = 0.4;
            });
        }
        
        instance.update();
    }
};

// ==========================================
// COMPARATOR LOGIC
// ==========================================

window.updateComparator = function() {
    const db = getDB();
    if(db.length === 0) return;

    const availableYears = [...new Set(db.map(item => item["ANNO"]))].sort((a, b) => b - a);
    
    const selectY1 = document.getElementById('comp-year1');
    const selectY2 = document.getElementById('comp-year2');
    
    if (selectY1.options.length === 0) {
        availableYears.forEach(year => {
            selectY1.add(new Option(year, year));
            selectY2.add(new Option(year, year));
        });
        if(availableYears.length > 1) {
            selectY1.value = availableYears[1];
            selectY2.value = availableYears[0];
        } else if (availableYears.length > 0) {
            selectY1.value = availableYears[0];
            selectY2.value = availableYears[0];
        }
        
        selectY1.addEventListener('change', updateComparator);
        selectY2.addEventListener('change', updateComparator);
    }
    
    const year1 = parseInt(selectY1.value);
    const year2 = parseInt(selectY2.value);
    
    const ytdTitle = document.getElementById('comp-ytd-title');
    if(ytdTitle) {
        ytdTitle.textContent = `YTD (${year1} VS ${year2})`;
    }
    
    document.getElementById('comp-th-y1').textContent = year1;
    document.getElementById('comp-th-y2').textContent = year2;
    document.getElementById('comp-ytd-th-y1').textContent = year1;
    document.getElementById('comp-ytd-th-y2').textContent = year2;
    
    const y1Data = db.filter(item => item["ANNO"] === year1);
    const y2Data = db.filter(item => item["ANNO"] === year2);
    
    const tbody = document.getElementById('comp-table-body');
    tbody.innerHTML = '';
    
    let y1Total = 0;
    let y2Total = 0;
    let y1YtdTotal = 0;
    let y2YtdTotal = 0;
    
    let mostRecentYearData = year1 > year2 ? y1Data : y2Data;
    if (year1 === year2) mostRecentYearData = y1Data; // stesso anno
    
    let lastValidMonthIndex = -1;
    for(let i=0; i<12; i++) {
        const item = mostRecentYearData.find(x => x["MESE"] === MONTHS_ORDER[i]);
        if(item && (parseFloat(item["Total (Net sales)"]) > 0 || parseFloat(item["Diarias"]) > 0)) {
            lastValidMonthIndex = i;
        }
    }
    if(lastValidMonthIndex === -1) lastValidMonthIndex = 11;
    
    const chartDataY1 = Array(12).fill(null);
    const chartDataY2 = Array(12).fill(null);
    
    for(let i=0; i<12; i++) {
        const monthName = MONTHS_ORDER[i];
        const itemY1 = y1Data.find(x => x["MESE"] === monthName);
        const itemY2 = y2Data.find(x => x["MESE"] === monthName);
        
        let val1 = itemY1 ? (parseFloat(itemY1["Total (Net sales)"] || itemY1["Diarias"]) || 0) : 0;
        let val2 = itemY2 ? (parseFloat(itemY2["Total (Net sales)"] || itemY2["Diarias"]) || 0) : 0;
        
        chartDataY1[i] = val1 === 0 ? null : val1;
        chartDataY2[i] = val2 === 0 ? null : val2;
        
        y1Total += val1;
        y2Total += val2;
        
        if (i <= lastValidMonthIndex) {
            y1YtdTotal += val1;
            y2YtdTotal += val2;
        }
        
        let diffPerc = 0;
        let percColor = '';
        let percText = '';
        if (val1 > 0) {
            diffPerc = ((val2 - val1) / val1) * 100;
            percColor = diffPerc >= 0 ? '#16a34a' : '#dc2626';
            percText = diffPerc >= 0 ? '+' + diffPerc.toFixed(2) + '%' : diffPerc.toFixed(2) + '%';
        } else if (val2 > 0) {
            diffPerc = 100;
            percColor = '#16a34a';
            percText = '+100.00%';
        } else {
            percColor = '#64748b';
            percText = '0.00%';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;"><strong>${i+1}</strong></td>
            <td>${formatCurrency(val1)}</td>
            <td>${formatCurrency(val2)}</td>
            <td style="color:${percColor}; font-weight:bold;">${percText}</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Total Foot
    let diffTotal = 0;
    let colorTotal = '';
    let textTotal = '';
    if(y1Total > 0) {
        diffTotal = ((y2Total - y1Total) / y1Total) * 100;
        colorTotal = diffTotal >= 0 ? '#16a34a' : '#dc2626';
        textTotal = diffTotal >= 0 ? '+' + diffTotal.toFixed(2) + '%' : diffTotal.toFixed(2) + '%';
    } else if (y2Total > 0) {
        colorTotal = '#16a34a';
        textTotal = '+100.00%';
    } else {
        colorTotal = '#64748b';
        textTotal = '0.00%';
    }
    
    document.getElementById('comp-table-foot').innerHTML = `
        <tr>
            <td style="text-align:center;">TOTAL</td>
            <td>${formatCurrency(y1Total)}</td>
            <td>${formatCurrency(y2Total)}</td>
            <td style="color:${colorTotal}; font-weight:bold;">${textTotal}</td>
        </tr>
    `;
    
    // YTD Foot
    let diffYtd = 0;
    let colorYtd = '';
    let textYtd = '';
    if(y1YtdTotal > 0) {
        diffYtd = ((y2YtdTotal - y1YtdTotal) / y1YtdTotal) * 100;
        colorYtd = diffYtd >= 0 ? '#16a34a' : '#dc2626';
        textYtd = diffYtd >= 0 ? '+' + diffYtd.toFixed(2) + '%' : diffYtd.toFixed(2) + '%';
    } else if (y2YtdTotal > 0) {
        colorYtd = '#16a34a';
        textYtd = '+100.00%';
    } else {
        colorYtd = '#64748b';
        textYtd = '0.00%';
    }
    
    document.getElementById('comp-ytd-body').innerHTML = `
        <tr style="background-color: #f1f5f9;">
            <td style="text-align: right;"><strong>${formatCurrency(y1YtdTotal)}</strong></td>
            <td><strong>${formatCurrency(y2YtdTotal)}</strong></td>
            <td style="color:${colorYtd}; font-weight:bold;">${textYtd}</td>
        </tr>
    `;
    
    drawComparatorChart(chartDataY1, chartDataY2, year1, year2);
};

function drawComparatorChart(dataY1, dataY2, year1, year2) {
    const canvas = document.getElementById('comparatorChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const chartTypeSelect = document.getElementById('comp-chart-type');
    const chartType = chartTypeSelect ? chartTypeSelect.value : 'bar';
    
    if(comparatorChartInstance) {
        comparatorChartInstance.destroy();
    }

    comparatorChartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: MONTHS_ORDER.map(m => m.substring(0,3)),
            datasets: [
                {
                    label: `Fatturato ${year1}`,
                    data: dataY1,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: `Fatturato ${year2}`,
                    data: dataY2,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            layout: { padding: { left: 10, right: 10, top: 20 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end' },
                datalabels: {
                    display: false
                },
                tooltip: {
                    callbacks: { label: c => formatCurrency(c.raw) }
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ==========================================
// ANALISI DATI LOGIC
// ==========================================

let analisiDatiChartInstance = null;

window.updateAnalisiDati = function() {
    const db = getDB();
    if(db.length === 0) return;

    // Determina quale toggle è selezionato
    const toggleRadios = document.getElementsByName('analisi-toggle');
    let mode = 'diarie'; // 'diarie' o 'diaria_media'
    for (const radio of toggleRadios) {
        if (radio.checked) {
            mode = radio.value;
            break;
        }
    }

    // Aggiorna titoli
    document.getElementById('analisi-table-title').textContent = mode === 'diarie' ? 'NR DIARIE' : (mode === 'occupazione' ? 'OCCUPAZIONE MEDIA' : 'DIARIA MEDIA');
    document.getElementById('analisi-summary-col2').textContent = mode === 'diarie' ? 'Totale Diarie' : (mode === 'occupazione' ? 'Occupazione %' : 'Diaria Media');

    let filteredDb = db;
    if(selectedYears && selectedYears.size > 0) {
        filteredDb = db.filter(item => selectedYears.has(item["ANNO"]));
    } else {
        filteredDb = db.filter(item => !hiddenYears.includes(item["ANNO"]));
    }

    const availableYears = [...new Set(filteredDb.map(item => item["ANNO"]))].sort((a, b) => a - b);
    
    // Header tabella
    const thead = document.getElementById('analisi-dati-thead');
    let thHtml = `<th style="text-align: center;" data-i18n="comparator.months">Mesi</th>`;
    availableYears.forEach(year => {
        thHtml += `<th>${year}</th>`;
    });
    thead.innerHTML = thHtml;

    // Body tabella principale
    const tbody = document.getElementById('analisi-dati-tbody');
    tbody.innerHTML = '';
    
    // Array per i totali/medie annuali e grafici
    const yearlySums = {};
    const yearlyCounts = {};
    availableYears.forEach(y => {
        yearlySums[y] = 0;
        yearlyCounts[y] = 0;
    });

    for(let i=0; i<12; i++) {
        const monthName = MONTHS_ORDER[i];
        const tr = document.createElement('tr');
        let trHtml = `<td style="text-align:center;"><strong>${i+1}</strong></td>`;
        
        availableYears.forEach(year => {
            const item = filteredDb.find(x => x["ANNO"] === year && x["MESE"] === monthName);
            let val = 0;
            if (item) {
                if (mode === 'diarie') {
                    val = parseInt(item["n. diarie"]) || 0;
                } else if (mode === 'occupazione') {
                    val = parseFloat(item["% occup."] || item["Ocupação %"]) || 0;
                } else {
                    val = parseFloat(item["Diaria media"]) || 0;
                }
            }
            
            if (val > 0) {
                yearlySums[year] += val;
                yearlyCounts[year] += 1;
                trHtml += `<td>${mode === 'diarie' ? val : (mode === 'occupazione' ? formatPercent(val) : formatCurrency(val))}</td>`;
            } else {
                trHtml += `<td>-</td>`;
            }
        });
        
        tr.innerHTML = trHtml;
        tbody.appendChild(tr);
    }

    // Tfoot tabella principale
    const tfoot = document.getElementById('analisi-dati-tfoot');
    const trFoot = document.createElement('tr');
    let tfootHtml = `<td style="text-align:center;"><strong>Totale / Media</strong></td>`;
    
    const chartData = [];
    
    availableYears.forEach(year => {
        let finalVal = 0;
        if (mode === 'diarie') {
            finalVal = yearlySums[year];
            tfootHtml += `<td>${finalVal}</td>`;
        } else {
            finalVal = yearlyCounts[year] > 0 ? (yearlySums[year] / yearlyCounts[year]) : 0;
            tfootHtml += `<td>${mode === 'occupazione' ? formatPercent(finalVal) : formatCurrency(finalVal)}</td>`;
        }
        chartData.push(finalVal);
    });
    trFoot.innerHTML = tfootHtml;
    tfoot.innerHTML = '';
    tfoot.appendChild(trFoot);

    // Tabella Riepilogativa
    const summaryBody = document.getElementById('analisi-summary-tbody');
    summaryBody.innerHTML = '';
    
    for (let i = 0; i < availableYears.length; i++) {
        const year = availableYears[i];
        let val = chartData[i];
        let prevVal = i > 0 ? chartData[i-1] : 0;
        
        let diffPerc = 0;
        let percColor = '';
        let percText = '';
        
        if (prevVal > 0) {
            diffPerc = ((val - prevVal) / prevVal) * 100;
            percColor = diffPerc >= 0 ? '#16a34a' : '#dc2626';
            percText = diffPerc >= 0 ? '+' + diffPerc.toFixed(2) + '%' : diffPerc.toFixed(2) + '%';
        } else if (val > 0 && i > 0) {
            diffPerc = 100;
            percColor = '#16a34a';
            percText = '+100.00%';
        } else {
            percColor = '#64748b';
            percText = '-';
        }

        const trSum = document.createElement('tr');
        trSum.innerHTML = `
            <td><strong>${year}</strong></td>
            <td>${mode === 'diarie' ? val : (mode === 'occupazione' ? formatPercent(val) : formatCurrency(val))}</td>
            <td style="color:${percColor}; font-weight:bold;">${percText}</td>
        `;
        summaryBody.appendChild(trSum);
    }

    // Grafico
    drawAnalisiDatiChart(availableYears, chartData, mode);
};

function drawAnalisiDatiChart(labels, data, mode) {
    const canvas = document.getElementById('analisiDatiChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if(analisiDatiChartInstance) {
        analisiDatiChartInstance.destroy();
    }

    const labelTesto = mode === 'diarie' ? 'Nr. Diarie' : (mode === 'occupazione' ? 'Occupazione %' : 'Diaria Media (R$)');
    
    analisiDatiChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: labelTesto,
                    data: data,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 2
                },
                {
                    label: 'Trend',
                    data: data,
                    type: 'line',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                    tension: 0,
                    order: 1,
                    datalabels: {
                        display: false
                    }
                }
            ]
        },
        options: {
            layout: { padding: { left: 10, right: 10, top: 30 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end' },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: function(value) {
                        if (!value) return '';
                        return mode === 'diarie' ? value : (mode === 'occupazione' ? formatPercent(value) : formatCurrency(value));
                    },
                    font: { weight: 'bold', size: 10 },
                    color: '#475569'
                },
                tooltip: {
                    callbacks: { label: c => mode === 'diarie' ? c.raw : (mode === 'occupazione' ? formatPercent(c.raw) : formatCurrency(c.raw)) }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grace: '15%', 
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        callback: function(value) {
                            if (mode === 'occupazione') {
                                return (value * 100).toFixed(0) + '%';
                            }
                            return value;
                        }
                    }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// --- Analisi per Area ---
window.updateAnalisiArea = function() {
    const db = getDB();
    if(db.length === 0) return;
    
    const showDiarias = document.getElementById('area-chk-diarias').checked;
    const showAb = document.getElementById('area-chk-ab').checked;
    const showSpa = document.getElementById('area-chk-spa').checked;
    const chartType = document.getElementById('analisi-area-chart-type').value;
    
    document.getElementById('th-area-diarias').style.display = showDiarias ? '' : 'none';
    document.getElementById('th-area-ab').style.display = showAb ? '' : 'none';
    document.getElementById('th-area-spa').style.display = showSpa ? '' : 'none';
    
    let filteredDb = db.filter(item => selectedYears.has(item["ANNO"]));
    
    let yearMap = {};
    selectedYears.forEach(y => {
        yearMap[y] = { diarias: 0, ab: 0, spa: 0 };
    });
    
    filteredDb.forEach(item => {
        const y = item["ANNO"];
        if(yearMap[y]) {
            yearMap[y].diarias += parseFloat(item["Diarias"]) || 0;
            yearMap[y].ab += parseFloat(item["A&B"]) || 0;
            yearMap[y].spa += (parseFloat(item["Spa"]) || 0) + (parseFloat(item["Outros"]) || 0);
        }
    });
    
    let years = Array.from(selectedYears).sort((a,b) => a-b);
    
    const tbody = document.getElementById('analisi-area-tbody');
    const tfoot = document.getElementById('analisi-area-tfoot');
    if(!tbody || !tfoot) return;
    
    tbody.innerHTML = '';
    
    let totDiarias = 0;
    let totAb = 0;
    let totSpa = 0;
    let grandTotal = 0;
    
    let labels = [];
    let dataDiarias = [];
    let dataAb = [];
    let dataSpa = [];
    
    years.forEach(y => {
        const d = yearMap[y];
        labels.push(y);
        dataDiarias.push(d.diarias);
        dataAb.push(d.ab);
        dataSpa.push(d.spa);
        
        totDiarias += d.diarias;
        totAb += d.ab;
        totSpa += d.spa;
        
        let rowTotal = 0;
        if(showDiarias) rowTotal += d.diarias;
        if(showAb) rowTotal += d.ab;
        if(showSpa) rowTotal += d.spa;
        grandTotal += rowTotal;
        
        const tr = document.createElement('tr');
        let html = `<td><strong>${y}</strong></td>`;
        if(showDiarias) html += `<td>${formatCurrency(d.diarias)}</td>`;
        if(showAb) html += `<td>${formatCurrency(d.ab)}</td>`;
        if(showSpa) html += `<td>${formatCurrency(d.spa)}</td>`;
        html += `<td style="background-color: #f0fdf4; font-weight: bold; color: #166534;">${formatCurrency(rowTotal)}</td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
    
    let tfootHtml = `<tr><td>TOTALE</td>`;
    if(showDiarias) tfootHtml += `<td>${formatCurrency(totDiarias)}<br><span style="font-size:0.8em; font-weight:normal;">${grandTotal>0 ? ((totDiarias/grandTotal)*100).toFixed(2) : '0.00'}%</span></td>`;
    if(showAb) tfootHtml += `<td>${formatCurrency(totAb)}<br><span style="font-size:0.8em; font-weight:normal;">${grandTotal>0 ? ((totAb/grandTotal)*100).toFixed(2) : '0.00'}%</span></td>`;
    if(showSpa) tfootHtml += `<td>${formatCurrency(totSpa)}<br><span style="font-size:0.8em; font-weight:normal;">${grandTotal>0 ? ((totSpa/grandTotal)*100).toFixed(2) : '0.00'}%</span></td>`;
    tfootHtml += `<td style="background-color: #d1fae5; color: #166534;">${formatCurrency(grandTotal)}<br><span style="font-size:0.8em; font-weight:normal;">100.00%</span></td></tr>`;
    tfoot.innerHTML = tfootHtml;
    
    const ctx = document.getElementById('analisiAreaChart');
    if(!ctx) return;
    
    if(analisiAreaChartInstance) {
        analisiAreaChartInstance.destroy();
    }
    
    let datasets = [];
    if(showDiarias) {
        datasets.push({
            label: 'Diarias',
            data: dataDiarias,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
        });
    }
    if(showAb) {
        datasets.push({
            label: 'A&B',
            data: dataAb,
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 1
        });
    }
    if(showSpa) {
        datasets.push({
            label: 'Spa (+ Outros)',
            data: dataSpa,
            backgroundColor: '#84cc16',
            borderColor: '#65a30d',
            borderWidth: 1
        });
    }
    
    const isStacked = chartType === 'stacked';
    
    analisiAreaChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                datalabels: { display: false }
            },
            scales: {
                x: {
                    stacked: isStacked,
                    grid: { display: false }
                },
                y: {
                    stacked: isStacked,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return formatCurrency(value); }
                    }
                }
            }
        }
    });
};
