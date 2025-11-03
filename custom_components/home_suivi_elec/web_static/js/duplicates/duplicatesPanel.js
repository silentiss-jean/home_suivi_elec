// duplicatesPanel.js
"use strict";

import { on, emit } from "../shared/eventBus.js";
import stateModule from "../shared/stateModule.js";

// Utilitaires d’affichage
function makeToggleHeader(storageKey, columnKey, titleHTML, panelEl) {
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

  // État de pliage depuis store
  const uiFold = stateModule.get("uiFold") || {};
  const foldKey = `${storageKey}:${columnKey}`;
  const opened = !!uiFold[foldKey];
  btn.textContent = opened ? "▼" : "▶";
  panelEl.style.display = opened ? "block" : "none";

  btn.onclick = () => {
    const isOpen = panelEl.style.display !== "none";
    panelEl.style.display = isOpen ? "none" : "block";
    btn.textContent = isOpen ? "▶" : "▼";
    const next = { ...uiFold, [foldKey]: !isOpen };
    stateModule.set("uiFold", next);
  };

  left.appendChild(btn);
  const span = document.createElement("span");
  span.innerHTML = titleHTML;
  left.appendChild(span);

  header.appendChild(left);
  return header;
}

function renderGroups(wrapper, { groupsByDevice, ignored, allCapteurs, onIgnore, onKeepBest, refEntityId, instantById }) {
  wrapper.innerHTML = `<h2>Doublons par appareil</h2>`;

  const devices = Array.from(groupsByDevice.entries()).map(([did, g]) => ({
    device_id: did, name: g.name || "Appareil", area: g.area || "", members: g.members || []
  })).filter(g => (g.members?.length || 0) >= 2);

  const multi = [];
  const byIntegration = new Map(); // integ -> { devices: [deviceGroup], total }
  devices.forEach(g => {
    const integSet = new Set(g.members.map(m => allCapteurs[m.entity_id]?.integration).filter(Boolean));
    if (integSet.size >= 2) {
      multi.push(g);
    } else {
      const integ = Array.from(integSet)[0] || "unknown";
      if (!byIntegration.has(integ)) byIntegration.set(integ, { devices: [], total: 0 });
      byIntegration.get(integ).devices.push(g);
      byIntegration.get(integ).total += g.members.length;
    }
  });

  // A) Multi-intégrations
  const secA_panel = document.createElement("div");
  const secA_header = makeToggleHeader("dup_section_multi", "multi", `Doublons multi-intégrations`, secA_panel);
  wrapper.appendChild(secA_header);

  if (multi.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Aucun doublon multi-intégrations.";
    secA_panel.appendChild(p);
  } else {
    multi.forEach(g => {
      const block = document.createElement("div");
      block.className = "duplicate-group";

      const panel = document.createElement("div"); // panel pliable du device
      const head = makeToggleHeader(
        `dup_device_${g.device_id}`,
        "multi",
        `<span class="badge device">🔗 Appareil</span> <span class="dup-name">${g.name}${g.area ? " — " + g.area : ""}</span> <span class="dup-count">(×${g.members.length})</span>`,
        panel
      );

      block.appendChild(head);

      const ul = document.createElement("ul");
      g.members.forEach(m => {
        const c = allCapteurs[m.entity_id];
        const isIgnored = (ignored && ignored.has(m.entity_id));
        const val = instantById?.[m.entity_id];
        let liveClass = "live-gray";
        if (typeof val === "number") liveClass = (val > 0) ? "live-green" : "live-red";
        const isRef = (refEntityId === m.entity_id);

        const li = document.createElement("li");
        li.innerHTML = `
          <label>
            <input type="checkbox" class="ignore-toggle" data-entity="${m.entity_id}" ${isIgnored ? "checked" : ""}>
            Ignorer
          </label>
          <span class="dup-entity ${liveClass}">${m.friendly_name}</span>
          <span class="badge integration">${m.integration}</span>
          ${isRef ? '<span class="badge reference">⭐ Réf.</span>' : ''}
        `;
        ul.appendChild(li);
      });

      // actions
      const actions = document.createElement("div");
      actions.className = "dup-actions";
      actions.innerHTML = `<button class="keep-best" data-device="${g.device_id}">Choisir la meilleure</button>`;

      panel.appendChild(ul);
      panel.appendChild(actions);
      block.appendChild(panel);
      secA_panel.appendChild(block);
    });
  }
  wrapper.appendChild(secA_panel);

  // B) Intra-intégration
  const secB_panel = document.createElement("div");
  const secB_header = makeToggleHeader("dup_section_intra", "intra", `Doublons par intégration`, secB_panel);
  wrapper.appendChild(secB_header);

  if (byIntegration.size === 0) {
    const p = document.createElement("p");
    p.textContent = "Aucun doublon intra-intégration.";
    secB_panel.appendChild(p);
  } else {
    Array.from(byIntegration.entries()).forEach(([integ, info]) => {
      const integBlock = document.createElement("div");
      integBlock.className = "duplicate-group";

      const integPanel = document.createElement("div");
      const integHeader = makeToggleHeader(
        `dup_integ_${integ}`,
        "intra",
        `<span class="badge integration">${integ}</span> <span class="dup-count">(×${info.total})</span>`,
        integPanel
      );

      integBlock.appendChild(integHeader);

      info.devices.forEach(g => {
        const deviceHeader = document.createElement("div");
        deviceHeader.className = "dup-title";
        deviceHeader.style.marginTop = "6px";
        deviceHeader.innerHTML = `
          <span class="badge device">🔗 Appareil</span>
          <span class="dup-name">${g.name}${g.area ? " — " + g.area : ""}</span>
          <span class="dup-count">(×${g.members.length})</span>
        `;
        integPanel.appendChild(deviceHeader);

        const ul = document.createElement("ul");
        g.members.forEach(m => {
          const c = allCapteurs[m.entity_id];
          const isIgnored = (ignored && ignored.has(m.entity_id));
          const val = instantById?.[m.entity_id];
          let liveClass = "live-gray";
          if (typeof val === "number") liveClass = (val > 0) ? "live-green" : "live-red";
          const isRef = (refEntityId === m.entity_id);

          const li = document.createElement("li");
          li.innerHTML = `
            <label>
              <input type="checkbox" class="ignore-toggle" data-entity="${m.entity_id}" ${isIgnored ? "checked" : ""}>
              Ignorer
            </label>
            <span class="dup-entity ${liveClass}">${m.friendly_name}</span>
            <span class="badge integration">${m.integration}</span>
            ${isRef ? '<span class="badge reference">⭐ Réf.</span>' : ''}
          `;
          ul.appendChild(li);
        });
        integPanel.appendChild(ul);
      });

      secB_panel.appendChild(integBlock);
      integBlock.appendChild(integPanel);
    });
  }
  wrapper.appendChild(secB_panel);

  // Liste ignorés
  const ignoredList = Array.from(ignored || []);
  const ignBlock = document.createElement("div");
  ignBlock.className = "ignored-block";
  
  // ✅ NOUVELLE VERSION avec toggle
  ignBlock.innerHTML = `
    <div class="ignored-header" style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="toggleIgnored()">
      <button type="button" style="border: none; background: none; font-size: 14px; cursor: pointer;">
        <span class="toggle-icon-ignored">▶</span>
      </button>
      <h3 style="margin: 0;">Capteurs ignorés par défaut (${ignoredList.length})</h3>
    </div>
  `;
  
  const ignUl = document.createElement("ul");
  ignUl.style.display = "none"; // ✅ Fermé par défaut
  ignUl.className = "ignored-list-content";
  
  ignoredList.forEach(eid => {
    const c = allCapteurs[eid];
    const name = c?.friendly_name || eid;
    const integ = c?.integration || "";
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="ignored-entity">${name}</span>
      <span class="badge integration">${integ}</span>
      <button class="unignore" data-entity="${eid}">Réintégrer</button>
    `;
    ignUl.appendChild(li);
  });
  ignBlock.appendChild(ignUl);
  wrapper.appendChild(ignBlock);


  // Handlers
  wrapper.querySelectorAll("input.ignore-toggle").forEach(cb => {
    cb.addEventListener("change", () => onIgnore?.(cb.dataset.entity, cb.checked));
  });
  wrapper.querySelectorAll("button.unignore").forEach(btn => {
    btn.addEventListener("click", () => onIgnore?.(btn.dataset.entity, false));
  });
  wrapper.querySelectorAll("button.keep-best").forEach(btn => {
    btn.addEventListener("click", () => onKeepBest?.(btn.dataset.device));
  });
}

// API publique du module
export function initDuplicatesPanel(rootContainer) {
  const grid = rootContainer?.querySelector("#columns-grid");
  const wrapper = grid?.querySelector(".column.duplicates");
  if (!grid || !wrapper) return;

  // Le module écoute un event unique pour rerender avec son contexte
  on("duplicates:render", (ctx) => {
    if (!ctx) return;
    const { groupsByDevice, ignored, allCapteurs, onIgnore, onKeepBest, refEntityId, instantById } = ctx;
    renderGroups(wrapper, { groupsByDevice, ignored, allCapteurs, onIgnore, onKeepBest, refEntityId, instantById });
  });
}

export function renderDuplicates(rootContainer, ctx) {
  const grid = rootContainer?.querySelector("#columns-grid");
  const wrapper = grid?.querySelector(".column.duplicates");
  if (!grid || !wrapper) return;
  renderGroups(wrapper, ctx);
}

// ═══════════════════════════════════════════════════════════════
// Fonction globale pour toggle des capteurs ignorés
// ═══════════════════════════════════════════════════════════════
window.toggleIgnored = function() {
  const list = document.querySelector('.ignored-list-content');
  const icon = document.querySelector('.toggle-icon-ignored');
  
  if (!list || !icon) return;
  
  if (list.style.display === 'none') {
    list.style.display = 'block';
    icon.textContent = '▼';
  } else {
    list.style.display = 'none';
    icon.textContent = '▶';
  }
};
