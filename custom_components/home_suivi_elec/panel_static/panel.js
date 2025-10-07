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
    this.token = await this.getAuthToken();
    await this.loadSensors();
  }

  // 🔹 Récupération du token (HA ou manuel)
  async getAuthToken() {
    try {
      const conn = await window.hassConnection;
      if (conn?.options?.auth?.accessToken) {
        console.log("🔐 Token HA récupéré automatiquement");
        return conn.options.auth.accessToken;
      }
      console.warn("⚠️ Aucun token HA détecté — bascule en mode test local");
    } catch (e) {
      console.warn("⚠️ Erreur récupération token HA:", e);
    }

    // 🔹 Fallback manuel pour test local (remplacer par ton token long-lived)
    const MANUAL_TOKEN = "TON_LONG_LIVED_TOKEN_ICI";
    if (MANUAL_TOKEN && MANUAL_TOKEN.length > 30) {
      console.warn("🔑 Utilisation d’un token manuel (mode test)");
      return MANUAL_TOKEN;
    }

    console.error("❌ Aucun token disponible — les requêtes échoueront (401)");
    return null;
  }

  getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    return headers;
  }

  async loadSensors() {
    const container = document.getElementById("content");
    container.textContent = "Chargement...";
    try {
      const resp = await fetch("/api/home_suivi_elec/get_sensors", {
        headers: this.getAuthHeaders(),
      });

      if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
      this.sensors = await resp.json();
      this.render();
    } catch (e) {
      console.error("Erreur chargement capteurs:", e);
      container.innerHTML = `<p style="color:red;">❌ ${e.message}</p>`;
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

    document.getElementById("save-btn").onclick = () => this.saveSelection();
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
      const resp = await fetch("/api/home_suivi_elec/save_selection", {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(selected)
      });

      if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
      alert("✅ Sélection sauvegardée");
    } catch (e) {
      alert("❌ Erreur sauvegarde: " + e);
    }
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);