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
          overflow: hidden;
        }

        .fade-in {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeIn 0.8s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h1 {
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        h1 span.icon {
          color: var(--energy-color, #f5b300);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0,0,0,0.1);
          border-left-color: var(--energy-color, #f5b300);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 3rem auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .card {
          background: var(--ha-card-background, rgba(255,255,255,0.05));
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          margin-top: 1.5rem;
        }

        .info {
          margin-top: 0.5rem;
          opacity: 0.85;
        }

        ul {
          padding-left: 1.2rem;
        }
      </style>

      <h1 class="fade-in"><span class="icon">⚡</span> Home Suivi Élec</h1>

      <div id="loader" class="loader"></div>

      <div id="content" style="display:none;">
        <div class="card fade-in">
          <h2>Intégration installée avec succès ✅</h2>
          <p>Le panneau <b>Home Suivi Élec</b> est maintenant accessible via la barre latérale.</p>
          <div class="info">
            <p>📂 Les dossiers <code>data/</code> et <code>panel_static/</code> sont détectés.</p>
            <p>🧠 Prochaine étape : interface de sélection des capteurs et suivi énergétique.</p>
          </div>
        </div>

        <div class="card fade-in">
          <h3>Vérification rapide :</h3>
          <ul>
            <li>Service <code>home_suivi_elec.generate_local_data</code> → OK</li>
            <li>Service <code>home_suivi_elec.generate_selection</code> → à venir</li>
            <li>Fichiers JSON → consultables dans <code>custom_components/home_suivi_elec/data/</code></li>
          </ul>
        </div>
      </div>

      <script>
        // Simulation de chargement avant affichage du contenu
        setTimeout(() => {
          document.querySelector('#loader').style.display = 'none';
          document.querySelector('#content').style.display = 'block';
        }, 1200);
      </script>
    `;
  }
}

customElements.define("home-suivi-elec-panel", HomeSuiviElecPanel);