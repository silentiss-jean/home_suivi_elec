// app.js — Assembleur UI (délègue save globale à savePanel)
// ✅ VERSION FIXÉE - Ajout gardes pour éviter conflits navigation
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

// ✅ FIX 1: GARDE - Éviter redéfinition des fonctions de navigation
let navigationInitialized = false;

document.addEventListener("DOMContentLoaded", async () => {
  console.log('🚀 app.js DOMContentLoaded - Démarrage contrôlé (Version Fix)');
  
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

  // ✅ FIX 2: Chargements initiaux UNIQUEMENT si pas de coordinateurs
  // Attendre un peu pour que les coordinateurs de index.html s'initialisent d'abord
  setTimeout(() => {
    if (!window.initHomeTab || !window.initConfigTab) {
      console.log('⚠️ Coordinateurs non disponibles, chargement legacy...');
      loadDetection();
      loadSummary();
      loadConfiguration();
      loadDiagnostics();
    } else {
      console.log('✅ Coordinateurs détectés, chargements délégués aux coordinateurs');
    }
  }, 500);

  // Listener sur changement reference
  on("reference-changed", () => {
    console.log('🔄 Reference changed, rechargement modules...');
    rerenderReferencePanel();
    // Déléguer aux coordinateurs si disponibles
    if (typeof window.refreshHomeTab === 'function') {
      window.refreshHomeTab();
    } else {
      loadSummary();
    }
  });

  // Listener sur save (déclenché par savePanel)
  on("global-save-complete", () => {
    console.log("[APP] Save global terminé, rechargement...");
    // Déléguer aux coordinateurs si disponibles
    if (typeof window.refreshHomeTab === 'function') {
      window.refreshHomeTab();
    } else {
      loadSummary();
    }
    if (typeof window.refreshConfigTab === 'function') {
      window.refreshConfigTab();
    } else {
      loadConfiguration();
    }
    loadDiagnostics();
  });
  
  console.log('✅ app.js initialisé avec succès (mode cohabitation coordinateurs)');
});

// ✅ FIX 3: GARDE - Fonction showDiagTab UNIQUEMENT si pas déjà définie
if (!window.showDiagTab) {
  window.showDiagTab = async function(tab) {
    console.log(`🔧 showDiagTab appelé: ${tab} (depuis app.js)`);
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
} else {
  console.log('ℹ️ showDiagTab déjà définie (probablement par index.html)');
}

// ✅ FIX 4: GARDE - Fonction showTab UNIQUEMENT si pas déjà définie
if (!window.showTab) {
  window.showTab = function(tab) {
    console.log(`📑 showTab appelé: ${tab} (depuis app.js - fallback)`);
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const selected = document.getElementById(tab);
    if (selected) selected.classList.add('active');

    // Chargements selon onglet
    switch(tab) {
      case 'diagnostics':
        loadDiagnostics();
        if (window.showDiagTab) window.showDiagTab('diag-sensors');
        break;
      case 'detection':
        loadDetection();
        break;
      case 'home':
        if (typeof window.initHomeTab === 'function') {
          window.initHomeTab();
        } else {
          loadSummary();
        }
        break;
      case 'configuration':
        if (typeof window.initConfigTab === 'function') {
          window.initConfigTab();
        } else {
          loadConfiguration();
        }
        break;
    }
  };
} else {
  console.log('ℹ️ showTab déjà définie (probablement par index.html)');
}

// ✅ FIX 5: Import du module Génération avec garde
try {
  const { loadGeneration } = await import('./modules/generate.js');
  
  // Hook sur le bouton de l'onglet Génération - avec garde
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
} catch (error) {
  console.warn('⚠️ Module generate.js non disponible:', error.message);
}

// ✅ FIX 6: Éviter duplication showDiagTab en fin de fichier
// (Ligne supprimée car déjà gérée avec garde ci-dessus)

console.log('✅ app.js chargé (version avec gardes navigation)');
