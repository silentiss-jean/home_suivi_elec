// app.js — Assembleur UI (délègue save globale à savePanel)
// ✅ RETOUR ARCHITECTURE FONCTIONNELLE ORIGINALE avec ajouts coordinateurs
"use strict";
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
  console.log('🚀 app.js DOMContentLoaded (Architecture originale réparée)');
  
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
    console.log('✅ État utilisateur hydraté');
  } catch (err) {
    console.error("❌ Erreur hydratation état:", err);
  }

  // Initialisation panels
  console.log('🎛️ Initialisation panels...');
  initReferencePanel();
  initSavePanel();

  // ✅ CHARGEMENTS INITIAUX - COMME DANS L'ORIGINAL
  // ℹ️ PAS de délai, PAS de conditionnels, appel direct
  console.log('📦 Chargements initiaux...');
  loadDetection();
  loadSummary();
  loadConfiguration();
  loadDiagnostics();

  // Listener sur changement reference
  on("reference-changed", () => {
    console.log('🔄 Reference changed, rechargement modules...');
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
  
  console.log('✅ app.js initialisé avec succès (architecture originale)');
});

// ✅ FONCTION SHOWDIAG - COMME DANS L'ORIGINAL
window.showDiagTab = async function(tab) {
  console.log(`🔧 showDiagTab appelé: ${tab}`);
  document.querySelectorAll('.diag-tab-content').forEach(el => el.style.display = 'none');
  const selected = document.getElementById(tab);
  if (selected) {
    if (!selected.dataset.loaded) {
      if (tab === 'diag-sensors') {
        try {
          const html = await (await fetch('tabs/diagnostic_sensors.html')).text();
          selected.innerHTML = html;
          await loadDiagnosticSensors();
          selected.dataset.loaded = 'true';
        } catch (error) {
          console.error('❌ Erreur chargement diag-sensors:', error);
        }
      }
    }
    selected.style.display = 'block';
  }
};

// ✅ FONCTION SHOWTAB PRINCIPALE - AMÉLIORÉE AVEC COORDINATEURS
window.showTab = function(tab) {
  console.log(`📑 showTab appelé: ${tab} (app.js amélioré)`);
  
  // Gestion affichage onglets
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const selected = document.getElementById(tab);
  if (selected) selected.classList.add('active');

  // ✅ NOUVEAU: PRIORITÉ AUX COORDINATEURS, FALLBACK FONCTIONS ORIGINALES
  switch(tab) {
    case 'home':
      // Utilise coordinateur si disponible, sinon fonction originale
      if (typeof window.initHomeTab === 'function') {
        console.log('🏠 Appel coordinateur home');
        window.initHomeTab();
      } else {
        console.log('🏠 Fallback fonction originale home');
        loadSummary();
      }
      break;
      
    case 'diagnostics':
      loadDiagnostics();
      window.showDiagTab('diag-sensors');
      break;
      
    case 'detection':
      if (typeof window.initDetectionTab === 'function') {
        window.initDetectionTab();
      } else {
        loadDetection();
      }
      break;
      
    case 'configuration':
      // Utilise coordinateur si disponible, sinon fonction originale
      if (typeof window.initConfigTab === 'function') {
        console.log('⚙️ Appel coordinateur config');
        window.initConfigTab();
      } else {
        console.log('⚙️ Fallback fonction originale config');
        loadConfiguration();
      }
      break;
      
    case 'customisation':
      console.log('🎨 Onglet customisation');
      break;
      
    case 'generation':
      console.log('🧩 Onglet génération');
      break;
  }
};

// Import du module Génération avec garde
try {
  import('./modules/generate.js').then(({ loadGeneration }) => {
    // Hook sur le bouton de l'onglet Génération
    document.addEventListener('DOMContentLoaded', () => {
      const generateTab = document.querySelector('button[onclick*="generation"]');
      if (generateTab && !generateTab.dataset.initialized) {
        generateTab.addEventListener('click', async () => {
          const container = document.getElementById('generation');
          if (container && !container.dataset.loaded) {
            try {
              const response = await fetch('tabs/generate.html');
              const html = await response.text();
              container.innerHTML = html;
              container.dataset.loaded = 'true';
              
              await loadGeneration();
            } catch (error) {
              console.error('❌ Erreur chargement onglet Génération:', error);
            }
          }
        });
        generateTab.dataset.initialized = 'true';
      }
    });
  });
} catch (error) {
  console.warn('⚠️ Module generate.js non disponible:', error.message);
}

console.log('✅ app.js chargé (architecture originale + coordinateurs en fallback)');
