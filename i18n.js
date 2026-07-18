// Logica per l'internazionalizzazione (i18n)

// Lingua di default e lingua corrente
let currentLanguage = localStorage.getItem('app_lang') || 'it';

/**
 * Inizializza il sistema i18n
 */
function initI18n() {
    // Imposta il valore iniziale della select se esiste
    const langSelect = document.getElementById('language-selector');
    if (langSelect) {
        langSelect.value = currentLanguage;
    }
    
    // Esegue la traduzione della pagina
    translatePage();
}

/**
 * Traduce una chiave testuale
 * @param {string} key Chiave nel dizionario translations
 * @returns {string} Testo tradotto o la chiave stessa se non trovata
 */
function t(key) {
    if (!window.translations) {
        console.warn('Dizionario translations non caricato.');
        return key;
    }
    const langDict = window.translations[currentLanguage];
    if (langDict && langDict[key]) {
        return langDict[key];
    }
    // Fallback all'italiano se la chiave non c'è nella lingua scelta
    if (window.translations['it'] && window.translations['it'][key]) {
        return window.translations['it'][key];
    }
    return key;
}

/**
 * Cambia la lingua dell'applicazione
 * @param {string} lang Codice lingua ('it', 'en', 'fr')
 */
function setLanguage(lang) {
    if (['it', 'en', 'fr'].includes(lang)) {
        currentLanguage = lang;
        localStorage.setItem('app_lang', lang);
        
        // Traduce gli elementi DOM statici
        translatePage();
        updateFlagsUI();
        
        // Emette un evento per notificare altre parti dell'app (es. per aggiornare i grafici in app2.js)
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
}

/**
 * Traduce tutti gli elementi DOM con l'attributo data-i18n
 */
function translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        
        // Controlla se bisogna tradurre il placeholder o il testo interno
        if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
            el.placeholder = t(key);
        } else {
            // Se l'elemento contiene un'icona Phosphor prima del testo, preserveremo l'icona
            const icon = el.querySelector('i');
            if (icon) {
                // Sostituiamo solo il testo (nodo di tipo 3)
                Array.from(el.childNodes).forEach(node => {
                    if (node.nodeType === 3 && node.nodeValue.trim() !== '') {
                        node.nodeValue = t(key);
                    }
                });
            } else {
                el.textContent = t(key);
            }
        }
    });
}

/**
 * Aggiorna lo stato visivo dei pulsanti lingua
 */
function updateFlagsUI() {
    document.querySelectorAll('button[onclick^="setLanguage"]').forEach(btn => {
        // Estrai il codice lingua (es: 'it') dall'onclick
        const match = btn.getAttribute('onclick').match(/setLanguage\('([^']+)'\)/);
        if (match && match[1]) {
            const lang = match[1];
            if (lang === currentLanguage) {
                btn.style.opacity = '1';
                btn.style.boxShadow = '0 0 0 3px #10b981';
                btn.style.filter = 'grayscale(0)';
            } else {
                btn.style.opacity = '0.5';
                btn.style.boxShadow = 'none';
                btn.style.filter = 'grayscale(0.8)';
            }
        }
    });
}

// Inizializza i18n quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    updateFlagsUI();
});
