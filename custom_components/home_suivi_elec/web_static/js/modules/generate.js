/**
 * Module de génération de cartes Lovelace
 * Compatible avec l'architecture existante
 */

export class LovelaceGenerator {
  constructor() {
    this.sensors = [];
    this.generatedYAML = '';
  }

  async init() {
    console.log('🎨 Initialisation du générateur Lovelace');
    
    this.attachEvents();
    await this.loadSensors();
  }

  attachEvents() {
    const btnGenerate = document.getElementById('btn-generate-yaml');
    const btnDownload = document.getElementById('btn-download-yaml');
    const btnPreview = document.getElementById('btn-preview');
    const btnCopy = document.getElementById('btn-copy-yaml');
    const btnRefresh = document.getElementById('refreshGenerate');

    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => this.generateYAML());
    }

    if (btnDownload) {
      btnDownload.addEventListener('click', () => this.downloadYAML());
    }

    if (btnPreview) {
      btnPreview.addEventListener('click', () => this.togglePreview());
    }

    if (btnCopy) {
      btnCopy.addEventListener('click', () => this.copyToClipboard());
    }

    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.loadSensors());
    }
  }

async loadSensors() {
  try {
    console.log('🔍 Chargement des sensors HSE via REST API locale...');
    const response = await fetch('/api/home_suivi_elec/lovelace_sensors');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const sensors = await response.json();
    this.sensors = sensors;

    const countEl = document.getElementById('sensor-count');
    if (countEl) {
      countEl.textContent = this.sensors.length > 0 ? this.sensors.length : 'Aucun trouvé';
      countEl.style.color = this.sensors.length > 0 ? 'inherit' : 'red';
    }

    console.log(`✅ ${this.sensors.length} sensors HSE trouvés`);
    // Log des 5 premiers pour debug
    if (this.sensors.length > 0) {
      console.log('📋 Exemples de sensors HSE:');
      this.sensors.slice(0, 5).forEach(s => {
        console.log(`  - ${s.entity_id} (${s.state})`);
      });
    } else {
      console.warn('⚠️ Aucun sensor HSE trouvé ! Vérifiez que les sensors existent.');
    }
  } catch (error) {
    console.error('❌ Erreur chargement sensors:', error);
    const countEl = document.getElementById('sensor-count');
    if (countEl) {
      countEl.textContent = `Erreur: ${error.message}`;
      countEl.style.color = 'red';
    }
  }
}

  async generateYAML() {
    if (this.sensors.length === 0) {
      alert('Aucun sensor HSE trouvé. Vérifiez que vos sensors sont créés.');
      return;
    }

    console.log('🎨 Génération du YAML...');

    // Filtre les sensors "daily" OU ceux qui contiennent "_d"
    const dailySensors = this.sensors
      .filter(s => {
        const eid = s.entity_id;
        return eid.includes('_d') || eid.includes('daily') || eid.includes('_day');
      })
      .sort((a, b) => parseFloat(b.state || 0) - parseFloat(a.state || 0))
      .slice(0, 10);

    if (dailySensors.length === 0) {
      console.warn('⚠️ Aucun sensor daily trouvé, utilisation de TOUS les sensors');
      // Fallback : prendre les 10 premiers sensors HSE
      const fallbackSensors = this.sensors
        .sort((a, b) => parseFloat(b.state || 0) - parseFloat(a.state || 0))
        .slice(0, 10);
      this.generatedYAML = this.buildLovelaceYAML(fallbackSensors);
    } else {
      this.generatedYAML = this.buildLovelaceYAML(dailySensors);
    }

    document.getElementById('yaml-code').textContent = this.generatedYAML;
    
    const lastGenEl = document.getElementById('last-gen');
    if (lastGenEl) {
      lastGenEl.textContent = new Date().toLocaleString('fr-FR');
    }

    console.log('✅ YAML généré');
  }

  buildLovelaceYAML(sensors) {
    return `# ⚡ Home Suivi Élec - Dashboard Auto-généré
# Généré le ${new Date().toLocaleString('fr-FR')}
# ${sensors.length} sensors inclus

title: ⚡ Home Suivi Élec
views:
  - title: Vue d'ensemble
    path: overview
    icon: mdi:home-analytics
    cards:
      - type: entities
        title: 📊 Top ${sensors.length} consommateurs
        show_header_toggle: false
        entities:
${sensors.map(s => `          - entity: ${s.entity_id}`).join('\n')}

      - type: history-graph
        title: 📈 Consommation 7 derniers jours
        hours_to_show: 168
        entities:
${sensors.slice(0, Math.min(5, sensors.length)).map(s => `          - ${s.entity_id}`).join('\n')}
`;
  }

  downloadYAML() {
    if (!this.generatedYAML) {
      alert('Générez d\'abord le YAML');
      return;
    }

    const blob = new Blob([this.generatedYAML], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `home_suivi_elec_dashboard_${Date.now()}.yaml`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ YAML téléchargé');
  }

  async copyToClipboard() {
    if (!this.generatedYAML) {
      alert('Générez d\'abord le YAML');
      return;
    }
  
    // Méthode moderne si disponible
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(this.generatedYAML);
        alert('YAML copié dans le presse-papiers !');
      } else {
        // Fallback si navigator.clipboard indisponible (certaines vieilles versions ou environnement)
        const textArea = document.createElement("textarea");
        textArea.value = this.generatedYAML;
        // Empêche tout scroll/autofocus inutiles
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (success) {
            alert('YAML copié dans le presse-papiers !');
          } else {
            throw new Error('execCommand a échoué');
          }
        } catch (err) {
          document.body.removeChild(textArea);
          alert('Erreur lors de la copie (fallback): ' + err.message);
        }
      }
    } catch (error) {
      alert('Erreur lors de la copie : ' + error.message);
      console.error('Erreur copie:', error);
    }
  }
  

  togglePreview() {
    const preview = document.getElementById('preview-container');
    if (preview.style.display === 'none') {
      preview.style.display = 'block';
      this.renderPreview();
    } else {
      preview.style.display = 'none';
    }
  }

  renderPreview() {
    const preview = document.getElementById('dashboard-preview');
    const dailySensors = this.sensors
      .filter(s => s.entity_id.includes('_d') || s.entity_id.includes('daily'))
      .sort((a, b) => parseFloat(b.state || 0) - parseFloat(a.state || 0))
      .slice(0, 10);

    const sensorsToShow = dailySensors.length > 0 ? dailySensors : this.sensors.slice(0, 10);

    const html = sensorsToShow.map(s => `
      <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px;">
        <div style="font-size: 12px; color: #6c757d;">${s.entity_id}</div>
        <div style="font-size: 24px; font-weight: bold; color: #0066ff; margin-top: 10px;">
          ${parseFloat(s.state || 0).toFixed(2)} ${s.attributes.unit_of_measurement || 'kWh'}
        </div>
      </div>
    `).join('');

    preview.innerHTML = html || '<p>Aucun sensor à afficher</p>';
  }
}

export async function loadGeneration() {
  const generator = new LovelaceGenerator();
  await generator.init();
  return generator;
}
