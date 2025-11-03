// selectionPanel.js — Rendu des colonnes de sélection
import { on } from "../shared/eventBus.js";
import { renderDuplicates } from "../duplicates/duplicatesPanel.js";

export function renderSelectionColumns(root, { selected, alternatives, refEntityId, handlers, getFold, setFold }) {
  const grid = document.createElement("div");
  grid.id = "columns-grid";
  grid.className = "grid";
  root.appendChild(grid);

  const colSelected = document.createElement("div");
  colSelected.className = "column selected";
  grid.appendChild(colSelected);

  const colAlt = document.createElement("div");
  colAlt.className = "column alternatives";
  grid.appendChild(colAlt);

  const colDup = document.createElement("div");
  colDup.className = "column duplicates";
  grid.appendChild(colDup);

  const renderColumn = (col, title, integMap, columnName) => {
    col.innerHTML = "";
    const keys = Object.keys(integMap || {}).sort();
    keys.forEach(integ => {
      const list = integMap[integ] || [];
      const panel = document.createElement("div");

      const header = document.createElement("div");
      header.className = "toggle-header";
      const icon = document.createElement("span");
      icon.className = "toggle-icon";
      const opened = getFold(integ, columnName);
      icon.textContent = opened ? "▼" : "▶";
      panel.style.display = opened ? "block" : "none";
      header.appendChild(icon);

      const titleSpan = document.createElement("span");
      titleSpan.innerHTML = `${title} — <strong>${integ}</strong> (${list.length})`;
      header.appendChild(titleSpan);

      header.onclick = () => {
        const isOpen = panel.style.display !== "none";
        panel.style.display = isOpen ? "none" : "block";
        icon.textContent = isOpen ? "▶" : "▼";
        setFold(integ, columnName, !isOpen);
      };

      col.appendChild(header);

      const ul = document.createElement("ul");
      (list || []).forEach(row => {
        const li = document.createElement("li");
        li.innerHTML = `
          <label>
            <input type="checkbox" class="capteur-checkbox" data-integration="${integ}" data-entity="${row.entity_id}" ${row.enabled ? "checked" : ""}>
            ${row.friendly_name || row.entity_id}
          </label>
        `;
        ul.appendChild(li);
      });

      panel.appendChild(ul);
      col.appendChild(panel);
    });
  };

  renderColumn(colSelected, "Sélection", selected, "selected");
  renderColumn(colAlt, "Alternatives", alternatives, "alternatives");

  // Rendu de la colonne Duplicates via renderDuplicates
  renderDuplicates(grid, {
    groupsByDevice: new Map(), // sera hydraté par configuration.js
    ignored: new Set(),
    allCapteurs: {},
    onIgnore: handlers?.onIgnore,
    onKeepBest: handlers?.onKeepBest,
    refEntityId,
    instantById: {}
  });

  // Coordonne via eventBus
  on("selection:saved", () => {
    // éventuellement, redessiner
  });
}
