import { normalizeSensors } from './utils.js';
import { loadSummary } from './summary.js';  // ✅ pour recharger le résumé

export async function loadConfiguration() {
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

    // Bloc capteur externe
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

    document.getElementById("useExternalConfig").onchange = function() {
      document.getElementById("externalFieldsConfig").style.display = this.checked ? "block" : "none";
    };

    // ✅ Ajout du reload du résumé après sauvegarde
    document.getElementById("saveExternal").onclick = async function() {
      try {
        const data = {
          externalCapteur: selectExterne.value,
          useExternal: document.getElementById("useExternalConfig").checked,
          consommationExterne: parseFloat(document.getElementById("consommationExterneConfig").value) || 0,
          selection: selectionData
        };
        await fetch("/api/home_suivi_elec/save_user_options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        await loadSummary();        // ✅ ici
        await loadConfiguration();
        alert("💾 Capteur externe sauvegardé !");
      } catch (err) {
        console.error(err);
        alert("❌ Erreur sauvegarde capteur externe");
      }
    };

    // Bloc capteurs principaux
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
        checkbox.disabled = c.entity_id === externalCapteur;
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