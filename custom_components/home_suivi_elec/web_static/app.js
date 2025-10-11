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
      fetch("/api/home_suivi_elec/get_file?name=capteurs_power.json"),
      fetch("/api/home_suivi_elec/get_file?name=capteurs_selection.json"),
      fetch("/api/home_suivi_elec/get_user_config")
    ]);

    if (!powerResp.ok || !selectionResp.ok) {
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
      actifs += integ.filter(c => c.enabled).length;
      consommationTotale += integ.filter(c => c.enabled).reduce((sum, c) => sum + (c.value || 0), 0);
    }

    let delta = 0;
    if (userData.consommationExterne) delta = userData.consommationExterne - consommationTotale;

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
        div.textContent = `${c.friendly_name} — ${c.area || "?"} [${c.value ?? 0} ${c.unit || "?"}]`;
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
      fetch("/api/home_suivi_elec/get_user_config")
    ]);
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);

    const sensors = await resp.json();
    const userData = userResp.ok ? await userResp.json() : {};
    content.innerHTML = "";

    // --- Remplissage auto du formulaire utilisateur ---
    document.getElementById("abonnementHT").value = userData.abonnementHT || "";
    document.getElementById("abonnementTTC").value = userData.abonnementTTC || "";
    document.getElementById("typeContrat").value = userData.typeContrat || "fixe";
    document.getElementById("tarifHP").value = userData.tarifHP || "";
    document.getElementById("tarifHC").value = userData.tarifHC || "";
    document.getElementById("heuresHPDebut").value = userData.heuresHPDebut || "";
    document.getElementById("heuresHPFin").value = userData.heuresHPFin || "";

    if (userData.typeContrat === "hp-hc") document.getElementById("hpHCFields").style.display = "block";

    // --- Exclusion du capteur externe si utilisé ---
    const capteurExterne = userData.capteurExterne || null;

    for (const [integration, list] of Object.entries(sensors)) {
      const visibles = list.filter(c => c.entity_id !== capteurExterne);
      if (visibles.length === 0) continue;

      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;

      visibles.forEach(c => {
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

    // --- Liste déroulante capteurs externes disponibles ---
    const externalSelect = document.getElementById("capteurExterneSelect");
    externalSelect.innerHTML = `<option value="">(Aucun)</option>`;
    Object.entries(sensors).forEach(([integration, list]) => {
      list.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.entity_id;
        opt.textContent = `${c.friendly_name} (${integration})`;
        if (c.entity_id === capteurExterne) opt.selected = true;
        externalSelect.appendChild(opt);
      });
    });

    document.getElementById("useExternal").checked = !!capteurExterne;
    document.getElementById("externalFields").style.display = capteurExterne ? "block" : "none";

  } catch (err) {
    console.error("Erreur config:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

document.getElementById("useExternal").onchange = function () {
  document.getElementById("externalFields").style.display = this.checked ? "block" : "none";
};


// === Sauvegarde Sélection + Données utilisateur ===
document.getElementById("saveSelection").onclick = async function () {
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
    capteurExterne: document.getElementById("capteurExterneSelect").value || null,
    consommationExterne: parseFloat(document.getElementById("consommationExterne").value) || 0
  };

  try {
    await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections, userData })
    });
    alert("💾 Données et sélection sauvegardées !");
    loadSummary();
  } catch (err) {
    alert("❌ Erreur lors de la sauvegarde");
    console.error(err);
  }
};

// Sélection rapide
function selectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
}
function deselectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
}

// Démarrage
showTab('home');
