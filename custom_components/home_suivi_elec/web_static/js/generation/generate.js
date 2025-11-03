// modules/generate.js — Générateur de YAML Lovelace
"use strict";

const DEBUG = true;

export async function loadGeneration() {
  console.log('🛠️ [generate] Initialisation module génération...');
  
  try {
    const generator = new LovelaceGenerator();
    await generator.init();
    console.log('✅ [generate] Module génération initialisé');
  } catch (error) {
    console.error('❌ [generate] Erreur initialisation:', error);
    const container = document.getElementById('generation-content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h3>❌ Erreur de chargement</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()">Recharger la page</button>
        </div>
      `;
    }
  }
}

class LovelaceGenerator {
  constructor() {
    this.sensors = null;
    this.container = null;
    this.previewContainer = null;
    this.debug('LovelaceGenerator instancié');
  }

  debug(message, data = null) {
    if (DEBUG) {
      console.log(`📝 [LovelaceGenerator] ${message}`, data || '');
    }
  }

  async init() {
    this.debug('Initialisation...');
    
    // Trouver les containers
    this.container = document.getElementById('generation-content');
    this.previewContainer = document.getElementById('lovelace-preview');
    
    if (!this.container) {
      throw new Error('Container #generation-content non trouvé');
    }
    
    // Charger les données
    await this.loadSensors();
    
    // Construire l'interface
    this.buildInterface();
    
    // Générer automatiquement un aperçu
    this.generatePreview();
    
    this.debug('Initialisation terminée');
  }

  async loadSensors() {
    this.debug('Chargement des capteurs...');
    
    try {
      const response = await fetch('/api/home_suivi_elec/lovelace_sensors');
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }
      
      this.sensors = await response.json();
      this.debug('Capteurs chargés', this.sensors);
      
      // Vérifier la structure des données
      if (!this.sensors || typeof this.sensors !== 'object') {
        throw new Error('Format de données invalide reçu de l\'API');
      }
      
    } catch (error) {
      console.error('❌ [generate] Erreur chargement capteurs:', error);
      throw new Error(`Impossible de charger les capteurs: ${error.message}`);
    }
  }

  buildInterface() {
    this.debug('Construction de l\'interface...');
    
    const sensorsCount = this.countSensors();
    
    this.container.innerHTML = `
      <div class="generation-header">
        <h2>🏠 Générateur Dashboard Lovelace</h2>
        <div class="stats">
          <span class="stat-item">
            <strong>${sensorsCount.total}</strong> capteurs détectés
          </span>
          <span class="stat-item">
            <strong>${sensorsCount.selected}</strong> sélectionnés
          </span>
        </div>
      </div>
      
      <div class="generation-controls">
        <div class="control-group">
          <label>
            <input type="checkbox" id="include-energy" checked>
            Inclure capteurs d'énergie (kWh)
          </label>
        </div>
        <div class="control-group">
          <label>
            <input type="checkbox" id="include-power" checked>
            Inclure capteurs de puissance (W)
          </label>
        </div>
        <div class="control-group">
          <label>
            <input type="checkbox" id="group-by-integration">
            Grouper par intégration
          </label>
        </div>
        <div class="control-group">
          <button id="regenerate-btn" class="btn btn-primary">
            🔄 Regénérer
          </button>
          <button id="copy-yaml-btn" class="btn btn-secondary">
            📋 Copier YAML
          </button>
        </div>
      </div>
      
      <div class="generation-preview">
        <h3>Aperçu généré</h3>
        <pre id="lovelace-preview" class="yaml-preview"></pre>
      </div>
    `;
    
    // Attacher les événements
    this.attachEvents();
  }

  attachEvents() {
    this.debug('Attachement des événements...');
    
    const regenerateBtn = document.getElementById('regenerate-btn');
    const copyBtn = document.getElementById('copy-yaml-btn');
    
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        this.debug('Regénération demandée');
        this.generatePreview();
      });
    }
    
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        this.copyYamlToClipboard();
      });
    }
    
    // Écouter les changements de checkboxes
    ['include-energy', 'include-power', 'group-by-integration'].forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          this.debug(`Option changée: ${id} = ${checkbox.checked}`);
          this.generatePreview();
        });
      }
    });
  }

  countSensors() {
    let total = 0;
    let selected = 0;
    
    if (this.sensors && this.sensors.selected) {
      Object.values(this.sensors.selected).forEach(list => {
        if (Array.isArray(list)) {
          total += list.length;
          selected += list.filter(s => s.enabled !== false).length;
        }
      });
    }
    
    if (this.sensors && this.sensors.alternatives) {
      Object.values(this.sensors.alternatives).forEach(list => {
        if (Array.isArray(list)) {
          total += list.length;
        }
      });
    }
    
    return { total, selected };
  }

  generatePreview() {
    this.debug('Génération de l\'aperçu...');
    
    if (!this.previewContainer) {
      this.previewContainer = document.getElementById('lovelace-preview');
    }
    
    if (!this.previewContainer) {
      console.warn('Container preview non trouvé');
      return;
    }
    
    try {
      const options = this.getGenerationOptions();
      const yaml = this.generateLovelaceYaml(options);
      
      this.previewContainer.textContent = yaml;
      
      // Optionnel: coloration syntaxique simple
      this.applySyntaxHighlighting();
      
    } catch (error) {
      console.error('❌ [generate] Erreur génération:', error);
      this.previewContainer.textContent = `# Erreur génération:\n# ${error.message}`;
    }
  }

  getGenerationOptions() {
    return {
      includeEnergy: document.getElementById('include-energy')?.checked ?? true,
      includePower: document.getElementById('include-power')?.checked ?? true,
      groupByIntegration: document.getElementById('group-by-integration')?.checked ?? false
    };
  }

  generateLovelaceYaml(options) {
    this.debug('Génération YAML avec options:', options);
    
    let yaml = `# Dashboard Home Suivi Élec - Généré le ${new Date().toLocaleString()}\n`;
    yaml += `title: "Suivi Électrique"\n`;
    yaml += `views:\n`;
    yaml += `  - title: "Consommation"\n`;
    yaml += `    path: "consommation"\n`;
    yaml += `    icon: "mdi:flash"\n`;
    yaml += `    cards:\n`;
    
    if (!this.sensors || !this.sensors.selected) {
      yaml += `      # Aucun capteur sélectionné\n`;
      return yaml;
    }
    
    const cards = this.generateCards(options);
    cards.forEach(card => {
      yaml += this.cardToYaml(card, 6); // 6 espaces d'indentation
    });
    
    return yaml;
  }

  generateCards(options) {
    const cards = [];
    
    // Carte de puissance instantanée
    if (options.includePower) {
      cards.push(this.createPowerCard());
    }
    
    // Cartes d'énergie
    if (options.includeEnergy) {
      if (options.groupByIntegration) {
        cards.push(...this.createEnergyCardsByIntegration());
      } else {
        cards.push(this.createEnergyCard());
      }
    }
    
    return cards;
  }

  createPowerCard() {
    const entities = this.getSelectedEntitiesByType('power');
    
    return {
      type: 'entities',
      title: 'Puissance Instantanée',
      icon: 'mdi:lightning-bolt',
      entities: entities.map(e => ({
        entity: e.entity_id,
        name: e.friendly_name || e.entity_id
      }))
    };
  }

  createEnergyCard() {
    const entities = this.getSelectedEntitiesByType('energy');
    
    return {
      type: 'history-graph',
      title: 'Consommation Énergétique',
      entities: entities.map(e => e.entity_id),
      hours_to_show: 24,
      refresh_interval: 60
    };
  }

  createEnergyCardsByIntegration() {
    const cards = [];
    const entitiesByIntegration = this.getSelectedEntitiesGroupedByIntegration('energy');
    
    Object.entries(entitiesByIntegration).forEach(([integration, entities]) => {
      if (entities.length > 0) {
        cards.push({
          type: 'history-graph',
          title: `Énergie - ${integration}`,
          entities: entities.map(e => e.entity_id),
          hours_to_show: 24
        });
      }
    });
    
    return cards;
  }

  getSelectedEntitiesByType(type) {
    const entities = [];
    
    if (this.sensors && this.sensors.selected) {
      Object.values(this.sensors.selected).forEach(list => {
        if (Array.isArray(list)) {
          list.forEach(sensor => {
            if (sensor.enabled !== false) {
              const unit = (sensor.unit || '').toLowerCase();
              const isEnergy = unit.includes('kwh') || unit.includes('wh');
              const isPower = unit.includes('w') && !isEnergy;
              
              if ((type === 'energy' && isEnergy) || (type === 'power' && isPower)) {
                entities.push(sensor);
              }
            }
          });
        }
      });
    }
    
    return entities;
  }

  getSelectedEntitiesGroupedByIntegration(type) {
    const groups = {};
    
    if (this.sensors && this.sensors.selected) {
      Object.entries(this.sensors.selected).forEach(([integration, list]) => {
        if (Array.isArray(list)) {
          const filtered = list.filter(sensor => {
            if (sensor.enabled === false) return false;
            
            const unit = (sensor.unit || '').toLowerCase();
            const isEnergy = unit.includes('kwh') || unit.includes('wh');
            const isPower = unit.includes('w') && !isEnergy;
            
            return (type === 'energy' && isEnergy) || (type === 'power' && isPower);
          });
          
          if (filtered.length > 0) {
            groups[integration] = filtered;
          }
        }
      });
    }
    
    return groups;
  }

  cardToYaml(card, indent = 0) {
    const spaces = ' '.repeat(indent);
    let yaml = `${spaces}- type: ${card.type}\n`;
    
    Object.entries(card).forEach(([key, value]) => {
      if (key === 'type') return; // Déjà traité
      
      yaml += `${spaces}  ${key}: `;
      
      if (Array.isArray(value)) {
        yaml += `\n`;
        value.forEach(item => {
          if (typeof item === 'string') {
            yaml += `${spaces}    - ${item}\n`;
          } else if (typeof item === 'object') {
            yaml += `${spaces}    - `;
            Object.entries(item).forEach(([k, v], index) => {
              if (index === 0) {
                yaml += `${k}: ${v}\n`;
              } else {
                yaml += `${spaces}      ${k}: ${v}\n`;
              }
            });
          }
        });
      } else if (typeof value === 'string') {
        yaml += `"${value}"\n`;
      } else {
        yaml += `${value}\n`;
      }
    });
    
    return yaml;
  }

  applySyntaxHighlighting() {
    // Coloration syntaxique basique pour YAML
    if (!this.previewContainer) return;
    
    let content = this.previewContainer.textContent;
    
    // Remplacer par du HTML avec classes CSS
    content = content
      .replace(/^(\s*)(\w+):/gm, '$1<span class="yaml-key">$2</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="yaml-string">"$1"</span>')
      .replace(/^(\s*)(#.*)$/gm, '$1<span class="yaml-comment">$2</span>');
    
    this.previewContainer.innerHTML = content;
  }

  async copyYamlToClipboard() {
    if (!this.previewContainer) return;
    
    try {
      const yaml = this.previewContainer.textContent;
      await navigator.clipboard.writeText(yaml);
      
      // Feedback visuel
      const btn = document.getElementById('copy-yaml-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ Copié !';
        btn.classList.add('btn-success');
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('btn-success');
        }, 2000);
      }
      
      this.debug('YAML copié dans le presse-papiers');
      
    } catch (error) {
      console.error('❌ [generate] Erreur copie:', error);
      alert('Erreur lors de la copie du YAML');
    }
  }
}

// Styles CSS pour la coloration syntaxique
const style = document.createElement('style');
style.textContent = `
  .yaml-preview {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 16px;
    font-family: 'Courier New', Consolas, monospace;
    font-size: 13px;
    line-height: 1.4;
    max-height: 500px;
    overflow: auto;
    white-space: pre;
  }
  
  .yaml-key {
    color: #d73a49;
    font-weight: bold;
  }
  
  .yaml-string {
    color: #032f62;
  }
  
  .yaml-comment {
    color: #6a737d;
    font-style: italic;
  }
  
  .generation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e9ecef;
  }
  
  .stats {
    display: flex;
    gap: 20px;
  }
  
  .stat-item {
    color: #6c757d;
    font-size: 14px;
  }
  
  .generation-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
    align-items: center;
  }
  
  .control-group {
    display: flex;
    align-items: center;
  }
  
  .control-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 14px;
    cursor: pointer;
  }
  
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-primary:hover {
    background: #0056b3;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-secondary:hover {
    background: #545b62;
  }
  
  .btn-success {
    background: #28a745 !important;
  }
  
  .error-message {
    text-align: center;
    padding: 40px;
    color: #dc3545;
  }
  
  .error-message h3 {
    margin-bottom: 10px;
  }
  
  .error-message button {
    margin-top: 15px;
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`;

document.head.appendChild(style);
