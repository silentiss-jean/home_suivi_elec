/**
 * diagnostics-sensors-grouped.js
 * 📊 Module diagnostic enrichi - Capteurs groupés avec états et compteurs
 * Phase 1: Consolidation vue groupée + états calculés côté front
 */

"use strict";

// 🗺️ CONFIGURATION ÉTATS CAPTEURS
const STATUS_CONFIG = {
  thresholds: {
    ko_timeout: 300000,      // 5 minutes unavailable = KO
    absent_timeout: 3600000  // 1h sans update = absent
  },
  colors: {
    ok: '#28a745',
    ko: '#dc3545', 
    absent: '#ffc107',
    quarantine: '#17a2b8',
    removed: '#6c757d'
  },
  icons: {
    ok: '✅',
    ko: '❌',
    absent: '⚠️',
    quarantine: '⏸️',
    removed: '🗑️'
  }
};

// 📁 GESTION PERSISTANCE PLIAGE (utilise configuration.state.js pattern)
const FOLD_KEY = 'hse_diag_sensors_fold_v1';

function getFoldState(groupId) {
  try {
    const stored = localStorage.getItem(FOLD_KEY);
    const folds = stored ? JSON.parse(stored) : {};
    return folds[groupId] !== false; // Déplié par défaut
  } catch (e) {
    console.warn('Erreur lecture pliage:', e);
    return true;
  }
}

function setFoldState(groupId, isExpanded) {
  try {
    const stored = localStorage.getItem(FOLD_KEY);
    const folds = stored ? JSON.parse(stored) : {};
    folds[groupId] = isExpanded;
    localStorage.setItem(FOLD_KEY, JSON.stringify(folds));
  } catch (e) {
    console.warn('Erreur sauvegarde pliage:', e);
  }
}

// 🧮 LOGIQUE MÉTIER - CALCUL ÉTATS CAPTEURS
function calculateSensorStatus(sensor) {
  const now = Date.now();
  const lastChanged = sensor.last_changed ? new Date(sensor.last_changed).getTime() : 0;
  const lastUpdated = sensor.last_updated ? new Date(sensor.last_updated).getTime() : 0;
  const lastActivity = Math.max(lastChanged, lastUpdated);
  
  // Logique états
  if (sensor.state === 'unavailable' || sensor.state === 'unknown') {
    if (now - lastActivity > STATUS_CONFIG.thresholds.ko_timeout) {
      return 'ko';
    }
  }
  
  if (now - lastActivity > STATUS_CONFIG.thresholds.absent_timeout) {
    return 'absent';
  }
  
  // TODO Phase 2: Gérer SUPPRIMÉ via comparaison avec config
  // TODO Phase 2: Gérer QUARANTAINE via stateModule.uiFold
  
  return 'ok';
}

// 📊 GROUPEMENT AUTOMATIQUE - Logic métier
function groupSensorsByDevice(sensors) {
  const groups = new Map();
  
  sensors.forEach(sensor => {
    // Groupement par device_id ou par préfixe entity_id si pas de device
    let groupKey = sensor.device_id || 'orphan';
    
    if (groupKey === 'orphan') {
      // Fallback: groupement par préfixe entity_id (ex: "sensor.chambre_tv_*")
      const parts = sensor.entity_id.split('.');
      if (parts.length > 1) {
        const nameparts = parts[1].split('_');
        if (nameparts.length > 1) {
          groupKey = `${nameparts[0]}_${nameparts[1]}`; // Ex: "chambre_tv"
        }
      }
    }
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupId: groupKey,
        title: sensor.device_info?.name || sensor.friendly_name?.split(' ')[0] || groupKey,
        integration: sensor.integration || 'unknown',
        statusCounts: { ok: 0, ko: 0, absent: 0, quarantine: 0, removed: 0 },
        sensors: []
      });
    }
    
    const status = calculateSensorStatus(sensor);
    const group = groups.get(groupKey);
    group.statusCounts[status]++;
    group.sensors.push({
      ...sensor,
      status: status,
      display_name: sensor.friendly_name || sensor.entity_id
    });
  });
  
  return Array.from(groups.values());
}

// 🎨 RENDU UI - Génération HTML pour un groupe
function renderSensorGroup(group) {
  const isExpanded = getFoldState(group.groupId);
  const totalSensors = group.sensors.length;
  const okCount = group.statusCounts.ok;
  const koCount = group.statusCounts.ko;
  const absentCount = group.statusCounts.absent;
  
  // Header group avec compteurs
  const headerHtml = `
    <div class="sensor-group-header" onclick="toggleGroup('${group.groupId}')">
      <span class="sensor-group-toggle">${isExpanded ? '▼' : '▶'}</span>
      <strong>${group.title}</strong>
      <span class="sensor-group-integration">(${group.integration})</span>
      <div class="sensor-group-counters" style="margin-left: auto; display: flex; gap: 8px; font-size: 12px;">
        <span style="color: ${STATUS_CONFIG.colors.ok}">✅ ${okCount}</span>
        ${koCount > 0 ? `<span style="color: ${STATUS_CONFIG.colors.ko}">❌ ${koCount}</span>` : ''}
        ${absentCount > 0 ? `<span style="color: ${STATUS_CONFIG.colors.absent}">⚠️ ${absentCount}</span>` : ''}
        <span style="color: #666;">Total: ${totalSensors}</span>
      </div>
    </div>
  `;
  
  // Body avec capteurs (si déplié)
  let bodyHtml = '';
  if (isExpanded) {
    bodyHtml = `
      <div class="sensor-group-body">
        ${group.sensors.map(sensor => `
          <div class="sensor-item" style="padding: 8px 15px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 10px;">
            <span class="sensor-status ${sensor.status}" style="padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; background: ${STATUS_CONFIG.colors[sensor.status]}20; color: ${STATUS_CONFIG.colors[sensor.status]};">
              ${STATUS_CONFIG.icons[sensor.status]} ${sensor.status.toUpperCase()}
            </span>
            <code style="font-size: 11px; color: #666;">${sensor.entity_id}</code>
            <span style="flex: 1;">${sensor.display_name}</span>
            <span style="font-weight: 500; color: #333;">${sensor.state || '-'}</span>
            <span style="font-size: 11px; color: #999;">${sensor.unit_of_measurement || ''}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return `
    <div class="sensor-group ${isExpanded ? '' : 'collapsed'}" data-group-id="${group.groupId}">
      ${headerHtml}
      ${bodyHtml}
    </div>
  `;
}

// 🔄 TOGGLE GROUPE (fonction globale)
window.toggleGroup = function(groupId) {
  const groupEl = document.querySelector(`[data-group-id="${groupId}"]`);
  if (!groupEl) return;
  
  const isExpanded = !groupEl.classList.contains('collapsed');
  const newState = !isExpanded;
  
  // Update UI
  if (newState) {
    groupEl.classList.remove('collapsed');
    // Recharger le body si nécessaire
    const bodyExists = groupEl.querySelector('.sensor-group-body');
    if (!bodyExists) {
      // Recharger le groupe complet
      setTimeout(() => loadDiagnosticSensorsGrouped(), 50);
      return;
    }
  } else {
    groupEl.classList.add('collapsed');
    const body = groupEl.querySelector('.sensor-group-body');
    if (body) body.style.display = 'none';
  }
  
  // Update icon
  const toggle = groupEl.querySelector('.sensor-group-toggle');
  if (toggle) toggle.textContent = newState ? '▼' : '▶';
  
  // Persistance
  setFoldState(groupId, newState);
};

// 🔍 RECHERCHE CLIENT-SIDE
function initSearchFilter() {
  const searchInput = document.getElementById('sensor-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const groups = document.querySelectorAll('.sensor-group');
    
    groups.forEach(group => {
      const sensors = group.querySelectorAll('.sensor-item');
      let visibleSensors = 0;
      
      sensors.forEach(sensor => {
        const entityId = sensor.querySelector('code')?.textContent || '';
        const displayName = sensor.querySelector('span:nth-child(3)')?.textContent || '';
        const isVisible = entityId.toLowerCase().includes(query) || displayName.toLowerCase().includes(query);
        
        sensor.style.display = isVisible || !query ? 'flex' : 'none';
        if (isVisible || !query) visibleSensors++;
      });
      
      // Masquer groupe si aucun capteur visible
      group.style.display = visibleSensors > 0 || !query ? 'block' : 'none';
    });
  });
}

// 📂 EXPAND/COLLAPSE ALL
window.expandAllGroups = function() {
  document.querySelectorAll('.sensor-group').forEach(group => {
    const groupId = group.dataset.groupId;
    if (group.classList.contains('collapsed')) {
      toggleGroup(groupId);
    }
  });
};

window.collapseAllGroups = function() {
  document.querySelectorAll('.sensor-group').forEach(group => {
    const groupId = group.dataset.groupId;
    if (!group.classList.contains('collapsed')) {
      toggleGroup(groupId);
    }
  });
};

// 🚀 FONCTION PRINCIPALE D'EXPORT - Compatible avec app.js
export async function loadDiagnosticSensorsGrouped() {
  if (window.HSE_FLAGS.debug) console.log('📊 Chargement diagnostic capteurs groupés...');
  
  const container = document.getElementById('diag-sensors');
  if (!container) {
    console.warn('⚠️ Container diag-sensors non trouvé');
    return;
  }
  
  try {
    // Chargement données via endpoints existants
    const [sensorsResp, diagResp] = await Promise.all([
      fetch('/api/home_suivi_elec/get_sensors').catch(() => null),
      fetch('/api/home_suivi_elec/get_diagnostics').catch(() => null)
    ]);
    
    const sensors = sensorsResp?.ok ? await sensorsResp.json() : [];
    const diagnostics = diagResp?.ok ? await diagResp.json() : {};
    
    if (window.HSE_FLAGS.debug) {
      console.log(`📊 ${sensors.length} capteurs reçus`);
      console.log('🔧 Diagnostics:', diagnostics);
    }
    
    // Groupement et calcul états
    const groups = groupSensorsByDevice(sensors);
    
    // Calcul statistiques générales
    const totalStats = {
      total: sensors.length,
      ok: 0,
      ko: 0, 
      absent: 0,
      quarantine: 0,
      removed: 0
    };
    
    groups.forEach(group => {
      Object.keys(totalStats).forEach(key => {
        if (key !== 'total') totalStats[key] += group.statusCounts[key] || 0;
      });
    });
    
    // Rendu interface
    container.innerHTML = `
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3>📊 Capteurs HSE Energy - Vue Groupée</h3>
          <div style="display: flex; gap: 8px;">
            <button id="expand-all-btn" class="primary" type="button" onclick="expandAllGroups()">📂 Tout déplier</button>
            <button id="collapse-all-btn" class="primary" type="button" onclick="collapseAllGroups()">📁 Tout replier</button>
            <button id="refresh-sensors-btn" class="primary" type="button" onclick="loadDiagnosticSensorsGrouped()">🔄 Actualiser</button>
          </div>
        </div>
        
        <!-- Recherche -->
        <div style="margin-bottom: 15px;">
          <input 
            type="text" 
            id="sensor-search" 
            placeholder="🔍 Rechercher capteur (nom ou entity_id)..." 
            style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px;"
          >
        </div>
        
        <!-- Statistiques générales -->
        <div class="sensors-stats" style="display: flex; gap: 15px; margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px; flex-wrap: wrap;">
          <span><strong>Total:</strong> <span style="font-weight: 600;">${totalStats.total}</span></span>
          <span style="color: ${STATUS_CONFIG.colors.ok};"><strong>✅ OK:</strong> ${totalStats.ok}</span>
          ${totalStats.ko > 0 ? `<span style="color: ${STATUS_CONFIG.colors.ko};"><strong>❌ KO:</strong> ${totalStats.ko}</span>` : ''}
          ${totalStats.absent > 0 ? `<span style="color: ${STATUS_CONFIG.colors.absent};"><strong>⚠️ Absents:</strong> ${totalStats.absent}</span>` : ''}
          ${totalStats.quarantine > 0 ? `<span style="color: ${STATUS_CONFIG.colors.quarantine};"><strong>⏸️ Quarantaine:</strong> ${totalStats.quarantine}</span>` : ''}
          <span style="margin-left: auto; font-size: 12px; color: #666;">Groupes: ${groups.length}</span>
        </div>
        
        <!-- Groupes de capteurs -->
        <div id="sensors-groups-container">
          ${groups.length > 0 
            ? groups.map(group => renderSensorGroup(group)).join('') 
            : '<div style="text-align: center; padding: 40px; color: #999;">⚠️ Aucun capteur détecté</div>'
          }
        </div>
        
        ${window.HSE_FLAGS.debug ? `
        <details style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
          <summary style="cursor: pointer;">🐛 Debug Info</summary>
          <pre style="font-size: 11px; margin-top: 10px;">${JSON.stringify({groups: groups.length, totalStats}, null, 2)}</pre>
        </details>
        ` : ''}
      </div>
    `;
    
    // Initialiser recherche
    setTimeout(() => initSearchFilter(), 100);
    
    if (window.HSE_FLAGS.debug) {
      console.log('✅ Diagnostic capteurs groupés rendu avec succès');
      console.log('Statistiques:', totalStats);
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic capteurs groupés:', error);
    
    // Fallback sécurisé
    container.innerHTML = `
      <div class="card">
        <h3>📊 Diagnostic Capteurs</h3>
        <div style="text-align: center; padding: 40px; color: #dc3545;">
          ❌ Erreur chargement des capteurs groupés<br>
          <small>Détails: ${error.message}</small><br><br>
          <button class="primary" onclick="loadDiagnosticSensorsGrouped()">🔄 Réessayer</button>
        </div>
      </div>
    `;
  }
}

// 🛠️ UTILITAIRES GLOBAUX (exposition)
window.loadDiagnosticSensorsGrouped = loadDiagnosticSensorsGrouped;

// 🎆 AUTO-INITIALISATION si onglet déjà actif
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const diagSensors = document.getElementById('diag-sensors');
    if (diagSensors && diagSensors.style.display !== 'none') {
      setTimeout(() => loadDiagnosticSensorsGrouped(), 100);
    }
  });
} else {
  // DOM déjà chargé
  const diagSensors = document.getElementById('diag-sensors');
  if (diagSensors && diagSensors.style.display !== 'none') {
    setTimeout(() => loadDiagnosticSensorsGrouped(), 100);
  }
}

if (window.HSE_FLAGS.debug) console.log('✅ Module diagnostics-sensors-grouped.js chargé');
