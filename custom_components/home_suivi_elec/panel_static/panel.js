class HomeSuiviElecPanel extends HTMLElement {
  constructor() {
    super();
    this.sensors = {};
  }

  async connectedCallback() {
    this.innerHTML = `<h1>⚡ Home Suivi Élec — Sélection Capteurs</h1><div id="content">Chargement...</div>`;
    await this.loadSensors();
    this.render();
  }

  async loadSensors() {
    try {
      const resp = await fetch("/api/home_suivi_elec/get_sensors");
      this.sensors = await resp.json();
    } catch (e) {
      console.error("Erreur chargement capteurs:", e);
      this.sensors = {};
    }
  }

  render() {
    const container = document.getElementById("content");
    container.innerHTML = "";
    for (const [integration, caps] of Object.entries(this.sensors)) {
      const integDiv = document.createElement("div");
      integDiv.innerHTML = `<h2>${integration}</h2>`;
      caps.forEach(c => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = c.enabled;
        checkbox.id = c.entity_id;
        checkbox.dataset.integ = integration;

        const label = document.createElement("label");
        label.htmlFor = c.entity_id;
        label.innerText = `${c.friendly_name} (${c.area || "?"}) [${c.unit || "?"}]`;

        const line = document.createElement("div");
        line.appendChild(checkbox);
        line.appendChild(label);
        integDiv.appendChild(line);
      });
      container.appendChild(integDiv);
    }

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "💾 Enregistrer";
    saveBtn.onclick = () => this.saveSelection();
    container.appendChild(saveBtn);
  }

  async saveSelection() {
    const selected = {};
    for (const [integration, caps] of Object.entries(this.sensors)) {
      selected[integration] = caps.map(c => {
        const cb = document.getElementById(c.entity_id);
        return { ...c, enabled: cb.checked };
      });
    }
    try {
      await fetch("/api/home_suivi_elec/save_selection", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(selected)
      });
      alert("✅ Sélection sauvegardée");
    } catch (e) {
      alert("❌ Erreur sauvegarde: " + e);
    }
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);
