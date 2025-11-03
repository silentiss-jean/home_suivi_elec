// app.js — Assembleur UI (délègue save globale à savePanel)
"use strict";

// 🎛️ FLAGS DE CONTRÔLE POUR MIGRATION PROGRESSIVE
window.HSE_FLAGS = {
  diag_v2: false,  // Mode conservateur par défaut
  debug: false     // Logs détaillés si besoin
};

import { initAuth } from "./auth.js";
import { loadSummary } from './summary.js';
import { loadDetection } from './detection.js';
import { loadConfiguration } from './configuration.js';
import { loadDiagnostics } from './diagnostics.js';
import stateModule from "./stateModule.js";
import { on } from "./eventBus.js";
import { initReferencePanel, rerenderReferencePanel } from "./referencePanel.js";
import { initSavePanel } from "./savePanel.js";
import { loadDiagnosticSensors } from "./modules/diagnosticSensors.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (window.HSE_FLAGS.debug) console.log('🚀 HSE app.js initialisation...');
  
  // Hydrate état utilisateur
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
  } catch (err) {
    console.error("Erreur hydratation état:", err);
  }

  // Initialisation panels
  initReferencePanel();
  initSavePanel();

  // Chargements initiaux
  loadDetection();
  loadSummary();
  loadConfiguration();
  loadDiagnostics();

  // Listener sur changement reference
  on("reference-changed", () => {
    rerenderReferencePanel();
    loadSummary();
  });

  // Listener sur save (déclenché par savePanel)
  on("global-save-complete", () => {
    console.log("[APP] Save global terminé, rechargement...");
    loadSummary();
    loadConfiguration();
    loadDiagnostics();
  });
  
  if (window.HSE_FLAGS.debug) console.log('✅ HSE app.js initialisé');
});

// 🔧 NAVIGATION SOUS-ONGLETS DIAGNOSTIC (source unique)
window.showDiagTab = async function(tab) {
  if (window.HSE_FLAGS.debug) console.log(`🔧 showDiagTab: ${tab}`);
  
  document.querySelectorAll('.diag-tab-content').forEach(el => el.style.display = 'none');
  const selected = document.getElementById(tab);
  
  if (selected) {
    // Lazy loading pour éviter surcharge initiale
    if (!selected.dataset.loaded) {
      try {
        switch(tab) {
          case 'diag-sensors':
            if (window.HSE_FLAGS.diag_v2) {
              // 🆕 Version enrichie (Phase 1+)
              const { loadDiagnosticSensorsGrouped } = await import('./diagnostics-sensors-grouped.js');
              await loadDiagnosticSensorsGrouped();
            } else {
              // 📜 Version classique (fallback)
              const html = await (await fetch('tabs/diagnostic_sensors.html')).text();
              selected.innerHTML = html;
              await loadDiagnosticSensors();
            }
            break;
            
          case 'diag-integrations':
            // 🔄 À implémenter Phase 2
            selected.innerHTML = '<div class="card"><h3>🔌 État des Intégrations</h3><p>🔄 En cours de développement...</p></div>';
            break;
            
          case 'diag-logs':
            // 📜 À implémenter Phase 2  
            selected.innerHTML = '<div class="card"><h3>📜 Logs Système</h3><p>🔄 En cours de développement...</p></div>';
            break;
            
          case 'diag-apis':
            // 🌐 À implémenter Phase 2
            selected.innerHTML = '<div class="card"><h3>🌐 Santé Backend</h3><p>🔄 En cours de développement...</p></div>';
            break;
            
          case 'diag-flow':
            // 📊 À implémenter Phase 2
            selected.innerHTML = '<div class="card"><h3>📊 Flux Système</h3><p>🔄 En cours de développement...</p></div>';
            break;
        }
        
        selected.dataset.loaded = 'true';
        
      } catch (error) {
        console.error(`❌ Erreur chargement ${tab}:`, error);
        selected.innerHTML = `<div class="card"><h3>❌ Erreur</h3><p>Impossible de charger ${tab}: ${error.message}</p></div>`;
      }
    }
    
    selected.style.display = 'block';
  }
};

// 📋 NAVIGATION PRINCIPALE (source unique)
window.showTab = function(tab) {
  if (window.HSE_FLAGS.debug) console.log(`📋 showTab: ${tab}`);
  
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const selected = document.getElementById(tab);
  if (selected) selected.classList.add('active');

  switch(tab) {
    case 'diagnostics':
      loadDiagnostics();
      showDiagTab('diag-sensors');
      break;
    case 'detection':
      loadDetection();
      break;
    case 'home':
      loadSummary();
      break;
    case 'configuration':
      loadConfiguration();
      break;
    case 'customisation':
      if (window.HSE_FLAGS.debug) console.log('🎨 Onglet customisation');
      break;
    case 'generation':
      // Import dynamique du module génération
      try {
        const { loadGeneration } = await import('./modules/generate.js');
        const container = document.getElementById('generation');
        if (container && !container.dataset.loaded) {
          const response = await fetch('tabs/generate.html');
          const html = await response.text();
          container.innerHTML = html;
          container.dataset.loaded = 'true';
          await loadGeneration();
        }
      } catch (error) {
        console.error('❌ Erreur chargement génération:', error);
      }
      break;
  }
};

// 🛠️ CONTRÔLES DÉVELOPPEUR (dev only)
if (window.location.hostname === '192.168.3.160' || window.location.hostname === 'localhost') {
  // Raccourcis clavier pour debug
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
      switch(e.key) {
        case 'D': // Ctrl+Shift+D = toggle debug
          window.HSE_FLAGS.debug = !window.HSE_FLAGS.debug;
          console.log(`🐛 Debug mode: ${window.HSE_FLAGS.debug}`);
          e.preventDefault();
          break;
        case 'V': // Ctrl+Shift+V = toggle diag v2
          window.HSE_FLAGS.diag_v2 = !window.HSE_FLAGS.diag_v2;
          console.log(`🔧 Diag v2 mode: ${window.HSE_FLAGS.diag_v2}`);
          e.preventDefault();
          break;
      }
    }
  });
}
