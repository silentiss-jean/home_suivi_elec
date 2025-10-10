// -*- coding: utf-8 -*-
async function loadSensors() {
  const content = document.getElementById("content");
  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();

    content.innerHTML = "";

    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.className = "integration-block";

      block.innerHTML = `<h2>${integration}</h2>
        <button onclick="selectAll('${integration}')">Tout sélectionner</button>
        <button onclick="deselectAll('${integration}')">Tout désélectionner</button>`;

      list.forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor";
        div.textContent = `${c.friendly_name} — ${c.area || "?"} [${c.unit || "?"}]`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = c.enabled;
        checkbox.dataset.integration = integration;
        checkbox.dataset.entityId = c.entity_id;
        div.prepend(checkbox);
        block.appendChild(div);
      });

      content.appendChild(block);
    }
  } catch (err) {
    console.error("Erreur:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// Sélectionner tous les capteurs d’une intégration
function selectAll(integration) {
  document.querySelectorAll(`input[type="checkbox"][data-integration="${integration}"]`).forEach(cb => cb.checked = true);
}

// Désélectionner tous les capteurs d’une intégration
function deselectAll(integration) {
  document.querySelectorAll(`input[type="checkbox"][data-integration="${integration}"]`).forEach(cb => cb.checked = false);
}

document.getElementById("refresh").onclick = loadSensors;
loadSensors();
