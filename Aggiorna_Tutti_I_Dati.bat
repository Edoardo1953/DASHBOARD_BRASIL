@echo off
chcp 65001 > nul
echo ========================================================
echo   AGGIORNAMENTO DATI (COSTI E RICAVI) - Sombra Spa
echo ========================================================
echo.

set PROJ=%~dp0
cd /d "%PROJ%"

echo [1/3] Rigenero i file di preload dai file Excel...
python "%PROJ%scripts\make_db_preload.py"
if errorlevel 1 (
    echo [ERRORE] Generazione ricavi fallita.
    pause
    exit /b 1
)

python "%PROJ%scripts\make_costi_preload.py"
if errorlevel 1 (
    echo [ERRORE] Generazione costi fallita.
    pause
    exit /b 1
)

echo.
echo [2/3] Sincronizzazione con GitHub...
git add "DB Arcoiris Dashboard.xlsx" "Uploads/spese.xlsx" costi_preload.js db_preload.js sombra_spa_db.json scripts/make_db_preload.py .github/workflows/aggiorna_costi.yml
git commit -m "aggiornamento dati mensili costi e ricavi"
if errorlevel 1 (
    echo Nessuna nuova modifica da committare su git.
) else (
    git push
    echo Push completato con successo!
)

echo.
echo ========================================================
echo   [3/3] FATTO! Dati di Settembre 2026 aggiornati!
echo ========================================================
echo.
pause
