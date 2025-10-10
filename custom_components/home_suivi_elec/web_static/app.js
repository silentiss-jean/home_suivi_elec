async function loadSensors() {
  const content = document.getElementById("content");
  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();

    content.innerHTML = "";

    if (!sensors || Object.keys(sensors).length === 0) {
      content.innerHTML = "<p style='color:orange;'>⚠️ Aucun capteur détecté pour le moment.</p>";
      return;
    }

    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.innerHTML = `<h2>${integration}</h2>`;

      if (!Array.isArray(list) || list.length === 0) {
        const warning = document.createElement("div");
        warning.textContent = "Aucun capteur disponible";
        block.appendChild(warning);
      } else {
        list.forEach(c => {
          const div = document.createElement("div");
          div.className = "sensor";
          div.textContent = `${c.friendly_name} — ${c.area || "?"} [${c.unit || "?"}]`;
          block.appendChild(div);
        });
      }

      content.appendChild(block);
    }
  } catch (err) {
    console.error("Erreur:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// Rechargement manuel
document.getElementById("refresh").onclick = loadSensors;
loadSensors();
