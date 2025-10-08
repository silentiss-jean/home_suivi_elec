class HomeSuiviElecPanel extends HTMLElement {
  constructor() {
    super();
    this.sensors = {};
  }

  async connectedCallback() {
    this.innerHTML = `
      <h1>⚡ Home Suivi Élec — Sélection des capteurs</h1>
      <div id="content">Chargement...</div>
      <button id="save-btn">💾 Enregistrer</button>
    `;
    await this.loadSensors();
    this.setupSaveButton();
  }

  setupSaveButton() {
    const saveBtn = document.getElementById("save-btn");
    saveBtn.onclick = () => this.saveSelection();
  }

  async loadSensors() {
    const container = document.getElementById("content");
    container.textContent = "Chargement des capteurs...";
    try {
      const data = await window.hass.callWS({ type: "home_suivi_elec/get_sensors" });
      this.sensors = data;
      this.render();
      container.textContent = "";
    } catch (err) {
      console.error("Erreur chargement capteurs via WS:", err);
      container.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
    }
  }

  render() {
    const container = document.getElementById("content");
    container.innerHTML = "";
    for (const [integration, caps] of Object.entries(this.sensors)) {
      const block = document.createElement("div");
      block.className = "hs_integration_block";
      const header = document.createElement("h2");
      header.textContent = integration;
      block.appendChild(header);
      caps.forEach(c => {
        const line = document.createElement("div");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = c.entity_id;
        checkbox.checked = c.enabled;
        checkbox.dataset.integration = integration;
        const label = document.createElement("label");
        label.htmlFor = c.entity_id;
        label.textContent = `${c.friendly_name || c.entity_id} (${c.area || "?"}) [${c.unit || "?"}]`;
        line.appendChild(checkbox);
        line.appendChild(label);
        block.appendChild(line);
      });
      container.appendChild(block);
    }
  }

  async saveSelection() {
    const selection = {};
    for (const [integration, caps] of Object.entries(this.sensors)) {
      selection[integration] = caps.map(c => {
        const cb = document.getElementById(c.entity_id);
        return { ...c, enabled: cb.checked };
      });
    }
    try {
      await window.hass.callWS({
        type: "home_suivi_elec/save_selection",
        selection: selection
      });
      alert("✅ Sélection sauvegardée !");
    } catch (err) {
      console.error("Erreur sauvegarde sélection:", err);
      alert("❌ Erreur sauvegarde : " + err.message);
    }
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);
