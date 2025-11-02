/**
 * home-main.js - Coordinateur Onglet Accueil
 * Wrapper/coordinateur pour le module summary.js existant
 * Garantit l'initialisation et l'isolation de l'onglet Accueil
 */

// Import du module summary.js existant (si disponible)
import { loadSummary, refreshSummary } from './summary.js';

// 🏠 COORDINATEUR PRINCIPAL ACCUEIL
export async function initHomeTab() {
  console.log('🏠 Initialisation onglet Accueil...');
  
  try {
    // Charge le résumé via module existant
    if (typeof loadSummary === 'function') {
      await loadSummary();
      console.log('✅ Résumé chargé via summary.js');
    } else {
      console.warn('⚠️ Module summary.js non disponible, chargement fallback...');
      await loadSummaryFallback();
    }
    
    // Initialise les event listeners
    initHomeEventListeners();
    
    console.log('✅ Onglet Accueil initialisé');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Accueil:', error);
    showHomeError(`Erreur chargement Accueil: ${error.message}`);
  }
}

// 🔄 ACTUALISATION ACCUEIL
export async function refreshHomeTab() {
  console.log('🔄 Actualisation onglet Accueil...');
  
  try {
    if (typeof refreshSummary === 'function') {
      await refreshSummary();
    } else {
      await loadSummaryFallback();
    }
  } catch (error) {
    console.error('❌ Erreur actualisation Accueil:', error);
  }
}

// 🔧 FALLBACK SI SUMMARY.JS INDISPONIBLE
async function loadSummaryFallback() {
  console.log('🔧 Chargement fallback résumé...');
  
  // Affiche message temporaire en attendant
  const summaryCard = document.getElementById('summaryCard');
  if (summaryCard) {
    const fallbackContent = `
      <div style="text-align: center; padding: 40px; color: #666;">
        🔄 Résumé en cours de chargement...<br>
        <small>Module summary.js en cours d'initialisation</small>
      </div>
    `;
    
    // Ne remplace que le contenu, pas la structure
    const summaryData = document.getElementById('summaryData');
    if (summaryData) {
      summaryData.innerHTML = fallbackContent;
    }
  }
}

// 🎛️ EVENT LISTENERS ACCUEIL
function initHomeEventListeners() {
  const refreshBtn = document.getElementById('refreshHome');
  if (refreshBtn) {
    // Nettoie les anciens listeners pour éviter les doublons
    refreshBtn.replaceWith(refreshBtn.cloneNode(true));
    const newRefreshBtn = document.getElementById('refreshHome');
    
    newRefreshBtn.addEventListener('click', async () => {
      newRefreshBtn.disabled = true;
      newRefreshBtn.textContent = '🔄 Actualisation...';
      
      try {
        await refreshHomeTab();
        newRefreshBtn.textContent = '🔄 Actualiser résumé';
      } finally {
        newRefreshBtn.disabled = false;
      }
    });
  }
}

// 🚨 AFFICHAGE ERREUR ACCUEIL
function showHomeError(message) {
  const summaryCard = document.getElementById('summaryCard');
  if (summaryCard) {
    summaryCard.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        ❌ ${message}
        <br><br>
        <button onclick="initHomeTab()" class="primary">🔄 Réessayer</button>
      </div>
    `;
  }
}

// Expose globalement pour compatibilité
window.initHomeTab = initHomeTab;
window.refreshHomeTab = refreshHomeTab;

export default {
  initHomeTab,
  refreshHomeTab
};