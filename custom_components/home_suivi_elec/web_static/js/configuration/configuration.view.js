// js/configuration.view.js — Vue configuration
import { getFold, setFold } from "./configuration.state.js";

export function ensureUserConfigAbove(root) {
  const el = document.getElementById("userConfigPanel");
  if (!el) {
    const panel = document.createElement("div");
    panel.id = "userConfigPanel";
    panel.innerHTML = ""; // conservé, structure HTML existante dans index
    root.prepend(panel);
  }
}

export function makeToggleHeader(title, panel, storageKey, columnName) {
  const container = document.createElement("div");
  container.className = "toggle-header";
  const icon = document.createElement("span");
  icon.className = "toggle-icon";
  const opened = getFold(storageKey, columnName);
  icon.textContent = opened ? "▼" : "▶";
  panel.style.display = opened ? "block" : "none";
  container.appendChild(icon);

  const titleSpan = document.createElement("span");
  titleSpan.innerHTML = title;
  container.appendChild(titleSpan);

  container.onclick = () => {
    const isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "block";
    icon.textContent = isOpen ? "▶" : "▼";
    setFold(storageKey, columnName, !isOpen);
  };

  return container;
}

export function renderIntegrationColumn(root, title, integration, list, options) {
  const col = document.createElement("div");
  col.className = "column";

  const panel = document.createElement("div");
  const header = makeToggleHeader(`${title} (${(list||[]).length})`, panel, integration, options.columnName);
  col.appendChild(header);

  // Corps
  const ul = document.createElement("ul");
  (list || []).forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `
      <label>
        <input type="checkbox" class="capteur-checkbox" data-integration="${integration}" data-entity="${c.entity_id}" ${c.enabled ? "checked" : ""}>
        ${c.friendly_name || c.entity_id}
      </label>
      ${c.ui_device_label ? `<span class="device-label">${c.ui_device_label}</span>` : ""}
      ${c.quality_recommendation ? `<span class="quality-label">${c.quality_recommendation}</span>` : ""}
    `;
    ul.appendChild(li);
  });
  panel.appendChild(ul);

  col.appendChild(panel);
  root.appendChild(col);
}

export function renderDuplicatesColumn(root, { groupsByDevice, ignored, allCapteurs, onIgnore, onKeepBest, refEntityId, instantById }) {
  const col = document.createElement("div");
  col.className = "column duplicates";

  // Le panel Duplicates sera rendu par duplicatesPanel.js via eventBus
  root.appendChild(col);
}
