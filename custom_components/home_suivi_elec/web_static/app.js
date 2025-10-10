// -*- coding: utf-8 -*-

// === 🏠 PAGE HOME ===
async function loadSummary() {
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const coutSpan = document.getElementById("coutEstime");
  const refreshSpan = document.getElementById("dernierRefresh");

  try {
    const [powerResp, selectionResp] = await Promise.all([
      fetch("/local/community/home_suivi_elec_ui/../data/capteurs_power.json"),
      fetch("/local/community/home_suivi_elec_ui/../data/capteurs_selection.json")
    ]);

    const powerData = powerResp.ok ? await powerResp.json() : [];
    const selectionData = selectionResp.ok ? await selectionResp.json() : {};

    let total = Array.isArray(powerData) ? powerData.length : 0;
    let actifs = 0;
    for (const integ of Object.values(selectionData)) {
      actifs += integ.filter(c => c.enabled).length;
    }

    totalSpan.textContent = total;
    actifsSpan.textContent = `${actifs} / ${total}`;
    coutSpan.textContent = `${(actifs * 0.12).toFixed(2)} €`;
    refreshSpan.textContent = new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Erreur chargement résumé:", err);
  }
}
document.getElementById("refreshHome").onclick = loadSummary;
loadSummary();

// === 🔍 PAGE DÉTECTION ===
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
document.getElementById("refresh").onclick = loadDetection;

// === ⚙️ PAGE CONFIGURATION ===
async function loadConfiguration() {
  const content = document.getElementById("content-configuration");
  const useExternal = document.getElementById("useExternal");
  const externalDiv = document.getElementById("externalInput");

  useExternal.onchange = () => {
    externalDiv.style.display = useExternal.checked ? "block" : "none";
  };

  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();
    content.innerHTML = "";

    // Récupérer capteur externe s'il existe pour exclure
    let externalId = null;
    if (useExternal.checked) {
      const extSensorInput = document.getElementById("externalSensor");
      externalId = extSensorInput ? extSensorInput.value : null;
    }

    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;

      list.forEach(c => {
        if (c.entity_id === externalId) return; // Exclure le capteur externe
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

// Sauvegarde de la sélection des capteurs
document.getElementById("saveSelection").onclick = async function () {
  const selections = {};
  document.querySelectorAll("#content-configuration input[type='checkbox']").forEach(cb => {
    const integ = cb.dataset.integration;
    selections[integ] ??= [];
    selections[integ].push({
      entity_id: cb.dataset.entityId,
      enabled: cb.checked
    });
  });

  try {
    const resp = await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selections)
    });
    const result = await resp.json();
    alert(result.success ? "✅ Sélection sauvegardée !" : "❌ Erreur sauvegarde");
  } catch (err) {
    alert("❌ Erreur lors de la sauvegarde");
    console.error(err);
  }
};

// Sauvegarde des données utilisateur / abonnement
document.getElementById("saveUserData").onclick = async function() {
  const data = {
    ht: parseFloat(document.getElementById("userHT").value) || 0,
    ttc: parseFloat(document.getElementById("userTTC").value) || 0,
    type_contrat: document.getElementById("typeContrat").value,
    mesure_externe: {
      enabled: document.getElementById("useExternal").checked,
      capteur: document.getElementById("externalSensor").value || null,
      manuel: parseFloat(document.getElementById("externalManual").value) || null
    }
  };
  try {
    const resp = await fetch("/api/home_suivi_elec/save_user_data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await resp.json();
    alert(result.success ? "✅ Données utilisateur sauvegardées !" : "❌ Erreur sauvegarde");
  } catch(err) {
    alert("❌ Erreur lors de la sauvegarde");
    console.error(err);
  }
};

// === OUTILS SÉLECTION ===
function selectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
}
function deselectAll(integration) {
  document.querySelectorAll(`#content-configuration input[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
}

// Charger les onglets
loadConfiguration();
loadDetection();
