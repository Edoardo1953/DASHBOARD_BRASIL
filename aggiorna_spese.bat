@echo off
chcp 65001 > nul
echo.
echo ============================================
echo  AGGIORNAMENTO SPESE - Dashboard Arco-Iris
echo ============================================
echo.

set PROJ=c:\Users\Edoardo\.gemini\antigravity\scratch\DASHBOARD_BRASIL

:: Verifica che spese.xlsx esista
if not exist "%PROJ%\Uploads\spese.xlsx" (
    echo [ERRORE] File non trovato: Uploads\spese.xlsx
    echo Copia il file aggiornato nella cartella Uploads\ e riprova.
    pause
    exit /b 1
)

echo [1/3] Rigenero costi_preload.js dal file Excel...
python "%PROJ%\scripts\make_costi_preload.py"
if errorlevel 1 (
    echo [ERRORE] Conversione fallita. Controlla che Python sia installato.
    pause
    exit /b 1
)

echo.
echo [2/3] Carico le modifiche su GitHub...
cd /d "%PROJ%"
git add Uploads/spese.xlsx costi_preload.js
git commit -m "aggiornamento mensile spese.xlsx"
if errorlevel 1 (
    echo Nessuna modifica da committare.
) else (
    git push
    echo Push completato!
)

echo.
echo [3/3] FATTO!
echo GitHub Actions aggiornera' l'app entro 1-2 minuti.
echo Gli utenti vedranno i dati aggiornati al prossimo riavvio dell'app.
echo.
pause
