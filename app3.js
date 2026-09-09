let monthlyChartInstance = null;

let yearlyChartInstance = null;
let yearlyTrendChartInstance = null;
let yearlyCompositionChartInstance = null;
let comparatorChartInstance = null;
let analisiDatiChartInstance = null;
let analisiAreaChartInstance = null;
const DB_KEY = 'sombra_spa_db';
try { /* Chart.register(ChartDataLabels); */ } catch (e) {
        console.error("Errore nel caricamento o parsing dei costi:", e);
        const html = `<tr class="error-row">
                <td colspan="15" style="text-align: center; padding: 2rem;">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 1rem;">Errore di caricamento: ${e.message}</div>
                    <p style="color: #64748b; margin-bottom: 1rem;">Se stai testando in locale (file:///), il browser blocca la lettura automatica del file per sicurezza. <br>Caricalo manualmente per questa sessione:</p>
                    <label class="btn btn-primary" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; justify-content: center; width: auto; margin: 0 auto;">
                        <i class="ph ph-upload-simple"></i> Carica file spese.xlsx
                        <input type="file" style="display:none" accept=".xlsx" onchange="window.handleManualCostiUpload(event)">
                    </label>
                </td>
            </tr>`;
        
        const tbody1 = document.getElementById("immobTableBody");
        if (tbody1) tbody1.innerHTML = html;
        
        const tbody2 = document.getElementById("costiOrdTableBody");
        if (tbody2) tbody2.innerHTML = html;
    }
};

window.handleManualCostiUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            window.costiData = [];
            
            if (workbook.SheetNames.includes("Spese Ordinarie (25-26)")) {
                const sheet = workbook.Sheets["Spese Ordinarie (25-26)"];
                const json = XLSX.utils.sheet_to_json(sheet);
                json.forEach(row => { row.MacroType = "Spesa Ordinaria"; window.costiData.push(row); });
            }
            if (workbook.SheetNames.includes("Immobilizzato (25-26)")) {
                const sheet = workbook.Sheets["Immobilizzato (25-26)"];
                const json = XLSX.utils.sheet_to_json(sheet);
                json.forEach(row => { row.MacroType = "Immobilizzato"; window.costiData.push(row); });
            }
            
            if (window.costiData.length > 0) {
                try { localStorage.setItem('sombra_costi_data', JSON.stringify(window.costiData)); } catch(err) {}
                window.renderCostiTables();
            } else {
                alert("Nessun dato trovato nei fogli corretti.");
            }
        } catch (err) {
            alert("Errore nel parsing del file: " + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
};

function formatCostiCurrency(val) {
    if (val == null || val === 0 || val === "0") return "-";
    if (typeof val === 'number') {
        return "R$ " + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const immobHead = document.getElementById('immobTableHead');
    const immobBody = document.getElementById('immobTableBody');
    const costiOrdHead = document.getElementById('costiOrdTableHead');
    const costiOrdBody = document.getElementById('costiOrdTableBody');
    
    if (!immobHead || !costiOrdHead) return;
    
    let thHtml = '<th style="text-align: left; width: 40%;">Categoria / Tipologia</th>';
    window.costiSelectedYears.forEach(y => {
        thHtml += '<th style="text-align: right;">' + y + '</th>';
    });
    
    immobHead.innerHTML = thHtml;
    costiOrdHead.innerHTML = thHtml;
    
    function renderSpecificTable(tbody, macroTypeFilter) {
        const grouped = {};
        
        window.costiData.filter(r => r.MacroType === macroTypeFilter && window.costiSelectedYears.includes(parseInt(r.Anno))).forEach(row => {
            const cat = row.Categoria || 'Altro';
            const tip = row.Tipologia || 'Altro';
            const anno = parseInt(row.Anno);
            const val = parseFloat(row["Totale Anno"]) || 0;
            
            if (!grouped[cat]) grouped[cat] = { totalByYear: {}, tipologie: {} };
            if (!grouped[cat].totalByYear[anno]) grouped[cat].totalByYear[anno] = 0;
            grouped[cat].totalByYear[anno] += val;
            
            if (!grouped[cat].tipologie[tip]) grouped[cat].tipologie[tip] = {};
            if (!grouped[cat].tipologie[tip][anno]) grouped[cat].tipologie[tip][anno] = 0;
            grouped[cat].tipologie[tip][anno] += val;
        });
        
        if (Object.keys(grouped).length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + (window.costiSelectedYears.length + 1) + '" style="text-align: center;">Nessun dato per gli anni selezionati</td></tr>';
            return;
        }
        
        let html = '';
        const normalCats = Object.keys(grouped).filter(cat => !cat.toLowerCase().includes('total')).sort();
        const totalCats = Object.keys(grouped).filter(cat => cat.toLowerCase().includes('total')).sort();
        
        normalCats.forEach((cat, index) => {
            const catId = macroTypeFilter.replace(/\s+/g, '') + '_cat_' + index;
            
            html += '<tr class="table-row-parent" onclick="window.toggleCostiAccordion(\'' + catId + '\')" style="cursor: pointer; background: var(--bg-secondary);">';
            html += '<td style="font-weight: bold; color: var(--text-primary); text-align: left;"><i id="icon_' + catId + '" class="ph ph-caret-right" style="margin-right: 8px; transition: transform 0.2s;"></i>' + cat + '</td>';
            window.costiSelectedYears.forEach(y => {
                html += '<td style="text-align: right; font-weight: bold;">' + formatCostiCurrency(grouped[cat].totalByYear[y]) + '</td>';
            });
            html += '</tr>';
            
            Object.keys(grouped[cat].tipologie).sort().forEach(tip => {
                html += '<tr class="table-row-child child-of-' + catId + '" style="display: none; background: #fff;">';
                html += '<td style="padding-left: 2.5rem; color: var(--text-secondary); text-align: left;">' + tip + '</td>';
                window.costiSelectedYears.forEach(y => {
                    html += '<td style="text-align: right; color: var(--text-secondary);">' + formatCostiCurrency(grouped[cat].tipologie[tip][y]) + '</td>';
                });
                html += '</tr>';
            });
        });
        
        totalCats.forEach(cat => {
            html += '<tr style="background: var(--bg-secondary); border-top: 2px solid var(--border-color);">';
            html += '<td style="font-weight: bold; color: var(--text-primary); text-align: left; padding-left: 1.5rem;">' + cat + '</td>';
            window.costiSelectedYears.forEach(y => {
                html += '<td style="text-align: right; font-weight: bold;">' + formatCostiCurrency(grouped[cat].totalByYear[y]) + '</td>';
            });
            html += '</tr>';
        });
        
        tbody.innerHTML = html;
    }
    
    renderSpecificTable(immobBody, "Immobilizzato");
    renderSpecificTable(costiOrdBody, "Spesa Ordinaria");
};

window.toggleCostiAccordion = function(catId) {
    const icon = document.getElementById('icon_' + catId);
    const children = document.querySelectorAll('.child-of-' + catId);
    
    let isExpanded = false;
    if (icon && icon.style.transform === 'rotate(90deg)') {
        isExpanded = true;
        icon.style.transform = 'rotate(0deg)';
    } else if (icon) {
        icon.style.transform = 'rotate(90deg)';
    }
    
    children.forEach(child => {
        child.style.display = isExpanded ? 'none' : 'table-row';
    });
};

// Fetch all'avvio
setTimeout(() => {
    window.fetchCostiData();
}, 2000);

// --- LOGICA VISIBILITA' MENU (User View / Admin View) ---
window.pageVisibility = {};
window.isAdminInUserView = false;

window.updateSidebarVisibilityUI = function() {
    const isUser = currentUserRole === 'USER' || window.isAdminInUserView;
    const isRealAdmin = currentUserRole === 'ADMIN';
    
    document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(item => {
        const pageKey = item.getAttribute('data-view');
        
        // Ignoriamo le viste di sistema o esclusive admin per evitare occhietti vagabondi
        if (['welcome-view', 'input-view', 'settings-view', 'users-view'].includes(pageKey)) return;
        
        // Wrap se non già wrappato
        if (!item.parentElement.classList.contains('nav-item-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'nav-item-wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.alignItems = 'center';
            item.parentNode.insertBefore(wrapper, item);
            wrapper.appendChild(item);
        }
        
        const wrapper = item.parentElement;
        
        // Rimuoviamo vecchi bottoni occhio
        let oldBtn = wrapper.querySelector('.nav-eye-btn');
        if (oldBtn) oldBtn.remove();
        
        if (isUser) {
            // Modalità Utente: mostra solo le voci visibili
            const isVisible = (window.pageVisibility[pageKey] !== false);
            wrapper.style.display = isVisible ? 'flex' : 'none';
        } else {
            // Modalità Admin: mostra tutto, con occhio a fianco
            wrapper.style.display = 'flex';
            
            const btn = document.createElement('button');
            btn.className = 'nav-eye-btn';
            btn.setAttribute('data-page', pageKey);
            btn.style.cssText = 'background:none; border:none; padding:4px 8px; cursor:pointer; font-size:1.1rem; border-radius:4px; margin-left: 5px;';
            
            const isVisible = (window.pageVisibility[pageKey] !== false);
            if (isVisible) {
                btn.style.color = '#10b981';
                btn.innerHTML = '<i class="ph ph-eye"></i>';
                btn.title = 'Visibile (Clicca per nascondere)';
            } else {
                btn.style.color = '#ef4444';
                btn.innerHTML = '<i class="ph ph-eye-slash"></i>';
                btn.title = 'Nascosto (Clicca per mostrare)';
            }
            
            btn.onclick = (e) => window.togglePageVisibility(pageKey, e);
            wrapper.appendChild(btn);
        }
    });
    
    // Gestione del bottone "Passa a VISTA UTENTE / Torna a VISTA ADMIN"
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
        let toggleBtn = sidebarNav.querySelector('#btn-toggle-view');
        if (isRealAdmin) {
            if (!toggleBtn) {
                toggleBtn = document.createElement('a');
                toggleBtn.href = '#';
                toggleBtn.id = 'btn-toggle-view';
                toggleBtn.className = 'nav-item';
                toggleBtn.style.cssText = 'margin-top: 1rem; border: 1px dashed #f59e0b; color: #f59e0b; justify-content: center;';
                toggleBtn.onclick = (e) => window.toggleAdminUserView(e);
                
                // Inseriamo prima dell'ultimo elemento (Logout)
                const navItemsArray = Array.from(sidebarNav.querySelectorAll('.nav-item'));
                const logoutBtn = navItemsArray.find(el => el.id === 'nav-logout');
                if (logoutBtn) {
                    sidebarNav.insertBefore(toggleBtn, logoutBtn.parentElement || logoutBtn);
                } else {
                    sidebarNav.appendChild(toggleBtn);
                }
            }
            
            toggleBtn.style.display = 'flex';
            if (window.isAdminInUserView) {
                toggleBtn.innerHTML = `<i class="ph ph-arrows-left-right"></i> <span>${t('nav.adminView') || 'Torna a VISTA ADMIN'}</span>`;
            } else {
                toggleBtn.innerHTML = `<i class="ph ph-arrows-left-right"></i> <span>${t('nav.userView') || 'Passa a VISTA UTENTE'}</span>`;
            }
        } else if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }
    }
};

window.togglePageVisibility = async function(pageKey, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const isVisible = (window.pageVisibility[pageKey] !== false);
    window.pageVisibility[pageKey] = !isVisible; // Toggle
    
    window.updateSidebarVisibilityUI();
    
    // Salva tramite la funzione di salvataggio layout
    window.publishLayoutToGitHub(true);
};

window.toggleAdminUserView = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    window.isAdminInUserView = !window.isAdminInUserView;
    window.updateSidebarVisibilityUI();
    
    // Mostra/Nascondi tool admin durante la simulazione
    const navSettings = document.getElementById('nav-settings');
    const navUsers = document.getElementById('nav-users');
    const navLayout = document.getElementById('nav-layout-toggle');
    
    if (window.isAdminInUserView) {
        if (navSettings) navSettings.style.display = 'none';
        if (navUsers) navUsers.style.display = 'none';
        if (navLayout) navLayout.style.display = 'none';
        
        // Forza click su welcome-view se simuliamo l'utente (che va alla welcome-view all'accesso)
        const welcomeBtn = document.querySelector('.nav-item[data-view="welcome-view"]');
        if (welcomeBtn) welcomeBtn.click();
    } else {
        if (navSettings) navSettings.style.display = 'flex';
        if (navUsers) navUsers.style.display = 'flex';
        if (navLayout) navLayout.style.display = 'flex';
        
        // Ritorno alla dashboard
        const dashBtn = document.querySelector('.nav-item[data-view="dashboard-view"]');
        if (dashBtn) dashBtn.click();
    }
};

// Applica visibilità all'avvio (se già loggati)
setTimeout(window.updateSidebarVisibilityUI, 1000);

// Applica visibilità dopo il login
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', () => {
                setTimeout(window.updateSidebarVisibilityUI, 500);
            });
        }
    }, 500);
});
