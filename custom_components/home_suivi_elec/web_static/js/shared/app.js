// app.js — Assembleur UI (délègue save globale à savePanel)
"use strict";

import { initAuth } from "./auth.js";
import { loadSummary } from '../summary/summary.js';
import { loadDetection } from '../detection/detection.js';
import { loadConfiguration } from '../configuration/configuration.js';
import { loadDiagnostics } from '../diagnostics/diagnostics.js';
import stateModule from "./stateModule.js";
import { on } from "./eventBus.js";
import { initReferencePanel, rerenderReferencePanel } from "../configuration/referencePanel.js";
import { initSavePanel } from "../save/savePanel.js";
import { loadDiagnosticSensors } from "../diagnostics/diagnosticSensors.js";
import { loadGeneration } from '../generation/generate.js';

// 🔧 FONCTION showTab PRINCIPALE AMÉLIORÉE
function showTab(tab) {
  console.log(`[showTab] Changement vers: ${tab}`);
  
  // Masquer tous les onglets principaux
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.remove('active');
  });
  
  // Afficher l'onglet sélectionné
  const selected = document.getElementById(tab);
  if (!selected) {
    console.error(`[showTab] ❌ Élément ${tab} non trouvé dans le DOM`);
    return;
  }
  
  selected.classList.add('active');
  console.log(`[showTab] ✅ Onglet ${tab} activé`);

  // Charger le contenu spécifique selon l'onglet
  if (tab === 'diagnostics') {
    loadDiagnostics();
    // Attendre un court délai pour que le DOM soit mis à jour
    setTimeout(() => {
      const diagElement = document.getElementById('diag-sensors');
      if (diagElement && typeof showDiagTab === 'function') {
        showDiagTab('diag-sensors');
      } else {
        console.warn('[showTab] diag-sensors non trouvé, retry dans 500ms');
        setTimeout(() => {
          if (typeof showDiagTab === 'function') {
            showDiagTab('diag-sensors');
          }
        }, 500);
      }
    }, 100);
  } else if (tab === 'detection') {
    loadDetection();
  } else if (tab === 'home') {
    loadSummary();
  } else if (tab === 'configuration') {
    console.log('[showTab] Chargement configuration...');
    loadConfiguration();
  }
}

// 🔧 FONCTION showDiagTab UNIQUE ET CORRIGÉE
function showDiagTab(tab) {
  console.log(`[showDiagTab] Changement vers: ${tab}`);
  
  // Masquer tous les contenus des sous-onglets
  document.querySelectorAll('.diag-tab-content').forEach(el => {
    el.style.display = 'none';
  });
  
  // Trouver et afficher le sous-onglet sélectionné
  const selected = document.getElementById(tab);
  if (!selected) {
    console.error(`[showDiagTab] ❌ Élément ${tab} non trouvé dans le DOM`);
    return;
  }
  
  // Charger le contenu si nécessaire
  if (!selected.dataset.loaded) {
    if (tab === 'diag-sensors') {
      loadDiagnosticSensors().then(() => {
        selected.dataset.loaded = 'true';
        console.log(`[showDiagTab] ✅ Contenu ${tab} chargé avec succès`);
      }).catch(error => {
        console.error(`[showDiagTab] ❌ Erreur chargement ${tab}:`, error);
        selected.innerHTML = '<p class="error">❌ Erreur de chargement du contenu</p>';
      });
    }
  }
  
  selected.style.display = 'block';
  console.log(`[showDiagTab] ✅ Onglet ${tab} affiché`);
}

document.addEventListener("DOMContentLoaded", async () => {
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

  // Chargements initiaux - SEULEMENT pour onglets visibles au démarrage
  loadDetection();
  loadSummary();
  // ✅ SUPPRIMÉ: loadConfiguration(); // Se charge à l'ouverture de l'onglet
  // ✅ SUPPRIMÉ: loadDiagnostics(); // Se charge à l'ouverture de l'onglet

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

  // Hook sur le bouton de l'onglet Génération
  const generateTab = document.querySelector('button[onclick*="generation"]');
  if (generateTab) {
    generateTab.addEventListener('click', async () => {
      // Charger le contenu de l'onglet
      const container = document.getElementById('generation');
      if (container && !container.dataset.loaded) {
        try {
          await loadGeneration();
          container.dataset.loaded = 'true';
        } catch (error) {
          console.error('❌ Erreur chargement onglet Génération:', error);
        }
      }
    });
  }

  console.log('[APP] ✅ Module app.js chargé - initialisation terminée');
});

// ✅ EXPOSER LES FONCTIONS GLOBALEMENT (important pour onclick="showTab(...)")
window.showTab = showTab;
window.showDiagTab = showDiagTab;
window.loadConfiguration = loadConfiguration;

console.log('[APP] ✅ Module app.js chargé - fonctions showTab et showDiagTab exposées globalement');