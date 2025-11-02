/**
 * diagnostics-integrations.js - État intégrations HA et compteurs capteurs
 * Surveille santé des intégrations qui fournissent capteurs énergie/puissance  
 */

import { proxyFetch } from './proxy.js';

// 🔌 CHARGEMENT ÉTAT INTÉGRATIONS
export async function loadDiagnosticIntegrations() {
  console.log('🔌 Démarrage diagnostic intégrations...');
  
  try {
    // Récupération données capteurs pour analyse
    const [sensorsResponse, diagResponse] = await Promise.all([
      proxyFetch('/api/home_suivi_elec/sensors'),
      proxyFetch('/api/home_suivi_elec/get_diagnostics')
    ]);
    
    if (!sensorsResponse?.data?.sensors) {
      showIntegrationsError('Pas de données capteurs disponibles');
      return;
    }
    
    const sensors = sensorsResponse.data.sensors;
    console.log(`🔌 Analyse ${sensors.length} capteurs pour intégrations...`);
    
    // Groupement par intégration
    const integrations = analyzeIntegrations(sensors);
    
    // Ajout infos diagnostic global si disponible
    if (diagResponse?.data) {
      enrichIntegrationsWithDiagnostics(integrations, diagResponse.data);
    }
    
    // Rendu interface
    renderIntegrations(integrations);
    
  } catch (error) {
    console.error('❌ Erreur diagnostic intégrations:', error);
    showIntegrationsError(`Erreur chargement: ${error.message}`);
  }
}

// 📋 ANALYSE INTÉGRATIONS
function analyzeIntegrations(sensors) {
  const integrations = {};
  
  sensors.forEach(sensor => {
    const integration = sensor.integration || sensor.platform_declared || 'unknown';
    
    if (!integrations[integration]) {
      integrations[integration] = {
        name: integration,
        displayName: formatIntegrationName(integration),
        sensors: [],
        totalSensors: 0,
        activeSensors: 0,
        inactiveSensors: 0,
        errorSensors: 0,
        status: 'unknown',
        lastSeen: null,
        issues: []
      };
    }
    
    integrations[integration].sensors.push(sensor);
    integrations[integration].totalSensors++;
    
    // Comptage par état
    const sensorState = sensor.sync_status || sensor.current_state || 'unknown';
    if (sensorState === 'active' || sensorState === 'available') {
      integrations[integration].activeSensors++;
    } else if (sensorState === 'unavailable') {
      integrations[integration].inactiveSensors++;
    } else {
      integrations[integration].errorSensors++;
    }
    
    // Mise à jour last_seen
    const sensorLastSeen = sensor.last_seen || sensor.last_changed;
    if (sensorLastSeen) {
      if (!integrations[integration].lastSeen || sensorLastSeen > integrations[integration].lastSeen) {
        integrations[integration].lastSeen = sensorLastSeen;
      }
    }
  });
  
  // Calcul statut global par intégration
  Object.values(integrations).forEach(integration => {
    integration.status = calculateIntegrationStatus(integration);
    integration.issues = detectIntegrationIssues(integration);
  });
  
  console.log(`🔌 Intégrations analysées: ${Object.keys(integrations).length}`);
  return integrations;
}

// 🏷️ FORMATAGE NOM INTÉGRATION
function formatIntegrationName(integration) {
  const nameMap = {
    'tapo': 'TP-Link Tapo',
    'tplink': 'TP-Link',
    'powercalc': 'PowerCalc',
    'utility_meter': 'Utility Meter', 
    'minmax': 'Min/Max Helper',
    'template': 'Template Sensors',
    'integration': 'Intégration Custom',
    'unknown': 'Intégration Inconnue'
  };
  
  return nameMap[integration.toLowerCase()] || 
    integration.charAt(0).toUpperCase() + integration.slice(1);
}

// 📈 CALCUL STATUT INTÉGRATION
function calculateIntegrationStatus(integration) {
  const { totalSensors, activeSensors, inactiveSensors, errorSensors } = integration;
  
  if (totalSensors === 0) return 'empty';
  if (activeSensors === totalSensors) return 'ok';
  if (errorSensors > 0) return 'error';
  if (inactiveSensors > totalSensors * 0.5) return 'critical';
  if (inactiveSensors > 0) return 'warning';
  
  return 'ok';
}

// ⚠️ DÉTECTION PROBLÈMES
function detectIntegrationIssues(integration) {
  const issues = [];
  
  if (integration.totalSensors === 0) {
    issues.push('🔴 Aucun capteur détecté');
  }
  
  if (integration.errorSensors > 0) {
    issues.push(`❌ ${integration.errorSensors} capteurs en erreur`);
  }
  
  if (integration.inactiveSensors > integration.totalSensors * 0.3) {
    issues.push(`⚠️ ${integration.inactiveSensors} capteurs inactifs (>${Math.round(integration.inactiveSensors/integration.totalSensors*100)}%)`);
  }
  
  const timeSinceLastSeen = integration.lastSeen ? 
    Math.round((Date.now() - new Date(integration.lastSeen).getTime()) / 60000) : null;
  
  if (timeSinceLastSeen && timeSinceLastSeen > 30) {
    issues.push(`🕰️ Dernière activité: ${timeSinceLastSeen}min`);
  }
  
  return issues;
}

// 📋 ENRICHISSEMENT AVEC DIAGNOSTICS
function enrichIntegrationsWithDiagnostics(integrations, diagnosticsData) {
  // Ajout d'informations du diagnostic global si disponible
  if (diagnosticsData.integration_status) {
    // Enrichir avec données diagnostic supplémentaires
    console.log('📋 Enrichissement avec diagnostic global...');
  }
}

// 💁 RENDU INTÉGRATIONS
function renderIntegrations(integrations) {
  const container = document.getElementById('integrationsContainer');
  if (!container) return;
  
  const sortedIntegrations = Object.values(integrations)
    .sort((a, b) => b.totalSensors - a.totalSensors); // Par nombre de capteurs décroissant
  
  let html = '';
  
  // Intégrations actives
  const activeIntegrations = sortedIntegrations.filter(i => i.totalSensors > 0);
  if (activeIntegrations.length > 0) {
    html += `
      <div class="card" style="margin-bottom: 20px;">
        <h4 style="margin-top: 0; color: #28a745;">✅ Intégrations Actives</h4>
    `;
    
    activeIntegrations.forEach(integration => {
      const statusIcon = getIntegrationIcon(integration.status);
      const statusClass = getIntegrationStatusClass(integration.status);
      
      html += `
        <div class="integration-block" style="border-left: 4px solid ${getStatusColor(integration.status)};">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <span style="font-size: 18px;">${statusIcon}</span>
                <strong>${integration.displayName}</strong>
                <span class="sensor-status ${statusClass}">
                  ${integration.status.toUpperCase()}
                </span>
              </div>
              
              <div style="display: flex; gap: 20px; font-size: 14px; color: #666;">
                <span>📁 <strong>${integration.totalSensors}</strong> total</span>
                <span>✅ <strong>${integration.activeSensors}</strong> actifs</span>
                ${integration.inactiveSensors > 0 ? `<span>❌ <strong>${integration.inactiveSensors}</strong> inactifs</span>` : ''}
                ${integration.errorSensors > 0 ? `<span>🚨 <strong>${integration.errorSensors}</strong> erreurs</span>` : ''}
              </div>
              
              ${integration.lastSeen ? `
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                  🕰️ Dernière activité: ${formatLastSeen(integration.lastSeen)}
                </div>
              ` : ''}
            </div>
            
            <div style="text-align: right;">
              <button class="primary" onclick="showIntegrationDetails('${integration.name}')" style="font-size: 12px; padding: 6px 12px;">
                🔍 Détails
              </button>
            </div>
          </div>
          
          ${integration.issues.length > 0 ? `
            <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 4px;">
              <strong>⚠️ Problèmes détectés:</strong>
              <ul style="margin: 5px 0 0 20px;">
                ${integration.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  // Intégrations vides ou problématiques 
  const emptyIntegrations = sortedIntegrations.filter(i => i.totalSensors === 0);
  if (emptyIntegrations.length > 0) {
    html += `
      <div class="card">
        <h4 style="margin-top: 0; color: #dc3545;">❌ Intégrations Sans Capteurs</h4>
        <div style="font-size: 14px; color: #666; margin-bottom: 10px;">
          Ces intégrations sont installées mais n'exposent aucun capteur énergie
        </div>
    `;
    
    emptyIntegrations.forEach(integration => {
      html += `
        <div style="display: flex; align-items: center; padding: 8px; background: #f8f9fa; margin-bottom: 5px; border-radius: 4px;">
          <span style="font-size: 14px;">🔴</span>
          <span style="margin-left: 10px;">${integration.displayName}</span>
          <span style="margin-left: auto; font-size: 12px; color: #999;">Aucun capteur</span>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  container.innerHTML = html;
}

// 🎨 HELPERS VISUELS
function getIntegrationIcon(status) {
  switch(status) {
    case 'ok': return '✅';
    case 'warning': return '⚠️'; 
    case 'critical': return '🚨';
    case 'error': return '❌';
    case 'empty': return '🔴';
    default: return '❓';
  }
}

function getIntegrationStatusClass(status) {
  switch(status) {
    case 'ok': return 'ok';
    case 'warning': return 'absent';
    case 'critical': case 'error': return 'ko';
    case 'empty': return 'removed';
    default: return 'absent';
  }
}

function getStatusColor(status) {
  switch(status) {
    case 'ok': return '#28a745';
    case 'warning': return '#ffc107';
    case 'critical': case 'error': return '#dc3545';
    case 'empty': return '#6c757d';
    default: return '#17a2b8';
  }
}

function formatLastSeen(lastSeen) {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = Math.round((now - date) / 60000);
  
  if (diffMinutes < 2) return 'maintenant';
  if (diffMinutes < 60) return `${diffMinutes}min`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes/60)}h`;
  return `${Math.round(diffMinutes/1440)}j`;
}

// 🔍 DÉTAILS INTÉGRATION
window.showIntegrationDetails = function(integrationName) {
  console.log(`🔍 Affichage détails intégration: ${integrationName}`);
  
  // TODO: Modal ou expansion avec liste détaillée des capteurs
  // Pour l'instant, log simple
  alert(`Détails ${integrationName}\n\nÀ implémenter:\n• Liste capteurs détaillée\n• Historique pannes\n• Actions maintenance`);
};

// 🚨 AFFICHAGE ERREUR
function showIntegrationsError(message) {
  const container = document.getElementById('integrationsContainer');
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
  const refreshBtn = document.getElementById('refreshIntegrations');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadDiagnosticIntegrations);
  }
  
  console.log('🔌 Module diagnostics-integrations.js initialisé');
});

// Expose globalement
window.loadDiagnosticIntegrations = loadDiagnosticIntegrations;

export default {
  loadDiagnosticIntegrations
};