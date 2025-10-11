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
    // On lit directement les fichiers locaux JSON produits par l’intégration
    const [powerResp, selectionResp, userResp] = await Promise.all([
      fetch("/local/community/home_suivi_elec_ui/../data/capteurs_power.json"),
      fetch("/local/community/home_suivi_elec_ui/../data/capteurs_selection.json"),
      fetch("/local/community/home_suivi_elec_ui/../data/user_config.json")
    ]);

    if (!selectionResp.ok || !powerResp.ok) {
      summaryMessage.style.display = "block";
      summaryData.style.display = "none";
      return;
    }

    const powerData = powerResp.ok ? await powerResp.json() : [];
    const selectionData = selectionResp.ok ? await selectionResp.json() : {};
    const userData = userResp.ok ? await userResp.json() : {};

    let total = Array.isArray(powerData) ? powerData.length : 0;
    let actifs = 0;
    let consommationTotale = 0;

    for (const integ of Object.values(selectionData)) {
      const actifsList = integ.filter(c => c.enabled);
      actifs += actifsList.length;
      consommationTotale += actifsList.reduce((sum, c) => sum + (c.value || 0), 0);
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

document.getElementById("refreshDetection").onclick = loadDetection;

// === ⚙️ CONFIGURATION ===
async function loadConfiguration() {
  const content = document.getElementById("content-configuration");
  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();
    content.innerHTML = "";

    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;
      list.forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = c.enabled;
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

// Sauvegarde sélection capteurs
document.getElementById("saveSelection").onclick = async function () {
  const selections = {};
  document.querySelectorAll("#content-configuration input[type='checkbox']").forEach(cb => {
    const integ = cb.dataset.integration;
    selections[integ] ??= [];
    selections[integ].push({ entity_id: cb.dataset.entityId, enabled: cb.checked });
  });
  try {
    const resp = await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selections)
    });
    const result = await resp.json();
    alert(result.success ? "✅ Sélection sauvegardée !" : "❌ Erreur sauvegarde");
    loadSummary();
  } catch (err) {
    alert("❌ Erreur lors de la sauvegarde");
    console.error(err);
  }
};

// HP/HC toggle
document.getElementById("typeContrat").onchange = function () {
  document.getElementById("hpHCFields").style.display =
    this.value === "hp-hc" ? "block" : "none";
};

// === Sélection globale ===
function selectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
}
function deselectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
}

// Onglet par défaut
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
}
showTab('home');
