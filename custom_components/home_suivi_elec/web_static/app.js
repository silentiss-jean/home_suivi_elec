async function loadSensors() {
  const content = document.getElementById("content");
  content.innerHTML = "Chargement...";

  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();

    // Si l'API retourne une erreur
    if (sensors.error) {
      content.innerHTML = `<p style="color:red;">❌ ${sensors.error}</p>`;
      return;
    }

    // Si ce n'est pas un objet
    if (typeof sensors !== "object") {
      content.innerHTML = `<p style="color:red;">❌ Données invalides reçues</p>`;
      return;
    }

    content.innerHTML = "";
    for (const [integration, list] of Object.entries(sensors)) {
      const block = document.createElement("div");
      block.innerHTML = `<h2>${integration}</h2>`;
      if (Array.isArray(list)) {
        list.forEach(c => {
          const div = document.createElement("div");
          div.className = "sensor";
          div.textContent = `${c.friendly_name} — ${c.area || "?"} [${c.unit || "?"}]`;
          block.appendChild(div);
        });
      } else {
        const div = document.createElement("div");
        div.style.color = "red";
        div.textContent = "❌ Données de capteurs invalides";
        block.appendChild(div);
      }
      content.appendChild(block);
    }
  } catch (err) {
    console.error("Erreur:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

document.getElementById("refresh").onclick = loadSensors;
loadSensors();
