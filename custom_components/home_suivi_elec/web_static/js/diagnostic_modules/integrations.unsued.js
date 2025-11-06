"use strict";

// Module pour l'onglet "Intégrations Home Assistant" des diagnostics
import { fetchViaProxy } from "../shared/proxy.js";
import { toast } from "../shared/uiToast.js";

console.info("[integrations] Module intégrations HA chargé");

// Configuration des seuils de santé
const HEALTH_CONFIG = {
  KO_THRESHOLD_CRITICAL: 0.30,  // >30% KO = Défaillante
  KO_THRESHOLD_WARNING: 0.10,   // 10-30% KO = Attention
  UPDATE_THRESHOLD_CRITICAL: 60, // >1h sans MAJ = Défaillante
  UPDATE_THRESHOLD_WARNING: 30,  // 30min-1h = Attention
  AUTO_REFRESH_INTERVAL: null    // null = pas d'auto-refresh
};

// Cache et filtres
let cachedIntegrationsData = null;
let currentFilters = {
  search: '',
  state: 'all', // all, ok, warning, critical
  domain: 'all'
};

/**
 * Point d'entrée principal pour l'onglet intégrations
 */
export async function loadIntegrations(container) {
  try {
    console.log("[integrations] Début chargement interface intégrations HA");
    
    container.innerHTML = '<div class="loading-spinner">🔄 Chargement des intégrations...</div>';
    
    // Récupérer les données des intégrations
    const integrationsData = await fetchViaProxy('/api/home_suivi_elec/get_integrations_status');
    console.log('[DEBUG] Réponse integrationsData:', integrationsData);

    if (integrationsData.error) {
        throw new Error(integrationsData.message || 'Données intégrations indisponibles');
    }

    if (!integrationsData.data || !integrationsData.data.integrations) {
        throw new Error('Format de données inattendu - pas d\'intégrations');
    }

    cachedIntegrationsData = integrationsData.data.integrations;
    console.log('[DEBUG] Intégrations chargées:', cachedIntegrationsData.length);
    


    // Traitement et enrichissement des données
    const enrichedIntegrations = processIntegrationsData(cachedIntegrationsData);
    
    // Rendu de l'interface complète
    container.innerHTML = renderIntegrationsInterface(enrichedIntegrations);
    
    // Initialisation des interactions
    initIntegrationsInteractions();
    
    console.log("✅ Interface intégrations HA initialisée avec succès");
    
  } catch (error) {
    console.error('❌ Erreur chargement intégrations:', error);
    
    // Interface d'erreur avec fallback vers scan basique
    container.innerHTML = `
      <div class="error-display">
        <h4>❌ Impossible de charger l'état des intégrations</h4>
        <p>Erreur: ${error.message}</p>
        <div style="margin-top: 15px;">
          <button id="fallback-basic-integrations" class="btn-fallback">🔄 Scanner intégrations basique</button>
          <button onclick="location.reload()" class="btn-fallback">🔄 Recharger la page</button>
        </div>
        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
          <em>Note: L'API get_integrations_status peut ne pas être encore implémentée.<br>
          Cette interface nécessite des données étendues sur l'état des intégrations HA.</em>
        </p>
      </div>
    `;
    
    // Gestionnaire pour le fallback
    const fallbackBtn = container.querySelector('#fallback-basic-integrations');
    if (fallbackBtn) {
      fallbackBtn.addEventListener('click', () => loadFallbackIntegrationsView(container));
    }
  }
}

/**
 * Traitement et enrichissement des données intégrations
 */
function processIntegrationsData(integrations) {
  const now = Date.now();
  
  return integrations.map(integration => {
    const koRate = integration.entities_total > 0 ? 
      (integration.ko || 0) / integration.entities_total : 0;
    
    const lastUpdateMs = integration.last_update ? 
      now - new Date(integration.last_update).getTime() : 
      Infinity;
    
    const minutesSinceUpdate = Math.floor(lastUpdateMs / 60000);
    
    // Calcul de l'état de santé
    let healthState = 'ok';
    let healthReason = 'Fonctionnement normal';
    
    if (integration.entities_total === 0) {
      healthState = 'critical';
      healthReason = 'Aucune entité chargée';
    } else if (koRate > HEALTH_CONFIG.KO_THRESHOLD_CRITICAL) {
      healthState = 'critical';
      healthReason = `Taux d'échec élevé: ${Math.round(koRate * 100)}%`;
    } else if (minutesSinceUpdate > HEALTH_CONFIG.UPDATE_THRESHOLD_CRITICAL) {
      healthState = 'critical';
      healthReason = `Pas de MAJ depuis ${Math.floor(minutesSinceUpdate/60)}h`;
    } else if (koRate > HEALTH_CONFIG.KO_THRESHOLD_WARNING) {
      healthState = 'warning';
      healthReason = `Taux d'échec modéré: ${Math.round(koRate * 100)}%`;
    } else if (minutesSinceUpdate > HEALTH_CONFIG.UPDATE_THRESHOLD_WARNING) {
      healthState = 'warning';
      healthReason = `Dernière MAJ: ${minutesSinceUpdate}min`;
    }
    
    return {
      ...integration,
      koRate,
      minutesSinceUpdate,
      healthState,
      healthReason,
      lastUpdateHuman: formatLastUpdate(integration.last_update)
    };
  }).sort((a, b) => {
    // Tri: critiques d'abord, puis par nom
    if (a.healthState !== b.healthState) {
      const order = { critical: 0, warning: 1, ok: 2 };
      return order[a.healthState] - order[b.healthState];
    }
    return (a.name || a.domain).localeCompare(b.name || b.domain);
  });
}

/**
 * Interface principale de l'onglet intégrations
 */
function renderIntegrationsInterface(integrations) {
  const stats = calculateIntegrationsStats(integrations);
  const domains = [...new Set(integrations.map(i => i.domain))].sort();
  
  return `
    <div class="integrations-interface">
      <!-- Header avec statistiques globales -->
      <div class="integrations-header">
        <div class="header-stats">
          <h3>🔌 État des Intégrations Home Assistant</h3>
          <div class="stats-overview">
            <span class="stat-badge total">📊 Total: ${stats.total}</span>
            <span class="stat-badge ok">✅ OK: ${stats.ok}</span>
            <span class="stat-badge warning">⚠️ Attention: ${stats.warning}</span>
            <span class="stat-badge critical">❌ Défaillantes: ${stats.critical}</span>
          </div>
        </div>
        
        <!-- Contrôles de filtre -->
        <div class="header-controls">
          <div class="filter-row">
            <input type="search" id="integrations-search" placeholder="🔍 Rechercher intégration..." value="${currentFilters.search}">
            
            <select id="integrations-state-filter">
              <option value="all" ${currentFilters.state === 'all' ? 'selected' : ''}>Tous états</option>
              <option value="ok" ${currentFilters.state === 'ok' ? 'selected' : ''}>✅ Seulement OK</option>
              <option value="warning" ${currentFilters.state === 'warning' ? 'selected' : ''}>⚠️ Attention</option>
              <option value="critical" ${currentFilters.state === 'critical' ? 'selected' : ''}>❌ Défaillantes</option>
            </select>
            
            <select id="integrations-domain-filter">
              <option value="all" ${currentFilters.domain === 'all' ? 'selected' : ''}>Tous domaines</option>
              ${domains.map(domain => 
                `<option value="${domain}" ${currentFilters.domain === domain ? 'selected' : ''}>${domain}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>
      
      <!-- Liste des intégrations -->
      <div class="integrations-list" id="integrations-list-container">
        ${integrations.length > 0 ? renderIntegrationsList(integrations) : '<p class="no-results">Aucune intégration trouvée avec les filtres actuels.</p>'}
      </div>
    </div>
    
    <style>
    .integrations-interface {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .integrations-header {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
      padding: 20px;
    }
    
    .integrations-header h3 {
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
    
    .stat-badge.warning {
      background: #fff3cd;
      color: #856404;
      border-color: #ffeaa7;
    }
    
    .stat-badge.critical {
      background: #f8d7da;
      color: #721c24;
      border-color: #f5c6cb;
    }
    
    .filter-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .filter-row input,
    .filter-row select {
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
    
    .integrations-list {
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .integration-card {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    
    .integration-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .integration-card.critical {
      border-color: #dc3545;
      box-shadow: 0 0 0 1px rgba(220,53,69,0.2);
    }
    
    .integration-card.warning {
      border-color: #ffc107;
      box-shadow: 0 0 0 1px rgba(255,193,7,0.2);
    }
    
    .integration-header {
      background: #f8f9fa;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .integration-card.critical .integration-header {
      background: rgba(220,53,69,0.05);
    }
    
    .integration-card.warning .integration-header {
      background: rgba(255,193,7,0.05);
    }
    
    .integration-info {
      flex: 1;
    }
    
    .integration-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .integration-domain {
      font-size: 0.85em;
      color: #6c757d;
      font-family: monospace;
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    .integration-details {
      font-size: 0.9em;
      color: #6c757d;
      margin-top: 4px;
    }
    
    .integration-metrics {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .entities-progress {
      min-width: 120px;
    }
    
    .entities-progress-label {
      font-size: 0.8em;
      color: #495057;
      margin-bottom: 2px;
    }
    
    .progress-bar {
      width: 100%;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #28a745;
      transition: width 0.3s ease;
    }
    
    .progress-fill.warning {
      background: #ffc107;
    }
    
    .progress-fill.critical {
      background: #dc3545;
    }
    
    .health-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
      text-align: center;
      min-width: 70px;
    }
    
    .health-badge.ok {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .health-badge.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }
    
    .health-badge.critical {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .integration-actions {
      display: flex;
      gap: 6px;
    }
    
    .action-btn {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8em;
      transition: all 0.2s;
      color: #495057;
    }
    
    .action-btn:hover {
      background: #e9ecef;
      border-color: #0078d4;
      color: #0078d4;
    }
    
    .action-btn.primary {
      background: #0078d4;
      color: white;
      border-color: #0078d4;
    }
    
    .action-btn.primary:hover {
      background: #106ebe;
    }
    
    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .last-update {
      font-size: 0.8em;
      color: #6c757d;
      font-style: italic;
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
 * Rendu de la liste des intégrations
 */
function renderIntegrationsList(integrations) {
  return integrations.map(integration => {
    const okRate = integration.entities_total > 0 ? 
      (integration.ok || 0) / integration.entities_total * 100 : 0;
    
    const healthIcons = {
      ok: '✅',
      warning: '⚠️',
      critical: '❌'
    };
    
    const healthLabels = {
      ok: 'OK',
      warning: 'Attention',
      critical: 'Défaillante'
    };
    
    return `
      <div class="integration-card ${integration.healthState}" data-integration="${integration.domain}">
        <div class="integration-header">
          <div class="integration-info">
            <div class="integration-name">
              ${healthIcons[integration.healthState]}
              ${integration.name || integration.domain}
              <span class="integration-domain">${integration.domain}</span>
            </div>
            <div class="integration-details">
              ${integration.entities_total || 0} entités • ${integration.ok || 0} OK • ${integration.ko || 0} KO
              ${integration.lastUpdateHuman ? ` • MAJ: ${integration.lastUpdateHuman}` : ''}
            </div>
          </div>
          
          <div class="integration-metrics">
            <div class="entities-progress">
              <div class="entities-progress-label">
                Santé: ${Math.round(okRate)}% OK
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${integration.healthState}" style="width: ${okRate}%"></div>
              </div>
            </div>
            
            <div class="health-badge ${integration.healthState}" title="${integration.healthReason}">
              ${healthLabels[integration.healthState]}
            </div>
            
            <div class="integration-actions">
              <button class="action-btn" onclick="pingIntegration('${integration.domain}')" title="Tester connectivité">
                🏓 Ping
              </button>
              <button class="action-btn" onclick="reloadIntegration('${integration.domain}')" title="Recharger configuration">
                🔄 Recharge
              </button>
              ${integration.healthState === 'critical' ? 
                `<button class="action-btn primary" onclick="restartIntegration('${integration.domain}')" title="Redémarrer intégration">
                  🔁 Redémarrer
                </button>` : ''
              }
            </div>
          </div>
        </div>
        
        ${integration.last_error ? `
          <div class="integration-error">
            <strong>Dernière erreur:</strong> ${integration.last_error}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Initialisation des interactions utilisateur
 */
function initIntegrationsInteractions() {
  // Gestion de la recherche en temps réel
  const searchInput = document.getElementById('integrations-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value;
      applyIntegrationsFiltersAndRerender();
    });
  }
  
  // Gestion des filtres d'état et de domaine
  ['integrations-state-filter', 'integrations-domain-filter'].forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.addEventListener('change', (e) => {
        if (id === 'integrations-state-filter') currentFilters.state = e.target.value;
        if (id === 'integrations-domain-filter') currentFilters.domain = e.target.value;
        applyIntegrationsFiltersAndRerender();
      });
    }
  });
}

/**
 * Applique les filtres et re-render les intégrations
 */
function applyIntegrationsFiltersAndRerender() {
  if (!cachedIntegrationsData) return;
  
  // Filtrage côté client
  const filtered = cachedIntegrationsData.filter(integration => {
    // Filtre recherche
    if (currentFilters.search) {
      const search = currentFilters.search.toLowerCase();
      const matches = (integration.name || '').toLowerCase().includes(search) ||
                      integration.domain.toLowerCase().includes(search);
      if (!matches) return false;
    }
    
    // Filtre par état de santé
    if (currentFilters.state !== 'all') {
      const enriched = processIntegrationsData([integration])[0];
      if (enriched.healthState !== currentFilters.state) return false;
    }
    
    // Filtre par domaine
    if (currentFilters.domain !== 'all' && integration.domain !== currentFilters.domain) {
      return false;
    }
    
    return true;
  });
  
  // Re-enrichissement et rendu
  const enrichedFiltered = processIntegrationsData(filtered);
  
  const container = document.getElementById('integrations-list-container');
  if (container) {
    container.innerHTML = enrichedFiltered.length > 0 ? 
      renderIntegrationsList(enrichedFiltered) : 
      '<p class="no-results">Aucune intégration trouvée avec les filtres actuels.</p>';
  }
  
  // Mise à jour des statistiques
  const stats = calculateIntegrationsStats(enrichedFiltered);
  updateIntegrationsStatsDisplay(stats);
}

/**
 * Fonctions utilitaires
 */
function calculateIntegrationsStats(integrations) {
  return integrations.reduce((acc, integration) => {
    acc.total++;
    acc[integration.healthState] = (acc[integration.healthState] || 0) + 1;
    return acc;
  }, { total: 0, ok: 0, warning: 0, critical: 0 });
}

function formatLastUpdate(lastUpdate) {
  if (!lastUpdate) return 'Jamais';
  
  const now = new Date();
  const update = new Date(lastUpdate);
  const diffMs = now - update;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `${diffMins}min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}j`;
}

function updateIntegrationsStatsDisplay(stats) {
  const badges = {
    'total': stats.total,
    'ok': stats.ok,
    'warning': stats.warning,
    'critical': stats.critical
  };
  
  Object.entries(badges).forEach(([type, count]) => {
    const badge = document.querySelector(`.integrations-interface .stat-badge.${type}`);
    if (badge) {
      const text = badge.textContent.replace(/\d+/, count);
      badge.textContent = text;
    }
  });
}

// Actions sur intégrations (fonctions globales)
window.pingIntegration = async function(domain) {
  try {
    toast.info(`🏓 Test connectivité ${domain}...`);
    
    const result = await fetchViaProxy(`/api/home_suivi_elec/ping_integration`, {
      method: 'POST',
      body: JSON.stringify({ domain })
    });
    
    if (result.success) {
      toast.success(`✅ ${domain}: ${result.message || 'Ping réussi'}`);
    } else {
      toast.error(`❌ ${domain}: ${result.error || 'Ping échoué'}`);
    }
  } catch (error) {
    toast.error(`Erreur ping ${domain}: ${error.message}`);
  }
};

window.reloadIntegration = async function(domain) {
  try {
    toast.info(`🔄 Rechargement ${domain}...`);
    
    const result = await fetchViaProxy(`/api/home_suivi_elec/reload_integration`, {
      method: 'POST',
      body: JSON.stringify({ domain })
    });
    
    if (result.success) {
      toast.success(`✅ ${domain} rechargé avec succès`);
      // Recharger l'affichage après 2 secondes
      setTimeout(() => {
        const container = document.querySelector('.integrations-interface').parentElement;
        loadIntegrations(container);
      }, 2000);
    } else {
      toast.error(`❌ Échec rechargement ${domain}: ${result.error}`);
    }
  } catch (error) {
    toast.error(`Erreur rechargement ${domain}: ${error.message}`);
  }
};

window.restartIntegration = async function(domain) {
  if (!confirm(`⚠️ Confirmer le redémarrage de l'intégration '${domain}' ?\n\nCeci peut temporairement perturber les capteurs de cette intégration.`)) {
    return;
  }
  
  try {
    toast.info(`🔁 Redémarrage ${domain}...`);
    
    const result = await fetchViaProxy(`/api/home_suivi_elec/restart_integration`, {
      method: 'POST',
      body: JSON.stringify({ domain })
    });
    
    if (result.success) {
      toast.success(`✅ ${domain} redémarré avec succès`);
      // Recharger après 5 secondes (temps de redémarrage)
      setTimeout(() => {
        const container = document.querySelector('.integrations-interface').parentElement;
        loadIntegrations(container);
      }, 5000);
    } else {
      toast.error(`❌ Échec redémarrage ${domain}: ${result.error}`);
    }
  } catch (error) {
    toast.error(`Erreur redémarrage ${domain}: ${error.message}`);
  }
};

/**
 * Fallback vers scan basique des intégrations
 */
async function loadFallbackIntegrationsView(container) {
  try {
    toast.info('🔄 Scan basique des intégrations...');
    
    // Utiliser les données de capteurs pour déduire les intégrations
    const sensorsData = await fetchViaProxy('/api/home_suivi_elec/get_sensors');
    
    if (!sensorsData?.success) {
      throw new Error('Aucune API disponible pour les données');
    }
    
    // Analyser les intégrations à partir des capteurs
    const integrationsFromSensors = analyzeIntegrationsFromSensors(sensorsData.sensors || {});
    
    container.innerHTML = renderBasicIntegrationsView(integrationsFromSensors) + 
      '<div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 0.9em;">⚠️ <strong>Mode basique:</strong> Intégrations déduites à partir des capteurs. Fonctionnalités limitées.</div>';
    
    toast.success('Vue basique chargée');
    
  } catch (error) {
    container.innerHTML = `
      <div class="error-display">
        <h4>❌ Aucune donnée disponible</h4>
        <p>Impossible de charger les intégrations par aucune méthode.</p>
        <p>Erreur: ${error.message}</p>
      </div>
    `;
  }
}

function analyzeIntegrationsFromSensors(sensors) {
  const integrationsMap = {};
  
  Object.entries(sensors).forEach(([entityId, sensor]) => {
    const integration = sensor.integration || 'unknown';
    
    if (!integrationsMap[integration]) {
      integrationsMap[integration] = {
        domain: integration,
        name: integration,
        entities_total: 0,
        ok: 0,
        ko: 0,
        last_update: new Date().toISOString() // Supposer récent
      };
    }
    
    integrationsMap[integration].entities_total++;
    
    // Estimation simple de l'état
    if (sensor.value !== null && sensor.value !== undefined) {
      integrationsMap[integration].ok++;
    } else {
      integrationsMap[integration].ko++;
    }
  });
  
  return Object.values(integrationsMap);
}

function renderBasicIntegrationsView(integrations) {
  return `
    <div class="integrations-basic">
      <h3>🔌 Intégrations (Vue Basique)</h3>
      <div class="basic-integrations-list">
        ${integrations.map(integration => `
          <div class="basic-integration-item">
            <strong>${integration.name}</strong>
            <span>(${integration.entities_total} entités: ${integration.ok} OK, ${integration.ko} KO)</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

console.info("[integrations] ✅ Module intégrations HA prêt");
