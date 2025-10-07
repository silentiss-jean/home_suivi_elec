class HomeSuiviElecPanel extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          font-family: "Roboto", Arial, sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }

        h1 {
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        h1 span.icon {
          color: var(--energy-color, #f5b300);
        }

        p {
          font-size: 1rem;
          line-height: 1.4;
        }

        .card {
          background: var(--ha-card-background, #fff1);
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          margin-top: 1.5rem;
        }

        .info {
          margin-top: 0.5rem;
          opacity: 0.85;
        }
      </style>

      <h1><span class="icon">⚡</span> Home Suivi Élec</h1>

      <div class="card">
        <h2>Intégration installée avec succès ✅</h2>
        <p>Le panneau <b>Home Suivi Élec</b> est maintenant accessible via la barre latérale de Home Assistant.</p>

        <div class="info">
          <p>📂 Les dossiers <code>data/</code> et <code>panel_static/</code> sont détectés.</p>
          <p>🧠 Prochaine étape : interface de sélection des capteurs et suivi énergétique.</p>
        </div>
      </div>

      <div class="card">
        <h3>Vérification rapide :</h3>
        <ul>
          <li>Service <code>home_suivi_elec.generate_local_data</code> → OK</li>
          <li>Service <code>home_suivi_elec.generate_selection</code> → à venir</li>
          <li>Fichiers JSON → consultables dans <code>custom_components/home_suivi_elec/data/</code></li>
        </ul>
      </div>
    `;
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);