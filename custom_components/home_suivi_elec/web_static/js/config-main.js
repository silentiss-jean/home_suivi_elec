/**
 * config-main.js - Coordinateur Onglet Configuration  
 * Fix urgent: appel direct loadConfiguration avec gardes de sécurité
 */

// ⚙️ COORDINATEUR PRINCIPAL CONFIGURATION - VERSION FIXÉE
export async function initConfigTab() {
  console.log('⚙️ Initialisation onglet Configuration... (Version Fix)');
  
  try {
    // ✅ FIX 1: Délai pour DOM ready + garde de sécurité
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // ✅ FIX 2: Appel direct des fonctions globales (pas imports ES6)
    if (typeof window.loadConfiguration === 'function') {
      console.log('📞 Appel direct window.loadConfiguration...');
      await window.loadConfiguration();
      console.log('✅ Configuration chargée via appel direct');
    } else {
      console.warn('⚠️ window.loadConfiguration non disponible, fallback...');
      await loadConfigFallback();
    }
    
    // Initialisation des fonctions auxiliaires
    if (typeof window.initConfiguration === 'function') {
      console.log('📞 Appel window.initConfiguration...');
      await window.initConfiguration();
      console.log('✅ initConfiguration exécuté');
    }
    
    // Event listeners spécifiques
    initConfigEventListeners();
    
    console.log('✅ Onglet Configuration initialisé complètement');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Configuration:', error);
    showConfigError(`Erreur chargement Configuration: ${error.message}`);
  }
}

// 🔄 ACTUALISATION CONFIGURATION - VERSION FIXÉE
export async function refreshConfigTab() {
  console.log('🔄 Actualisation onglet Configuration... (Fix)');
  
  try {
    // ✅ FIX 3: Appels directs pour refresh
    if (typeof window.refreshConfiguration === 'function') {
      await window.refreshConfiguration();
    } else if (typeof window.loadConfiguration === 'function') {
      await window.loadConfiguration();
    } else {
      console.warn('⚠️ Pas de fonction refresh disponible pour Configuration');
      await loadConfigFallback();
    }
    console.log('✅ Actualisation Configuration terminée');
  } catch (error) {
    console.error('❌ Erreur actualisation Configuration:', error);
  }
}

// 🔧 FALLBACK CONFIGURATION - AMÉLIORÉ
async function loadConfigFallback() {
  console.log('🔧 Chargement fallback configuration...');
  
  const container = document.getElementById('content-configuration');
  if (container) {
    container.innerHTML = `
      <div class="card">
        <h3>📋 Sélection des Capteurs</h3>
        <div style="text-align: center; padding: 40px; color: #666;">
          🔄 Module de configuration en cours de restauration...<br>
          <small>Coordinateur en cours d'harmonisation avec les modules existants</small><br><br>
          <button onclick="initConfigTab()" class="primary">🔄 Réessayer</button>
        </div>
      </div>
    `;
  }
}

// 🎯 AUTO-SÉLECTION CAPTEURS - FIXÉE POUR COMPATIBILITÉ GLOBALE
window.autoSelectBestSensors = async function() {
  console.log('🎯 Lancement sélection automatique... (Version Fix)');
  
  const statusElement = document.getElementById('autoSelectStatus');
  const button = document.getElementById('autoSelectBtn');
  
  if (statusElement) statusElement.textContent = '🔄 Analyse en cours...';
  if (button) button.disabled = true;
  
  try {
    // ✅ FIX 4: Recherche de la fonction dans plusieurs contextes
    if (typeof window.autoSelectBestSensorsOriginal === 'function') {
      console.log('📞 Appel window.autoSelectBestSensorsOriginal...');
      await window.autoSelectBestSensorsOriginal();
    } else if (typeof autoSelectBestSensorsOriginal === 'function') {
      console.log('📞 Appel autoSelectBestSensorsOriginal global...');
      await autoSelectBestSensorsOriginal();
    } else {
      // Fallback temporaire - message utilisateur informatif
      if (statusElement) {
        statusElement.innerHTML = `
          ⚠️ Fonction auto-select en cours de migration vers nouvelle architecture.<br>
          <small>Utilisez temporairement la sélection manuelle dans les panels ci-dessous.</small>
        `;
      }
      console.warn('⚠️ autoSelectBestSensors non disponible - migration en cours');
    }
  } catch (error) {
    console.error('❌ Erreur sélection automatique:', error);
    if (statusElement) statusElement.textContent = `❌ Erreur: ${error.message}`;
  } finally {
    if (button) button.disabled = false;
  }
};

// 🎮 EVENT LISTENERS CONFIGURATION - AMÉLIORÉS
function initConfigEventListeners() {
  console.log('🎮 Configuration des event listeners...');
  
  // Bouton sauvegarde sélection - avec garde
  const saveBtn = document.getElementById('saveSelection');
  if (saveBtn) {
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    const newSaveBtn = document.getElementById('saveSelection');
    
    newSaveBtn.addEventListener('click', async () => {
      newSaveBtn.disabled = true;
      newSaveBtn.textContent = '💾 Sauvegarde...';
      
      try {
        // Appel fonction sauvegarde existante - recherche dans plusieurs contextes
        if (typeof window.saveCurrentSelection === 'function') {
          await window.saveCurrentSelection();
        } else if (typeof saveCurrentSelection === 'function') {
          await saveCurrentSelection();
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
  
  // Bouton sauvegarde config utilisateur - avec garde
  const saveUserConfigBtn = document.getElementById('saveUserConfig');
  if (saveUserConfigBtn) {
    saveUserConfigBtn.replaceWith(saveUserConfigBtn.cloneNode(true));
    const newSaveUserConfigBtn = document.getElementById('saveUserConfig');
    
    newSaveUserConfigBtn.addEventListener('click', async () => {
      newSaveUserConfigBtn.disabled = true;
      newSaveUserConfigBtn.textContent = '💾 Sauvegarde...';
      
      try {
        // Appel fonction sauvegarde config existante
        if (typeof window.saveUserConfiguration === 'function') {
          await window.saveUserConfiguration();
        } else if (typeof saveUserConfiguration === 'function') {
          await saveUserConfiguration();
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
  
  console.log('✅ Event listeners Configuration configurés');
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

// ✅ FIX 5: Exposition globale immédiate
window.initConfigTab = initConfigTab;
window.refreshConfigTab = refreshConfigTab;

export default {
  initConfigTab,
  refreshConfigTab
};