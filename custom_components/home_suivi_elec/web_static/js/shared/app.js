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
});


// Fonction sous-onglet Diagnostic : à mettre AVANT showTab
window.showDiagTab = async function(tab) {
  document.querySelectorAll('.diag-tab-content').forEach(el => el.style.display = 'none');
  const selected = document.getElementById(tab);
  if (!selected.dataset.loaded) {
    if (tab === 'diag-sensors') {
      const html = await (await fetch('tabs/diagnostic_sensors.html')).text();
      selected.innerHTML = html;
      await loadDiagnosticSensors();
      selected.dataset.loaded = 'true';
    }
  }
  selected.style.display = 'block';
};

// Fonction showTab principale
window.showTab = function(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const selected = document.getElementById(tab);
  if (selected) selected.classList.add('active');

  if (tab === 'diagnostics') {
    loadDiagnostics();
    showDiagTab('diag-sensors');
  } else if (tab === 'detection') {
    loadDetection();
  } else if (tab === 'home') {
    loadSummary();
  } else if (tab === 'configuration') {
    loadConfiguration();
  }
};

// Import du module Génération
import { loadGeneration } from '../generation/generate.js';

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
// Import du module Diagnostics
window.showDiagTab = async function(tab) {
  document.querySelectorAll('.diag-tab-content').forEach(el => el.style.display = 'none');
  const selected = document.getElementById(tab);
  if (!selected.dataset.loaded) {
    if (tab === 'diag-sensors') {
      const html = await (await fetch('tabs/diagnostic_sensors.html')).text();
      selected.innerHTML = html;
      await loadDiagnosticSensors();
      selected.dataset.loaded = 'true';
    }
  }
  selected.style.display = 'block';
};