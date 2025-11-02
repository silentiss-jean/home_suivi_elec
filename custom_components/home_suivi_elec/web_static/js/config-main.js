/**
 * config-main.js - Coordinateur Onglet Configuration
 * Wrapper/coordinateur pour les modules configuration.js existants
 * Garantit l'initialisation et l'isolation de l'onglet Configuration
 */

// Imports des modules configuration existants
import { initConfiguration, loadConfiguration, refreshConfiguration } from './configuration.js';
import { initSelectionPanel } from './selectionPanel.js';
import { initReferencePanel } from './referencePanel.js';
import { initSavePanel } from './savePanel.js';

// ⚙️ COORDINATEUR PRINCIPAL CONFIGURATION
export async function initConfigTab() {
  console.log('⚙️ Initialisation onglet Configuration...');
  
  try {
    // Initialise tous les modules configuration dans l'ordre
    if (typeof initConfiguration === 'function') {
      await initConfiguration();
      console.log('✅ Configuration principal initialisé');
    }
    
    if (typeof loadConfiguration === 'function') {
      await loadConfiguration();
      console.log('✅ Configuration chargée');
    }
    
    // Initialise les panels
    await initConfigPanels();
    
    // Event listeners spécifiques
    initConfigEventListeners();
    
    console.log('✅ Onglet Configuration initialisé complètement');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Configuration:', error);
    showConfigError(`Erreur chargement Configuration: ${error.message}`);
  }
}

// 🎛️ INITIALISATION PANELS CONFIGURATION
async function initConfigPanels() {
  console.log('🎛️ Initialisation panels Configuration...');
  
  try {
    // Panel sélection capteurs
    if (typeof initSelectionPanel === 'function') {
      await initSelectionPanel();
      console.log('✅ SelectionPanel initialisé');
    }
    
    // Panel capteur de référence
    if (typeof initReferencePanel === 'function') {
      await initReferencePanel();
      console.log('✅ ReferencePanel initialisé');
    }
    
    // Panel sauvegarde
    if (typeof initSavePanel === 'function') {
      await initSavePanel();
      console.log('✅ SavePanel initialisé');
    }
    
  } catch (error) {
    console.warn('⚠️ Erreur initialisation panels:', error);
    // Continue même si certains panels échouent
  }
}

// 🔄 ACTUALISATION CONFIGURATION
export async function refreshConfigTab() {
  console.log('🔄 Actualisation onglet Configuration...');
  
  try {
    if (typeof refreshConfiguration === 'function') {
      await refreshConfiguration();
    } else if (typeof loadConfiguration === 'function') {
      await loadConfiguration();
    } else {
      console.warn('⚠️ Pas de fonction refresh disponible pour Configuration');
    }
  } catch (error) {
    console.error('❌ Erreur actualisation Configuration:', error);
  }
}

// 🎯 AUTO-SÉLECTION CAPTEURS (Fonction exposée)
window.autoSelectBestSensors = async function() {
  console.log('🎯 Lancement sélection automatique...');
  
  const statusElement = document.getElementById('autoSelectStatus');
  const button = document.getElementById('autoSelectBtn');
  
  if (statusElement) statusElement.textContent = '🔄 Analyse en cours...';
  if (button) button.disabled = true;
  
  try {
    // Appel de la fonction existante si disponible
    if (window.autoSelectBestSensorsOriginal) {
      await window.autoSelectBestSensorsOriginal();
    } else {
      // Fallback : message temporaire
      if (statusElement) {
        statusElement.textContent = '⚠️ Fonction auto-select en cours de migration...';
      }
      console.warn('⚠️ autoSelectBestSensorsOriginal non disponible');
    }
  } catch (error) {
    console.error('❌ Erreur sélection automatique:', error);
    if (statusElement) statusElement.textContent = `❌ Erreur: ${error.message}`;
  } finally {
    if (button) button.disabled = false;
  }
};

// 🎮 EVENT LISTENERS CONFIGURATION
function initConfigEventListeners() {
  // Bouton sauvegarde sélection
  const saveBtn = document.getElementById('saveSelection');
  if (saveBtn) {
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    const newSaveBtn = document.getElementById('saveSelection');
    
    newSaveBtn.addEventListener('click', async () => {
      newSaveBtn.disabled = true;
      newSaveBtn.textContent = '💾 Sauvegarde...';
      
      try {
        // Appel fonction sauvegarde existante
        if (window.saveCurrentSelection) {
          await window.saveCurrentSelection();
        } else {
          console.warn('⚠️ Fonction saveCurrentSelection non disponible');
        }
        newSaveBtn.textContent = '💾 Sauvegarder la sélection des capteurs';
      } catch (error) {
        console.error('❌ Erreur sauvegarde:', error);
        newSaveBtn.textContent = '❌ Erreur sauvegarde';
      } finally {
        newSaveBtn.disabled = false;
      }
    });
  }
  
  // Bouton sauvegarde config utilisateur
  const saveUserConfigBtn = document.getElementById('saveUserConfig');
  if (saveUserConfigBtn) {
    saveUserConfigBtn.replaceWith(saveUserConfigBtn.cloneNode(true));
    const newSaveUserConfigBtn = document.getElementById('saveUserConfig');
    
    newSaveUserConfigBtn.addEventListener('click', async () => {
      newSaveUserConfigBtn.disabled = true;
      newSaveUserConfigBtn.textContent = '💾 Sauvegarde...';
      
      try {
        // Appel fonction sauvegarde config existante
        if (window.saveUserConfiguration) {
          await window.saveUserConfiguration();
        } else {
          console.warn('⚠️ Fonction saveUserConfiguration non disponible');
        }
        newSaveUserConfigBtn.textContent = '💾 Sauvegarder la configuration';
      } catch (error) {
        console.error('❌ Erreur sauvegarde config:', error);
        newSaveUserConfigBtn.textContent = '❌ Erreur sauvegarde';
      } finally {
        newSaveUserConfigBtn.disabled = false;
      }
    });
  }
}

// 🚨 AFFICHAGE ERREUR CONFIGURATION
function showConfigError(message) {
  const container = document.getElementById('content-configuration');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        ❌ ${message}
        <br><br>
        <button onclick="initConfigTab()" class="primary">🔄 Réessayer</button>
      </div>
    `;
  }
}

// Expose globalement
window.initConfigTab = initConfigTab;
window.refreshConfigTab = refreshConfigTab;

export default {
  initConfigTab,
  refreshConfigTab
};