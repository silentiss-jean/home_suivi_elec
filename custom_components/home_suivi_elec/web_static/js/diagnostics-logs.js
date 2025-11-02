/**
 * diagnostics-logs.js - Viewer logs backend HSE temps réel
 * Affichage et filtrage des logs backend pour surveillance et debug
 */

import { proxyFetch } from './proxy.js';

// 📜 CHARGEMENT LOGS BACKEND
export async function loadDiagnosticLogs() {
  console.log('📜 Démarrage viewer logs backend...');
  
  try {
    // Pour l'instant, simulation en attendant API /logs backend
    // L'API sera ajoutée plus tard selon vos besoins
    
    const mockLogs = generateMockLogs();
    renderLogs(mockLogs);
    
    console.log('📜 Logs affichés (mode simulation)');
    
    // TODO: Quand l'API backend /logs sera prête:
    // const response = await proxyFetch('/api/home_suivi_elec/logs?level=all&limit=100');
    // renderLogs(response.data.logs);
    
  } catch (error) {
    console.error('❌ Erreur chargement logs:', error);
    showLogsError(`Erreur chargement logs: ${error.message}`);
  }
}

// 🎭 GÉNÉRATION LOGS SIMULATION
function generateMockLogs() {
  const now = new Date();
  const logs = [];
  
  // Simule 20 logs récents
  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - (i * 30000)); // Toutes les 30s
    const logTypes = [
      { level: 'info', icon: 'ℹ️', message: 'Energy tracking: 45 sensors OK', module: 'energy_tracking' },
      { level: 'info', icon: '🔄', message: 'API health check: operational', module: 'api' },
      { level: 'warning', icon: '⚠️', message: 'Tapo integration: 2 timeout detected', module: 'detect_local' },
      { level: 'info', icon: '📊', message: 'Sensor sync: 45 sensors synchronized', module: 'sensor_sync' },
      { level: 'debug', icon: '🔧', message: 'Auto-detection completed: 0 new sensors', module: 'detect_local' },
      { level: 'error', icon: '❌', message: 'Sensor unavailable: salon_prise_tv', module: 'power_monitoring' }
    ];
    
    const randomLog = logTypes[Math.floor(Math.random() * logTypes.length)];
    
    logs.push({
      timestamp: timestamp.toISOString(),
      level: randomLog.level,
      icon: randomLog.icon,
      message: randomLog.message,
      module: randomLog.module
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// 💁 RENDU LOGS
function renderLogs(logs) {
  const container = document.getElementById('logsContainer');
  if (!container) return;
  
  if (!logs || logs.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #888; padding: 20px;">
        📜 Aucun log disponible
      </div>
    `;
    return;
  }
  
  let html = '';
  
  logs.forEach(log => {
    const timeFormatted = formatLogTime(log.timestamp);
    const levelClass = getLogLevelClass(log.level);
    const levelColor = getLogLevelColor(log.level);
    
    html += `
      <div class="log-entry" data-level="${log.level}" data-module="${log.module}" style="
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 6px 0;
        border-bottom: 1px solid #333;
        font-size: 13px;
        line-height: 1.4;
      ">
        <span style="color: #888; font-size: 11px; width: 60px; flex-shrink: 0;">
          ${timeFormatted}
        </span>
        <span style="color: ${levelColor}; width: 20px; text-align: center; flex-shrink: 0;">
          ${log.icon}
        </span>
        <span style="color: #ccc; font-size: 11px; width: 100px; flex-shrink: 0;">
          [${log.module}]
        </span>
        <span style="color: #f0f0f0; flex: 1;">
          ${log.message}
        </span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// 🕰️ FORMATAGE TEMPS
function formatLogTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
}

// 🎨 COULEURS NIVEAUX LOG
function getLogLevelClass(level) {
  return `log-${level}`;
}

function getLogLevelColor(level) {
  switch(level) {
    case 'error': return '#ff6b6b';
    case 'warning': return '#ffd43b';
    case 'info': return '#74c0fc';
    case 'debug': return '#95f0d0';
    default: return '#f0f0f0';
  }
}

// 🔍 FILTRAGE LOGS
window.filterLogs = function() {
  const levelFilter = document.getElementById('logLevel')?.value || 'all';
  const searchTerm = document.getElementById('logSearch')?.value.toLowerCase() || '';
  
  document.querySelectorAll('.log-entry').forEach(entry => {
    const entryLevel = entry.getAttribute('data-level');
    const entryText = entry.textContent.toLowerCase();
    
    const levelMatch = (levelFilter === 'all') || (entryLevel === levelFilter);
    const searchMatch = searchTerm === '' || entryText.includes(searchTerm);
    
    entry.style.display = (levelMatch && searchMatch) ? 'flex' : 'none';
  });
};

// 📊 EXPORT LOGS
window.exportLogs = function() {
  const logs = Array.from(document.querySelectorAll('.log-entry:not([style*="display: none"])'));
  
  let csvContent = "Timestamp,Level,Module,Message\n";
  
  logs.forEach(logEntry => {
    const cells = logEntry.querySelectorAll('span');
    if (cells.length >= 4) {
      const timestamp = cells[0].textContent.trim();
      const level = logEntry.getAttribute('data-level');
      const module = cells[2].textContent.replace(/[\[\]]/g, '');
      const message = cells[3].textContent.replace(/"/g, '""'); // Escape CSV
      
      csvContent += `"${timestamp}","${level}","${module}","${message}"\n`;
    }
  });
  
  // Téléchargement CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hse_logs_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  console.log('📊 Export logs CSV terminé');
};

// 🚨 AFFICHAGE ERREUR
function showLogsError(message) {
  const container = document.getElementById('logsContainer');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ff6b6b;">
        ❌ ${message}
      </div>
    `;
  }
}

// ✅ INITIALISATION EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshLogs');
  const exportBtn = document.getElementById('exportLogs');
  const levelSelect = document.getElementById('logLevel');
  const searchInput = document.getElementById('logSearch');
  
  if (refreshBtn) refreshBtn.addEventListener('click', loadDiagnosticLogs);
  if (exportBtn) exportBtn.addEventListener('click', window.exportLogs);
  if (levelSelect) levelSelect.addEventListener('change', window.filterLogs);
  if (searchInput) searchInput.addEventListener('input', window.filterLogs);
  
  console.log('📜 Module diagnostics-logs.js initialisé');
});

// Expose globalement
window.loadDiagnosticLogs = loadDiagnosticLogs;
window.filterLogs = window.filterLogs;
window.exportLogs = window.exportLogs;

export default {
  loadDiagnosticLogs
};