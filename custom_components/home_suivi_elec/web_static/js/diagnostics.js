/**
 * diagnostics.js - Coordination sous-onglets Diagnostic enrichis
 * Point d'entrée pour navigation et orchestration modules diagnostics
 */

import { proxyFetch } from './proxy.js';

// ✅ NAVIGATION SOUS-ONGLETS DIAGNOSTIC
export function showDiagTab(diagTab) {
  // Désactive tous les sous-onglets
  document.querySelectorAll('.diag-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.diag-tabs button').forEach(btn => btn.classList.remove('active'));
  
  // Active le bon sous-onglet et bouton
  const selectedTab = document.getElementById(diagTab);
  if (selectedTab) {
    selectedTab.classList.add('active');
    // Trouve et active le bouton correspondant
    const targetBtn = document.querySelector(`button[onclick="showDiagTab('${diagTab}')"]`);
    if (targetBtn) targetBtn.classList.add('active');
  }
  
  // Appel spécifique de chargement selon l'onglet
  switch(diagTab) {
    case 'diag-sensors':
      if (window.loadDiagnosticSensorsGrouped) {
        console.log('📊 Chargement diagnostic capteurs groupés...');
        window.loadDiagnosticSensorsGrouped();
      }
      break;
    case 'diag-integrations':
      if (window.loadDiagnosticIntegrations) {
        console.log('🔌 Chargement diagnostic intégrations...');
        window.loadDiagnosticIntegrations();
      }
      break;
    case 'diag-logs':
      if (window.loadDiagnosticLogs) {
        console.log('📜 Chargement logs backend...');
        window.loadDiagnosticLogs();
      }
      break;
    case 'diag-apis':
      if (window.loadDiagnosticAPIs) {
        console.log('🌐 Test santé APIs...');
        window.loadDiagnosticAPIs();
      }
      break;
    case 'diag-flow':
      if (window.loadDiagnosticFlow) {
        console.log('📈 Génération diagramme flux...');
        window.loadDiagnosticFlow();
      }
      break;
    default:
      console.warn(`Sous-onglet diagnostic inconnu: ${diagTab}`);
  }
}

// ✅ CHARGEMENT INITIAL DIAGNOSTIC (compatible ancien système)
export async function loadDiagnostics() {
  console.log('🔧 Initialisation module Diagnostic enrichi...');
  
  try {
    // Test connectivité API de base
    const response = await proxyFetch('/api/home_suivi_elec/get_diagnostics');
    
    if (response?.data) {
      console.log('✅ API Diagnostic opérationnelle:', response.data.system_status || 'OK');
      
      // Charge automatiquement l'onglet Capteurs par défaut
      setTimeout(() => {
        if (window.loadDiagnosticSensorsGrouped) {
          console.log('📊 Auto-chargement capteurs groupés...');
          window.loadDiagnosticSensorsGrouped();
        }
      }, 300);
    } else {
      console.warn('⚠️ API Diagnostic: réponse inattendue');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation Diagnostic:', error);
    // Fallback gracieux - pas de blocage
  }
}

// Expose globalement pour compatibilité
window.showDiagTab = showDiagTab;
window.loadDiagnostics = loadDiagnostics;

// ✅ AUTO-INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 Module diagnostics.js chargé');
});

export default {
  showDiagTab,
  loadDiagnostics
};