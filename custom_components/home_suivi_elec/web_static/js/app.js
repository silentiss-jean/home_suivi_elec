import { loadSummary } from './summary.js';
import { loadDetection } from './detection.js';
import { loadConfiguration } from './configuration.js';

document.getElementById("refreshHome").onclick = loadSummary;
document.getElementById("refreshDetection").onclick = loadDetection;

document.getElementById("saveSelection").onclick = async function() {
  const selections = {};
  document.querySelectorAll("#content-configuration input[type='checkbox']").forEach(cb => {
    const integ = cb.dataset.integration;
    selections[integ] ??= [];
    selections[integ].push({ entity_id: cb.dataset.entityId, enabled: cb.checked });
  });

  const userData = {
    abonnementHT: parseFloat(document.getElementById("abonnementHT").value) || 0,
    abonnementTTC: parseFloat(document.getElementById("abonnementTTC").value) || 0,
    typeContrat: document.getElementById("typeContrat").value,
    tarifHP: parseFloat(document.getElementById("tarifHP").value) || 0,
    tarifHC: parseFloat(document.getElementById("tarifHC").value) || 0,
    heuresHPDebut: document.getElementById("heuresHPDebut").value || "",
    heuresHPFin: document.getElementById("heuresHPFin").value || "",
    useExternal: document.getElementById("useExternalConfig")?.checked ?? false,
    externalCapteur: document.getElementById("capteurExterneSelectConfig")?.value || "",
    consommationExterne: parseFloat(document.getElementById("consommationExterneConfig")?.value) || 0,
    selection: selections
  };

  try {
    await fetch("/api/home_suivi_elec/save_user_options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    alert("💾 Données sauvegardées !");
    await loadSummary();
    await loadConfiguration();
  } catch (err) {
    alert("❌ Erreur sauvegarde configuration");
    console.error(err);
  }
};

// Toggle HP/HC
document.getElementById("typeContrat").onchange = function () {
  document.getElementById("hpHCFields").style.display =
    this.value === "hp-hc" ? "block" : "none";
};

// Sélection globale
window.selectAll = function(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
};
window.deselectAll = function(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
};

// Chargement automatique
document.addEventListener("DOMContentLoaded", () => {
  loadDetection();
  loadSummary();
  loadConfiguration();
});