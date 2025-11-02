/**
 * config-main.js - Coordinateur Onglet Configuration  
 * ✅ ARCHITECTURE ES6 MODULES CORRECTE - Version réparée
 */

// ✅ IMPORTS ES6 CORRECTS - Comme dans app.js original
import { loadConfiguration, initConfiguration } from './configuration.js';

// ⚙️ COORDINATEUR PRINCIPAL CONFIGURATION - VERSION RÉPARÉE
export async function initConfigTab() {
  console.log('⚙️ Initialisation onglet Configuration... (Architecture ES6 correcte)');
  
  try {
    // ✅ APPELS DIRECTS DES FONCTIONS IMPORTÉES (pas de window.*)
    
    // Initialiser d'abord si la fonction existe
    if (typeof initConfiguration === 'function') {
      console.log('📞 Appel initConfiguration...');
      await initConfiguration();
      console.log('✅ initConfiguration exécuté');
    }
    
    // Puis charger la configuration
    console.log('📞 Appel loadConfiguration...');
    await loadConfiguration();
    console.log('✅ Configuration chargée via import ES6 direct');
    
    // Event listeners spécifiques
    initConfigEventListeners();
    
    console.log('✅ Onglet Configuration initialisé complètement');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Configuration:', error);
    showConfigError(`Erreur chargement Configuration: ${error.message}`);
  }
}

// 🔄 ACTUALISATION CONFIGURATION - VERSION RÉPARÉE
export async function refreshConfigTab() {
  console.log('🔄 Actualisation onglet Configuration... (ES6 direct)');
  
  try {
    // ✅ APPEL DIRECT - PAS DE DÉLAI ARTIFICIEL
    await loadConfiguration();
    console.log('✅ Actualisation Configuration terminée');
  } catch (error) {
    console.error('❌ Erreur actualisation Configuration:', error);
  }
}

// 🔧 FALLBACK CONFIGURATION si échec
async function showConfigError(message) {
  const container = document.getElementById('content-configuration');
  if (container) {
    container.innerHTML = `
      <div class="card">
        <h3>📋 Sélection des Capteurs</h3>
        <div style="text-align: center; padding: 40px; color: #dc3545;">
          ❌ ${message}<br><br>
          <button onclick="window.initConfigTab()" class="primary">🔄 Réessayer</button>
        </div>
      </div>
    `;
  }
}

// 🎮 EVENT LISTENERS CONFIGURATION
function initConfigEventListeners() {
  console.log('🎮 Configuration des event listeners...');
  
  // Les event listeners pour les boutons de sauvegarde sont gérés
  // par les modules originaux (savePanel.js, configuration.state.js)
  // donc on ne les redéfinit pas ici pour éviter les conflits
  
  console.log('✅ Event listeners Configuration délégués aux modules originaux');
}

// ✅ EXPOSITION GLOBALE POUR COMPATIBILITÉ AVEC INDEX.HTML
window.initConfigTab = initConfigTab;
window.refreshConfigTab = refreshConfigTab;

// ✅ GESTION AUTO-SÉLECTION - Import de la fonction depuis selectionPanel
// Cette fonction sera disponible dès que selectionPanel.js sera chargé
window.autoSelectBestSensors = async function() {
  console.log('🎯 Délégation auto-select à selectionPanel.js...');
  
  // La vraie fonction autoSelectBestSensors est définie dans selectionPanel.js
  // et expose window.autoSelectBestSensors
  // Si elle n'est pas encore chargée, on affiche un message informatif
  const statusElement = document.getElementById('autoSelectStatus');
  if (statusElement) {
    statusElement.innerHTML = `
      ⚠️ Module de sélection automatique en cours de chargement...<br>
      <small>La fonction sera disponible dès que tous les modules seront initialisés.</small>
    `;
  }
};

export default {
  initConfigTab,
  refreshConfigTab
};