async function loadSensors() {
  const message = document.getElementById("message");
  message.textContent = "Chargement des capteurs...";
  try {
    const res = await fetch("/api/home_suivi_elec/get_sensors");
    if (!res.ok) throw new Error("Erreur API: " + res.status);
    const data = await res.json();

    const container = document.getElementById("integration-list");
    container.innerHTML = "";

    Object.entries(data).forEach(([integration, sensors]) => {
      const block = document.createElement("div");
      block.className = "integration-block";

      const header = document.createElement("div");
      header.className = "integration-header";
      header.innerHTML = `
        <span>${integration}</span>
        <div>
          <button onclick="toggleIntegration('${integration}', true)">Tout cocher</button>
          <button onclick="toggleIntegration('${integration}', false)">Tout décocher</button>
        </div>
      `;
      block.appendChild(header);

      const list = document.createElement("div");
      list.className = "sensor-list";
      sensors.forEach(s => {
        const item = document.createElement("div");
        item.innerHTML = `
          <label>
            <input type="checkbox" data-integration="${integration}" value="${s.entity_id}" checked>
            ${s.friendly_name || s.entity_id} (${s.area || "?"})
          </label>
        `;
        list.appendChild(item);
      });
      block.appendChild(list);
      container.appendChild(block);
    });

    message.textContent = "✅ Capteurs chargés.";
  } catch (err) {
    message.textContent = "Erreur : " + err.message;
  }
}

function toggleIntegration(integration, checked) {
  document
    .querySelectorAll(`input[data-integration="${integration}"]`)
    .forEach(cb => (cb.checked = checked));
}

async function saveSelection() {
  const message = document.getElementById("message");
  message.textContent = "Sauvegarde en cours...";
  const selections = {};

  document.querySelectorAll("input[type=checkbox]").forEach(cb => {
    const integ = cb.dataset.integration;
    if (!selections[integ]) selections[integ] = [];
    if (cb.checked)
      selections[integ].push({ entity_id: cb.value, enabled: true });
  });

  try {
    const res = await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selections),
    });
    const result = await res.json();
    message.textContent = "✅ Sélection sauvegardée";
  } catch (err) {
    message.textContent = "❌ Erreur : " + err.message;
  }
}

document.getElementById("load-btn").addEventListener("click", loadSensors);
document.getElementById("save-btn").addEventListener("click", saveSelection);
