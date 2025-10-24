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

// Fonction showTab globale (appelée depuis index.html)
window.showTab = function(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const selected = document.getElementById(tab);
  if (selected) selected.classList.add('active');
  
  // Charger les données de l'onglet si nécessaire
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