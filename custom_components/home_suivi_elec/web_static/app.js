// -*- coding: utf-8 -*-
// === 🏠 PAGE HOME / RÉSUMÉ & DÉTECTION & CONFIGURATION ===

// Helper : normalise la réponse get_sensors en { integration: [sensors...] }
function normalizeSensors(sensorsRaw) {
  if (!sensorsRaw) return {};
  if (Array.isArray(sensorsRaw)) {
    // array -> regrouper par integration
    return sensorsRaw.reduce((acc, c) => {
      const integ = c.integration || "unknown";
      acc[integ] ??= [];
      acc[integ].push(c);
      return acc;
    }, {});
  }
  // si c'est déjà un object (integration -> list)
  if (typeof sensorsRaw === "object") {
    return sensorsRaw;
  }
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
    // on récupère uniquement via les endpoints API (ne pas dépendre des fichiers /local)
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

    // n'affiche le résumé que s'il y a une selection enregistrée dans options
    const selectionData = userData.selection || {};
    if (!selectionData || Object.keys(selectionData).length === 0) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Aucune configuration sauvegardée pour le moment.";
      summaryData.style.display = "none";
      return;
    }

    // calcul consommation et actifs en s'appuyant sur les valeurs live des capteurs
    let actifs = 0;
    let consommationTotale = 0;
    for (const [integration, list] of Object.entries(selectionData)) {
      for (const s of list) {
        if (s.enabled) {
          actifs += 1;
          // récupérer la valeur actuelle depuis groupedSensors
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
    coutHT.textContent = userData.abonnementHT ? `${Number(userData.abonnementHT).toFixed(2)} €` : "-";
    coutTTC.textContent = userData.abonnementTTC ? `${Number(userData.abonnementTTC).toFixed(2)} €` : "-";
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
    // selectionData venant des options (si sauvegardée) sinon on construit une structure par défaut
    let selectionData = userData.selection || {};

    if (!selectionData || Object.keys(selectionData).length === 0) {
      // créer structure par défaut (tous décochés) sans l'écrire côté serveur
      selectionData = {};
      for (const [integration, list] of Object.entries(grouped)) {
        selectionData[integration] = (list || []).map(c => ({ entity_id: c.entity_id, enabled: false }));
      }
    }

    content.innerHTML = "";
    for (const [integration, list] of Object.entries(grouped)) {
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;
      (list || []).forEach(c => {
        // si capteur externe selectionné on peut le masquer (optionnel)
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

    // Données utilisateur (pré-remplir champs depuis options si présents)
    document.getElementById("abonnementHT").value = userData.abonnementHT ?? "";
    document.getElementById("abonnementTTC").value = userData.abonnementTTC ?? "";
    document.getElementById("typeContrat").value = userData.typeContrat ?? "fixe";
    document.getElementById("typeContrat").dispatchEvent(new Event('change'));
    document.getElementById("consommationExterne").value = userData.consommationExterne ?? "";
    document.getElementById("useExternal").checked = Boolean(userData.useExternal);
    document.getElementById("externalFields").style.display = userData.useExternal ? "block" : "none";

    const selectExterne = document.getElementById("capteurExterneSelect");
    selectExterne.innerHTML = "";
    // liste déroulante contient tous les capteurs disponibles
    for (const list of Object.values(grouped)) {
      (list || []).forEach(c => {
        const option = document.createElement("option");
        option.value = c.entity_id;
        option.textContent = `${c.friendly_name} — ${c.area || "?"}`;
        selectExterne.appendChild(option);
      });
    }
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
      heuresHPDebut: document.getElementById("heuresHPDebut").value || "",
      heuresHPFin: document.getElementById("heuresHPFin").value || "",
      useExternal: document.getElementById("useExternal").checked,
      externalCapteur: document.getElementById("capteurExterneSelect").value || "",
      consommationExterne: parseFloat(document.getElementById("consommationExterne").value) || 0,
      selection: selections // stocker la selection dans les options (utile pour résumé)
    };

    // On met à jour à la fois les options (ConfigEntry) ET le fichier selection pour compatibilité
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
    // recharger pour afficher le résumé et la config actualisée
    await loadSummary();
    await loadConfiguration();

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