#!/bin/bash

echo "========================================"
echo "Serveur web local - Itineraire Louis XVI"
echo "========================================"
echo ""

# Vérifier si Python est installé
if command -v python3 &> /dev/null; then
    echo "[OK] Python 3 détecté"
    echo "Lancement du serveur sur http://localhost:8000"
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo ""
    python3 -m http.server 8000
    exit 0
fi

# Vérifier si Python 2 est installé
if command -v python &> /dev/null; then
    echo "[OK] Python détecté"
    echo "Lancement du serveur sur http://localhost:8000"
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo ""
    python -m SimpleHTTPServer 8000
    exit 0
fi

# Vérifier si Node.js est installé
if command -v node &> /dev/null; then
    echo "[OK] Node.js détecté"
    echo "Lancement du serveur sur http://localhost:8000"
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo ""
    npx http-server -p 8000
    exit 0
fi

# Vérifier si PHP est installé
if command -v php &> /dev/null; then
    echo "[OK] PHP détecté"
    echo "Lancement du serveur sur http://localhost:8000"
    echo "Appuyez sur Ctrl+C pour arrêter le serveur"
    echo ""
    php -S localhost:8000
    exit 0
fi

echo "[ERREUR] Aucun serveur web trouvé"
echo ""
echo "Veuillez installer l'un des outils suivants :"
echo "  - Python 3 : https://www.python.org/downloads/"
echo "  - Node.js : https://nodejs.org/"
echo "  - PHP : https://www.php.net/downloads.php"
echo ""
echo "Ou utilisez manuellement :"
echo "  python3 -m http.server 8000"
echo "  npx http-server -p 8000"
echo "  php -S localhost:8000"
echo ""

