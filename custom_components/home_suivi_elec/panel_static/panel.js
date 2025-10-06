class HomeSuiviElecPanel extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        .wrapper {
          font-family: Arial, sans-serif;
          margin: 2rem;
          color: var(--primary-text-color);
        }
        h1 {
          font-size: 1.6rem;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: var(--secondary-text-color);
          margin-bottom: 1rem;
        }
        .status {
          background: var(--card-background-color);
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
      </style>
      <div class="wrapper">
        <h1>⚡ Home Suivi Élec</h1>
        <div class="subtitle">Panneau de configuration et de suivi énergétique</div>
        <div class="status">
          <p>✅ L’intégration est correctement installée.</p>
          <p>📂 Les dossiers <b>data/</b> et <b>panel_static/</b> sont présents.</p>
          <p>🧠 Prochaine étape : affichage de la sélection de capteurs.</p>
        </div>
      </div>
    `;
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);