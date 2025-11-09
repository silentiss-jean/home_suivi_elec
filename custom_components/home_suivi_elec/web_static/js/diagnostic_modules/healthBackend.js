"use strict";

// Module pour l'onglet "Santé Backend" des diagnostics
import { fetchViaProxy } from "../shared/proxy.js";
import { toast } from "../shared/uiToast.js";

console.info("[healthBackend] Module santé backend chargé");

// Configuration santé
const HEALTH_CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 secondes
  ERROR_RATE_THRESHOLD: 5, // >5 erreurs/h = alerte
  LATENCY_THRESHOLD: 1000, // >1s = lent
  UPTIME_CRITICAL: 95 // <95% uptime = critique
};

// Cache métriques
let healthMetricsHistory = [];
let autoRefreshTimer = null;

/**
 * Point d'entrée principal pour l'onglet santé
 */
export async function loadBackendHealth(container) {
  try {
    console.log("[healthBackend] Début monitoring santé backend");
    
    const healthData = await fetchViaProxy('/api/home_suivi_elec/get_backend_health');
    
    if (!healthData?.success) {
      throw new Error(healthData?.error || 'Données santé indisponibles');
    }
    
    const health = healthData.health || {};
    
    // Ajouter à l'historique pour tendances
    healthMetricsHistory.push({
      timestamp: new Date(),
      ...health
    });
    
    // Garder seulement les 60 derniers points (30min d'historique)
    if (healthMetricsHistory.length > 60) {
      healthMetricsHistory = healthMetricsHistory.slice(-60);
    }
    
    container.innerHTML = renderHealthInterface(health, healthMetricsHistory);
    initHealthInteractions();
    
    // Auto-refresh automatique
    setupHealthAutoRefresh(container);
    
  } catch (error) {
    container.innerHTML = `
      <div class="error-display">
        <h4>❌ Santé backend indisponible</h4>
        <p>${error.message}</p>
        <button class="btn-fallback" onclick="loadBasicHealthCheck(this.parentElement.parentElement)">Check basique</button>
      </div>
    `;
  }
}

function renderHealthInterface(health, history) {
  const services = health.services || {};
  const globalHealth = calculateGlobalHealth(health, services);
  
  return `
    <div class="health-interface">
      <div class="health-header">
        <h3>💚 Santé du Backend</h3>
        <div class="global-health-badge ${globalHealth.status}">
          ${globalHealth.icon} ${globalHealth.label}
        </div>
      </div>
      
      <!-- Métriques principales -->
      <div class="health-metrics">
        <div class="metric-card">
          <div class="metric-icon">🚀</div>
          <div class="metric-info">
            <h4>Uptime</h4>
            <span class="metric-value">${health.uptime || 'N/A'}</span>
            <div class="metric-trend">${calculateTrend(history, 'uptime')}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-info">
            <h4>Appels API</h4>
            <span class="metric-value">${health.api_calls || 0}/min</span>
            <div class="metric-trend">${calculateTrend(history, 'api_calls')}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⚠️</div>
          <div class="metric-info">
            <h4>Erreurs</h4>
            <span class="metric-value">${health.errors_per_hour || 0}/h</span>
            <div class="metric-trend error">${health.errors_per_hour > HEALTH_CONFIG.ERROR_RATE_THRESHOLD ? '↑ Élevé' : '✓ Normal'}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-info">
            <h4>Latence moy.</h4>
            <span class="metric-value">${health.avg_latency_ms || 0}ms</span>
            <div class="metric-trend">${health.avg_latency_ms > HEALTH_CONFIG.LATENCY_THRESHOLD ? '🐌 Lent' : '⚡ Rapide'}</div>
          </div>
        </div>
      </div>
      
      <!-- État des services -->
      <div class="services-status">
        <h4>🔧 État des Services</h4>
        <div class="services-grid">
          ${Object.entries(services).map(([name, service]) => `
            <div class="service-card ${service.status || 'unknown'}">
              <div class="service-header">
                <span class="service-name">${name}</span>
                <span class="service-status-badge ${service.status}">
                  ${getServiceStatusIcon(service.status)} ${service.status || 'Unknown'}
                </span>
              </div>
              <div class="service-details">
                ${service.latency_ms ? `<div>Latence: ${service.latency_ms}ms</div>` : ''}
                ${service.last_error ? `<div class="service-error">Erreur: ${service.last_error}</div>` : ''}
                ${service.uptime ? `<div>Uptime: ${service.uptime}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Dernière mise à jour -->
      <div class="health-footer">
        <span class="last-refresh">Dernière MAJ: ${new Date().toLocaleTimeString()}</span>
        <span class="auto-refresh-status">Auto-refresh: 30s</span>
      </div>
    </div>
    
    <style>
    .health-interface {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .health-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
    }
    
    .global-health-badge {
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 0.9em;
      font-weight: 500;
    }
    
    .global-health-badge.healthy {
      background: #d4edda;
      color: #155724;
    }
    
    .global-health-badge.warning {
      background: #fff3cd;
      color: #856404;
    }
    
    .global-health-badge.critical {
      background: #f8d7da;
      color: #721c24;
    }
    
    .health-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      padding: 20px;
    }
    
    .metric-card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      transition: transform 0.2s;
    }
    
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .metric-icon {
      font-size: 1.8em;
      margin-bottom: 8px;
    }
    
    .metric-info h4 {
      margin: 0 0 5px 0;
      color: #495057;
      font-size: 0.9em;
    }
    
    .metric-value {
      font-size: 1.6em;
      font-weight: bold;
      color: #28a745;
    }
    
    .metric-trend {
      font-size: 0.8em;
      color: #6c757d;
      margin-top: 4px;
    }
    
    .metric-trend.error {
      color: #dc3545;
    }
    
    .services-status {
      padding: 20px;
      border-top: 1px solid #f0f0f0;
    }
    
    .services-status h4 {
      margin: 0 0 15px 0;
      color: #0078d4;
    }
    
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
    }
    
    .service-card {
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 12px;
      background: white;
    }
    
    .service-card.healthy {
      border-color: #28a745;
      background: rgba(40,167,69,0.02);
    }
    
    .service-card.degraded {
      border-color: #ffc107;
      background: rgba(255,193,7,0.02);
    }
    
    .service-card.down {
      border-color: #dc3545;
      background: rgba(220,53,69,0.02);
    }
    
    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .service-name {
      font-weight: 600;
      color: #212529;
    }
    
    .service-status-badge {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 0.75em;
      font-weight: 500;
    }
    
    .service-status-badge.healthy {
      background: #d4edda;
      color: #155724;
    }
    
    .service-status-badge.degraded {
      background: #fff3cd;
      color: #856404;
    }
    
    .service-status-badge.down {
      background: #f8d7da;
      color: #721c24;
    }
    
    .service-details {
      font-size: 0.85em;
      color: #6c757d;
    }
    
    .service-error {
      color: #dc3545;
      font-style: italic;
    }
    
    .health-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      font-size: 0.85em;
      color: #6c757d;
    }
    </style>
  `;
}

function calculateGlobalHealth(health, services) {
  // Calcul de l'état de santé global
  const serviceStates = Object.values(services).map(s => s.status);
  const hasDown = serviceStates.includes('down');
  const hasDegraded = serviceStates.includes('degraded');
  const highErrorRate = (health.errors_per_hour || 0) > HEALTH_CONFIG.ERROR_RATE_THRESHOLD;
  
  if (hasDown || highErrorRate) {
    return { status: 'critical', icon: '❌', label: 'Critique' };
  }
  if (hasDegraded) {
    return { status: 'warning', icon: '⚠️', label: 'Dégradé' };
  }
  return { status: 'healthy', icon: '✅', label: 'Sain' };
}

function getServiceStatusIcon(status) {
  const icons = {
    healthy: '✅',
    degraded: '⚠️', 
    down: '❌',
    unknown: '❓'
  };
  return icons[status] || icons.unknown;
}

function calculateTrend(history, metric) {
  if (history.length < 2) return '—';
  
  const recent = history.slice(-2);
  const [prev, current] = recent;
  
  const prevValue = prev[metric] || 0;
  const currentValue = current[metric] || 0;
  
  if (currentValue > prevValue) return '↑';
  if (currentValue < prevValue) return '↓';
  return '→';
}

function initHealthInteractions() {
  // Pas d'interactions spéciales pour l'instant
}

function setupHealthAutoRefresh(container) {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  
  autoRefreshTimer = setInterval(async () => {
    if (document.querySelector('.health-interface')) {
      console.log('[healthBackend] Auto-refresh santé');
      await loadBackendHealth(container);
    }
  }, HEALTH_CONFIG.REFRESH_INTERVAL);
}

window.loadBasicHealthCheck = function(container) {
  container.innerHTML = `
    <div class="basic-health">
      <h3>💚 Check de Base</h3>
      <p>Interface simplifiée - APIs backend non disponibles.</p>
      <div class="basic-metrics">
        <div>Application: ✅ Active</div>
        <div>Interface: ✅ Fonctionnelle</div>
        <div>Navigation: ✅ Opérationnelle</div>
      </div>
    </div>
  `;
};

console.info("[healthBackend] ✅ Module santé backend prêt");
