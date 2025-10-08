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
      <style>
        .hs_integration_block { margin-bottom: 1.5rem; padding: 0.5rem; border: 1px solid #ccc; border-radius: 8px; background: var(--card-background-color); }
        .hs_integration_block h2 { margin-top: 0; }
        input[type="checkbox"] { margin-right: 0.5rem; }
        button { padding: 0.5rem 1rem; border-radius: 6px; border: none; background: var(--primary-color); color: white; cursor: pointer; }
        button:hover { opacity: 0.9; }
      </style>
    `;

    // 🔹 Attente sécurisée que Home Assistant soit disponible
    let retries = 0;
    while (!window.hass && retries < 20) {
      await new Promise(res => setTimeout(res, 200));
      retries++;
    }

    if (!window.hass) {
      const container = document.getElementById("content");
      container.innerHTML = `<p style="color:red;">❌ Home Assistant non détecté</p>`;
      console.error("Home Assistant non disponible dans l'iframe !");
      return;
    }

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
      // 🔹 callWS vers Home Assistant
      const data = await window.hass.callWS({ type: "home_suivi_elec/get_sensors" });
      this.sensors = data;
      this.render();
      container.textContent = ""; // supprime le message de chargement
    } catch (err) {
      console.error("Erreur chargement capteurs via WS:", err);
      container.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
    }
  }

  render() {
    const container = document.getElementById("content");
    container.innerHTML = ""; // réinitialise le contenu

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