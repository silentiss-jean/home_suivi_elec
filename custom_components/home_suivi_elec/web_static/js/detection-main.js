/**
 * detection-main.js - Coordinateur Onglet Détection
 * Wrapper/coordinateur pour le module detection.js existant
 * Garantit l'initialisation et l'isolation de l'onglet Détection
 */

// Import du module detection.js existant
import { loadDetection, refreshDetection } from './detection.js';

// 🔍 COORDINATEUR PRINCIPAL DÉTECTION
export async function initDetectionTab() {
  console.log('🔍 Initialisation onglet Détection...');
  
  try {
    // Charge la détection via module existant
    if (typeof loadDetection === 'function') {
      await loadDetection();
      console.log('✅ Détection chargée via detection.js');
    } else {
      console.warn('⚠️ Module detection.js non disponible, fallback...');
      await loadDetectionFallback();
    }
    
    // Initialise les event listeners
    initDetectionEventListeners();
    
    console.log('✅ Onglet Détection initialisé');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Détection:', error);
    showDetectionError(`Erreur chargement Détection: ${error.message}`);
  }
}

// 🔄 ACTUALISATION DÉTECTION
export async function refreshDetectionTab() {
  console.log('🔄 Actualisation onglet Détection...');
  
  try {
    if (typeof refreshDetection === 'function') {
      await refreshDetection();
    } else if (typeof loadDetection === 'function') {
      await loadDetection();
    } else {
      await loadDetectionFallback();
    }
  } catch (error) {
    console.error('❌ Erreur actualisation Détection:', error);
  }
}

// 🔧 FALLBACK SI DETECTION.JS INDISPONIBLE
async function loadDetectionFallback() {
  console.log('🔧 Chargement fallback détection...');
  
  const container = document.getElementById('content-detection');
  if (container) {
    container.innerHTML = `
      <div class="card">
        <h3>🔍 Scan Capteurs Disponibles</h3>
        <div style="text-align: center; padding: 40px; color: #666;">
          🔄 Module de détection en cours de migration...<br>
          <small>Fonctionnalité temporairement indisponible</small>
        </div>
      </div>
    `;
  }
}

// 🎛️ EVENT LISTENERS DÉTECTION
function initDetectionEventListeners() {
  // Bouton refresh détection
  const refreshBtn = document.getElementById('refreshDetection');
  if (refreshBtn) {
    refreshBtn.replaceWith(refreshBtn.cloneNode(true));
    const newRefreshBtn = document.getElementById('refreshDetection');
    
    newRefreshBtn.addEventListener('click', async () => {
      newRefreshBtn.disabled = true;
      newRefreshBtn.textContent = '🔄 Détection...';
      
      try {
        await refreshDetectionTab();
        newRefreshBtn.textContent = '🔄 Lancer Détection';
      } finally {
        newRefreshBtn.disabled = false;
      }
    });
  }
  
  // Bouton scan complet
  const forceBtn = document.getElementById('forceRescan');
  if (forceBtn) {
    forceBtn.replaceWith(forceBtn.cloneNode(true));
    const newForceBtn = document.getElementById('forceRescan');
    
    newForceBtn.addEventListener('click', async () => {
      newForceBtn.disabled = true;
      newForceBtn.textContent = '🔍 Scan...';
      
      try {
        // Force rescan si fonction disponible
        if (window.forceFullRescan) {
          await window.forceFullRescan();
        } else {
          await refreshDetectionTab();
        }
        newForceBtn.textContent = '🔍 Scan Complet';
      } finally {
        newForceBtn.disabled = false;
      }
    });
  }
}

// 🚨 AFFICHAGE ERREUR DÉTECTION
function showDetectionError(message) {
  const container = document.getElementById('content-detection');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        ❌ ${message}
        <br><br>
        <button onclick="initDetectionTab()" class="primary">🔄 Réessayer</button>
      </div>
    `;
  }
}

// Expose globalement
window.initDetectionTab = initDetectionTab;
window.refreshDetectionTab = refreshDetectionTab;

export default {
  initDetectionTab,
  refreshDetectionTab
};