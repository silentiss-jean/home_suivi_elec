class HomeSuiviElecPanel extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
      <h1>⚡ Home Suivi Élec — Hello World Panel</h1>
      <div id="content">Chargement...</div>
    `;
  }

  async connectedCallback() {
    const container = document.getElementById("content");
    try {
      // 🔹 Test WebSocket HA
      const result = await window.hass.callWS({ type: "config/core/update" }).catch(() => "WS OK");
      container.textContent = "✅ Hello World! HA WebSocket connecté: " + result;
    } catch (err) {
      console.error("Erreur WebSocket:", err);
      container.innerHTML = `<p style="color:red;">❌ Erreur WebSocket: ${err.message}</p>`;
    }
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);
