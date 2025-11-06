// app.js — Assembleur UI (délègue save globale à savePanel)
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
});


// Fonction showTab principale
window.showTab = function(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const selected = document.getElementById(tab);
  if (selected) selected.classList.add('active');

  if (tab === 'diagnostics') {
    loadDiagnostics();
  } else if (tab === 'detection') {
    loadDetection();
  } else if (tab === 'home') {
    loadSummary();
  } else if (tab === 'configuration') {
    loadConfiguration();
  }
};

window.showDiagTab = async function(tab) {
    console.log(`[showDiagTab] Switching to: ${tab}`);
    
    // Cache tous les sous-onglets diagnostic
    document.querySelectorAll('.diag-tab-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // Trouve le container du sous-onglet
    const container = document.getElementById(tab);
    if (!container) {
        console.error(`❌ Container #${tab} not found`);
        return;
    }
    
    // Affiche le sous-onglet
    container.style.display = 'block';
    
    // Charge dynamiquement si pas encore chargé
    if (!container.dataset.loaded) {
        try {
            // ✅ Charge fragment HTML
            const response = await fetch(`tabs/diagnostic_${tab}.html`);
            const html = await response.text();
            container.innerHTML = html;
            
            // ✅ Charge module JS correspondant AVEC CONTAINER
            if (tab === "capteurs") {
                const { loadCapteursSensor } = await import('./diagnostic_modules/capteursSensor.js');
                await loadCapteursSensor(container);  // ✅ AVEC CONTAINER !
            } else if (tab === "integrations") {
                const { loadIntegrations } = await import('./diagnostic_modules/integrations.js');
                await loadIntegrations(container);    // ✅ AVEC CONTAINER !
            }
            
            container.dataset.loaded = 'true';
        } catch (error) {
            console.error(`❌ Erreur chargement ${tab}:`, error);
            container.innerHTML = `<div class="error">Erreur chargement ${tab}</div>`;
        }
    }
};


// Import du module Génération
import { loadGeneration } from './modules/generate.js';

// Charger l'onglet Génération au DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Hook sur le bouton de l'onglet Génération
  const generateTab = document.querySelector('button[onclick*="generation"]');
  if (generateTab) {
    generateTab.addEventListener('click', async () => {
      // Charger le contenu de l'onglet
      const container = document.getElementById('generation');
      if (container && !container.dataset.loaded) {
        try {
          const response = await fetch('tabs/generate.html');
          const html = await response.text();
          container.innerHTML = html;
          container.dataset.loaded = 'true';
          
          // Initialiser le module
          await loadGeneration();
        } catch (error) {
          console.error('❌ Erreur chargement onglet Génération:', error);
        }
      }
    });
  }
});