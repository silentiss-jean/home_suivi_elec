class HomeSuiviElecPanel extends HTMLElement {
  constructor() {
    super();
    this.sensors = {};
    this.token = null;
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

  async getAuthToken() {
    try {
      const conn = await window.hassConnection;
      if (conn?.options?.auth?.accessToken) {
        console.log("🔐 Token HA récupéré automatiquement");
        return conn.options.auth.accessToken;
      }
    } catch (e) {
      console.warn("⚠️ Impossible d'obtenir le token HA:", e);
    }

    // 🔹 Token manuel pour tests REST
    const MANUAL_TOKEN = "🔑__TON_TOKEN_LONG_LIVED_ICI__🔑";
    if (MANUAL_TOKEN.length > 30) {
      console.warn("⚠️ Mode test REST (token manuel utilisé)");
      return MANUAL_TOKEN;
    }

    console.error("❌ Aucun token disponible !");
    return null;
  }

  getHeaders() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async loadSensors() {
    const div = this.querySelector("#content");
    div.textContent = "Chargement...";
    try {
      const resp = await fetch("/api/home_suivi_elec/get_sensors", { headers: this.getHeaders() });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this.sensors = await resp.json();
      this.render();
    } catch (e) {
      div.innerHTML = `<p style="color:red;">❌ ${e.message}</p>`;
      console.error(e);
    }
  }

  render() {
    const div = this.querySelector("#content");
    div.innerHTML = "";
    for (const [integ, caps] of Object.entries(this.sensors)) {
      const block = document.createElement("div");
      block.innerHTML = `<h3>${integ}</h3>`;
      caps.forEach(c => {
        const row = document.createElement("div");
        row.innerHTML = `
          <label>
            <input type="checkbox" id="${c.entity_id}" checked />
            ${c.friendly_name} (${c.area || "?"}) [${c.unit || "?"}]
          </label>`;
        block.appendChild(row);
      });
      div.appendChild(block);
    }
    this.querySelector("#save-btn").onclick = () => this.saveSelection();
  }

  async saveSelection() {
    const selected = {};
    for (const [integ, caps] of Object.entries(this.sensors)) {
      selected[integ] = caps.map(c => {
        const cb = this.querySelector(`#${c.entity_id}`);
        return { ...c, enabled: cb.checked };
      });
    }
    try {
      const resp = await fetch("/api/home_suivi_elec/save_selection", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(selected),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      alert("✅ Sélection sauvegardée !");
    } catch (e) {
      alert(`❌ ${e.message}`);
    }
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);