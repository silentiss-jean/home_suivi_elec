// selectionPanel.js
"use strict";

import { emit } from "../shared/eventBus.js";
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
  col.innerHTML = `
    <div class="integration-help">
      ${columnName === "alternatives" ? `
        <p style="font-size:12px;color:#666;margin-bottom:10px;">
          Capteurs agrégés ou calculés (min_max, template, etc.).<br>
          <strong>Non sélectionnables</strong> pour le calcul de coût.
        </p>
      ` : ""}
    </div>
  `;

  // Parcours des intégrations
  const integKeys = Object.keys(dataByIntegration || {}).sort();
  integKeys.forEach(integKey => {
    const capteurs = dataByIntegration[integKey] || [];
    if (capteurs.length === 0) return;

    const titleHTML = `${title} — <strong>${integKey}</strong> (${capteurs.length})`;
    
    const panel = document.createElement("div");
    panel.className = "integration-block";
    
    const header = makeToggleHeader(getFold, setFold, integKey, columnName, titleHTML, panel);
    col.appendChild(header);
    
    // Contenu du panel
    capteurs.forEach(capteurData => {
      const {
        entity_id,
        friendly_name,
        platform,
        enabled,
        selectable = true,
        quality
      } = capteurData;

      const sensorDiv = document.createElement("div");
      sensorDiv.className = "sensor";
      
      const isRef = (entity_id === refEntityId);
      const refIcon = isRef ? "⚡" : "";
      
      const qualityBadge = quality ? createQualityBadgeHTML(quality) : "";
      
      if (selectable) {
        sensorDiv.innerHTML = `
          <label class="sensor-line ${isRef ? 'is-reference' : ''}">
            <input type="checkbox" 
                   class="capteur-checkbox" 
                   data-integration="${integKey}" 
                   data-entity="${entity_id}"
                   data-column="${columnName}"
                   ${enabled ? "checked" : ""}>
            <span class="sensor-name">
              ${refIcon} ${friendly_name || entity_id}
            </span>
            ${qualityBadge}
          </label>
        `;
        
        const checkbox = sensorDiv.querySelector(".capteur-checkbox");
        if (checkbox && handlers?.onChange) {
          checkbox.addEventListener("change", (e) => {
            handlers.onChange({
              entity_id,
              enabled: e.target.checked,
              integration: integKey,
              column: columnName
            });
          });
        }
        
      } else {
        // Non sélectionnable
        sensorDiv.innerHTML = `
          <div class="sensor-line non-selectable">
            <span class="sensor-name non-select">
              ${refIcon} ${friendly_name || entity_id}
            </span>
            <span class="non-select-reason">Non sélectionnable</span>
            ${qualityBadge}
          </div>
        `;
      }
      
      panel.appendChild(sensorDiv);
    });
    
    col.appendChild(panel);
  });

  parentEl.appendChild(col);
}


/**
 * FONCTION PRINCIPALE D'EXPORT
 * Génère les colonnes Sélection + Alternatives + gère les handlers
 */
export function renderSelectionColumns(rootContainer, context) {
  console.log("[selectionPanel] renderSelectionColumns appelé", context);
  
  if (!rootContainer) {
    console.error("[selectionPanel] rootContainer manquant !");
    return;
  }
  
  const {
    selected,
    alternatives,
    refEntityId,
    handlers,
    getFold,
    setFold
  } = context;

  // Nettoyage du conteneur
  rootContainer.innerHTML = "";
  
  // Création de la grille principale
  const mainGrid = document.createElement("div");
  mainGrid.id = "columns-grid";
  mainGrid.className = "grid";
  
  // Génération Colonne Sélection
  renderIntegrationColumn({
    parentEl: mainGrid,
    title: "✅ Sélection",
    dataByIntegration: selected,
    columnName: "selected",
    refEntityId,
    handlers,
    getFold,
    setFold
  });
  
  // Génération Colonne Alternatives
  renderIntegrationColumn({
    parentEl: mainGrid,
    title: "🔄 Alternatives",
    dataByIntegration: alternatives,
    columnName: "alternatives",
    refEntityId,
    handlers,
    getFold,
    setFold
  });
  
  rootContainer.appendChild(mainGrid);
  
  console.log("[selectionPanel] ✅ Colonnes de sélection générées");
  
  // Émettre événement de fin de rendu
  emit("selection-columns-rendered", { selected, alternatives });
}