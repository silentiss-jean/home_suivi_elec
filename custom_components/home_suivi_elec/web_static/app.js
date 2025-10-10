// -*- coding: utf-8 -*-
// === 🏠 PAGE HOME / RÉSUMÉ GÉNÉRAL ===
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
    const [powerResp, selectionResp, userResp] = await Promise.all([
      fetch("/local/community/home_suivi_elec_ui/../data/capteurs_power.json"),
      fetch("/local/community/home_suivi_elec_ui/../data/capteurs_selection.json"),
      fetch("/local/community/home_suivi_elec_ui/../data/user_config.json")
    ]);

    const powerData = powerResp.ok ? await powerResp.json() : [];
    const selectionData = selectionResp.ok ? await selectionResp.json() : {};
    const userData = userResp.ok ? await userResp.json() : {};

    // Si aucune config => message d’invite
    if (!selectionResp.ok || Object.keys(selectionData).length === 0) {
      summaryMessage.style.display = "block";
      summaryData.style.display = "none";
      return;
    }

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
    if (userData.consommationExterne) {
      delta = userData.consommationExterne - consommationTotale;
    }

    totalSpan.textContent = total;
    actifsSpan.textContent = `${actifs} / ${total}`;
    coutHT.textContent = userData.abonnementHT ? `${userData.abonnementHT.toFixed(2)} €` : "-";
    coutTTC.textContent = userData.abonnementTTC ? `${userData.abonnementTTC.toFixed(2)} €` : "-";
    consommationW.textContent = `${consommationTotale.toFixed(2)} W`;
    deltaConsommation.textContent = `${delta.toFixed(2)} W`;

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";
    refreshSpan.textContent = new Date().toLocaleTimeString();

  } catch (err) {
    console.error("Erreur chargement résumé:", err);
  }
}

document.getElementById("refreshHome").onclick = loadSummary;
loadSummary();

// === 🔍 DÉTECTION DES CAPTEURS ===
async function loadDetection() {
  const content = document.getElementById("content-detection");
  content.innerHTML = "Chargement...";
  try {
    // Charger la config utilisateur pour exclure la mesure externe
    let externalSensorId = null;
    try {
      const userResp = await fetch("/local/community/home_suivi_elec_ui/../data/user_config.json");
      if (userResp.ok) {
        const userData = await userResp.json();
        externalSensorId = userData.capteurExterneEntityId || null;
      }
    } catch {}

    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();

    content.innerHTML = "";
    let total = 0;

    for (const [integration, list] of Object.entries(sensors)) {
      // Exclure le capteur externe s’il est défini
      const filtered = list.filter(c => c.entity_id !== externalSensorId);
      if (filtered.length === 0) continue;
      total += filtered.length;

      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>`;
      filtered.forEach(c => {
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

document.getElementById("refreshDetection").onclick = loadDetection;

// === ⚙️ CONFIGURATION DES CAPTEURS ===
async function loadConfiguration() {
  const content = document.getElementById("content-configuration");
  content.innerHTML = "Chargement...";
  try {
    const [resp, userResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/local/community/home_suivi_elec_ui/../data/user_config.json")
    ]);

    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();
    const userData = userResp.ok ? await userResp.json() : {};
    const externalSensorId = userData.capteurExterneEntityId || null;

    content.innerHTML = "";

    for (const [integration, list] of Object.entries(sensors)) {
      const filtered = list.filter(c => c.entity_id !== externalSensorId);
      if (filtered.length === 0) continue;

      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;

      filtered.forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = c.enabled;
        checkbox.dataset.integration = integration;
        checkbox.dataset.entityId = c.entity_id;
        div.append(
          checkbox,
          document.createTextNode(
            ` ${c.friendly_name} — ${c.area || "?"} [${c.value ?? 0} ${c.unit || "?"}]`
          )
        );
        block.appendChild(div);
      });
      content.appendChild(block);
    }
  } catch (err) {
    console.error("Erreur config:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// === Outils de sélection ===
function selectAll(integration) {
  document
    .querySelectorAll(`#content-configuration input[data-integration="${integration}"]`)
    .forEach(cb => (cb.checked = true));
}
function deselectAll(integration) {
  document
    .querySelectorAll(`#content-configuration input[data-integration="${integration}"]`)
    .forEach(cb => (cb.checked = false));
}

// Onglet par défaut
showTab('home');
