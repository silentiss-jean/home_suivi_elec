async function fetchSensors() {
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error(err);
    return {};
  }
}

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".content").forEach(c => c.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(tabName).classList.add("active");
}

function renderDetection(sensors) {
  const listEl = document.getElementById("detection-list");
  listEl.innerHTML = "";
  let count = 0;
  for (const [integration, items] of Object.entries(sensors)) {
    const block = document.createElement("div");
    block.innerHTML = `<h3>${integration}</h3>`;
    items.forEach(c => {
      const div = document.createElement("div");
      div.className = "sensor";
      div.textContent = `${c.friendly_name} — ${c.area || "?"} [${c.unit || "?"}]`;
      block.appendChild(div);
      count++;
    });
    listEl.appendChild(block);
  }
  document.getElementById("total-detection").textContent = count;
  document.getElementById("last-detection").textContent = new Date().toLocaleTimeString();
}

function renderConfiguration(sensors) {
  const listEl = document.getElementById("config-list");
  listEl.innerHTML = "";
  let count = 0;
  for (const [integration, items] of Object.entries(sensors)) {
    const block = document.createElement("div");
    block.innerHTML = `<h3>${integration}</h3>`;
    items.forEach(c => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = true; // par défaut coché
      input.dataset.entity = c.entity_id;
      label.appendChild(input);
      label.append(` ${c.friendly_name} — ${c.area || "?"}`);
      block.appendChild(label);
      block.appendChild(document.createElement("br"));
      count++;
    });
    listEl.appendChild(block);
  }
  document.getElementById("total-config").textContent = count;
  document.getElementById("last-config").textContent = new Date().toLocaleTimeString();

  document.getElementById("select-all").onclick = () => {
    listEl.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = true);
  };
  document.getElementById("deselect-all").onclick = () => {
    listEl.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
  };
}

// --- Initialisation onglets ---
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => switchTab(t.dataset.tab);
});

// --- Chargement initial ---
async function refresh() {
  const sensors = await fetchSensors();
  renderDetection(sensors);
  renderConfiguration(sensors);
}

document.getElementById("refresh-detection").onclick = refresh;

// --- Chargement initial au démarrage ---
refresh();