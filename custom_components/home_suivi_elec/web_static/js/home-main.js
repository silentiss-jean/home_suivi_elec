/**
 * home-main.js - Coordinateur Onglet Accueil
 * ✅ ARCHITECTURE ES6 MODULES CORRECTE - Version réparée
 */

// ✅ IMPORTS ES6 CORRECTS - Comme dans app.js original
import { loadSummary } from './summary.js';

// 🏠 COORDINATEUR PRINCIPAL ACCUEIL - VERSION RÉPARÉE
export async function initHomeTab() {
  console.log('🏠 Initialisation onglet Accueil... (Architecture ES6 correcte)');
  
  try {
    // ✅ APPEL DIRECT DE LA FONCTION IMPORTÉE (pas de window.*)
    await loadSummary();
    console.log('✅ Résumé chargé via import ES6 direct');
    
    // Initialise les event listeners
    initHomeEventListeners();
    
    console.log('✅ Onglet Accueil initialisé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur initialisation Accueil:', error);
    showHomeError(`Erreur chargement Accueil: ${error.message}`);
  }
}

// 🔄 ACTUALISATION ACCUEIL - VERSION RÉPARÉE
export async function refreshHomeTab() {
  console.log('🔄 Actualisation onglet Accueil... (ES6 direct)');
  
  try {
    // ✅ APPEL DIRECT - PAS DE DÉLAI ARTIFICIEL
    await loadSummary();
    console.log('✅ Actualisation Accueil terminée');
  } catch (error) {
    console.error('❌ Erreur actualisation Accueil:', error);
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
      } catch (error) {
        console.error('❌ Erreur lors du refresh:', error);
        newRefreshBtn.textContent = '❌ Erreur refresh';
        setTimeout(() => {
          newRefreshBtn.textContent = '🔄 Actualiser résumé';
        }, 2000);
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
        <button onclick="window.initHomeTab()" class="primary">🔄 Réessayer</button>
      </div>
    `;
  }
}

// ✅ EXPOSITION GLOBALE POUR COMPATIBILITÉ AVEC INDEX.HTML
window.initHomeTab = initHomeTab;
window.refreshHomeTab = refreshHomeTab;

export default {
  initHomeTab,
  refreshHomeTab
};