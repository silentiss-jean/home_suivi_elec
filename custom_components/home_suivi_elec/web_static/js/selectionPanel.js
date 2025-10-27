// selectionPanel.js
"use strict";

import { emit } from "./eventBus.js";
import { createQualityBadgeHTML } from "./configuration.js";

function makeToggleHeader(getFold, setFold, integrationKey, columnKey, titleHTML, panelEl) {
  const header = document.createElement("div");
  header.className = "duplicate-header";
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.gap = "8px";

  const left = document.createElement("div");
  left.className = "dup-title";
  left.style.display = "flex";
  left.style.alignItems = "center";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "toggle-btn";
  btn.style = "margin-right:8px; border:none; background:none; cursor:pointer; font-size:14px;";

  const opened = getFold(integrationKey, columnKey);
  btn.textContent = opened ? "▼" : "▶";
  panelEl.style.display = opened ? "block" : "none";

  btn.onclick = () => {
    const isOpen = panelEl.style.display !== "none";
    panelEl.style.display = isOpen ? "none" : "block";
    btn.textContent = isOpen ? "▶" : "▼";
    setFold(integrationKey, columnKey, !isOpen);
  };

  left.appendChild(btn);
  const span = document.createElement("span");
  span.innerHTML = titleHTML;
  left.appendChild(span);

  header.appendChild(left);
  return header;
}

function renderIntegrationColumn(opts) {
  const {
    parentEl,
    title,
    dataByIntegration,
    columnName, // "selected" | "alternatives"
    refEntityId,
    handlers,
    getFold,
    setFold
  } = opts || {};

  if (!parentEl) return;

  const col = document.createElement("div");
  col.className = `column ${columnName}`;
  col.innerHTML = `<h2>${title}</h2>`;

  const entries = Object.entries(dataByIntegration || {});
  entries.forEach(([integ, list0]) => {
    const list = Array.isArray(list0) ? list0 : [];
    if (list.length === 0) return;

    const integBlock = document.createElement("div");
    integBlock.className = "integration-block";

    const ul = document.createElement("ul");
    const header = makeToggleHeader(
      getFold, setFold,
      integ,
      columnName,
      `${integ} (${list.length})`,
      ul
    );

    integBlock.appendChild(header);

    list.forEach(c => {
      if (!c || !c.entity_id) return;
      const li = document.createElement("li");
      if (c.is_duplicate) li.className = "duplicate";

      const deviceBadge = (c.ui_device_label || c.device_name || c.area_name)
        ? `<span class="badge device">🔗 Appareil : ${c.ui_device_label || `${c.device_name || "Appareil"}${c.area_name ? " — " + c.area_name : ""}`}</span>`
        : "";
      const sameCnt = c.ui_same_device_count || 0;
      const sameBadge = sameCnt >= 2 ? `<span class="badge duplicate">⚠ Même appareil (×${sameCnt})</span>` : "";
      const refBadge = (refEntityId === c.entity_id) ? '<span class="badge reference">⭐ Réf.</span>' : "";
      const checked = columnName === "selected" ? "checked" : "";
      const qualityBadge = createQualityBadgeHTML(c);

      li.innerHTML = `
        <label>
          <input type="checkbox" class="capteur-checkbox" data-entity="${c.entity_id}" data-integration="${c.integration}" ${checked}>
          <span class="sensor-name">${c.friendly_name ?? c.entity_id}</span>
          <span class="badge integration">${c.integration}</span>
          ${qualityBadge}
        </label>
        ${deviceBadge}
        ${sameBadge}
        ${refBadge}
      `;
      ul.appendChild(li);
    });

    integBlock.appendChild(ul);

    // Boutons masse (optionnels)
    const mass = document.createElement("div");
    mass.className = "mass-actions";
    mass.innerHTML = `
      <button type="button" class="select-all-btn" data-integration="${integ}">Tout sélectionner</button>
      <button type="button" class="deselect-all-btn" data-integration="${integ}">Tout désélectionner</button>
    `;
    integBlock.appendChild(mass);

    col.appendChild(integBlock);
  });

  parentEl.appendChild(col);

  // Bind handlers
  parentEl.querySelectorAll(".select-all-btn").forEach(btn => {
    btn.addEventListener("click", () => handlers?.selectAll?.(btn.dataset.integration));
  });
  parentEl.querySelectorAll(".deselect-all-btn").forEach(btn => {
    btn.addEventListener("click", () => handlers?.deselectAll?.(btn.dataset.integration));
  });
  parentEl.querySelectorAll("input.capteur-checkbox").forEach(cb => {
    cb.addEventListener("change", () => handlers?.checkbox?.(cb.dataset.entity, cb.checked));
  });
}

export function renderSelectionColumns(container, ctx) {
  const { selected, alternatives, refEntityId, handlers, getFold, setFold } = ctx || {};
  if (!container) return;

  const grid = document.createElement("div");
  grid.id = "columns-grid";
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr 1fr";
  grid.style.gap = "16px";

  renderIntegrationColumn({
    parentEl: grid,
    title: "Capteurs sélectionnés",
    dataByIntegration: selected,
    columnName: "selected",
    refEntityId,
    handlers,
    getFold, setFold
  });

  renderIntegrationColumn({
    parentEl: grid,
    title: "Alternatives / Doublons",
    dataByIntegration: alternatives,
    columnName: "alternatives",
    refEntityId,
    handlers,
    getFold, setFold
  });

  // Slot pour la colonne “Doublons par appareil” (gérée par duplicatesPanel)
  const dupCol = document.createElement("div");
  dupCol.className = "column duplicates";
  dupCol.innerHTML = `<h2>Doublons par appareil</h2>`;
  grid.appendChild(dupCol);

  container.innerHTML = "";
  container.appendChild(grid);

  emit("selection:rendered");
}
// ========================================
// AJOUT : Système de scoring de qualité
// ========================================

/**
 * Charge les capteurs avec leurs scores de qualité.
 */
async function loadSensorsWithQuality() {
    try {
        const response = await fetch('/api/home_suivi_elec/get_sensor_quality_scores');
        const data = await response.json();
        
        if (data.success) {
            return data.sensors.map(sensor => ({
                ...sensor,
                quality_score: computeSensorScore(sensor),
                recommendation: getRecommendationLabel(computeSensorScore(sensor)),
                stars: getStars(computeSensorScore(sensor))
            }));
        }
    } catch (error) {
        console.error('Erreur chargement capteurs:', error);
        return [];
    }
}

/**
 * Calcule le score de qualité (0-150).
 */
function computeSensorScore(sensor) {
    let score = 0;
    
    // Type de mesure
    const unit = (sensor.unit || '').toLowerCase();
    if (unit.includes('kwh') || unit.includes('wh')) {
        score += 100; // Energy
    } else if (unit.includes('w')) {
        score += 50;  // Power
    }
    
    // State class
    if (sensor.state_class === 'total') score += 20;
    else if (sensor.state_class === 'measurement') score += 10;
    
    // Qualité intégration
    if (sensor.is_premium) score += 15;
    if (sensor.quality_scale === 'platinum' || sensor.quality_scale === 'gold') score += 10;
    
    // Physique vs virtuel
    if (!sensor.is_virtual) score += 10;
    
    // Disponibilité
    if (sensor.state && sensor.state !== 'unavailable') score += 5;
    
    return score;
}

function getRecommendationLabel(score) {
    if (score >= 130) return '✅ EXCELLENT';
    if (score >= 100) return '✅ BON';
    if (score >= 70) return '⚠️ ACCEPTABLE';
    if (score >= 50) return '⚠️ MOYEN';
    return '❌ FAIBLE';
}

function getStars(score) {
    if (score >= 130) return '⭐⭐⭐';
    if (score >= 100) return '⭐⭐⭐';
    if (score >= 70) return '⭐⭐';
    if (score >= 50) return '⭐';
    return '☆';
}

/**
 * Affiche un badge de qualité pour un capteur.
 */
function displayQualityBadge(sensor, container) {
    const score = sensor.quality_score || 0;
    const badgeClass = score >= 130 ? 'excellent' : score >= 100 ? 'good' : score >= 70 ? 'acceptable' : 'poor';
    const icon = (sensor.unit || '').toLowerCase().includes('kwh') ? '🔋' : '⚡';
    
    const badge = document.createElement('div');
    badge.className = `quality-badge ${badgeClass}`;
    badge.innerHTML = `
        <div class="badge-header">
            <span class="badge-icon">${icon}</span>
            <span class="badge-label">${sensor.recommendation}</span>
        </div>
        <div class="badge-details">
            <span class="badge-score">Score: ${score}/150</span>
            <span class="badge-stars">${sensor.stars}</span>
        </div>
    `;
    
    container.appendChild(badge);
}

/**
 * Sélection automatique des meilleurs capteurs.
 */
async function autoSelectBestSensors() {
    try {
        const response = await fetch('/api/home_suivi_elec/auto_select_best_sensors', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ ${data.selected_count} capteurs sélectionnés automatiquement !`);
            location.reload(); // Recharger la page
        }
    } catch (error) {
        console.error('Erreur auto-sélection:', error);
    }
}

// ✅ Exporter les fonctions pour utilisation dans d'autres modules
export {
  computeSensorScore,
  getRecommendationLabel,
  getStars,
  displayQualityBadge,
  loadSensorsWithQuality,
  autoSelectBestSensors
};

// ✅ Exposer globalement pour le bouton HTML
window.autoSelectBestSensors = autoSelectBestSensors;
window.computeSensorScore = computeSensorScore;

// ════════════════════════════════════════════════════════════════════════════
// ✅ ÉTAPE 3/4 : Affichage de la section HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Affiche la colonne des helpers (capteurs non sélectionnables).
 * 
 * @param {HTMLElement} container - Conteneur où ajouter la colonne
 * @param {Object} helpers - Map des helpers {entity_id: capteur}
 */
export function renderHelpersColumn(container, helpers) {
  if (!container || !helpers || Object.keys(helpers).length === 0) {
    console.log('[selectionPanel] Aucun helper à afficher');
    return;
  }
  
  const col = document.createElement('div');
  col.className = 'column helpers-column';
  col.innerHTML = `
    <div class="helpers-header">
      <h2>📊 Helpers (statistiques)</h2>
      <div class="helpers-info">
        <span class="info-badge" title="Ces capteurs ne sont PAS utilisés pour le calcul de coût">ℹ️</span>
        <p class="section-description">
          Capteurs agrégés ou calculés (min_max, template, etc.).<br>
          <strong>Non sélectionnables</strong> pour le calcul de coût.
        </p>
      </div>
      <button type="button" class="toggle-helpers-btn" onclick="window.toggleHelpers()">
        <span class="toggle-icon">▼</span> Afficher les helpers (${Object.keys(helpers).length})
      </button>
    </div>
    <div class="helpers-list" style="display: none;">
      <!-- Contenu ajouté dynamiquement -->
    </div>
  `;
  
  const helpersList = col.querySelector('.helpers-list');
  
  // Grouper par intégration
  const byIntegration = {};
  Object.entries(helpers).forEach(([entityId, helper]) => {
    const integration = helper.integration || 'unknown';
    if (!byIntegration[integration]) {
      byIntegration[integration] = [];
    }
    byIntegration[integration].push(helper);
  });
  
  // Afficher chaque intégration
  Object.entries(byIntegration).forEach(([integration, helpersList_data]) => {
    const integBlock = document.createElement('div');
    integBlock.className = 'integration-block helper-block';
    
    const ul = document.createElement('ul');
    
    helpersList_data.forEach(helper => {
      const li = document.createElement('li');
      li.className = 'helper-item';
      li.innerHTML = `
        <div class="helper-content">
          <span class="sensor-name">${helper.friendly_name || helper.entity_id}</span>
          <span class="badge integration">${integration}</span>
          <span class="badge helper-badge">🚫 Non sélectionnable</span>
        </div>
        <div class="helper-details">
          <small>${helper.entity_id}</small>
        </div>
      `;
      ul.appendChild(li);
    });
    
    integBlock.innerHTML = `<h4>${integration} (${helpersList_data.length})</h4>`;
    integBlock.appendChild(ul);
    helpersList.appendChild(integBlock);
  });
  
  container.appendChild(col);
  
  console.log(`[selectionPanel] ✅ Colonne helpers ajoutée : ${Object.keys(helpers).length} helpers`);
}

// Fonction globale pour le bouton toggle
window.toggleHelpers = function() {
  const helpersList = document.querySelector('.helpers-list');
  const toggleBtn = document.querySelector('.toggle-helpers-btn');
  const toggleIcon = document.querySelector('.toggle-helpers-btn .toggle-icon');
  
  if (!helpersList || !toggleBtn) return;
  
  if (helpersList.style.display === 'none') {
    helpersList.style.display = 'block';
    toggleIcon.textContent = '▲';
    toggleBtn.innerHTML = '<span class="toggle-icon">▲</span> Masquer les helpers';
  } else {
    helpersList.style.display = 'none';
    toggleIcon.textContent = '▼';
    const count = document.querySelectorAll('.helpers-list .helper-item').length;
    toggleBtn.innerHTML = `<span class="toggle-icon">▼</span> Afficher les helpers (${count})`;
  }
};

