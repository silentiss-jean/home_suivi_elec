"use strict";

// Module pour l'onglet "Capteurs groupés" des diagnostics
import { fetchViaProxy } from "../shared/proxy.js";
import { toast } from "../shared/uiToast.js";

console.info("[capteursSensor] Module capteurs groupés chargé");

// Configuration par défaut
const CONFIG = {
  ABSENT_DELAY_MINUTES: 5,
  AUTO_REFRESH_INTERVAL: null, // null = pas d'auto-refresh par défaut
  STATES_KO: ['unavailable', 'unknown', 'error', 'none'],
  INVALID_UNITS: ['°C', '°F', '%', 'lux', 'dB'] // Unités qui ne sont pas de l'énergie
};

// Cache et état local
let cachedSensorsData = null;
let filteredGroups = null;
let currentFilters = {
  search: '',
  state: 'all', // all, ok, ko, absent, quarantine
  integration: 'all'
};

/**
 * Point d'entrée principal pour l'onglet capteurs
 */
export async function loadCapteursSensor(container) {
  try {
    console.log("[capteursSensor] Début chargement interface capteurs groupés");
    
    container.innerHTML = '<div class="loading-spinner">🔄 Chargement des capteurs...</div>';
    
    // Récupérer les données via l'API de santé des capteurs
    const sensorsData = await fetchViaProxy('/api/home_suivi_elec/get_sensors');
    
    if (!sensorsData?.success) {
      throw new Error(sensorsData?.error || 'Données capteurs indisponibles');
    }
    
    cachedSensorsData = sensorsData.sensors || {};
    console.log(`[capteursSensor] ${Object.keys(cachedSensorsData).length} capteurs reçus`);
    
    // Traitement et groupement des données
    const { groups, stats } = processAndGroupSensors(cachedSensorsData);
    
    // Rendu de l'interface complète
    container.innerHTML = renderCapteursSensorInterface(groups, stats);
    
    // Initialisation des interactions
    initCapteursSensorInteractions(groups);
    
    console.log("✅ Interface capteurs groupés initialisée avec succès");
    
  } catch (error) {
    console.error('❌ Erreur chargement capteurs:', error);
    
    // Interface d'erreur avec fallback vers API existante
    container.innerHTML = `
      <div class="error-display">
        <h4>❌ Impossible de charger l'API de santé des capteurs</h4>
        <p>Erreur: ${error.message}</p>
        <div style="margin-top: 15px;">
          <button id="fallback-basic-sensors" class="btn-fallback">🔄 Utiliser API basique</button>
          <button onclick="location.reload()" class="btn-fallback">🔄 Recharger la page</button>
        </div>
        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
          <em>Note: L'API get_sensors peut ne pas être encore implémentée.<br>
          Cette interface nécessite des données étendues sur l'état de santé des capteurs.</em>
        </p>
      </div>
    `;
    
    // Gestionnaire pour le fallback vers API basique
    const fallbackBtn = container.querySelector('#fallback-basic-sensors');
    if (fallbackBtn) {
      fallbackBtn.addEventListener('click', () => loadFallbackBasicView(container));
    }
  }
}

/**
 * Traitement et groupement intelligent des capteurs
 */
function processAndGroupSensors(sensors) {
  const groups = {};
  const stats = { total: 0, ok: 0, ko: 0, absent: 0, quarantine: 0 };
  const now = Date.now();
  const absentThreshold = CONFIG.ABSENT_DELAY_MINUTES * 60 * 1000;
  
  Object.entries(sensors).forEach(([entityId, sensor]) => {
    stats.total++;
    
    // Calcul de l'état du capteur
    const sensorState = calculateSensorState(sensor, now, absentThreshold);
    stats[sensorState]++;
    
    // Détermination du groupe (ordre de priorité)
    const groupKey = sensor.duplicate_group || 
                     sensor.device_id || 
                     sensor.area || 
                     sensor.integration || 
                     'non_groupé';
    
    // Nom d'affichage du groupe
    const groupName = getGroupDisplayName(sensor, groupKey);
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        name: groupName,
        type: getGroupType(sensor, groupKey),
        sensors: [],
        stats: { total: 0, ok: 0, ko: 0, absent: 0, quarantine: 0 },
        expanded: getExpandedState(groupKey) // Récupère l'état expand/collapse sauvé
      };
    }
    
    // Ajouter le capteur enrichi au groupe
    groups[groupKey].sensors.push({
      ...sensor,
      entity_id: entityId,
      state: sensorState,
      last_seen_human: formatLastSeen(sensor.last_seen),
      quality_score: calculateQualityScore(sensor, sensorState)
    });
    
    groups[groupKey].stats[sensorState]++;
    groups[groupKey].stats.total++;
  });
  
  // Tri des groupes par priorité (plus de capteurs KO d'abord, puis par total)
  const sortedGroups = Object.entries(groups)
    .sort(([,a], [,b]) => {
      if (a.stats.ko !== b.stats.ko) return b.stats.ko - a.stats.ko; // Plus de KO d'abord
      return b.stats.total - a.stats.total; // Puis par total descendant
    })
    .reduce((acc, [key, group]) => ({ ...acc, [key]: group }), {});
  
  return { groups: sortedGroups, stats };
}

/**
 * Calcule l'état d'un capteur selon les règles métier
 */
function calculateSensorState(sensor, now, absentThreshold) {
  // 1. Quarantaine (priorité max)
  if (sensor.quarantine === true) {
    return 'quarantine';
  }
  
  // 2. Absent (pas vu depuis longtemps)
  if (sensor.last_seen && (now - new Date(sensor.last_seen).getTime()) > absentThreshold) {
    return 'absent';
  }
  
  // 3. KO (état invalide ou unité non-énergétique)
  if (CONFIG.STATES_KO.includes(sensor.state) || 
      CONFIG.INVALID_UNITS.includes(sensor.unit_of_measurement)) {
    return 'ko';
  }
  
  // 4. KO si valeur non numérique pour capteur énergie
  if (sensor.type?.includes('energy') && isNaN(parseFloat(sensor.value))) {
    return 'ko';
  }
  
  // 5. OK par défaut
  return 'ok';
}

/**
 * Interface principale de l'onglet capteurs
 */
function renderCapteursSensorInterface(groups, stats) {
  const groupsArray = Object.entries(groups);
  const integrations = [...new Set(Object.values(groups)
    .flatMap(g => g.sensors.map(s => s.integration))
    .filter(Boolean)
  )].sort();
  
  return `
    <div class="capteurs-sensor-interface">
      <!-- Header avec statistiques globales -->
      <div class="capteurs-header">
        <div class="header-stats">
          <h3>📊 Capteurs Groupés par Appareil/Zone</h3>
          <div class="stats-overview">
            <span class="stat-badge total">📊 Total: ${stats.total}</span>
            <span class="stat-badge ok">✅ OK: ${stats.ok}</span>
            <span class="stat-badge ko">❌ KO: ${stats.ko}</span>
            <span class="stat-badge absent">⚪ Absent: ${stats.absent}</span>
            <span class="stat-badge quarantine">🟡 Quarantaine: ${stats.quarantine}</span>
          </div>
        </div>
        
        <!-- Contrôles de filtre et configuration -->
        <div class="header-controls">
          <div class="filter-row">
            <input type="search" id="sensors-search" placeholder="🔍 Rechercher capteur..." value="${currentFilters.search}">
            
            <select id="sensors-state-filter">
              <option value="all" ${currentFilters.state === 'all' ? 'selected' : ''}>Tous états</option>
              <option value="ok" ${currentFilters.state === 'ok' ? 'selected' : ''}>✅ Seulement OK</option>
              <option value="ko" ${currentFilters.state === 'ko' ? 'selected' : ''}>❌ Seulement KO</option>
              <option value="absent" ${currentFilters.state === 'absent' ? 'selected' : ''}>⚪ Seulement Absents</option>
              <option value="quarantine" ${currentFilters.state === 'quarantine' ? 'selected' : ''}>🟡 Quarantaine</option>
            </select>
            
            <select id="sensors-integration-filter">
              <option value="all" ${currentFilters.integration === 'all' ? 'selected' : ''}>Toutes intégrations</option>
              ${integrations.map(integ => 
                `<option value="${integ}" ${currentFilters.integration === integ ? 'selected' : ''}>${integ}</option>`
              ).join('')}
            </select>
          </div>
          
          <div class="config-row">
            <label for="absent-delay">⏰ Absent si > </label>
            <select id="absent-delay">
              <option value="1" ${CONFIG.ABSENT_DELAY_MINUTES === 1 ? 'selected' : ''}>1 min</option>
              <option value="5" ${CONFIG.ABSENT_DELAY_MINUTES === 5 ? 'selected' : ''}>5 min</option>
              <option value="10" ${CONFIG.ABSENT_DELAY_MINUTES === 10 ? 'selected' : ''}>10 min</option>
              <option value="15" ${CONFIG.ABSENT_DELAY_MINUTES === 15 ? 'selected' : ''}>15 min</option>
            </select>
            
            <button id="expand-all-groups" class="btn-action">📂 Tout déplier</button>
            <button id="collapse-all-groups" class="btn-action">📁 Tout replier</button>
          </div>
        </div>
      </div>
      
      <!-- Zone des groupes -->
      <div class="groups-container" id="sensors-groups-container">
        ${groupsArray.length > 0 ? renderGroupsList(groupsArray) : '<p class="no-results">Aucun capteur trouvé avec les filtres actuels.</p>'}
      </div>
    </div>
    
    <style>
    .capteurs-sensor-interface {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .capteurs-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
      padding: 20px;
    }
    
    .header-stats h3 {
      margin: 0 0 12px 0;
      color: #0078d4;
      font-size: 1.2em;
    }
    
    .stats-overview {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 15px;
    }
    
    .stat-badge {
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: 500;
      border: 1px solid transparent;
    }
    
    .stat-badge.total {
      background: #e7f3ff;
      color: #0078d4;
      border-color: #b3d9ff;
    }
    
    .stat-badge.ok {
      background: #d4edda;
      color: #155724;
      border-color: #c3e6cb;
    }
    
    .stat-badge.ko {
      background: #f8d7da;
      color: #721c24;
      border-color: #f5c6cb;
    }
    
    .stat-badge.absent {
      background: #fff3cd;
      color: #856404;
      border-color: #ffeaa7;
    }
    
    .stat-badge.quarantine {
      background: #f4f4f4;
      color: #6c757d;
      border-color: #d1d1d1;
    }
    
    .filter-row,
    .config-row {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 8px 0;
      flex-wrap: wrap;
    }
    
    .filter-row input,
    .filter-row select,
    .config-row select {
      padding: 6px 10px;
      border: 1px solid #ced4da;
      border-radius: 5px;
      font-size: 0.9em;
    }
    
    .filter-row input {
      flex: 1;
      min-width: 200px;
      max-width: 300px;
    }
    
    .btn-action {
      background: #6c757d;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.85em;
      transition: background 0.2s;
    }
    
    .btn-action:hover {
      background: #545b62;
    }
    
    .groups-container {
      padding: 20px;
      max-height: 600px;
      overflow-y: auto;
    }
    
    .sensor-group {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    
    .sensor-group:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .group-header {
      background: #f8f9fa;
      padding: 12px 15px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
      border-bottom: 1px solid #dee2e6;
    }
    
    .group-header:hover {
      background: #e9ecef;
    }
    
    .group-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #495057;
    }
    
    .group-expand-icon {
      transition: transform 0.2s;
      font-size: 0.8em;
      color: #6c757d;
    }
    
    .group-header.expanded .group-expand-icon {
      transform: rotate(90deg);
    }
    
    .group-stats {
      display: flex;
      gap: 6px;
    }
    
    .group-stats .mini-badge {
      background: #6c757d;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.75em;
      min-width: 18px;
      text-align: center;
    }
    
    .group-stats .mini-badge.ok { background: #28a745; }
    .group-stats .mini-badge.ko { background: #dc3545; }
    .group-stats .mini-badge.absent { background: #ffc107; color: #333; }
    .group-stats .mini-badge.quarantine { background: #6c757d; }
    
    .group-content {
      display: none;
      padding: 0;
    }
    
    .group-content.expanded {
      display: block;
      animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 500px;
      }
    }
    
    .sensors-list {
      background: white;
    }
    
    .sensor-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #f8f9fa;
      transition: background 0.2s;
    }
    
    .sensor-item:last-child {
      border-bottom: none;
    }
    
    .sensor-item:hover {
      background: #f8f9fa;
    }
    
    .sensor-info {
      flex: 1;
    }
    
    .sensor-name {
      font-weight: 500;
      color: #212529;
      margin-bottom: 2px;
    }
    
    .sensor-details {
      font-size: 0.85em;
      color: #6c757d;
    }
    
    .sensor-value {
      text-align: center;
      margin: 0 15px;
      min-width: 80px;
    }
    
    .sensor-value-main {
      font-weight: bold;
      color: #212529;
    }
    
    .sensor-value-unit {
      font-size: 0.8em;
      color: #6c757d;
    }
    
    .sensor-state {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 100px;
    }
    
    .state-icon {
      font-size: 1.2em;
    }
    
    .state-icon.ok { color: #28a745; }
    .state-icon.ko { color: #dc3545; }
    .state-icon.absent { color: #ffc107; }
    .state-icon.quarantine { color: #6c757d; }
    
    .sensor-actions {
      display: flex;
      gap: 5px;
    }
    
    .sensor-btn {
      background: none;
      border: 1px solid #dee2e6;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8em;
      transition: all 0.2s;
    }
    
    .sensor-btn:hover {
      background: #f8f9fa;
      border-color: #0078d4;
    }
    
    .no-results {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 40px;
    }
    
    .btn-fallback {
      background: #6c757d;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 5px;
      cursor: pointer;
      margin-right: 10px;
      font-size: 0.9em;
    }
    
    .btn-fallback:hover {
      background: #545b62;
    }
    </style>
  `;
}

/**
 * Rendu de la liste des groupes
 */
function renderGroupsList(groupsArray) {
  return groupsArray.map(([groupKey, group]) => {
    const isExpanded = group.expanded;
    
    return `
      <div class="sensor-group" data-group="${groupKey}">
        <div class="group-header ${isExpanded ? 'expanded' : ''}" onclick="toggleGroup('${groupKey}')">
          <div class="group-title">
            <span class="group-expand-icon">▶</span>
            <span class="group-icon">${getGroupIcon(group.type)}</span>
            <span>${group.name}</span>
            <span class="group-type-info">(${group.type})</span>
          </div>
          <div class="group-stats">
            ${group.stats.ok > 0 ? `<span class="mini-badge ok">${group.stats.ok}</span>` : ''}
            ${group.stats.ko > 0 ? `<span class="mini-badge ko">${group.stats.ko}</span>` : ''}
            ${group.stats.absent > 0 ? `<span class="mini-badge absent">${group.stats.absent}</span>` : ''}
            ${group.stats.quarantine > 0 ? `<span class="mini-badge quarantine">${group.stats.quarantine}</span>` : ''}
          </div>
        </div>
        
        <div class="group-content ${isExpanded ? 'expanded' : ''}">
          <div class="sensors-list">
            ${group.sensors.map(sensor => renderSensorItem(sensor)).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Rendu d'un item capteur individuel
 */
function renderSensorItem(sensor) {
  const stateIcons = {
    ok: '✅',
    ko: '❌', 
    absent: '⚪',
    quarantine: '🟡'
  };
  
  const stateLabels = {
    ok: 'Opérationnel',
    ko: 'Défaillant',
    absent: 'Non visible',
    quarantine: 'En quarantaine'
  };
  
  return `
    <div class="sensor-item" data-entity="${sensor.entity_id}" data-state="${sensor.state}">
      <div class="sensor-info">
        <div class="sensor-name" title="${sensor.entity_id}">
          ${sensor.friendly_name || sensor.entity_id}
        </div>
        <div class="sensor-details">
          ${sensor.integration} • ${sensor.device_id || 'Pas de device'} • ${sensor.last_seen_human}
        </div>
      </div>
      
      <div class="sensor-value">
        <div class="sensor-value-main">${sensor.value || '—'}</div>
        <div class="sensor-value-unit">${sensor.unit_of_measurement || ''}</div>
      </div>
      
      <div class="sensor-state">
        <span class="state-icon ${sensor.state}" title="${stateLabels[sensor.state]}">
          ${stateIcons[sensor.state]}
        </span>
        <span class="state-label">${stateLabels[sensor.state]}</span>
      </div>
      
      <div class="sensor-actions">
        <button class="sensor-btn" onclick="refreshSensor('${sensor.entity_id}')" title="Forcer actualisation">
          🔄
        </button>
        ${sensor.state === 'quarantine' ? 
          `<button class="sensor-btn" onclick="toggleQuarantine('${sensor.entity_id}', false)" title="Retirer de quarantaine">🟢</button>` :
          `<button class="sensor-btn" onclick="toggleQuarantine('${sensor.entity_id}', true)" title="Mettre en quarantaine">🟡</button>`
        }
      </div>
    </div>
  `;
}

/**
 * Initialisation des interactions utilisateur
 */
function initCapteursSensorInteractions(groups) {
  // Gestion de la recherche en temps réel
  const searchInput = document.getElementById('sensors-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value;
      applyFiltersAndRerender();
    });
  }
  
  // Gestion des filtres d'état et d'intégration
  ['sensors-state-filter', 'sensors-integration-filter'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.addEventListener('change', (e) => {
        if (id === 'sensors-state-filter') currentFilters.state = e.target.value;
        if (id === 'sensors-integration-filter') currentFilters.integration = e.target.value;
        applyFiltersAndRerender();
      });
    }
  });
  
  // Gestion du délai "Absent"
  const absentDelaySelect = document.getElementById('absent-delay');
  if (absentDelaySelect) {
    absentDelaySelect.addEventListener('change', async (e) => {
      CONFIG.ABSENT_DELAY_MINUTES = parseInt(e.target.value);
      toast.info(`Délai "Absent" mis à jour: ${CONFIG.ABSENT_DELAY_MINUTES} min`);
      
      // Recalculer les états avec le nouveau délai
      const container = document.querySelector('.capteurs-sensor-interface').parentElement;
      await loadCapteursSensor(container);
    });
  }
  
  // Boutons expand/collapse globaux
  const expandAllBtn = document.getElementById('expand-all-groups');
  const collapseAllBtn = document.getElementById('collapse-all-groups');
  
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      Object.keys(groups).forEach(groupKey => {
        setGroupExpanded(groupKey, true);
        updateGroupVisibility(groupKey, true);
      });
    });
  }
  
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      Object.keys(groups).forEach(groupKey => {
        setGroupExpanded(groupKey, false);
        updateGroupVisibility(groupKey, false);
      });
    });
  }
}

/**
 * Applique les filtres et re-render
 */
function applyFiltersAndRerender() {
  if (!cachedSensorsData) return;
  
  // Filtrage côté client pour performance
  const filtered = Object.entries(cachedSensorsData).filter(([entityId, sensor]) => {
    // Filtre recherche
    if (currentFilters.search) {
      const search = currentFilters.search.toLowerCase();
      const matches = entityId.toLowerCase().includes(search) ||
                      (sensor.friendly_name || '').toLowerCase().includes(search) ||
                      (sensor.device_id || '').toLowerCase().includes(search);
      if (!matches) return false;
    }
    
    // Filtre par intégration
    if (currentFilters.integration !== 'all' && sensor.integration !== currentFilters.integration) {
      return false;
    }
    
    // Filtre par état (recalculé à la volée)
    if (currentFilters.state !== 'all') {
      const now = Date.now();
      const absentThreshold = CONFIG.ABSENT_DELAY_MINUTES * 60 * 1000;
      const state = calculateSensorState(sensor, now, absentThreshold);
      if (state !== currentFilters.state) return false;
    }
    
    return true;
  }).reduce((acc, [id, sensor]) => ({ ...acc, [id]: sensor }), {});
  
  // Re-groupement avec données filtrées
  const { groups, stats } = processAndGroupSensors(filtered);
  
  // Mise à jour du container
  const container = document.getElementById('sensors-groups-container');
  if (container) {
    container.innerHTML = Object.keys(groups).length > 0 ? 
      renderGroupsList(Object.entries(groups)) : 
      '<p class="no-results">Aucun capteur trouvé avec les filtres actuels.</p>';
  }
  
  // Mise à jour des statistiques
  updateStatsDisplay(stats);
}

/**
 * Fonctions utilitaires
 */
function getGroupDisplayName(sensor, groupKey) {
  if (sensor.duplicate_group) {
    return `Groupe: ${sensor.duplicate_group}`;
  }
  if (sensor.device_id) {
    return sensor.device_name || `Appareil: ${sensor.device_id}`;
  }
  if (sensor.area) {
    return `Zone: ${sensor.area}`;
  }
  if (sensor.integration) {
    return `Intégration: ${sensor.integration}`;
  }
  return 'Non groupé';
}

function getGroupType(sensor, groupKey) {
  if (sensor.duplicate_group) return 'duplicate_group';
  if (sensor.device_id) return 'device';
  if (sensor.area) return 'area';
  if (sensor.integration) return 'integration';
  return 'ungrouped';
}

function getGroupIcon(type) {
  const icons = {
    duplicate_group: '🔗',
    device: '📱',
    area: '🏠',
    integration: '🔌',
    ungrouped: '❓'
  };
  return icons[type] || '❓';
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Jamais vu';
  
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMs = now - seen;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
}

function calculateQualityScore(sensor, state) {
  let score = 50; // Base
  
  if (state === 'ok') score += 40;
  if (state === 'ko') score -= 30;
  if (state === 'absent') score -= 20;
  if (state === 'quarantine') score -= 50;
  
  if (sensor.is_selected) score += 10; // Capteur utilisé
  
  return Math.max(0, Math.min(100, score));
}

// Gestion expand/collapse avec persistance
function getExpandedState(groupKey) {
  const saved = sessionStorage.getItem(`diag-group-${groupKey}`);
  return saved ? JSON.parse(saved) : false; // Fermé par défaut
}

function setGroupExpanded(groupKey, expanded) {
  sessionStorage.setItem(`diag-group-${groupKey}`, JSON.stringify(expanded));
}

function updateGroupVisibility(groupKey, expanded) {
  const groupElement = document.querySelector(`[data-group="${groupKey}"]`);
  if (groupElement) {
    const header = groupElement.querySelector('.group-header');
    const content = groupElement.querySelector('.group-content');
    
    if (header) header.classList.toggle('expanded', expanded);
    if (content) content.classList.toggle('expanded', expanded);
  }
}

// Fonction globale pour toggle groupe (appelée par onclick)
window.toggleGroup = function(groupKey) {
  const currentState = getExpandedState(groupKey);
  const newState = !currentState;
  
  setGroupExpanded(groupKey, newState);
  updateGroupVisibility(groupKey, newState);
};

// Actions sur capteurs individuels
window.refreshSensor = async function(entityId) {
  toast.info(`🔄 Actualisation de ${entityId}...`);
  // TODO: Implémenter API refresh_sensor
};

window.toggleQuarantine = async function(entityId, quarantine) {
  try {
    const result = await fetchViaProxy('/api/home_suivi_elec/set_sensor_quarantine', {
      method: 'POST',
      body: JSON.stringify({ entity_id: entityId, quarantine })
    });
    
    if (result.success) {
      toast.success(`${quarantine ? '🟡 Mis en' : '🟢 Retiré de'} quarantaine: ${entityId}`);
      // Recharger pour mettre à jour l'affichage
      const container = document.querySelector('.capteurs-sensor-interface').parentElement;
      await loadCapteursSensor(container);
    } else {
      throw new Error(result.error || 'Échec de l\'opération');
    }
  } catch (error) {
    toast.error(`Erreur quarantaine: ${error.message}`);
  }
};

function updateStatsDisplay(stats) {
  const badges = {
    'total': stats.total,
    'ok': stats.ok,
    'ko': stats.ko,
    'absent': stats.absent,
    'quarantine': stats.quarantine
  };
  
  Object.entries(badges).forEach(([type, count]) => {
    const badge = document.querySelector(`.stat-badge.${type}`);
    if (badge) {
      const text = badge.textContent.replace(/\d+/, count);
      badge.textContent = text;
    }
  });
}

/**
 * Fallback vers API basique si get_sensors indisponible
 */
async function loadFallbackBasicView(container) {
  try {
    toast.info('🔄 Chargement via API basique...');
    
    // Utiliser l'API existante get_sensors
    const basicData = await fetchViaProxy('/api/home_suivi_elec/get_sensors');
    
    if (!basicData?.success) {
      throw new Error('API basique également indisponible');
    }
    
    // Simuler des données de santé basiques
    const simulatedHealthData = {};
    Object.entries(basicData.sensors || {}).forEach(([entityId, sensor]) => {
      simulatedHealthData[entityId] = {
        ...sensor,
        last_seen: new Date().toISOString(), // Supposer récent
        quarantine: false,
        state: sensor.value !== null && sensor.value !== undefined ? 'on' : 'unavailable'
      };
    });
    
    cachedSensorsData = simulatedHealthData;
    const { groups, stats } = processAndGroupSensors(simulatedHealthData);
    
    container.innerHTML = renderCapteursSensorInterface(groups, stats) + 
      '<div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 0.9em;">⚠️ <strong>Mode basique:</strong> Données simulées à partir de l\'API standard. Certaines fonctionnalités peuvent être limitées.</div>';
    
    initCapteursSensorInteractions(groups);
    
    toast.success('Interface basique chargée');
    
  } catch (error) {
    container.innerHTML = `
      <div class="error-display">
        <h4>❌ Aucune API disponible</h4>
        <p>Ni l'API avancée ni l'API basique ne répondent.</p>
        <p>Erreur: ${error.message}</p>
      </div>
    `;
  }
}

console.info("[capteursSensor] ✅ Module capteurs groupés prêt");
