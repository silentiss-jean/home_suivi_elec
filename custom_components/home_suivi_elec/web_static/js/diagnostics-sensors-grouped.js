/**
 * diagnostics-sensors-grouped.js - Vue enrichie capteurs HSE groupés
 * Affichage organisé des capteurs HSE avec expand/collapse et états visuels
 */

import { proxyFetch } from './proxy.js';

// 📊 CHARGEMENT CAPTEURS GROUPÉS
export async function loadDiagnosticSensorsGrouped() {
  console.log('📊 Démarrage diagnostic capteurs groupés...');
  
  try {
    // Utilise l'API unifiée existante
    const response = await proxyFetch('/api/home_suivi_elec/sensors');
    
    if (!response?.data?.sensors) {
      console.warn('⚠️ API /sensors: pas de données capteurs');
      showErrorMessage('Aucun capteur trouvé');
      return;
    }
    
    const sensors = response.data.sensors;
    console.log(`📊 Capteurs récupérés: ${sensors.length}`);
    
    // Filtrer uniquement les capteurs HSE
    const hseSensors = sensors.filter(s => 
      s.entity_id && 
      (s.entity_id.startsWith('sensor.hse_') || s.entity_id.includes('_hse_'))
    );
    
    console.log(`🎯 HSE sensors filtrés: ${hseSensors.length}`);
    
    // Groupement par appareil/device
    const groupedSensors = groupSensorsByDevice(hseSensors);
    
    // Calcul statistiques
    const stats = calculateSensorStats(hseSensors);
    updateStatsDisplay(stats);
    
    // Affichage groupé
    renderGroupedSensors(groupedSensors);
    
  } catch (error) {
    console.error('❌ Erreur chargement capteurs groupés:', error);
    showErrorMessage(`Erreur chargement: ${error.message}`);
  }
}

// 🗂 GROUPEMENT CAPTEURS PAR APPAREIL
function groupSensorsByDevice(sensors) {
  const groups = {};
  
  sensors.forEach(sensor => {
    // Extraction nom de base device depuis entity_id
    // Ex: sensor.hse_chambre_tv_prise_connectee_today_energy_hourly -> "chambre_tv_prise_connectee"
    let deviceName = extractDeviceFromEntityId(sensor.entity_id);
    
    if (!groups[deviceName]) {
      groups[deviceName] = {
        name: deviceName,
        displayName: formatDeviceName(deviceName),
        sensors: [],
        status: 'unknown',
        zone: extractZoneFromDeviceName(deviceName)
      };
    }
    
    groups[deviceName].sensors.push(sensor);
  });
  
  // Calcul du statut global par groupe
  Object.values(groups).forEach(group => {
    group.status = calculateGroupStatus(group.sensors);
  });
  
  console.log('🗂 Groupes créés:', Object.keys(groups).length);
  return groups;
}

// 🏷️ EXTRACTION NOM DEVICE
function extractDeviceFromEntityId(entityId) {
  // sensor.hse_chambre_tv_prise_connectee_today_energy_hourly
  // -> chambre_tv_prise_connectee
  
  let name = entityId.replace('sensor.hse_', '').replace('sensor.hse_energy_', '');
  
  // Supprime cycle à la fin (_hourly, _daily, etc.)
  const cycles = ['_hourly', '_daily', '_weekly', '_monthly', '_yearly'];
  cycles.forEach(cycle => {
    if (name.endsWith(cycle)) {
      name = name.slice(0, -cycle.length);
    }
  });
  
  // Supprime _today_energy si présent
  if (name.endsWith('_today_energy')) {
    name = name.slice(0, -13);
  }
  
  return name;
}

// 🏷️ FORMATAGE NOM DEVICE
function formatDeviceName(deviceName) {
  return deviceName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// 🏠 EXTRACTION ZONE
function extractZoneFromDeviceName(deviceName) {
  const zones = ['chambre', 'salon', 'cuisine', 'buanderie', 'bureau', 'salle'];
  const firstPart = deviceName.split('_')[0].toLowerCase();
  return zones.includes(firstPart) ? formatDeviceName(firstPart) : 'Autre';
}

// 📈 CALCUL STATUT GROUPE
function calculateGroupStatus(sensors) {
  const states = sensors.map(s => s.sync_status || s.current_state || 'unknown');
  
  if (states.every(s => s === 'active' || s === 'available')) return 'ok';
  if (states.some(s => s === 'unavailable' || s === 'unknown')) return 'ko';
  if (states.some(s => s === 'removed')) return 'removed';
  return 'absent';
}

// 📄 CALCUL STATISTIQUES
function calculateSensorStats(sensors) {
  const total = sensors.length;
  const byStatus = {
    ok: 0,
    ko: 0, 
    absent: 0,
    removed: 0,
    quarantine: 0
  };
  
  sensors.forEach(sensor => {
    const state = sensor.sync_status || sensor.current_state || 'unknown';
    if (state === 'active' || state === 'available') byStatus.ok++;
    else if (state === 'unavailable' || state === 'unknown') byStatus.ko++;
    else if (state === 'removed') byStatus.removed++;
    else byStatus.absent++;
  });
  
  return { total, ...byStatus };
}

// 📁 MISE À JOUR AFFICHAGE STATS
function updateStatsDisplay(stats) {
  const elements = {
    sensorsTotal: stats.total,
    sensorsOK: stats.ok,
    sensorsKO: stats.ko,
    sensorsAbsent: stats.absent
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

// 💁 RENDU CAPTEURS GROUPÉS
function renderGroupedSensors(groupedSensors) {
  const container = document.getElementById('sensorsGroupedContainer');
  if (!container) return;
  
  // Groupé par zone pour affichage hiérarchique
  const byZone = {};
  Object.values(groupedSensors).forEach(group => {
    const zone = group.zone;
    if (!byZone[zone]) byZone[zone] = [];
    byZone[zone].push(group);
  });
  
  let html = '';
  
  Object.entries(byZone).forEach(([zone, groups]) => {
    html += `
      <div class="sensor-group">
        <div class="sensor-group-header" onclick="toggleGroup('zone-${zone}')">
          <span class="sensor-group-toggle">▼</span>
          <strong>🏠 ${zone}</strong>
          <span style="margin-left: auto; font-size: 12px; color: #666;">${groups.length} appareils</span>
        </div>
        <div class="sensor-group-body" id="zone-${zone}">
    `;
    
    groups.forEach(group => {
      const statusClass = group.status;
      const statusIcon = getStatusIcon(group.status);
      
      html += `
        <div class="sensor-group" style="margin: 8px; border: 1px solid #f0f0f0;">
          <div class="sensor-group-header" onclick="toggleGroup('device-${group.name}')">
            <span class="sensor-group-toggle">▼</span>
            <span class="sensor-status ${statusClass}">
              ${statusIcon} ${group.status.toUpperCase()}
            </span>
            <strong>🖥️ ${group.displayName}</strong>
            <span style="margin-left: auto; font-size: 12px; color: #666;">${group.sensors.length} cycles</span>
          </div>
          <div class="sensor-group-body" id="device-${group.name}">
      `;
      
      // Sensors de ce device triés par cycle
      const sortedSensors = group.sensors.sort((a, b) => {
        const cycleOrder = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
        const aIndex = cycleOrder.findIndex(c => a.entity_id.includes(c));
        const bIndex = cycleOrder.findIndex(c => b.entity_id.includes(c));
        return aIndex - bIndex;
      });
      
      sortedSensors.forEach(sensor => {
        const cycle = extractCycleFromEntityId(sensor.entity_id);
        const sensorStatus = sensor.sync_status || 'unknown';
        const sensorStatusClass = mapSensorStatus(sensorStatus);
        const sensorIcon = getStatusIcon(sensorStatusClass);
        const value = sensor.current_state || '-';
        const unit = sensor.unit || 'kWh';
        
        html += `
          <div style="padding: 6px 15px; display: flex; align-items: center; border-bottom: 1px solid #f8f8f8;">
            <span style="width: 20px;">└─</span>
            <span class="sensor-status ${sensorStatusClass}">
              ${sensorIcon} ${cycle}
            </span>
            <span style="flex: 1; margin-left: 10px; font-family: monospace; font-size: 11px;">
              ${sensor.entity_id}
            </span>
            <span style="font-weight: bold; color: #0078d4;">
              ${value} ${unit}
            </span>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 🔄 HELPERS
function extractCycleFromEntityId(entityId) {
  const cycles = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
  const found = cycles.find(cycle => entityId.includes(cycle));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'Unknown';
}

function mapSensorStatus(status) {
  switch(status) {
    case 'active': case 'available': return 'ok';
    case 'unavailable': case 'unknown': return 'ko';
    case 'removed': return 'removed';
    default: return 'absent';
  }
}

function getStatusIcon(status) {
  switch(status) {
    case 'ok': return '✅';
    case 'ko': return '❌';
    case 'absent': return '⚠️';
    case 'removed': return '🗑️';
    case 'quarantine': return '⏸️';
    default: return '❓';
  }
}

// 🔄 TOGGLE GROUPES
window.toggleGroup = function(groupId) {
  const group = document.getElementById(groupId);
  const header = group?.previousElementSibling;
  if (group && header) {
    const isCollapsed = group.parentElement.classList.contains('collapsed');
    if (isCollapsed) {
      group.parentElement.classList.remove('collapsed');
    } else {
      group.parentElement.classList.add('collapsed');
    }
  }
};

// 📂 EXPAND/COLLAPSE ALL
window.expandAllGroups = function() {
  document.querySelectorAll('.sensor-group').forEach(group => {
    group.classList.remove('collapsed');
  });
};

window.collapseAllGroups = function() {
  document.querySelectorAll('.sensor-group').forEach(group => {
    group.classList.add('collapsed');
  });
};

// 🔍 RECHERCHE CAPTEURS
window.filterSensors = function() {
  const searchTerm = document.getElementById('searchSensors')?.value.toLowerCase() || '';
  
  document.querySelectorAll('.sensor-group').forEach(group => {
    const groupName = group.querySelector('.sensor-group-header strong')?.textContent.toLowerCase() || '';
    const hasMatch = groupName.includes(searchTerm) || searchTerm === '';
    group.style.display = hasMatch ? 'block' : 'none';
  });
};

// 🚨 AFFICHAGE ERREUR
function showErrorMessage(message) {
  const container = document.getElementById('sensorsGroupedContainer');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        ❌ ${message}
      </div>
    `;
  }
}

// ✅ INITIALISATION EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  // Boutons expand/collapse
  const expandBtn = document.getElementById('expandAll');
  const collapseBtn = document.getElementById('collapseAll');
  const refreshBtn = document.getElementById('refreshSensors');
  const searchInput = document.getElementById('searchSensors');
  
  if (expandBtn) expandBtn.addEventListener('click', window.expandAllGroups);
  if (collapseBtn) collapseBtn.addEventListener('click', window.collapseAllGroups);
  if (refreshBtn) refreshBtn.addEventListener('click', loadDiagnosticSensorsGrouped);
  if (searchInput) searchInput.addEventListener('input', window.filterSensors);
  
  console.log('📊 Module diagnostics-sensors-grouped.js initialisé');
});

// Expose globalement
window.loadDiagnosticSensorsGrouped = loadDiagnosticSensorsGrouped;

export default {
  loadDiagnosticSensorsGrouped
};