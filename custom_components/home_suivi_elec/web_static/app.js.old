// -*- coding: utf-8 -*-
// === 🏠 PAGE HOME / RÉSUMÉ & DÉTECTION & CONFIGURATION ===

// Helper : normalise la réponse get_sensors en { integration: [sensors...] }
function normalizeSensors(sensorsRaw) {
  if (!sensorsRaw) return {};
  if (Array.isArray(sensorsRaw)) {
    return sensorsRaw.reduce((acc, c) => {
      const integ = c.integration || "unknown";
      acc[integ] ??= [];
      acc[integ].push(c);
      return acc;
    }, {});
  }
  if (typeof sensorsRaw === "object") return sensorsRaw;
  return {};
}

function countTotalFromGrouped(grouped) {
  return Object.values(grouped).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
}

function findSensorValue(entityId, grouped) {
  for (const list of Object.values(grouped)) {
    if (!Array.isArray(list)) continue;
    const s = list.find(x => x.entity_id === entityId);
    if (s) return Number(s.value ?? 0);
  }
  return 0;
}

// --- Résumé général ---
async function loadSummary() {
  const summaryMessage = document.getElementById("summaryMessage");
  const summaryData = document.getElementById("summaryData");
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const coutHT = document.getElementById("coutHT");
  const coutTTC = document.getElementById("coutTTC");
  const consommationW = document.getElementById("consommationW");
  const deltaConsommation = document.getElementById("deltaConsommation");
  const refreshSpan = document.getElementById("dernierRefresh");

  try {
    const [sensorsResp, optionsResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/api/home_suivi_elec/get_user_options")
    ]);

    if (!sensorsResp.ok) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Aucune détection de capteurs disponible.";
      summaryData.style.display = "none";
      return;
    }

    const sensorsRaw = await sensorsResp.json();
    const groupedSensors = normalizeSensors(sensorsRaw);
    const totalSensors = countTotalFromGrouped(groupedSensors);

    const userData = optionsResp.ok ? await optionsResp.json() : {};
    const selectionData = userData.selection || {};

    if (!selectionData || Object.keys(selectionData).length === 0) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Aucune configuration sauvegardée pour le moment.";
      summaryData.style.display = "none";
      return;
    }

    let actifs = 0;
    let consommationTotale = 0;
    for (const [integration, list] of Object.entries(selectionData)) {
      for (const s of list) {
        if (s.enabled) {
          actifs += 1;
          const val = findSensorValue(s.entity_id, groupedSensors);
          consommationTotale += Number(val || 0);
        }
      }
    }

    let delta = 0;
    if (userData.consommationExterne && userData.useExternal) {
      delta = Number(userData.consommationExterne) - consommationTotale;
    }

    totalSpan.textContent = totalSensors;
    actifsSpan.textContent = `${actifs} / ${totalSensors}`;
    coutHT.textContent = userData.abonnementHT != null ? `${Number(userData.abonnementHT).toFixed(2)} €` : "0 €";
    coutTTC.textContent = userData.abonnementTTC != null ? `${Number(userData.abonnementTTC).toFixed(2)} €` : "0 €";
    consommationW.textContent = `${consommationTotale.toFixed(2)} W`;
    deltaConsommation.textContent = `${delta.toFixed(2)} W`;
    refreshSpan.textContent = new Date().toLocaleTimeString();

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";

  } catch (err) {
    console.error("Erreur chargement résumé:", err);
    summaryMessage.style.display = "block";
    summaryMessage.textContent = "Erreur lors du chargement du résumé";
    summaryData.style.display = "none";
  }
}

// --- Détection des capteurs ---
async function loadDetection() {
  const content = document.getElementById("content-detection");
  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensorsRaw = await resp.json();
    const grouped = normalizeSensors(sensorsRaw);

    content.innerHTML = "";
    let total = 0;
    for (const [integration, list] of Object.entries(grouped)) {
      total += Array.isArray(list) ? list.length : 0;
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>`;
      (list || []).forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor";
        const displayValue = c.value ?? 0;
        const displayUnit = c.unit || "?";
        div.textContent = `${c.friendly_name} — ${c.area || "?"} [${displayValue} ${displayUnit}]`;
        block.appendChild(div);
      });
      content.appendChild(block);
    }

    document.getElementById("total").textContent = total;
    document.getElementById("lastRefresh").textContent = new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Erreur détection:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// --- Configuration ---
async function loadConfiguration() {
  const content = document.getElementById("content-configuration");
  content.innerHTML = "Chargement...";
  try {
    const [sensorsResp, optionsResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/api/home_suivi_elec/get_user_options")
    ]);

    const sensorsRaw = sensorsResp.ok ? await sensorsResp.json() : [];
    const grouped = normalizeSensors(sensorsRaw);

    const userData = optionsResp.ok ? await optionsResp.json() : {};
    let selectionData = userData.selection || {};

    if (!selectionData || Object.keys(selectionData).length === 0) {
      selectionData = {};
      for (const [integration, list] of Object.entries(grouped)) {
        selectionData[integration] = (list || []).map(c => ({ entity_id: c.entity_id, enabled: false }));
      }
    }

    content.innerHTML = "";

    // --- Bloc capteurs externes ---
    const useExternal = userData.useExternal ?? false;
    const externalCapteur = userData.externalCapteur || "";
    const externalBlock = document.createElement("div");
    externalBlock.id = "externalBlock";
    externalBlock.className = "card";
    externalBlock.innerHTML = `
      <label>
        <input type="checkbox" id="useExternalConfig" ${useExternal ? "checked" : ""}>
        Utiliser une mesure externe (clé Atome / saisie manuelle)
      </label>
      <div id="externalFieldsConfig" style="display:${useExternal ? "block" : "none"}">
        <label>Capteur Home Assistant :
          <select id="capteurExterneSelectConfig"></select>
        </label>
        <label>ou saisie manuelle (W relevés) :
          <input type="number" id="consommationExterneConfig" value="${userData.consommationExterne || 0}">
        </label>
        <button id="saveExternal" class="primary">💾 Sauvegarder capteur externe</button>
      </div>
    `;
    content.appendChild(externalBlock);

    const selectExterne = document.getElementById("capteurExterneSelectConfig");
    for (const list of Object.values(grouped)) {
      (list || []).forEach(c => {
        const option = document.createElement("option");
        option.value = c.entity_id;
        option.textContent = `${c.friendly_name} — ${c.area || "?"}`;
        if (c.entity_id === externalCapteur) option.selected = true;
        selectExterne.appendChild(option);
      });
    }

    // --- Sauvegarde capteur externe ---
    document.getElementById("saveExternal").onclick = async function() {
      try {
        const newExternal = document.getElementById("capteurExterneSelectConfig").value;
        const useExt = document.getElementById("useExternalConfig").checked;
        const data = {
          externalCapteur: newExternal,
          useExternal: useExt,
          consommationExterne: parseFloat(document.getElementById("consommationExterneConfig").value) || 0,
          selection: selectionData
        };
        await fetch("/api/home_suivi_elec/save_user_options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        await loadConfiguration();
        alert("💾 Capteur externe sauvegardé !");
      } catch (err) {
        console.error(err);
        alert("❌ Erreur sauvegarde capteur externe");
      }
    };

    // --- Toggle externe ---
    document.getElementById("useExternalConfig").onchange = function() {
      document.getElementById("externalFieldsConfig").style.display = this.checked ? "block" : "none";
    };

    // --- Bloc capteurs principaux ---
    for (const [integration, list] of Object.entries(grouped)) {
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;
      (list || []).forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectionData[integration]?.find(s => s.entity_id === c.entity_id)?.enabled ?? false;
        checkbox.disabled = c.entity_id === externalCapteur; // inselectionnable si externe
        checkbox.dataset.integration = integration;
        checkbox.dataset.entityId = c.entity_id;
        div.append(checkbox, document.createTextNode(` ${c.friendly_name} — ${c.area || "?"} [${c.value ?? 0} ${c.unit || "?"}]`));
        block.appendChild(div);
      });
      content.appendChild(block);
    }

  } catch (err) {
    console.error("Erreur config:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// --- Sauvegarde globale ---
document.getElementById("saveSelection").onclick = async function() {
  try {
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

    await Promise.all([
      fetch("/api/home_suivi_elec/save_user_options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      }),
      fetch("/api/home_suivi_elec/save_selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selections)
      })
    ]);

    alert("💾 Données sauvegardées !");
    await loadSummary();
    await loadConfiguration();

  } catch (err) {
    alert("❌ Erreur sauvegarde configuration");
    console.error(err);
  }
};

// --- Toggle HP/HC ---
document.getElementById("typeContrat").onchange = function () {
  document.getElementById("hpHCFields").style.display =
    this.value === "hp-hc" ? "block" : "none";
};

// --- Sélection globale ---
function selectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
}
function deselectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
}

// --- Boutons de rafraîchissement ---
document.getElementById("refreshHome").onclick = loadSummary;
document.getElementById("refreshDetection").onclick = loadDetection;

// --- Chargement automatique ---
document.addEventListener("DOMContentLoaded", () => {
  loadDetection();
  loadSummary();
  loadConfiguration();
});