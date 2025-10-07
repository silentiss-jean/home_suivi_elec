class HomeSuiviElecPanel extends HTMLElement {
  constructor() {
    super();
    this.sensors = {};
  }

  async connectedCallback() {
    this.innerHTML = `
      <h1>⚡ Home Suivi Élec — Sélection des capteurs</h1>
      <div id="content">Chargement...</div>
    `;
    await this.loadSensors();
    this.render();
  }

  async getAuthHeaders() {
    // Récupère le token d'authentification Home Assistant
    if (window.hassConnection && window.hassConnection.options?.auth?.accessToken) {
      return {
        Authorization: "Bearer " + window.hassConnection.options.auth.accessToken,
        "Content-Type": "application/json"
      };
    }

    // Token non trouvé : on affiche un message clair
    console.warn("⚠️ Token HA non détecté — vérifie que tu es connecté à Home Assistant.");
    return { "Content-Type": "application/json" };
  }

  async loadSensors() {
    const content = this.querySelector("#content");
    try {
      const headers = await this.getAuthHeaders();
      const resp = await fetch("/api/home_suivi_elec/get_sensors", { headers });
      if (!resp.ok) throw new Error("Erreur HTTP " + resp.status);
      this.sensors = await resp.json();
    } catch (e) {
      console.error("Erreur chargement capteurs:", e);
      content.innerHTML = `<p style="color:red;">❌ Impossible de charger les capteurs (${e.message})</p>`;
      this.sensors = {};
    }
  }

  render() {
    const container = this.querySelector("#content");
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
      const headers = await this.getAuthHeaders();
      const resp = await fetch("/api/home_suivi_elec/save_selection", {
        method: "POST",
        headers,
        body: JSON.stringify(selected)
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      alert("✅ Sélection sauvegardée");
    } catch (e) {
      alert("❌ Erreur sauvegarde: " + e.message);
    }
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);