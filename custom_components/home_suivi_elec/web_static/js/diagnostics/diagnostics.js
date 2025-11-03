"use strict";

// Diagnostic enrichi avec 4 sous-onglets spécialisés
import { fetchViaProxy } from "../shared/proxy.js";
import { toast } from "../shared/uiToast.js";
import { loadCapteursSensor } from "./capteursSensor.js";
import { loadIntegrations } from "./integrations.js";
import { loadSystemLogs } from "./logs.js";
import { loadBackendHealth } from "./healthBackend.js";

console.info("[diagnostics] Module diagnostics enrichi chargé - 4 sous-onglets COMPLETS");

// Variables globales pour la gestion des onglets
let activeSubTab = 'capteurs';
let diagnosticsData = {};

// Cache pour les données
const dataCache = {
  sensors: null,
  integrations: null,
  logs: null,
  health: null,
  lastUpdate: null
};

/**
 * Point d'entrée principal - charge l'interface diagnostics
 */
export async function loadDiagnostics() {
  const container = document.getElementById("diagnosticsGlobal") || document.getElementById("diagnostics-container");
  
  if (!container) {
    console.warn("[diagnostics] Conteneur diagnostics non trouvé - retour silencieux");
    return;
  }
  
  try {
    // Créer la structure de base avec les 4 sous-onglets
    container.innerHTML = createDiagnosticsLayout();
    
    // Initialiser les gestionnaires d'événements
    initSubTabHandlers();
    
    // Charger le premier sous-onglet par défaut
    await switchSubTab('capteurs');
    
    console.log("✅ Interface diagnostics enrichie COMPLÈTE initialisée");
    
  } catch (error) {
    console.error("❌ Erreur initialisation diagnostics:", error);
    container.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h3>❌ Erreur de chargement des diagnostics</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()" class="primary">🔄 Recharger</button>
      </div>
    `;
    toast.error("Erreur chargement diagnostics");
  }
}

/**
 * Crée la structure HTML de base pour les diagnostics enrichis
 */
function createDiagnosticsLayout() {
  return `
    <div class="diagnostics-enhanced">
      <!-- En-tête avec refresh et status global -->
      <div class="diagnostics-header">
        <h2>🔧 Diagnostics Avancés</h2>
        <div class="header-controls">
          <span id="last-update" class="update-time">Chargement...</span>
          <button id="refresh-diagnostics" class="btn-refresh">🔄 Actualiser</button>
        </div>
      </div>
      
      <!-- Barre des 4 sous-onglets -->
      <nav class="diag-sub-tabs">
        <button class="diag-tab-btn active" data-tab="capteurs">
          📊 <span class="tab-title">Capteurs</span>
          <span class="tab-counter" id="capteurs-count">—</span>
        </button>
        <button class="diag-tab-btn" data-tab="integrations">
          🔌 <span class="tab-title">Intégrations</span>
          <span class="tab-counter" id="integrations-count">—</span>
        </button>
        <button class="diag-tab-btn" data-tab="logs">
          📋 <span class="tab-title">Logs</span>
          <span class="tab-counter" id="logs-count">—</span>
        </button>
        <button class="diag-tab-btn" data-tab="health">
          💚 <span class="tab-title">Santé</span>
          <span class="tab-counter" id="health-count">—</span>
        </button>
      </nav>
      
      <!-- Conteneurs pour chaque sous-onglet -->
      <div class="diag-content-area">
        <div id="diag-capteurs" class="diag-sub-content active">Chargement capteurs...</div>
        <div id="diag-integrations" class="diag-sub-content">Chargement intégrations...</div>
        <div id="diag-logs" class="diag-sub-content">Chargement logs...</div>
        <div id="diag-health" class="diag-sub-content">Chargement santé backend...</div>
      </div>
    </div>
    
    <style>
    .diagnostics-enhanced {
      background: white;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .diagnostics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e5e5;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px 12px 0 0;
    }
    
    .diagnostics-header h2 {
      margin: 0;
      color: #0078d4;
      font-size: 1.4em;
    }
    
    .header-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .update-time {
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    }
    
    .btn-refresh {
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      transition: background 0.2s;
    }
    
    .btn-refresh:hover { background: #218838; }
    .btn-refresh:disabled { background: #ccc; cursor: not-allowed; }
    
    .diag-sub-tabs {
      display: flex;
      border-bottom: 1px solid #e5e5e5;
      background: #f8f9fa;
      margin: 0;
      padding: 0 20px;
    }
    
    .diag-tab-btn {
      background: none;
      border: none;
      padding: 15px 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      font-size: 0.95em;
      position: relative;
    }
    
    .diag-tab-btn:hover {
      background: rgba(0,120,212,0.05);
      color: #0078d4;
    }
    
    .diag-tab-btn.active {
      color: #0078d4;
      border-bottom-color: #0078d4;
      background: rgba(0,120,212,0.05);
      font-weight: 500;
    }
    
    .tab-counter {
      background: #666;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      min-width: 20px;
      text-align: center;
    }
    
    .diag-tab-btn.active .tab-counter {
      background: #0078d4;
    }
    
    .diag-content-area {
      position: relative;
      min-height: 400px;
    }
    
    .diag-sub-content {
      display: none;
      padding: 0;
      animation: fadeIn 0.3s ease-in;
    }
    
    .diag-sub-content.active {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
    }
    
    .error-display {
      background: #ffe6e6;
      border: 1px solid #ff9999;
      border-radius: 8px;
      padding: 15px;
      margin: 10px;
      color: #cc0000;
    }
    </style>
  `;
}

/**
 * Initialise les gestionnaires d'événements pour les sous-onglets
 */
function initSubTabHandlers() {
  // Gestionnaire pour les boutons des sous-onglets
  document.querySelectorAll('.diag-tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tabName = btn.dataset.tab;
      await switchSubTab(tabName);
    });
  });
  
  // Gestionnaire pour le bouton refresh
  const refreshBtn = document.getElementById('refresh-diagnostics');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '🔄 Mise à jour...';
      
      try {
        await refreshAllData();
        await switchSubTab(activeSubTab); // Recharge l'onglet actif
        toast.success('Diagnostics mis à jour');
      } catch (error) {
        toast.error('Erreur lors de la mise à jour');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Actualiser';
      }
    });
  }
}

/**
 * Bascule vers un sous-onglet spécifique
 */
async function switchSubTab(tabName) {
  try {
    // Mise à jour visuelle des onglets
    document.querySelectorAll('.diag-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.diag-sub-content').forEach(content => {
      content.classList.toggle('active', content.id === `diag-${tabName}`);
    });
    
    activeSubTab = tabName;
    
    // Charger le contenu spécifique selon l'onglet
    const container = document.getElementById(`diag-${tabName}`);
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner">🔄 Chargement...</div>';
    
    // 🎯 TOUS LES SOUS-ONGLETS IMPLÉMENTÉS
    switch (tabName) {
      case 'capteurs':
        await loadCapteursSensor(container);  // ✅ Lot A - Capteurs groupés
        break;
      case 'integrations':
        await loadIntegrations(container);    // ✅ Lot B - Intégrations HA
        break;
      case 'logs':
        await loadSystemLogs(container);      // ✅ Lot C - Logs système
        break;
      case 'health':
        await loadBackendHealth(container);   // ✅ Lot D - Santé backend
        break;
    }
    
    updateLastRefreshTime();
    
  } catch (error) {
    console.error(`❌ Erreur chargement onglet ${tabName}:`, error);
    const container = document.getElementById(`diag-${tabName}`);
    if (container) {
      container.innerHTML = `
        <div class="error-display">
          <h4>❌ Erreur de chargement</h4>
          <p>${error.message}</p>
          <button onclick="window.location.reload()" class="btn-refresh">Recharger</button>
        </div>
      `;
    }
  }
}

/**
 * Fonctions utilitaires
 */
function updateTabCounter(tabName, count) {
  const counter = document.getElementById(`${tabName}-count`);
  if (counter) {
    counter.textContent = count;
    counter.style.background = count === '!' ? '#dc3545' : '#28a745';
  }
}

function updateLastRefreshTime() {
  const timeElement = document.getElementById('last-update');
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = `Mis à jour: ${now.toLocaleTimeString()}`;
  }
}

async function refreshAllData() {
  // Vider le cache
  dataCache.sensors = null;
  dataCache.integrations = null;
  dataCache.logs = null;
  dataCache.health = null;
  dataCache.lastUpdate = null;
}

// Export pour usage global
window.loadDiagnostics = loadDiagnostics;

console.info("[diagnostics] 🎆 Module diagnostics COMPLET avec les 4 sous-onglets avancés!");
