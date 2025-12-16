// Chargement des données depuis le fichier JSON
let theatres = [];
let places = [];
let allPlaces = [];

// Charger les données
fetch('assets/data.json')
    .then(response => response.json())
    .then(data => {
        theatres = data.theatres;
        places = data.places;
        allPlaces = [...theatres, ...places];
        
        // Initialiser la carte une fois les données chargées
        initMap();
    })
    .catch(error => {
        console.error('Erreur lors du chargement des données:', error);
    });

function initMap() {
    // Initialisation de la carte centrée sur l'Île-de-France
    // Carte centrée par défaut sur le château de Versailles
    const map = L.map('map', {
        zoomControl: false
    }).setView([48.80452438239178, 2.1215883760563514], 9);
    
    // Ajouter le contrôle de zoom en bas à droite
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Fond de carte sobre et académique
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19
    }).addTo(map);

    // Définition des couleurs par catégorie
    const colors = {
        theatres: '#9b59b6',        // Violet
        fontainebleau: '#e57373',   // Rouge clair
        versailles: '#64b5f6',      // Bleu clair
        chasse: '#81c784',          // Vert clair
        residences: '#fff176',      // Jaune clair
        normandie: '#d7ccc8'        // Beige
    };

    const categoryNames = {
        theatres: 'Principaux théâtres curiaux fréquentés en 1786',
        fontainebleau: 'Lieux fréquentés en saison d\'automne (Fontainebleau lieu de séjour principal)',
        versailles: 'Lieux fréquentés en saison d\'hiver (Versailles lieu de séjour principal)',
        chasse: 'Pavillons de chasse',
        residences: 'Autres résidences royales',
        normandie: 'Voyage en Normandie (juin 1786)'
    };

    // --- Timeline : parsing des dates et plage temporelle ---
    const monthMap = {
        'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };

    // Parse une date au format YYYYMMDD (ex: 17860101)
    function parseSingleDate(dateStr) {
        if (!dateStr) return new Date(1786, 0, 1).getTime();
        const dateInt = parseInt(dateStr, 10);
        const year = Math.floor(dateInt / 10000);
        const month = Math.floor((dateInt % 10000) / 100) - 1; // 0-indexed
        const day = dateInt % 100;
        return new Date(year, month, day).getTime();
    }

    function formatTimelineDate(ts) {
        const date = new Date(ts);
        const month = Object.keys(monthMap).find(key => monthMap[key] === date.getMonth()) || '';
        return `${date.getDate()} ${month} 1786`.trim();
    }

    // Formater une date YYYYMMDD en DD/MM
    function formatDateShort(dateStr) {
        const dateInt = parseInt(dateStr, 10);
        const month = Math.floor((dateInt % 10000) / 100);
        const day = dateInt % 100;
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
    }

    // Calculer le nombre de visites réelles (séquences de dates consécutives)
    function countRealVisits(visitDates) {
        if (!visitDates || visitDates.length === 0) return 0;
        
        // Convertir en nombres et trier
        const sortedDates = visitDates.map(d => parseInt(d, 10)).sort((a, b) => a - b);
        
        let visitCount = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1];
            const currDate = sortedDates[i];
            
            // Calculer la différence en jours
            const prevTimestamp = parseSingleDate(prevDate.toString());
            const currTimestamp = parseSingleDate(currDate.toString());
            const daysDiff = Math.round((currTimestamp - prevTimestamp) / (1000 * 60 * 60 * 24));
            
            // Si plus d'un jour d'écart, c'est une nouvelle visite
            if (daysDiff > 1) {
                visitCount++;
            }
        }
        
        return visitCount;
    }

    // Construire la timeline à partir des visitDates
    const timelineDatesByPlace = {};
    const allVisitDates = new Set();
    
    allPlaces.forEach(place => {
        if (place.visitDates && Array.isArray(place.visitDates)) {
            const timestamps = place.visitDates.map(parseSingleDate);
            timelineDatesByPlace[place.id] = timestamps;
            timestamps.forEach(ts => allVisitDates.add(ts));
        } else {
            timelineDatesByPlace[place.id] = [];
        }
    });
    
    const timelineDates = Array.from(allVisitDates).sort((a, b) => a - b);

    let currentTimelineIndex = 0;
    let timelineSlider = null;
    let timelineDateLabel = null;
    let timelinePlayButton = null;
    let timelineInterval = null;
    let timelineHistoryInput = null;
    let showHistory = false;
    let timelineEnableInput = null;
    let timelineEnabled = false;
    let timelineSpeed = 1; // Vitesse de lecture: 1, 5 ou 10

    function updateTimelineUi(enabled) {
        const control = document.querySelector('.timeline-control');
        if (!control) return;
        control.classList.toggle('timeline-disabled', !enabled);
        if (timelineSlider) timelineSlider.disabled = !enabled;
        if (timelinePlayButton) timelinePlayButton.disabled = !enabled;
        if (timelineHistoryInput) timelineHistoryInput.disabled = !enabled;
        
        // Désactiver/activer les boutons de vitesse
        document.querySelectorAll('.timeline-speed-btn').forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    function setPlayIcon(isPlaying) {
        if (!timelinePlayButton) return;
        timelinePlayButton.querySelector('span').textContent = isPlaying ? '⏸' : '▶';
        timelinePlayButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Lecture');
    }

    // Création des groupes de calques pour la légende interactive
    const layerGroups = {
        theatres: L.layerGroup(),
        fontainebleau: L.layerGroup(),
        versailles: L.layerGroup(),
        chasse: L.layerGroup(),
        residences: L.layerGroup(),
        normandie: L.layerGroup()
    };

    // État de visibilité par catégorie (théâtres visibles par défaut, autres masqués)
    const visibility = {
        theatres: true,
        fontainebleau: true,
        versailles: true,
        chasse: true,
        residences: true,
        normandie: true
    };

    // Stockage des marqueurs par ID
    const markersById = {};

    // Applique la double contrainte : visibilité par catégorie + position dans la timeline
    function updateMarkersVisibility() {
        const selectedDate = timelineDates[currentTimelineIndex];
        if (selectedDate === undefined) return;

        const markersToBlink = [];

        allPlaces.forEach(place => {
            const marker = markersById[place.id];
            const markerDates = timelineDatesByPlace[place.id] || [];
            const group = layerGroups[place.category];
            const isTheatre = place.category === 'theatres';
            
            let shouldBeVisible = visibility[place.category];
            
            // Les théâtres sont toujours visibles
            if (!isTheatre && timelineEnabled) {
                if (showHistory) {
                    // Mode historique : visible si au moins une visite <= date sélectionnée
                    shouldBeVisible = shouldBeVisible && markerDates.some(d => d <= selectedDate);
                } else {
                    // Mode exact : visible si visite exactement à cette date
                    shouldBeVisible = shouldBeVisible && markerDates.includes(selectedDate);
                }
            }

            if (!marker || !group) return;

            if (shouldBeVisible) {
                if (!group.hasLayer(marker)) {
                    group.addLayer(marker);
                }
                if (map.hasLayer(group) === false && visibility[place.category]) {
                    group.addTo(map);
                }

                // Faire clignoter les lieux de la date courante pour signaler leur activation/réactivation
                if (timelineEnabled && markerDates.includes(selectedDate)) {
                    markersToBlink.push(marker);
                }
            } else if (group.hasLayer(marker)) {
                group.removeLayer(marker);
            }
        });

        if (timelineEnabled && markersToBlink.length > 0) {
            markersToBlink.forEach(triggerMarkerBlink);
        }
    }

    // Fait clignoter brièvement un marqueur (SVG ou divIcon)
    function triggerMarkerBlink(marker) {
        const el = (marker.getElement && marker.getElement()) || marker._icon || marker._path;
        if (!el) return;
        // Redémarrer l'animation en forçant un reflow
        el.classList.remove('marker-blink');
        void el.getBoundingClientRect();
        el.classList.add('marker-blink');
        setTimeout(() => el.classList.remove('marker-blink'), 900);
    }

    // Fonction pour naviguer vers un lieu (affiche même si catégorie masquée)
    function goToPlace(placeId) {
        const marker = markersById[placeId];
        if (marker) {
            // Trouver la catégorie du lieu
            const place = allPlaces.find(p => p.id === placeId);
            if (place) {
                const layerGroup = layerGroups[place.category];
                
                // S'assurer que le groupe de couches est visible sur la carte
                if (!map.hasLayer(layerGroup)) {
                    layerGroup.addTo(map);
                }
                
                // S'assurer que le marqueur est dans le groupe
                if (!layerGroup.hasLayer(marker)) {
                    marker.addTo(layerGroup);
                }
            }

            // Centrer sur le marqueur
            map.setView(marker.getLatLng(), 12);

            // Fonction pour ouvrir la popup de manière sécurisée
            function openPopupSafely() {
                if (!map.hasLayer(marker)) {
                    return false;
                }
                
                try {
                    marker.openPopup();
                    return true;
                } catch (e) {
                    console.warn('Erreur lors de l\'ouverture de la popup:', e);
                    return false;
                }
            }

            // Attendre que la carte soit complètement chargée avant d'ouvrir la popup
            // Utiliser 'moveend' et 'zoomend' pour s'assurer que toutes les animations sont terminées
            let popupOpened = false;
            
            function tryOpenPopup() {
                if (!popupOpened && openPopupSafely()) {
                    popupOpened = true;
                }
            }
            
            map.once('moveend', () => {
                setTimeout(tryOpenPopup, 200);
            });
            
            map.once('zoomend', () => {
                setTimeout(tryOpenPopup, 200);
            });
            
            // Fallback : essayer après un délai plus long si les événements ne se déclenchent pas
            setTimeout(() => {
                if (!popupOpened) {
                    tryOpenPopup();
                }
            }, 500);
        }
    }

    function setTimelineIndex(index, syncSlider = true) {
        if (!timelineDates.length) return;
        currentTimelineIndex = Math.min(Math.max(index, 0), timelineDates.length - 1);
        if (timelineDateLabel) {
            timelineDateLabel.textContent = formatTimelineDate(timelineDates[currentTimelineIndex]);
        }
        if (syncSlider && timelineSlider) {
            timelineSlider.value = currentTimelineIndex;
        }
        updateMarkersVisibility();
    }

    function startTimeline() {
        if (timelineInterval || !timelineDates.length) return;
        if (timelinePlayButton) timelinePlayButton.classList.add('playing');
        setPlayIcon(true);
        const baseDelay = 1200; // Délai de base en ms
        const delay = baseDelay / timelineSpeed; // Ajuster selon la vitesse
        timelineInterval = setInterval(() => {
            if (currentTimelineIndex >= timelineDates.length - 1) {
                stopTimeline();
                return;
            }
            setTimelineIndex(currentTimelineIndex + 1);
        }, delay);
    }

    function stopTimeline() {
        if (timelinePlayButton) timelinePlayButton.classList.remove('playing');
        setPlayIcon(false);
        if (timelineInterval) {
            clearInterval(timelineInterval);
            timelineInterval = null;
        }
    }

    function setTimelineSpeed(speed) {
        const wasPlaying = timelineInterval !== null;
        if (wasPlaying) {
            stopTimeline();
        }
        timelineSpeed = speed;
        
        // Mettre à jour les boutons de vitesse
        document.querySelectorAll('.timeline-speed-btn').forEach(btn => {
            const btnSpeed = parseInt(btn.getAttribute('data-speed'));
            if (btnSpeed === speed) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        if (wasPlaying) {
            startTimeline();
        }
    }

    // Fonction pour créer un marqueur
    function createMarker(place) {
        const color = colors[place.category];
        const isTheatre = place.category === 'theatres';
        
        // Calculer le nombre de visites réelles et formater les dates
        const realVisitCount = place.visitDates ? countRealVisits(place.visitDates) : 0;
        const totalDays = place.visitDates ? place.visitDates.length : 0;
        let formattedDates = 'Non daté';
        
        if (place.visitDates && place.visitDates.length > 0) {
            if (place.visitDates.length > 10) {
                // Plus de 10 jours : afficher "entre le ... et le ..."
                const firstDate = formatDateShort(place.visitDates[0]);
                const lastDate = formatDateShort(place.visitDates[place.visitDates.length - 1]);
                formattedDates = `entre le ${firstDate} et le ${lastDate}`;
            } else {
                // 10 jours ou moins : lister toutes les dates
                formattedDates = place.visitDates.map(d => formatDateShort(d)).join(', ');
            }
        }

        let marker;
        if (isTheatre) {
            const size = 22;
            const icon = L.divIcon({
                className: 'theatre-icon',
                html: `<div class="marker-triangle" style="border-left:${size / 2}px solid transparent; border-right:${size / 2}px solid transparent; border-bottom:${size}px solid ${color};"></div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
                popupAnchor: [0, -size / 2]
            });
            marker = L.marker([place.lat, place.lng], { icon });
        } else {
            // Calculer le rayon en fonction du nombre de jours avec une échelle logarithmique
            // pour éviter des marqueurs trop grands tout en gardant une progression visible
            let radius;
            if (totalDays === 0) {
                radius = 5;
            } else if (totalDays === 1) {
                radius = 6;
            } else {
                // Échelle logarithmique : radius = baseSize + scale * log(days)
                // Base: 6px, Scale: 3, ce qui donne:
                // 1 jour = 6px
                // 2-3 jours = ~7-8px
                // 5-10 jours = ~9-10px
                // 20-30 jours = ~11-12px
                // 50-100 jours = ~13-14px
                // 200+ jours = ~15-16px
                const baseSize = 6;
                const scale = 3;
                radius = Math.min(16, baseSize + scale * Math.log10(totalDays));
                radius = Math.round(radius * 10) / 10; // Arrondir à 1 décimale
            }
            
            marker = L.circleMarker([place.lat, place.lng], {
                radius: radius,
                fillColor: color,
                color: '#333',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.85
            });
        }

        let popupContent = `
            <div class="popup-title">${place.name}</div>
            <div class="popup-content">
                ${realVisitCount > 0 ? `<strong>Nombre de visites :</strong> ${realVisitCount}${totalDays > realVisitCount ? ` (${totalDays} jours)` : ''}<br/>` : ''}
                ${realVisitCount > 0 ? `<strong>Dates :</strong> ${formattedDates}<br/>` : ''}
                ${place.details ? `<em>${place.details}</em><br/>` : ''}
                ${place.history ? `<div class="popup-history">${place.history}</div>` : ''}
                <div class="category-tag-container">
                    <span class="category-tag" style="background-color: ${color}; color: ${isTheatre ? '#fff' : '#333'};">${categoryNames[place.category]}</span>
                    ${place.latlngVerified ? '<span class="verified-icon" title="Coordonnées géographiques vérifiées"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>Coordonnées géographiques vérifiées</title><path d="M18.25,22L15.5,19L16.66,17.82L18.25,19.41L21.84,15.82L23,17.23M20.5,3A0.5,0.5 0 0,1 21,3.5V13.36C20.36,13.13 19.69,13 19,13C17.46,13 16.06,13.6 15,14.56V7.1L9,5V16.9L13.04,18.3C13,18.54 13,18.77 13,19C13,19.46 13.06,19.92 13.16,20.36L9,18.9L3.66,20.97C3.59,21 3.55,21 3.5,21A0.5,0.5 0 0,1 3,20.5V5.38C3,5.15 3.16,4.97 3.35,4.9L9,3L15,5.1L20.33,3" /></svg></span>' : ''}
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);
        return marker;
    }

    // Ajout des marqueurs pour les théâtres
    theatres.forEach(place => {
        const marker = createMarker(place);
        marker.addTo(layerGroups.theatres);
        markersById[place.id] = marker;
    });

    // Ajout des marqueurs pour les autres lieux
    places.forEach(place => {
        const marker = createMarker(place);
        marker.addTo(layerGroups[place.category]);
        markersById[place.id] = marker;
    });

    // Ajout initial : uniquement les théâtres
    Object.values(layerGroups).forEach(group => group.addTo(map));

    // Création de la barre de recherche
    const searchControl = L.control({ position: 'topleft' });

    searchControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'search-control');
        div.innerHTML = `
            <h4>🔍 Rechercher</h4>
            <input type="text" class="search-input" placeholder="Lieu ou date...">
            <div class="search-results"></div>
        `;

        const input = div.querySelector('.search-input');
        const resultsDiv = div.querySelector('.search-results');

        function performSearch() {
            const query = input.value.toLowerCase().trim();
            resultsDiv.innerHTML = '';

            if (query.length < 2) {
                return;
            }

            const results = allPlaces.filter(p => {
                const nameMatch = p.name.toLowerCase().includes(query);
                const detailsMatch = p.details && p.details.toLowerCase().includes(query);
                const historyMatch = p.history && p.history.toLowerCase().includes(query);
                
                // Rechercher dans les dates de visite
                let datesMatch = false;
                if (p.visitDates && Array.isArray(p.visitDates)) {
                    // Convertir les dates YYYYMMDD en formats lisibles pour la recherche
                    const searchableDates = p.visitDates.map(dateInt => {
                        const dateStr = dateInt.toString();
                        const year = dateStr.substring(0, 4);
                        const month = dateStr.substring(4, 6);
                        const day = dateStr.substring(6, 8);
                        
                        // Créer différents formats de recherche
                        const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                                          'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
                        const monthName = monthNames[parseInt(month) - 1];
                        
                        return [
                            `${day}/${month}`,           // 01/01
                            `${day}/${month}/${year}`,   // 01/01/1786
                            `${day}.${month}`,           // 01.01
                            `${day}.${month}.${year}`,   // 01.01.1786
                            `${day} ${monthName}`,       // 01 janvier
                            monthName,                   // janvier
                            dateStr                      // 17860101
                        ].join(' ');
                    }).join(' ').toLowerCase();
                    
                    datesMatch = searchableDates.includes(query);
                }
                
                return nameMatch || datesMatch || detailsMatch || historyMatch;
            });

            if (results.length === 0) {
                resultsDiv.innerHTML = '<div class="no-results">Aucun résultat</div>';
                return;
            }

            results.slice(0, 10).forEach(place => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                
                // Formater les dates pour l'affichage
                let dateDisplay = 'Non daté';
                if (place.visitDates && place.visitDates.length > 0) {
                    const realVisits = countRealVisits(place.visitDates);
                    const totalDays = place.visitDates.length;
                    if (totalDays > 10) {
                        const firstDate = formatDateShort(place.visitDates[0]);
                        const lastDate = formatDateShort(place.visitDates[totalDays - 1]);
                        dateDisplay = `${realVisits} visite${realVisits > 1 ? 's' : ''} (${totalDays} jour${totalDays > 1 ? 's' : ''}, entre le ${firstDate} et le ${lastDate})`;
                    } else {
                        dateDisplay = `${realVisits} visite${realVisits > 1 ? 's' : ''} (${totalDays} jour${totalDays > 1 ? 's' : ''})`;
                    }
                }
                
                item.innerHTML = `
                    <div class="result-name">${place.name}</div>
                    <div class="result-date">${dateDisplay}</div>
                `;
                item.addEventListener('click', function () {
                    goToPlace(place.id);
                    input.value = '';
                    resultsDiv.innerHTML = '';
                });
                resultsDiv.appendChild(item);
            });
        }

        input.addEventListener('input', performSearch);

        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = input.value.toLowerCase().trim();
                if (query.length >= 2) {
                    const results = allPlaces.filter(p => {
                        const nameMatch = p.name.toLowerCase().includes(query);
                        let datesMatch = false;
                        if (p.visitDates && Array.isArray(p.visitDates)) {
                            const datesStr = p.visitDates.join(' ').toLowerCase();
                            datesMatch = datesStr.includes(query);
                        }
                        return nameMatch || datesMatch;
                    });
                    if (results.length > 0) {
                        goToPlace(results[0].id);
                        input.value = '';
                        resultsDiv.innerHTML = '';
                    }
                }
            }
        });

        // Empêcher la propagation des événements
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        return div;
    };

    searchControl.addTo(map);

    // Création de la légende interactive
    const legend = L.control({ position: 'topright' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'legend');

        div.innerHTML = '<h4>Catégories</h4>';

        // Comptage des lieux par catégorie
        const counts = {
            theatres: theatres.length
        };
        places.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });

        const theatreCategories = [
            { key: 'theatres', name: 'Principaux théâtres curiaux' }
        ];

        const sejourCategories = [
            { key: 'fontainebleau', name: 'Lieux fréquentés en saison d\'automne (Fontainebleau lieu de séjour principal)' },
            { key: 'versailles', name: 'Lieux fréquentés en saison d\'hiver (Versailles lieu de séjour principal)' },
            { key: 'chasse', name: 'Pavillons de chasse' },
            { key: 'residences', name: 'Autres résidences royales' }
        ];

        // Autres séjours ponctuels
        const otherSejourCategories = [
            { key: 'normandie', name: 'Voyage en Normandie (juin 1786)' }
        ];

        // Fonction pour créer un item de légende
        function createLegendItem(cat, container) {
            const item = L.DomUtil.create('div', 'legend-item', container);
            item.setAttribute('data-category', cat.key);

        const colorIcon = cat.key === 'theatres'
            ? `<span class="legend-color legend-color-triangle" style="border-bottom-color: ${colors[cat.key]};"></span>`
            : `<span class="legend-color" style="background-color: ${colors[cat.key]};"></span>`;

        item.innerHTML = `
        ${colorIcon}
        <span class="legend-text">${cat.name}</span>
        <span class="legend-count">(${counts[cat.key] || 0})</span>
    `;

            item.addEventListener('click', function (e) {
                e.stopPropagation();
                visibility[cat.key] = !visibility[cat.key];

                if (visibility[cat.key]) {
                    map.addLayer(layerGroups[cat.key]);
                    item.classList.remove('inactive');
                } else {
                    map.removeLayer(layerGroups[cat.key]);
                    item.classList.add('inactive');
                }
                updateToggleButtons();
                updateMarkersVisibility();
            });

            return item;
        }

        // Sous-titre 1 : Saison théâtrale
        const subtitle1 = L.DomUtil.create('div', 'legend-subtitle', div);
        subtitle1.innerHTML = '<span class="subtitle-text">La saison théâtrale en 1786</span><span class="toggle-all" data-group="theatres"><input type="checkbox" id="toggle-theatres" checked></span>';

        // Container pour les théâtres (sous subtitle1)
        const theatreContainer = L.DomUtil.create('div', 'legend-group', div);
        theatreContainer.setAttribute('data-group', 'theatres');
        theatreCategories.forEach(cat => createLegendItem(cat, theatreContainer));

        // Sous-titre 2 : Séjours de la cour
        const subtitle2 = L.DomUtil.create('div', 'legend-subtitle', div);
        subtitle2.innerHTML = '<span class="subtitle-text">Les séjours de la cour en 1786</span><span class="toggle-all" data-group="sejours"><input type="checkbox" id="toggle-sejours" checked></span>';

        // Container pour les séjours (sous subtitle2)
        const sejourContainer = L.DomUtil.create('div', 'legend-group', div);
        sejourContainer.setAttribute('data-group', 'sejours');
        sejourCategories.forEach(cat => createLegendItem(cat, sejourContainer));

        // Sous-titre 3 : Autres séjours
        const subtitle3 = L.DomUtil.create('div', 'legend-subtitle', div);
        subtitle3.innerHTML = '<span class="subtitle-text">Autres séjours</span><span class="toggle-all" data-group="autres"><input type="checkbox" id="toggle-autres" checked></span>';

        // Container pour les autres séjours (sous subtitle3)
        const otherSejourContainer = L.DomUtil.create('div', 'legend-group', div);
        otherSejourContainer.setAttribute('data-group', 'autres');
        otherSejourCategories.forEach(cat => createLegendItem(cat, otherSejourContainer));

        // Fonction pour mettre à jour les boutons "Tout"
        function updateToggleButtons() {
            const theatreKeys = theatreCategories.map(c => c.key);
            const sejourKeys = sejourCategories.map(c => c.key);
            const otherSejourKeys = otherSejourCategories.map(c => c.key);

            const allTheatresVisible = theatreKeys.every(k => visibility[k]);
            const allSejoursVisible = sejourKeys.every(k => visibility[k]);
            const allOtherVisible = otherSejourKeys.every(k => visibility[k]);

            const theatresCheckbox = div.querySelector('[data-group="theatres"] input[type="checkbox"]');
            const sejoursCheckbox = div.querySelector('[data-group="sejours"] input[type="checkbox"]');
            const autresCheckbox = div.querySelector('[data-group="autres"] input[type="checkbox"]');

            if (theatresCheckbox) theatresCheckbox.checked = allTheatresVisible;
            if (sejoursCheckbox) sejoursCheckbox.checked = allSejoursVisible;
            if (autresCheckbox) autresCheckbox.checked = allOtherVisible;
        }

        // Gestionnaire pour "Tout sélectionner/désélectionner"
        div.querySelectorAll('.toggle-all').forEach(btn => {
            const checkbox = btn.querySelector('input[type="checkbox"]');
            const group = btn.getAttribute('data-group');

            // Gestionnaire pour le clic sur le label ou le span
            btn.addEventListener('click', function (e) {
                // Ne pas déclencher si on clique directement sur la checkbox (elle gère son propre événement)
                if (e.target.type === 'checkbox') return;
                e.stopPropagation();
                checkbox.checked = !checkbox.checked;
                handleToggleAll(group, checkbox.checked);
            });

            // Gestionnaire pour le changement de la checkbox
            if (checkbox) {
                checkbox.addEventListener('change', function (e) {
                    e.stopPropagation();
                    handleToggleAll(group, this.checked);
                });
            }
        });

        function handleToggleAll(group, newState) {
            let keys = [];
            if (group === 'theatres') {
                keys = theatreCategories.map(c => c.key);
            } else if (group === 'sejours') {
                keys = sejourCategories.map(c => c.key);
            } else if (group === 'autres') {
                keys = otherSejourCategories.map(c => c.key);
            }

            keys.forEach(key => {
                visibility[key] = newState;
                if (newState) {
                    map.addLayer(layerGroups[key]);
                } else {
                    map.removeLayer(layerGroups[key]);
                }
                const item = div.querySelector(`[data-category="${key}"]`);
                if (item) {
                    item.classList.toggle('inactive', !newState);
                }
            });

            updateToggleButtons();
            updateMarkersVisibility();
        }

        const note = L.DomUtil.create('p', '', div);
        note.style.cssText = 'font-size: 11px; color: #888; margin-top: 10px; font-style: italic;';
        note.textContent = 'Cliquez sur une catégorie pour l\'afficher/masquer';

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        return div;
    };

    legend.addTo(map);

    // Contrôle timeline
    const timelineControl = L.control({ position: 'bottomleft' });

    timelineControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'timeline-control leaflet-control');

        const minLabel = timelineDates.length ? formatTimelineDate(timelineDates[0]) : '';
        const maxLabel = timelineDates.length ? formatTimelineDate(timelineDates[timelineDates.length - 1]) : '';

        div.innerHTML = `
            <div class="timeline-toggle-container">
                <label class="timeline-toggle">
                    <input type="checkbox" class="timeline-enable-input">
                    Activer la timeline
                </label>
                <label class="timeline-history">
                    <input type="checkbox" class="timeline-history-input">
                    Garder l'historique
                </label>
            </div>
            <div class="timeline-header">
                <button class="timeline-play" title="Lecture/Pause"><span>▶</span></button>
                <div class="timeline-date"></div>
                <div class="timeline-speed">
                    <button class="timeline-speed-btn active" data-speed="1">x1</button>
                    <button class="timeline-speed-btn" data-speed="5">x5</button>
                    <button class="timeline-speed-btn" data-speed="10">x10</button>
                </div>
            </div>
            <input type="range" class="timeline-slider" min="0" max="${Math.max(timelineDates.length - 1, 0)}" value="${currentTimelineIndex}">
            <div class="timeline-scale">
                <span>${minLabel}</span>
                <span>${maxLabel}</span>
            </div>
        `;

        timelineSlider = div.querySelector('.timeline-slider');
        timelineDateLabel = div.querySelector('.timeline-date');
        timelinePlayButton = div.querySelector('.timeline-play');
        timelineHistoryInput = div.querySelector('.timeline-history-input');
        timelineEnableInput = div.querySelector('.timeline-enable-input');

        // Appliquer l'état initial désactivé
        if (timelineEnableInput) {
            timelineEnableInput.checked = timelineEnabled;
        }
        updateTimelineUi(timelineEnabled);

        if (timelineDateLabel && timelineDates.length) {
            timelineDateLabel.textContent = formatTimelineDate(timelineDates[currentTimelineIndex]);
        }
        setPlayIcon(false);

        if (timelineSlider) {
            timelineSlider.addEventListener('input', (e) => {
                stopTimeline();
                setTimelineIndex(Number(e.target.value), false);
            });
        }

        if (timelinePlayButton) {
            timelinePlayButton.addEventListener('click', () => {
                if (timelineInterval) {
                    stopTimeline();
                } else {
                    // Repart de la date courante jusqu'à la fin
                    if (currentTimelineIndex >= timelineDates.length - 1) {
                        setTimelineIndex(0);
                    }
                    startTimeline();
                }
            });
        }

        if (timelineHistoryInput) {
            timelineHistoryInput.addEventListener('change', (e) => {
                showHistory = e.target.checked;
                updateMarkersVisibility();
            });
        }

        if (timelineEnableInput) {
            timelineEnableInput.addEventListener('change', (e) => {
                timelineEnabled = e.target.checked;
                if (!timelineEnabled) {
                    stopTimeline();
                }
                updateTimelineUi(timelineEnabled);
                updateMarkersVisibility();
            });
        }

        // Gestionnaires pour les boutons de vitesse
        div.querySelectorAll('.timeline-speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.getAttribute('data-speed'));
                setTimelineSpeed(speed);
            });
        });

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        return div;
    };

    timelineControl.addTo(map);
    setTimelineIndex(currentTimelineIndex);
    if (!timelineEnabled) {
        updateMarkersVisibility();
    }
    updateTimelineUi(timelineEnabled);

    // Ajout d'une ligne pour le voyage en Normandie
    const normandieRoute = [
        [48.80452438239178, 2.1215883760563514],  // Versailles (départ)
        [48.7534847, 0.740002],   // Chandai
        [49.173938600768544, 0.7863978614955963],  // Harcourt
        [49.655778138925584, -1.63536823180084], // Cherbourg
        [49.2751306, -1.1458554], // Montmartin
        [49.186695373508485, -0.36301474616409674], // Caen
        [49.4197222, 0.2338889],  // Honfleur
        [49.4857290969773, 0.10698682195733893],  // Le Havre
        [49.4404591, 1.0939658],  // Rouen
        [49.160903871171996, 1.329870183161747],  // Gaillon
        [48.80452438239178, 2.1215883760563514]   // Retour Versailles
    ];

    const routeLine = L.polyline(normandieRoute, {
        color: '#8d6e63',
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 10'
    }).addTo(layerGroups.normandie);

    routeLine.bindPopup('<strong>Voyage en Normandie</strong><br/>21-29 juin 1786<br/>Visite de Louis XVI à Cherbourg');

    // ===== CODE RESPONSIVE MOBILE =====
    
    // Détection de la largeur d'écran
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Toggle de l'en-tête
    const headerToggle = document.querySelector('.header-toggle');
    const header = document.querySelector('.header');
    
    if (headerToggle && header) {
        headerToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            header.classList.toggle('collapsed');
        });
    }

    // Toggle du footer
    const footerExpand = document.querySelector('.footer-expand');
    const footer = document.querySelector('.footer');
    
    if (footerExpand && footer) {
        footerExpand.addEventListener('click', function(e) {
            e.stopPropagation();
            footer.classList.toggle('collapsed');
            // Changer l'icône et le titre du bouton
            if (footer.classList.contains('collapsed')) {
                footerExpand.innerHTML = 'ⓘ';
                footerExpand.setAttribute('title', 'Afficher les sources');
                footerExpand.setAttribute('aria-label', 'Afficher les sources complètes');
            } else {
                footerExpand.innerHTML = '✕';
                footerExpand.setAttribute('title', 'Masquer les sources');
                footerExpand.setAttribute('aria-label', 'Masquer les sources complètes');
            }
        });
    }

    // Système de légende coulissante pour mobile
    let legendTab = null;
    let legendOverlay = null;
    
    function createLegendMobileControls() {
        if (!isMobile()) return;
        
        // Créer l'onglet si il n'existe pas
        if (!legendTab) {
            legendTab = document.createElement('div');
            legendTab.className = 'legend-tab';
            legendTab.textContent = 'Catégories';
            legendTab.setAttribute('aria-label', 'Ouvrir la liste des catégories');
            document.body.appendChild(legendTab);
            
            legendTab.addEventListener('click', function() {
                openLegend();
            });
        } else {
            // Si l'onglet existe déjà, s'assurer qu'il n'est pas caché
            legendTab.classList.remove('hidden');
        }
        
        // Créer l'overlay si il n'existe pas
        if (!legendOverlay) {
            legendOverlay = document.createElement('div');
            legendOverlay.className = 'legend-overlay';
            document.body.appendChild(legendOverlay);
            
            legendOverlay.addEventListener('click', function() {
                closeLegend();
            });
        }
    }
    
    function openLegend() {
        const legendElement = document.querySelector('.legend');
        if (legendElement) {
            legendElement.classList.add('open');
            if (legendOverlay) legendOverlay.classList.add('active');
            if (legendTab) legendTab.classList.add('hidden');
        }
    }
    
    function closeLegend() {
        const legendElement = document.querySelector('.legend');
        if (legendElement) {
            legendElement.classList.remove('open');
            if (legendOverlay) legendOverlay.classList.remove('active');
            if (legendTab) legendTab.classList.remove('hidden');
        }
    }

    // Ajouter un bouton de fermeture dans la légende pour mobile
    function addLegendCloseButton() {
        const legendElement = document.querySelector('.legend');
        
        if (isMobile()) {
            // Créer le bouton si on est sur mobile et qu'il n'existe pas
            if (legendElement && !legendElement.querySelector('.legend-close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'legend-close-btn';
                closeBtn.innerHTML = '✕';
                closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: #f0f0f0; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 18px; z-index: 1001;';
                closeBtn.setAttribute('aria-label', 'Fermer la légende');
                legendElement.insertBefore(closeBtn, legendElement.firstChild);
                
                closeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    closeLegend();
                });
            }
        } else {
            // Supprimer le bouton si on est sur desktop
            const existingBtn = legendElement?.querySelector('.legend-close-btn');
            if (existingBtn) {
                existingBtn.remove();
            }
        }
    }

    // Initialisation des contrôles mobiles
    function initMobileControls() {
        if (isMobile()) {
            createLegendMobileControls();
            addLegendCloseButton();
            
            // S'assurer que l'onglet légende est visible
            if (legendTab) {
                legendTab.classList.remove('hidden');
            }
            
            // S'assurer que l'en-tête et le footer sont repliés par défaut sur mobile
            if (header) header.classList.add('collapsed');
            if (footer) footer.classList.add('collapsed');
        } else {
            // Sur desktop, s'assurer que tout est déplié
            if (header) header.classList.remove('collapsed');
            if (footer) footer.classList.remove('collapsed');
            
            // Fermer la légende si elle était ouverte
            closeLegend();
            
            // Cacher les contrôles mobiles
            if (legendTab) {
                legendTab.classList.add('hidden');
            }
        }
    }

    // Initialiser au chargement
    initMobileControls();

    // Réinitialiser lors du redimensionnement
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            initMobileControls();
        }, 250);
    });

    // Empêcher la fermeture de la légende lors du clic à l'intérieur
    const legendElement = document.querySelector('.legend');
    if (legendElement) {
        legendElement.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

