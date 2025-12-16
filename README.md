# Itinéraire de la cour de Louis XVI représentatif de la saison théâtrale de 1786

Une carte interactive visualisant les déplacements de Louis XVI et de la cour en 1786, avec un focus particulier sur les saisons théâtrales sous l'Ancien Régime.

[Consulter la carte](https://stillebx.github.io/itineraire-louis-xvi-saison-theatrale-1786/)

## 📋 Description

Ce projet présente une cartographie interactive des lieux fréquentés par Louis XVI durant l'année 1786. Il met en lumière :

- **La saison théâtrale** : Les principaux théâtres curiaux (Versailles, Trianon, Fontainebleau)
- **Les itinérances de la cour** : Les déplacements saisonniers entre les résidences royales
- **Le voyage en Normandie** : L'inspection des travaux du port de Cherbourg (juin 1786)
- **Les pavillons de chasse** : Les nombreux lieux de chasse fréquentés par le roi

## 🎭 Contexte historique

La saison théâtrale sous l'Ancien Régime suivait un calendrier précis :
- **Automne** : Séjour à Fontainebleau (octobre-novembre) où les troupes parisiennes venaient faire le service de cour
- **Hiver** : Résidence à Versailles jusqu'à Pâques, ponctuée de représentations théâtrales

En 1786, Louis XVI fit construire le Théâtre de l'Aile neuve à Versailles, destiné à remplacer l'Opéra royal jugé trop grand et coûteux.

## 🗺️ Fonctionnalités

### Navigation
- **Carte interactive** : Visualisation des lieux sur une carte centrée sur Versailles
- **Marqueurs colorés** : Chaque catégorie de lieu possède sa propre couleur
- **Taille des marqueurs** : Proportionnelle au nombre de jours passés (échelle logarithmique)
- **Popups informatifs** : Cliquez sur un marqueur pour obtenir des détails historiques (nombre de visites, dates, contexte historique)
- **Effet de pulse** : Les marqueurs clignotent brièvement lorsqu'ils deviennent actifs dans la timeline

### Timeline interactive
- **Curseur temporel** : Naviguez dans le temps le long de l'année 1786
- **Affichage de la date** : Date courante affichée au format "Jour Mois Année"
- **Bouton play/pause** : Animation automatique de la timeline avec changement d'icône selon l'état
- **Contrôle de vitesse** : Vitesse d'animation réglable (x1, x5, x10)
- **Mode historique** : Option pour garder visibles les lieux déjà visités (avec effet de pulse sur les nouveaux)
- **Activation/désactivation** : Toggle pour activer ou désactiver complètement la timeline
- **Filtrage temporel** : Affichez uniquement les lieux visités à la date sélectionnée

### Recherche
- **Barre de recherche** : Recherchez un lieu par son nom, date ou contexte historique
- **Recherche par date** : Formats supportés (exemples) :
  - `01/01`, `15/06` (jour/mois)
  - `01/01/1786` (date complète)
  - `janvier`, `juin` (nom du mois)
  - `15 juin` (jour + mois)
- **Résultats en temps réel** : Les résultats s'affichent au fur et à mesure de la saisie
- **Navigation directe** : Cliquez sur un résultat pour centrer la carte et ouvrir la popup du lieu

### Légende interactive
- **Filtrage par catégorie** : Affichez ou masquez les différentes catégories de lieux
- **Compteurs** : Nombre de lieux par catégorie
- **Sélection groupée** : Activez/désactivez tous les lieux d'une section en un clic
- **Organisation en sections** :
  - La saison théâtrale en 1786
  - Les séjours de la cour en 1786
  - Autres séjours

### Catégories de lieux

**La saison théâtrale en 1786 :**
1. **Théâtres curiaux** (violet) - 3 lieux principaux (Versailles, Trianon, Fontainebleau)

**Les séjours de la cour en 1786 :**
2. **Saison d'automne** (rouge clair) - Lieux fréquentés pendant le séjour à Fontainebleau
3. **Saison d'hiver** (bleu clair) - Lieux fréquentés pendant le séjour à Versailles
4. **Pavillons de chasse** (vert clair) - Nombreux pavillons visités pour la chasse
5. **Autres résidences royales** (jaune clair) - Meudon, Saint-Cloud, Compiègne, etc.

**Autres séjours :**
6. **Voyage en Normandie** (beige) - Itinéraire du voyage de juin 1786

## 🚀 Utilisation

### Installation locale

**⚠️ Important :** Le projet nécessite un serveur web local pour fonctionner correctement (chargement des données JSON via `fetch()`).

#### Option 1 : Python (recommandé - souvent déjà installé)

```bash
# Python 3
python -m http.server 8000

# Ou Python 2
python -m SimpleHTTPServer 8000
```

Puis ouvrez votre navigateur à l'adresse : `http://localhost:8000`

#### Option 2 : Node.js (avec http-server)

```bash
# Installer http-server globalement (une seule fois)
npm install -g http-server

# Lancer le serveur
http-server -p 8000
```

Puis ouvrez votre navigateur à l'adresse : `http://localhost:8000`

#### Option 3 : PHP (si installé)

```bash
php -S localhost:8000
```

Puis ouvrez votre navigateur à l'adresse : `http://localhost:8000`

#### Option 4 : VS Code Live Server

1. Installez l'extension "Live Server" dans VS Code
2. Clic droit sur `index.html` → "Open with Live Server"

#### Option 5 : Autres outils

- **npx serve** : `npx serve .`
- **Deno** : `deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts`
- **Ruby** : `ruby -run -e httpd . -p 8000`

#### Option 6 : Scripts automatiques

Des scripts sont fournis dans le dossier `scripts/` pour faciliter le démarrage :

**Windows :**
```bash
# Depuis la racine du projet
.\scripts\start-server.bat
```

**Linux / Mac :**
```bash
# Depuis la racine du projet
chmod +x scripts/start-server.sh
./scripts/start-server.sh
```

⚠️ **Important :** Les scripts doivent être exécutés depuis la racine du projet (où se trouve `index.html`).

### Hébergement web

Le projet est entièrement statique et peut être hébergé sur n'importe quel serveur web ou service d'hébergement statique (GitHub Pages, Netlify, Vercel, etc.).

### Utilisation de la timeline

1. **Activer la timeline** : Cochez la case "Activer la timeline" en bas de la carte
2. **Naviguer manuellement** : Utilisez le curseur pour sélectionner une date
3. **Mode automatique** : Cliquez sur le bouton play pour lancer l'animation
4. **Ajuster la vitesse** : Utilisez les boutons x1, x5, x10 pour changer la vitesse de lecture
5. **Mode historique** : Cochez "Garder l'historique des lieux" pour voir tous les lieux visités jusqu'à la date sélectionnée
6. **Désactiver** : Décochez "Activer la timeline" pour revenir à l'affichage de tous les lieux

## 🛠️ Technologies utilisées

- **HTML5** : Structure de la page
- **CSS3** : Mise en forme et design responsive
- **JavaScript** : Logique interactive
- **Leaflet.js** (v1.9.4) : Bibliothèque de cartographie interactive
- **CartoDB Light** : Fond de carte sobre et académique
- **OpenStreetMap** : Données cartographiques

## 📁 Structure du projet

```
itineraire-louis-xvi-saison-theatrale-1786/
├── index.html              # Page principale
├── css/
│   └── styles.css          # Styles CSS
├── js/
│   └── script.js          # Logique JavaScript
├── assets/
│   └── data.json          # Données des lieux et théâtres
├── scripts/
│   ├── start-server.bat   # Script de démarrage Windows
│   └── start-server.sh    # Script de démarrage Linux/Mac
└── README.md              # Documentation
```

## 📊 Sources des données

**Source principale :** Caroline zum Kolk (éd.), *Itinéraire de Louis XVI. Les lieux de séjour du roi (1774-1789)*, Paris, [Cour de France.fr](https://cour-de-france.fr/squelettes/bases/itineraires/resultat_itineraire.php?Nr_personne=014&Town=0&year=1786), 2020.

Données publiées d'après l'itinéraire constitué par Karima Mazingarbe dans le cadre d'un mémoire de master.

**Traitement des données et mise en forme :** Elisa Broux

### Traitement des données

- **Format de dates interne** : Utilisation du format YYYYMMDD pour faciliter les calculs et le tri chronologique
- **Calcul des visites réelles** : Les dates consécutives sont regroupées en une seule visite (ex: 3 jours consécutifs = 1 visite)
- **Échelle logarithmique** : Les tailles des marqueurs suivent une échelle logarithmique pour représenter visuellement l'importance relative des séjours sans créer de marqueurs démesurés

## 📈 Statistiques

- **Plus de 80 lieux** référencés
- **Période couverte :** Année 1786
- **3 théâtres curiaux** documentés
- **1 grand voyage** en Normandie (21-29 juin 1786)
- **Nombreux pavillons de chasse** visités régulièrement

## 🎯 Événements marquants de 1786

- **Début 1786** : Construction du Théâtre de l'Aile neuve à Versailles
- **4 novembre 1786** : Première représentation d'*Azémire* de Marie-Joseph Chénier à Fontainebleau
- **21-29 juin 1786** : Voyage de Louis XVI en Normandie pour inspecter les travaux du port militaire de Cherbourg

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des erreurs historiques ou géographiques
- Proposer des améliorations de l'interface
- Ajouter des informations complémentaires

## 📝 Licence

Ce projet est mis à disposition à des fins éducatives et de recherche historique.

## 👤 Auteur

**Elisa Broux** - Traitement des données et mise en forme

## 🙏 Remerciements

- Caroline zum Kolk pour la publication de l'itinéraire de Louis XVI
- Karima Mazingarbe pour la constitution de l'itinéraire original
- Le projet Cour de France.fr pour la mise à disposition des données

---

*Projet réalisé dans le cadre de recherches sur les pratiques culturelles et les déplacements de la cour sous l'Ancien Régime.*

