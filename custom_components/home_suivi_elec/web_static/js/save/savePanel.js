// savePanel.js — Panel de sauvegarde globale (déclenché par bouton global)
"use strict";

import { getSensors, getUserOptions, saveSelection, saveUserOptions } from "../configuration/configuration.api.js";
import { emit } from "../shared/eventBus.js";
import { toast } from "../shared/uiToast.js";

let isSaving = false;

/**
 * Initialise le panel de sauvegarde global.
 */
export function initSavePanel() {
  const button = document.getElementById("globalSave");
  if (!button) {
    console.warn("[savePanel] Bouton #globalSave introuvable");
    return;
  }

  button.addEventListener("click", performGlobalSave);
  console.log("[savePanel] Inité");
}

/**
 * Sauvegarde globale : options utilisateur + sélection + émission d'événements.
 */
async function performGlobalSave() {
  if (isSaving) {
    toast.warning("Sauvegarde en cours...");
    return;
  }
  
  isSaving = true;
  
  try {
    toast.info("Début de la sauvegarde globale...");
    
    // 1. Récupérer les données utilisateur depuis les champs UI
    const userOptions = collectUserOptions();
    console.log("[savePanel] Options utilisateur collectées:", userOptions);
    
    // 2. Récupérer les sélections depuis les checkboxes
    const selections = collectSelections();
    console.log("[savePanel] Sélections collectées:", selections);
    
    // 3. Sauvegarder les options utilisateur
    await saveUserOptions(userOptions);
    console.log("[savePanel] ✅ Options utilisateur sauvegardées");
    
    // 4. Sauvegarder les sélections
    const selectionResult = await saveSelection(selections);
    console.log("[savePanel] ✅ Sélections sauvegardées:", selectionResult);
    
    // 5. Émettre l'événement de complétion
    emit("global-save-complete", {
      userOptions,
      selections,
      timestamp: new Date().toISOString()
    });
    
    toast.success("✅ Sauvegarde globale réussie !");
    
  } catch (error) {
    console.error("[savePanel] Erreur sauvegarde globale:", error);
    toast.error("❌ Erreur lors de la sauvegarde globale");
  } finally {
    isSaving = false;
  }
}

/**
 * Collecte les options utilisateur depuis l'UI.
 */
function collectUserOptions() {
  const options = {};
  
  // Configuration tarifaire
  const typeContrat = document.querySelector('input[name="typeContrat"]:checked')?.value;
  if (typeContrat) options.typeContrat = typeContrat;
  
  const abonnementHT = document.getElementById("abonnementHT")?.value;
  if (abonnementHT) options.abonnementHT = Number(abonnementHT);
  
  const abonnementTTC = document.getElementById("abonnementTTC")?.value;
  if (abonnementTTC) options.abonnementTTC = Number(abonnementTTC);
  
  if (typeContrat === "fixe") {
    const tarifFixeHT = document.getElementById("tarifFixeHT")?.value;
    if (tarifFixeHT) options.tarifFixeHT = Number(tarifFixeHT);
    
    const tarifFixeTTC = document.getElementById("tarifFixeTTC")?.value;
    if (tarifFixeTTC) options.tarifFixeTTC = Number(tarifFixeTTC);
  } else if (typeContrat === "hp-hc") {
    const tarifHP = document.getElementById("tarifHP")?.value;
    if (tarifHP) options.tarifHP = Number(tarifHP);
    
    const tarifHC = document.getElementById("tarifHC")?.value;
    if (tarifHC) options.tarifHC = Number(tarifHC);
    
    const heuresHPDebut = document.getElementById("heuresHPDebut")?.value;
    if (heuresHPDebut) options.heuresHPDebut = heuresHPDebut;
    
    const heuresHPFin = document.getElementById("heuresHPFin")?.value;
    if (heuresHPFin) options.heuresHPFin = heuresHPFin;
  }
  
  // Capteur de référence
  const useExternal = document.getElementById("useExternal")?.checked;
  options.useExternal = !!useExternal;
  
  if (useExternal) {
    const mode = document.querySelector('input[name="referenceMode"]:checked')?.value;
    if (mode) options.mode = mode;
    
    if (mode === "capteur") {
      const externalCapteur = document.getElementById("externalCapteur")?.value;
      if (externalCapteur) options.externalCapteur = externalCapteur;
    } else if (mode === "manuel") {
      const consommationExterne = document.getElementById("consommationExterne")?.value;
      if (consommationExterne) options.consommationExterne = Number(consommationExterne);
    }
  }
  
  return options;
}

/**
 * Collecte les sélections de capteurs depuis les checkboxes.
 */
function collectSelections() {
  const selections = {};
  
  document.querySelectorAll("input.capteur-checkbox").forEach(checkbox => {
    const integration = checkbox.dataset.integration || "unknown";
    const entityId = checkbox.dataset.entity;
    
    if (!entityId) return;
    
    if (!selections[integration]) {
      selections[integration] = [];
    }
    
    selections[integration].push({
      entity_id: entityId,
      enabled: checkbox.checked
    });
  });
  
  return selections;
}
