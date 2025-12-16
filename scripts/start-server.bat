@echo off
echo ========================================
echo Serveur web local - Itineraire Louis XVI
echo ========================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python detecte
    echo Lancement du serveur sur http://localhost:8000
    echo Appuyez sur Ctrl+C pour arreter le serveur
    echo.
    python -m http.server 8000
    goto :end
)

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Node.js detecte
    echo Lancement du serveur sur http://localhost:8000
    echo Appuyez sur Ctrl+C pour arreter le serveur
    echo.
    npx http-server -p 8000
    goto :end
)

REM Vérifier si PHP est installé
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] PHP detecte
    echo Lancement du serveur sur http://localhost:8000
    echo Appuyez sur Ctrl+C pour arreter le serveur
    echo.
    php -S localhost:8000
    goto :end
)

echo [ERREUR] Aucun serveur web trouve
echo.
echo Veuillez installer l'un des outils suivants :
echo   - Python 3 : https://www.python.org/downloads/
echo   - Node.js : https://nodejs.org/
echo   - PHP : https://www.php.net/downloads.php
echo.
echo Ou utilisez manuellement :
echo   python -m http.server 8000
echo   npx http-server -p 8000
echo   php -S localhost:8000
echo.
pause

:end

