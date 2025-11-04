// app.js — Assembleur UI principal avec chargement conditionnel
"use strict";

import stateModule from "./stateModule.js";
import { on } from "./eventBus.js";

// 💬 Variables globales pour le chargement conditionnel
let loadedModules = {
  summary: false,
  detection: false,
  configuration: false,
  diagnostics: false,
  generation: false
};

// 🔄 FONCTION showTab PRINCIPALE AMÉLIORÉE
function showTab(tab) {
  console.log(`[app.showTab] Changement vers: ${tab}`);
  
  // Masquer tous les onglets principaux
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });
  
  // Afficher l'onglet sélectionné
  const selected = document.getElementById(tab);
  if (!selected) {
    console.error(`[app.showTab] ❌ Élément ${tab} non trouvé dans le DOM`);
    return;
  }
  
  selected.classList.add('active');
  console.log(`[app.showTab] ✅ Onglet ${tab} activé`);

  // Charger le contenu spécifique selon l'onglet
  loadTabContent(tab);
}

// 🎯 CHARGEMENT CONDITIONNEL DES MODULES
async function loadTabContent(tab) {
  try {
    switch (tab) {
      case 'home':
        if (!loadedModules.summary) {
          console.log('[app] Chargement module summary...');
          const { loadSummary } = await import('../summary/summary.js');
          await loadSummary();
          loadedModules.summary = true;
        } else {
          // Module déjà chargé, juste recharger les données
          const { loadSummary } = await import('../summary/summary.js');
          await loadSummary();
        }
        break;
        
      case 'detection':
        if (!loadedModules.detection) {
          console.log('[app] Chargement module detection...');
          const { loadDetection } = await import('../detection/detection.js');
          await loadDetection();
          loadedModules.detection = true;
        } else {
          const { loadDetection } = await import('../detection/detection.js');
          await loadDetection();
        }
        break;
        
      case 'configuration':
        console.log('[app] Chargement module configuration...');
        try {
          const { loadConfiguration } = await import('../configuration/configuration.js');
          await loadConfiguration();
          loadedModules.configuration = true;
        } catch (error) {
          console.error('[app] ❌ Erreur chargement configuration:', error);
          const container = document.getElementById('content-configuration');
          if (container) {
            container.innerHTML = `
              <div class="error-message">
                <h3>❌ Erreur de chargement</h3>
                <p>Module configuration indisponible: ${error.message}</p>
                <button onclick="showTab('configuration')" class="btn btn-secondary">
                  🔄 Réessayer
                </button>
              </div>
            `;
          }
        }
        break;
        
      case 'diagnostics':
        console.log('[app] Chargement module diagnostics...');
        try {
          const { loadDiagnostics } = await import('../diagnostics/diagnostics.js');
          await loadDiagnostics();
          loadedModules.diagnostics = true;
          
          // Activer le premier sous-onglet par défaut
          setTimeout(() => {
            if (typeof window.showDiagTab === 'function') {
              window.showDiagTab('diag-sensors');
            }
          }, 200);
        } catch (error) {
          console.error('[app] ❌ Erreur chargement diagnostics:', error);
          const container = document.getElementById('diagnosticsGlobal');
          if (container) {
            container.innerHTML = `
              <div class="error-message">
                <h3>❌ Erreur de chargement</h3>
                <p>Module diagnostics indisponible: ${error.message}</p>
                <button onclick="showTab('diagnostics')" class="btn btn-secondary">
                  🔄 Réessayer
                </button>
              </div>
            `;
          }
        }
        break;
        
      case 'generation':
        if (!loadedModules.generation) {
          console.log('[app] Chargement module generation...');
          try {
            const { loadGeneration } = await import('../generation/generate.js');
            await loadGeneration();
            loadedModules.generation = true;
          } catch (error) {
            console.error('[app] ❌ Erreur chargement generation:', error);
            const container = document.getElementById('content-generation');
            if (container) {
              container.innerHTML = `
                <div class="error-message">
                  <h3>❌ Module indisponible</h3>
                  <p>Génération non implémentée: ${error.message}</p>
                </div>
              `;
            }
          }
        }
        break;
        
      default:
        console.log(`[app] Onglet ${tab}: pas de chargement spécifique`);
    }
  } catch (error) {
    console.error(`[app] ❌ Erreur générale chargement ${tab}:`, error);
  }
}

// 🔧 FONCTION showDiagTab ROBUSTE
function showDiagTab(tab) {
  console.log(`[app.showDiagTab] Changement vers: ${tab}`);
  
  // Vérifier que l'onglet diagnostics est actif
  const diagnosticsTab = document.getElementById('diagnostics');
  if (!diagnosticsTab || !diagnosticsTab.classList.contains('active')) {
    console.log('[app.showDiagTab] Onglet diagnostics pas actif, ignoré');
    return;
  }
  
  // Masquer tous les contenus des sous-onglets
  document.querySelectorAll('.diag-tab-content').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  
  // Trouver et afficher le sous-onglet sélectionné
  const selected = document.getElementById(tab);
  if (!selected) {
    console.error(`[app.showDiagTab] ❌ Élément ${tab} non trouvé dans le DOM`);
    return;
  }
  
  selected.style.display = 'block';
  selected.classList.add('active');
  console.log(`[app.showDiagTab] ✅ Sous-onglet ${tab} affiché`);
  
  // Charger le contenu si nécessaire
  loadDiagTabContent(tab, selected);
}

async function loadDiagTabContent(tab, container) {
  if (container.dataset.loaded === 'true') {
    console.log(`[app] Contenu ${tab} déjà chargé`);
    return;
  }
  
  try {
    switch (tab) {
      case 'diag-sensors':
        console.log('[app] Chargement diagnostics capteurs...');
        const { loadDiagnosticSensors } = await import('../diagnostics/diagnosticSensors.js');
        await loadDiagnosticSensors();
        container.dataset.loaded = 'true';
        break;
        
      case 'diag-integrations':
        console.log('[app] Chargement diagnostics intégrations...');
        container.innerHTML = '<div class="placeholder">Diagnostics intégrations à venir...</div>';
        container.dataset.loaded = 'true';
        break;
        
      case 'diag-logs':
        console.log('[app] Chargement logs système...');
        container.innerHTML = '<div class="placeholder">Logs système à venir...</div>';
        container.dataset.loaded = 'true';
        break;
        
      case 'diag-health':
        console.log('[app] Chargement santé backend...');
        container.innerHTML = '<div class="placeholder">Santé du backend à venir...</div>';
        container.dataset.loaded = 'true';
        break;
        
      default:
        console.log(`[app] Sous-onglet ${tab}: pas de chargement spécifique`);
    }
  } catch (error) {
    console.error(`[app] ❌ Erreur chargement ${tab}:`, error);
    container.innerHTML = `<div class="error">Erreur de chargement: ${error.message}</div>`;
  }
}

// 🎨 INITIALISATION PRINCIPALE
document.addEventListener("DOMContentLoaded", async () => {
  console.log('[app] 🚀 Initialisation de l\'application...');
  
  try {
    // Hydratation de l'état utilisateur
    console.log('[app] Hydratation état utilisateur...');
    await hydrateUserState();
    
    // Initialisation des panels (si disponibles)
    await initializePanels();
    
    // Chargement initial de l'onglet Accueil
    showTab('home');
    
    // Configuration des listeners globaux
    setupEventListeners();
    
    console.log('[app] ✅ Initialisation terminée avec succès');
    
  } catch (error) {
    console.error('[app] ❌ Erreur lors de l\'initialisation:', error);
  }
});

async function hydrateUserState() {
  try {
    const resp = await fetch("/api/home_suivi_elec/get_user_options");
    const userData = resp.ok ? await resp.json() : {};
    
    stateModule.hydrate({
      reference: {
        useExternal: !!userData.useExternal,
        externalCapteur: userData.externalCapteur ?? "",
        consommationExterne: userData.consommationExterne ?? null,
        mode: userData.mode ?? "capteur"
      },
      user: {
        abonnementHT: userData.abonnementHT ?? 0,
        abonnementTTC: userData.abonnementTTC ?? 0,
        typeContrat: userData.typeContrat ?? "fixe",
        tarifHP: userData.tarifHP ?? 0,
        tarifHC: userData.tarifHC ?? 0,
        tarifFixeHT: userData.tarifFixeHT ?? 0,
        tarifFixeTTC: userData.tarifFixeTTC ?? 0,
        heuresHPDebut: userData.heuresHPDebut ?? "",
        heuresHPFin: userData.heuresHPFin ?? ""
      }
    });
    
    console.log('[app] ✅ État utilisateur hydraté');
  } catch (err) {
    console.error("[app] Erreur hydratation état:", err);
  }
}

async function initializePanels() {
  try {
    // Tentative d'initialisation du panel de référence
    try {
      const { initReferencePanel, rerenderReferencePanel } = await import("../configuration/referencePanel.js");
      initReferencePanel();
      console.log('[app] ✅ Panel de référence initialisé');
      
      // Listener sur changement référence
      on("reference-changed", () => {
        rerenderReferencePanel();
        // Recharger summary si déjà chargé
        if (loadedModules.summary) {
          import('../summary/summary.js').then(({ loadSummary }) => loadSummary());
        }
      });
    } catch (error) {
      console.warn('[app] Panel de référence non disponible:', error.message);
    }
    
    // Tentative d'initialisation du panel de sauvegarde
    try {
      const { initSavePanel } = await import("../save/savePanel.js");
      initSavePanel();
      console.log('[app] ✅ Panel de sauvegarde initialisé');
    } catch (error) {
      console.warn('[app] Panel de sauvegarde non disponible:', error.message);
    }
    
  } catch (error) {
    console.warn('[app] Certains panels ne sont pas disponibles:', error.message);
  }
}

function setupEventListeners() {
  // Listener sur save global
  on("global-save-complete", () => {
    console.log("[app] Save global terminé, rechargement des modules actifs...");
    
    // Recharger les modules déjà chargés
    if (loadedModules.summary) {
      import('../summary/summary.js').then(({ loadSummary }) => loadSummary());
    }
    if (loadedModules.configuration) {
      import('../configuration/configuration.js').then(({ loadConfiguration }) => loadConfiguration());
    }
    if (loadedModules.diagnostics) {
      import('../diagnostics/diagnostics.js').then(({ loadDiagnostics }) => loadDiagnostics());
    }
  });
  
  console.log('[app] ✅ Event listeners configurés');
}

// 🌐 EXPOSITION GLOBALE DES FONCTIONS
window.showTab = showTab;
window.showDiagTab = showDiagTab;
window.loadConfiguration = async () => {
  try {
    const { loadConfiguration } = await import('../configuration/configuration.js');
    return loadConfiguration();
  } catch (error) {
    console.error('[app] Erreur chargement loadConfiguration:', error);
  }
};

console.log('[app] ✅ Module app.js chargé - fonctions exposées globalement');