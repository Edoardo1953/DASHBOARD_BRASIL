@echo off
echo ========================================================
echo   Avvio della Dashboard Brasil in Modalita' Locale...
echo ========================================================
echo.
echo Poiche' non hai Python o Node.js installati,
echo non e' possibile avviare un server locale standard.
echo.
echo Soluzione alternativa in corso: 
echo Stiamo aprendo l'app tramite Microsoft Edge in 
echo un ambiente isolato con i permessi sbloccati 
echo per leggere il tuo file Excel locale.
echo.
start msedge --allow-file-access-from-files --user-data-dir="%~dp0\Edge_Profile" "file:///%~dp0index.html"
