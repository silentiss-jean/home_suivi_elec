async function loadDetection() {
  const content = document.getElementById("content");
  content.innerHTML = "<p>Chargement des capteurs détectés...</p>";

  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);

    const sensors = await resp.json();
    content.innerHTML = "";

    const integrations = Object.keys(sensors);
    if (integrations.length === 0) {
      content.innerHTML = "<p>Aucun capteur détecté.</p>";
      return;
    }

    let total = 0;
    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.innerHTML = `<h2>${integration}</h2>`;
      list.forEach(c => {
        total++;
        const div = document.createElement("div");
        div.className = "sensor";
        div.textContent = `${c.friendly_name} — ${c.area || "?"} [${c.unit || "?"}]`;
        block.appendChild(div);
      });
      content.appendChild(block);
    }

    // Résumé global
    document.getElementById("summary").innerHTML = `
      <p><b>Total capteurs détectés :</b> ${total}</p>
      <p><b>Dernière mise à jour :</b> ${new Date().toLocaleTimeString()}</p>
    `;
  } catch (err) {
    console.error("Erreur:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// ---------------------------------------------------------------------------
// Onglet CONFIGURATION : gestion des sélections
// ---------------------------------------------------------------------------
async function loadConfiguration() {
  const content = document.getElementById("content");
  content.innerHTML = "<p>Chargement de la configuration...</p>";

  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();

    // Charger la sélection sauvegardée (si existe)
    let selection = {};
    try {
      const selResp = await fetch("/local/community/home_suivi_elec_ui/capteurs_selection.json");
      if (selResp.ok) selection = await selResp.json();
    } catch (_) {}

    content.innerHTML = "";
    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.innerHTML = `<h2>${integration}</h2>`;
      list.forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor-line";
        const checked = selection[integration]?.some(s => s.entity_id === c.entity_id) ? "checked" : "";
        div.innerHTML = `
          <label>
            <input type="checkbox" data-integ="${integration}" data-id="${c.entity_id}" ${checked}>
            ${c.friendly_name} — ${c.area || "?"} [${c.unit || "?"}]
          </label>
        `;
        block.appendChild(div);
      });
      content.appendChild(block);
    }

    // Bouton de sauvegarde
    const btn = document.createElement("button");
    btn.textContent = "💾 Sauvegarder la sélection";
    btn.onclick = saveSelection;
    content.appendChild(btn);

  } catch (err) {
    console.error("Erreur:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// ---------------------------------------------------------------------------
// Sauvegarde sélection
// ---------------------------------------------------------------------------
async function saveSelection() {
  const checkboxes = document.querySelectorAll("input[type=checkbox]");
  const selection = {};

  checkboxes.forEach(chk => {
    if (chk.checked) {
      const integ = chk.dataset.integ;
      const id = chk.dataset.id;
      if (!selection[integ]) selection[integ] = [];
      selection[integ].push({ entity_id: id });
    }
  });

  try {
    const resp = await fetch("/api/home_suivi_elec/save_selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selection),
    });
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    alert("✅ Sélection sauvegardée avec succès !");
  } catch (err) {
    console.error("Erreur sauvegarde:", err);
    alert(`❌ Erreur : ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Gestion des onglets
// ---------------------------------------------------------------------------
function showTab(tab) {
  document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");

  if (tab === "detection") loadDetection();
  if (tab === "configuration") loadConfiguration();
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------
document.getElementById("tab-detection").onclick = () => showTab("detection");
document.getElementById("tab-configuration").onclick = () => showTab("configuration");

// Démarrage sur l’onglet Détection
showTab("detection");
