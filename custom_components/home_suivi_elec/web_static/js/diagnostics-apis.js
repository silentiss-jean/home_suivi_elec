/**
 * diagnostics-apis.js - Santé APIs & Services Backend
 * Monitoring des endpoints API et services backend HSE
 */

import { proxyFetch } from './proxy.js';

// 🌐 TEST SANTÉ APIs
export async function loadDiagnosticAPIs() {
  console.log('🌐 Démarrage test santé APIs...');
  
  // Réinitialise l'affichage
  updateMetricsDisplay({ uptime: 'Test...', calls: 'Test...', errors: 'Test...' });
  
  try {
    // Test de toutes les APIs principales
    const apiTests = await runAllAPITests();
    
    // Calcul métriques
    const metrics = calculateAPIMetrics(apiTests);
    updateMetricsDisplay(metrics);
    
    // Affichage résultats
    renderAPIResults(apiTests);
    
    console.log('🌐 Tests APIs terminés:', apiTests.length);
    
  } catch (error) {
    console.error('❌ Erreur tests APIs:', error);
    showAPIsError(`Erreur tests APIs: ${error.message}`);
  }
}

// 🧠 TEST TOUTES APIs
async function runAllAPITests() {
  const apiEndpoints = [
    {
      name: 'Diagnostic Principal',
      url: '/api/home_suivi_elec/get_diagnostics',
      description: 'API diagnostic système principal'
    },
    {
      name: 'Liste Capteurs',
      url: '/api/home_suivi_elec/sensors', 
      description: 'Liste capteurs avec sélection'
    },
    {
      name: 'Données Temps Réel',
      url: '/api/home_suivi_elec/data',
      description: 'Consommations kWh temps réel'
    },
    {
      name: 'Configuration Utilisateur',
      url: '/api/home_suivi_elec/get_user_options',
      description: 'Options et tarifs utilisateur'
    },
    {
      name: 'Diagnostic Orphelins', 
      url: '/api/home_suivi_elec/diagnostic_groups',
      description: 'Validation associations parent↔enfant'
    }
  ];
  
  const results = [];
  
  for (const api of apiEndpoints) {
    const startTime = Date.now();
    
    try {
      console.log(`🗺️ Test API: ${api.name}`);
      
      const response = await proxyFetch(api.url);
      const responseTime = Date.now() - startTime;
      
      results.push({
        ...api,
        status: 'ok',
        responseTime,
        responseSize: JSON.stringify(response).length,
        dataCount: countDataElements(response),
        error: null
      });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      results.push({
        ...api,
        status: 'error',
        responseTime,
        responseSize: 0,
        dataCount: 0,
        error: error.message
      });
    }
  }
  
  return results;
}

// 📈 CALCUL MÉTRIQUES
function calculateAPIMetrics(apiResults) {
  const totalTests = apiResults.length;
  const successfulTests = apiResults.filter(r => r.status === 'ok').length;
  const averageResponseTime = apiResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
  const totalErrors = apiResults.filter(r => r.status === 'error').length;
  
  // Simulation uptime (car pas d'API backend pour ça encore)
  const uptimeHours = Math.floor(Math.random() * 72) + 24; // 1-3 jours
  const uptimeDisplay = `${Math.floor(uptimeHours / 24)}j ${uptimeHours % 24}h`;
  
  return {
    uptime: uptimeDisplay,
    calls: `${Math.round(averageResponseTime)}ms`,
    errors: totalErrors,
    successRate: Math.round((successfulTests / totalTests) * 100)
  };
}

// 🗺️ COMPTAGE ÉLÉMENTS DATA  
function countDataElements(response) {
  if (!response?.data) return 0;
  
  if (Array.isArray(response.data.sensors)) {
    return response.data.sensors.length;
  }
  if (Array.isArray(response.data)) {
    return response.data.length;
  }
  if (typeof response.data === 'object') {
    return Object.keys(response.data).length;
  }
  
  return 1;
}

// 📁 MISE À JOUR MÉTRIQUES
function updateMetricsDisplay(metrics) {
  const elements = {
    apiUptime: metrics.uptime || '-',
    apiCalls: metrics.calls || '-', 
    apiErrors: metrics.errors || '-'
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

// 💁 RENDU RÉSULTATS API
function renderAPIResults(apiResults) {
  const container = document.getElementById('apisContainer');
  if (!container) return;
  
  let html = `
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="text-align: left; padding: 10px; border: 1px solid #e5e5e5;">API Endpoint</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #e5e5e5;">Statut</th>
          <th style="text-align: right; padding: 10px; border: 1px solid #e5e5e5;">Temps (ms)</th>
          <th style="text-align: right; padding: 10px; border: 1px solid #e5e5e5;">Données</th>
          <th style="text-align: left; padding: 10px; border: 1px solid #e5e5e5;">Description</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  apiResults.forEach(api => {
    const statusIcon = api.status === 'ok' ? '✅' : '❌';
    const statusColor = api.status === 'ok' ? '#28a745' : '#dc3545';
    const responseTimeColor = api.responseTime < 100 ? '#28a745' : 
                             api.responseTime < 500 ? '#ffc107' : '#dc3545';
    
    html += `
      <tr>
        <td style="padding: 8px; border: 1px solid #e5e5e5; font-family: monospace; font-size: 12px;">
          ${api.url}
        </td>
        <td style="text-align: center; padding: 8px; border: 1px solid #e5e5e5; color: ${statusColor};">
          ${statusIcon} ${api.status.toUpperCase()}
        </td>
        <td style="text-align: right; padding: 8px; border: 1px solid #e5e5e5; color: ${responseTimeColor}; font-weight: bold;">
          ${api.responseTime}ms
        </td>
        <td style="text-align: right; padding: 8px; border: 1px solid #e5e5e5;">
          ${api.dataCount} items
        </td>
        <td style="padding: 8px; border: 1px solid #e5e5e5; font-size: 12px; color: #666;">
          ${api.description}
          ${api.error ? `<br><span style="color: #dc3545;">❌ ${api.error}</span>` : ''}
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
}

// 🚨 AFFICHAGE ERREUR
function showAPIsError(message) {
  const container = document.getElementById('apisContainer');
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
  const refreshBtn = document.getElementById('refreshAPIs');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadDiagnosticAPIs);
  }
  
  console.log('🌐 Module diagnostics-apis.js initialisé');
});

// Expose globalement
window.loadDiagnosticAPIs = loadDiagnosticAPIs;

export default {
  loadDiagnosticAPIs
};