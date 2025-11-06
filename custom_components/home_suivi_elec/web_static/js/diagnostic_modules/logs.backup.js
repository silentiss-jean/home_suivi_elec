"use strict";

// Module pour l'onglet "Logs Système" des diagnostics
import { fetchViaProxy } from "../shared/proxy.js";
import { toast } from "../shared/uiToast.js";

console.info("[logs] Module logs système chargé");

// Configuration des logs
const LOGS_CONFIG = {
  DEFAULT_LIMIT: 100,
  PAGE_SIZES: [25, 50, 100, 200],
  AUTO_REFRESH_INTERVALS: {
    'off': null,
    '30s': 30000,
    '1min': 60000,
    '5min': 300000
  },
  ERROR_PATTERN_THRESHOLD: 3, // >3 fois = pattern suspect
  ERROR_RATE_THRESHOLD: 10    // >10 erreurs/min = pic
};

// Cache et filtres
let cachedLogsData = null;
let currentFilters = {
  search: '',
  level: 'all',
  module: 'all',
  period: 'all'
};
let autoRefreshTimer = null;

/**
 * Point d'entrée principal pour l'onglet logs
 */
export async function loadSystemLogs(container) {
  try {
    console.log("[logs] Début chargement logs système");
    
    const logsData = await fetchViaProxy('/api/home_suivi_elec/get_logs?limit=100');
    
    if (!logsData?.success) {
      throw new Error(logsData?.error || 'Logs indisponibles');
    }
    
    cachedLogsData = logsData.logs || [];
    const errorPatterns = analyzeErrorPatterns(cachedLogsData);
    
    container.innerHTML = renderLogsInterface(cachedLogsData, errorPatterns);
    initLogsInteractions();
    
  } catch (error) {
    container.innerHTML = `
      <div class="error-display">
        <h4>❌ Logs système indisponibles</h4>
        <p>${error.message}</p>
        <button class="btn-fallback" onclick="loadConsoleFallback(this.parentElement.parentElement)">Console navigateur</button>
      </div>
    `;
  }
}

function renderLogsInterface(logs, errorPatterns) {
  const stats = { error: 0, warning: 0, info: 0 };
  logs.forEach(log => stats[log.level?.toLowerCase()] = (stats[log.level?.toLowerCase()] || 0) + 1);
  
  return `
    <div class="logs-interface">
      <div class="logs-header">
        <h3>📋 Logs Système</h3>
        <div class="stats-mini">
          <span class="stat-mini error">ERROR: ${stats.error}</span>
          <span class="stat-mini warning">WARN: ${stats.warning}</span>
          <span class="stat-mini info">INFO: ${stats.info}</span>
        </div>
      </div>
      
      <div class="logs-filters">
        <input type="search" id="logs-search" placeholder="Rechercher...">
        <select id="logs-level-filter">
          <option value="all">Tous niveaux</option>
          <option value="ERROR">ERROR</option>
          <option value="WARNING">WARNING</option>
          <option value="INFO">INFO</option>
        </select>
        <button id="export-csv" class="export-btn">📄 CSV</button>
      </div>
      
      ${errorPatterns.length > 0 ? `<div class="error-patterns">⚠️ ${errorPatterns.length} pattern(s) d'erreur</div>` : ''}
      
      <div class="logs-timeline">
        ${logs.map(log => `
          <div class="log-entry">
            <span class="log-level ${log.level}">${log.level}</span>
            <span class="log-message">${log.message || ''}</span>
            <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <style>
    .logs-interface .logs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
    .logs-filters {
      display: flex;
      gap: 10px;
      padding: 15px 20px;
      background: #f8f9fa;
    }
    .logs-timeline {
      padding: 10px 20px;
      max-height: 400px;
      overflow-y: auto;
    }
    .log-entry {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .log-level {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.75em;
      font-weight: bold;
      min-width: 60px;
      text-align: center;
    }
    .log-level.ERROR { background: #f8d7da; color: #721c24; }
    .log-level.WARNING { background: #fff3cd; color: #856404; }
    .log-level.INFO { background: #d1ecf1; color: #0c5460; }
    .log-message { flex: 1; font-size: 0.85em; }
    .log-time { font-size: 0.75em; color: #666; font-family: monospace; }
    .export-btn {
      background: #17a2b8;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    </style>
  `;
}

function analyzeErrorPatterns(logs) {
  // Analyse simple des patterns
  const errorMessages = {};
  logs.filter(log => log.level === 'ERROR').forEach(log => {
    const key = log.message?.substring(0, 50) || 'Unknown';
    errorMessages[key] = (errorMessages[key] || 0) + 1;
  });
  
  return Object.entries(errorMessages)
    .filter(([, count]) => count >= 3)
    .map(([message, count]) => ({ message, count }));
}

function initLogsInteractions() {
  const exportBtn = document.getElementById('export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const csv = 'timestamp,level,message\n' + 
        cachedLogsData.map(log => 
          `${log.timestamp},${log.level},"${log.message?.replace(/"/g, '""') || ''}"`
        ).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('✅ Export CSV téléchargé');
    });
  }
}

window.loadConsoleFallback = function(container) {
  container.innerHTML = `
    <div class="console-fallback">
      <h3>📋 Console Navigateur</h3>
      <p>Ouvrez F12 → Console pour voir les logs en temps réel.</p>
    </div>
  `;
};

console.info("[logs] ✅ Module logs prêt");
