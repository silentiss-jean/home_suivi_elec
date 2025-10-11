// -*- coding: utf-8 -*-
// === 🏠 PAGE HOME / RÉSUMÉ & DÉTECTION & CONFIGURATION ===

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
    const base = "/local/community/home_suivi_elec/data";
    const [powerResp, selectionResp, userResp] = await Promise.all([
      fetch(`${base}/capteurs_power.json`),
      fetch(`${base}/capteurs_selection.json`),
      fetch(`${base}/user_config.json`)
    ]);

    if (!powerResp.ok || !selectionResp.ok) {
      summaryMessage.style.display = "block";
      summaryData.style.display = "none";
      return;
    }

    const powerData = await powerResp.json();
    const selectionData = await selectionResp.json();
    const userData = userResp.ok ? await userResp.json() : {};

    let total = Array.isArray(powerData) ? powerData.length : 0;
    let actifs = 0;
    let consommationTotale = 0;

    for (const integ of Object.values(selectionData)) {
      actifs += integ.filter(c => c.enabled).length;
      consommationTotale += integ
        .filter(c => c.enabled)
        .reduce((sum, c) => sum + (c.value || 0), 0);
    }

    let delta = 0;
    if (userData.consommationExterne && userData.useExternal) {
      delta = userData.consommationExterne - consommationTotale;
    }

    totalSpan.textContent = total;
    actifsSpan.textContent = `${actifs} / ${total}`;
    coutHT.textContent = userData.abonnementHT ? `${userData.abonnementHT.toFixed(2)} €` : "-";
    coutTTC.textContent = userData.abonnementTTC ? `${userData.abonnementTTC.toFixed(2)} €` : "-";
    consommationW.textContent = `${consommationTotale.toFixed(2)} W`;
    deltaConsommation.textContent = `${delta.toFixed(2)} W`;
    refreshSpan.textContent = new Date().toLocaleTimeString();

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";

  } catch (err) {
    console.error("Erreur chargement résumé:", err);
    summaryMessage.style.display = "block";
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
    const sensors = await resp.json();
    content.innerHTML = "";
    let total = 0;

    for (const [integration, list] of Object.entries(sensors)) {
      total += list.length;
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>`;
      list.forEach(c => {
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
    const base = "/local/community/home_suivi_elec/data";
    const [powerResp, selectionResp, userResp] = await Promise.all([
      fetch(`${base}/capteurs_power.json`),
      fetch(`${base}/capteurs_selection.json`),
      fetch(`${base}/user_config.json`)
    ]);

    if (!powerResp.ok || !selectionResp.ok || !userResp.ok) {
      content.innerHTML = "<p style='color:red'>⛔ Fichiers de configuration manquants.</p>";
      return;
    }

    const powerData = await powerResp.json();
    const selectionData = await selectionResp.json();
    const userData = await userResp.json();

    content.innerHTML = "";
    for (const [integration, list] of Object.entries(powerData.reduce((acc, c) => {
      const integ = c.integration || "unknown";
      acc[integ] ??= [];
      acc[integ].push(c);
      return acc;
    }, {}))) {
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;
      list.forEach(c => {
        if (userData.externalCapteur && c.entity_id === userData.externalCapteur) return;
        const div = document.createElement("div");
        div.className = "sensor";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectionData[integration]?.find(s => s.entity_id === c.entity_id)?.enabled ?? false;
        checkbox.dataset.integration = integration;
        checkbox.dataset.entityId = c.entity_id;
        div.append(checkbox, document.createTextNode(` ${c.friendly_name} — ${c.area || "?"} [${c.value ?? 0} ${c.unit || "?"}]`));
        block.appendChild(div);
      });
      content.appendChild(block);
    }

    // Données utilisateur
    document.getElementById("abonnementHT").value = userData.abonnementHT ?? 0;
    document.getElementById("abonnementTTC").value = userData.abonnementTTC ?? 0;
    document.getElementById("typeContrat").value = userData.typeContrat ?? "fixe";
    document.getElementById("typeContrat").dispatchEvent(new Event('change'));
    document.getElementById("consommationExterne").value = userData.consommationExterne ?? 0;
    document.getElementById("useExternal").checked = userData.useExternal ?? false;
    document.getElementById("externalFields").style.display = userData.useExternal ? "block" : "none";

    const selectExterne = document.getElementById("capteurExterneSelect");
    selectExterne.innerHTML = "";
    powerData.forEach(c => {
      const option = document.createElement("option");
      option.value = c.entity_id;
      option.textContent = `${c.friendly_name} — ${c.area || "?"}`;
      selectExterne.appendChild(option);
    });
    if (userData.externalCapteur) selectExterne.value = userData.externalCapteur;

  } catch (err) {
    console.error("Erreur config:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// --- Sauvegarde unique ---
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
      heuresHPDebut: document.getElementById("heuresHPDebut").value,
      heuresHPFin: document.getElementById("heuresHPFin").value,
      useExternal: document.getElementById("useExternal").checked,
      externalCapteur: document.getElementById("capteurExterneSelect").value,
      consommationExterne: parseFloat(document.getElementById("consommationExterne").value) || 0
    };

    await fetch("/local/community/home_suivi_elec/data/user_config.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selections)
    });

    alert("💾 Données sauvegardées !");
    loadSummary();
    loadConfiguration();

  } catch (err) {
    alert("❌ Erreur sauvegarde configuration");
    console.error(err);
  }
};

// --- Toggle externe ---
document.getElementById("useExternal").onchange = function() {
  const fields = document.getElementById("externalFields");
  fields.style.display = this.checked ? "block" : "none";
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

// --- Chargement automatique ---
document.addEventListener("DOMContentLoaded", () => {
  loadDetection();
  loadSummary();
  loadConfiguration();
});