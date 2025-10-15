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
    await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selections)
    });
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

document.getElementById("typeContrat").onchange = function () {
  document.getElementById("hpHCFields").style.display = this.value === "hp-hc" ? "block" : "none";
};

window.selectAll = function(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
};
window.deselectAll = function(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
};

document.addEventListener("DOMContentLoaded", async () => {
  loadDetection();
  try {
    const resp = await fetch("/api/home_suivi_elec/get_user_options");
    const userData = resp.ok ? await resp.json() : {};
    const typeSel = document.getElementById("typeContrat");
    const hpHCFields = document.getElementById("hpHCFields");
    if (typeSel && hpHCFields) {
      typeSel.value = userData.typeContrat || "fixe";
      hpHCFields.style.display = (typeSel.value === "hp-hc") ? "block" : "none";
    }
    const setVal = (id, v) => { const el = document.getElementById(id); if (el != null && v != null) el.value = v; };
    setVal("abonnementHT", userData.abonnementHT);
    setVal("abonnementTTC", userData.abonnementTTC);
    setVal("tarifHP", userData.tarifHP);
    setVal("tarifHC", userData.tarifHC);
    setVal("heuresHPDebut", userData.heuresHPDebut);
    setVal("heuresHPFin", userData.heuresHPFin);
    const useExt = document.getElementById("useExternalConfig");
    if (useExt) useExt.checked = !!userData.useExternal;
    const capSel = document.getElementById("capteurExterneSelectConfig");
    if (capSel && userData.externalCapteur != null) capSel.value = userData.externalCapteur;
    const consExt = document.getElementById("consommationExterneConfig");
    if (consExt && userData.consommationExterne != null) consExt.value = userData.consommationExterne;
  } catch (e) {
    console.warn("Chargement options UI échoué:", e);
  }
  loadSummary();
  loadConfiguration();
});
