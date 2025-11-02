/**
 * home-main.js - Coordinateur Onglet Accueil
 * Fix urgent: appel direct loadSummary avec délai garanti DOM ready
 */

// 🏠 COORDINATEUR PRINCIPAL ACCUEIL - VERSION FIXÉE
export async function initHomeTab() {
  console.log('🏠 Initialisation onglet Accueil... (Version Fix)');
  
  try {
    // ✅ FIX 1: Délai pour s'assurer que DOM est prêt
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // ✅ FIX 2: Appel direct de la fonction globale loadSummary (pas import ES6)
    if (typeof window.loadSummary === 'function') {
      console.log('📞 Appel direct window.loadSummary...');
      await window.loadSummary();
      console.log('✅ Résumé chargé via appel direct');
    } else {
      console.warn('⚠️ window.loadSummary non disponible, tentative fallback...');
      await loadSummaryFallback();
    }
    
    // Initialise les event listeners
    initHomeEventListeners();
    
    console.log('✅ Onglet Accueil initialisé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Accueil:', error);
    showHomeError(`Erreur chargement Accueil: ${error.message}`);
  }
}

// 🔄 ACTUALISATION ACCUEIL - VERSION FIXÉE
export async function refreshHomeTab() {
  console.log('🔄 Actualisation onglet Accueil... (Fix)');
  
  try {
    // ✅ FIX 3: Appel direct aussi pour refresh
    if (typeof window.refreshSummary === 'function') {
      await window.refreshSummary();
    } else if (typeof window.loadSummary === 'function') {
      await window.loadSummary();
    } else {
      await loadSummaryFallback();
    }
    console.log('✅ Actualisation Accueil terminée');
  } catch (error) {
    console.error('❌ Erreur actualisation Accueil:', error);
  }
}

// 🔧 FALLBACK SI SUMMARY.JS INDISPONIBLE
async function loadSummaryFallback() {
  console.log('🔧 Chargement fallback résumé...');
  
  const summaryCard = document.getElementById('summaryCard');
  if (summaryCard) {
    const fallbackContent = `
      <div style="text-align: center; padding: 40px; color: #666;">
        🔄 Résumé en cours de chargement...<br>
        <small>Module summary.js en cours d'initialisation</small>
      </div>
    `;
    
    const summaryData = document.getElementById('summaryData');
    if (summaryData) {
      summaryData.innerHTML = fallbackContent;
    }
  }
}

// 🎛️ EVENT LISTENERS ACCUEIL - AMÉLIORÉS
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
      } catch (error) {
        console.error('❌ Erreur lors du refresh:', error);
        newRefreshBtn.textContent = '❌ Erreur refresh';
      } finally {
        newRefreshBtn.disabled = false;
      }
    });
    
    console.log('🎛️ Event listener refresh configuré');
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

// ✅ FIX 4: Exposition globale immédiate pour compatibilité avec index.html
window.initHomeTab = initHomeTab;
window.refreshHomeTab = refreshHomeTab;

export default {
  initHomeTab,
  refreshHomeTab
};