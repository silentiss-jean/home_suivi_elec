// selectionPanel.js
"use strict";

import { emit } from "./eventBus.js";

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

      li.innerHTML = `
        <label>
          <input type="checkbox" class="capteur-checkbox" data-entity="${c.entity_id}" data-integration="${c.integration}" ${checked}>
          <span class="sensor-name">${c.friendly_name ?? c.entity_id}</span>
          <span class="badge integration">${c.integration}</span>
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
