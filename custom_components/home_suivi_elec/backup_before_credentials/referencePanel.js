// referencePanel.js
"use strict";

import stateModule from "./stateModule.js";
import { emit, on } from "./eventBus.js";
import { toast } from "./uiToast.js";

/*
 * Reference Panel : UI indépendante du capteur de référence
 * - Rendu: switch, radios, select, input, bandeau
 * - Logique: promote_not_restrict + option fantôme
 * - Persistance: émet "reference:saved", sauvegarde côté backend via /save_user_options
 */

function toCapteursArray(allCapteurs) {
  if (Array.isArray(allCapteurs)) return allCapteurs;
  if (allCapteurs && typeof allCapteurs === "object") return Object.values(allCapteurs);
  return [];
}

function buildPromotedOptions(allCapteurs, allowedIntegrations = [], selectedId = "") {
  const list = toCapteursArray(allCapteurs);
  const byIntegration = {};
  list.forEach(c => {
    if (!c || !c.entity_id) return;
    const integ = c.integration || "unknown";
    byIntegration[integ] ??= [];
    byIntegration[integ].push({
      value: c.entity_id,
      label: c.friendly_name || c.entity_id,
      integration: integ
    });
  });

  const recognized = [];
  const others = [];
  const isAllowed = (integ) => allowedIntegrations.includes(integ);

  Object.entries(byIntegration).forEach(([integ, arr]) => {
    arr.sort((a, b) => a.label.localeCompare(b.label, "fr"));
    if (isAllowed(integ)) recognized.push(...arr);
    else others.push(...arr);
  });

  const exists = [...recognized, ...others].some(o => o.value === selectedId);
  if (selectedId && !exists) {
    others.unshift({
      value: selectedId,
      label: `(hors liste) ${selectedId}`,
      integration: "unknown"
    });
  }

  return { recognized, others };
}

function getAllowedIntegrationsFromRef(refJson) {
  if (!refJson) return [];
  if (Array.isArray(refJson.allowed_integrations)) return refJson.allowed_integrations;
  if (Array.isArray(refJson.allowed)) return refJson.allowed;
  return [];
}

async function fetchReferenceIntegrations() {
  return { allowed_integrations: ["keyatome", "enedis", "myenedis", "teleinfo", "linky_local"] };
}

function valueOrEmpty(el) {
  return (el?.value ?? "").toString().trim();
}

function numberOrNull(el) {
  const v = parseFloat(el?.value);
  return Number.isFinite(v) ? v : null;
}

function applyVisibility(containerEl) {
  const mode = containerEl.querySelector('input[name="referenceSourceChoice"]:checked')?.value || "sensor";
  const rowSensor = containerEl.querySelector("#referenceSensorRow");
  const rowManual = containerEl.querySelector("#referenceManualRow");
  if (rowSensor) rowSensor.style.display = mode === "manual" ? "none" : "block";
  if (rowManual) rowManual.style.display = mode === "manual" ? "block" : "none";
}

function render(containerEl, refState, allCapteurs, refConfig) {
  if (!containerEl) return;

  const { useExternal, externalCapteur, consommationExterne, mode } = refState || {};
  const allowed = getAllowedIntegrationsFromRef(refConfig);
  const groups = buildPromotedOptions(allCapteurs, allowed, externalCapteur);

  containerEl.innerHTML = `
    <div class="reference-panel">
      <span class="reference-icon">⭐</span>
      <div style="flex:1; min-width:260px;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="useExternalConfig" ${useExternal ? "checked" : ""}>
            <span class="reference-title">J’utilise un capteur de référence</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="radio" name="referenceSourceChoice" value="sensor" ${mode !== "manual" ? "checked" : ""}>
            <span>Capteur</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px;">
            <input type="radio" name="referenceSourceChoice" value="manual" ${mode === "manual" ? "checked" : ""}>
            <span>Valeur manuelle</span>
          </label>
        </div>

        <div id="referenceSensorRow" style="margin-top:8px; display:${mode === "manual" ? "none" : "block"};">
          <label for="capteurExterneSelectConfig" class="tooltip">Capteur externe</label>
          <select id="capteurExterneSelectConfig" style="min-width:320px;"></select>
          <span class="tooltip">Les intégrations reconnues apparaissent en premier; les autres restent disponibles.</span>
        </div>

        <div id="referenceManualRow" style="margin-top:8px; display:${mode === "manual" ? "block" : "none"};">
          <label for="consommationExterneConfig" class="tooltip">Valeur manuelle (W)</label>
          <input type="number" id="consommationExterneConfig" min="0" step="1" placeholder="Ex: 500" style="width:140px;" ${consommationExterne != null ? `value="${consommationExterne}"` : ""}>
        </div>
      </div>
      <button id="saveReferenceOptions" class="set-reference-btn" title="Sauvegarder">Sauvegarder</button>
    </div>

    <div class="reference-panel">
      <span class="reference-icon">⭐</span>
      ${useExternal && externalCapteur
        ? `<span class="reference-title">Capteur de référence sélectionné :</span>
           <span class="reference-name">${externalCapteur}</span>`
        : `<span class="reference-title">Aucun capteur de référence sélectionné</span>`
      }
    </div>
  `;

  // Peupler le select
  const sel = containerEl.querySelector("#capteurExterneSelectConfig");
  if (sel) {
    const appendGroup = (label, arr) => {
      if (!arr.length) return;
      const grp = document.createElement("optgroup");
      grp.label = label;
      arr.forEach(o => grp.appendChild(new Option(o.label, o.value, false, o.value === externalCapteur)));
      sel.appendChild(grp);
    };
    appendGroup("Intégrations reconnues", groups.recognized);
    appendGroup("Autres intégrations", groups.others);
  }

  containerEl.querySelectorAll('input[name="referenceSourceChoice"]').forEach(i => {
    i.addEventListener("change", () => applyVisibility(containerEl));
  });
  applyVisibility(containerEl);
}

export async function initReferencePanel(containerEl, allCapteurs) {
  if (!containerEl) return;
  const refConfig = await fetchReferenceIntegrations().catch(() => ({}));
  const refState = stateModule.get("reference") || {};
  render(containerEl, refState, allCapteurs, refConfig);

  containerEl.querySelector("#saveReferenceOptions")?.addEventListener("click", async () => {
    const useExternal = !!containerEl.querySelector("#useExternalConfig")?.checked;
    const mode = containerEl.querySelector('input[name="referenceSourceChoice"]:checked')?.value || "sensor";
    const externalCapteur = valueOrEmpty(containerEl.querySelector("#capteurExterneSelectConfig"));
    const consommationExterne = numberOrNull(containerEl.querySelector("#consommationExterneConfig"));

    // MAJ état local
    stateModule.set("reference", { useExternal, externalCapteur, consommationExterne, mode });

    // Persistance backend: MERGE avec options existantes pour éviter toute régression
    try {
      const current = await fetch("/api/home_suivi_elec/get_user_options").then(r => r.ok ? r.json() : {});
      const merged = {
        ...current,
        useExternal,
        externalCapteur,
        consommationExterne,
        mode
      };
      await fetch("/api/home_suivi_elec/save_user_options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged)
      });
      toast.success("Options de référence enregistrées");
    } catch (e) {
      console.warn("[referencePanel] save_user_options failed, state kept locally", e);
      toast.warning("Sauvegarde locale, backend indisponible");
    }

    // 1) Notifie les autres modules
    emit("reference:saved", { useExternal, externalCapteur, consommationExterne, mode });

    // 2) Auto-sélection du capteur de référence dans la grille + sauvegarde
    try {
      if (useExternal && mode !== "manual" && externalCapteur) {
        const cb = document.querySelector(`input.capteur-checkbox[data-entity="${externalCapteur}"]`);
        if (cb) cb.checked = true;
        const ev = new CustomEvent("hse:save-selection");
        window.dispatchEvent(ev);
      }
    } catch (e) {
      console.debug("[referencePanel] auto-select reference failed (non bloquant)", e);
    }

    // 3) Re-render immédiat du panneau pour refléter l'état après sauvegarde
    const newState = { useExternal, externalCapteur, consommationExterne, mode };
    render(containerEl, newState, allCapteurs, refConfig);
  });

  // Rerender ciblé
  on("ui:rerender", (t) => {
    if (!t || (Array.isArray(t.targets) && !t.targets.includes("reference"))) return;
    const st = stateModule.get("reference");
    render(containerEl, st, allCapteurs, refConfig);
  });
}

export function rerenderReferencePanel(containerEl, allCapteurs) {
  const st = stateModule.get("reference");
  render(containerEl, st, allCapteurs, { allowed_integrations: ["keyatome", "enedis", "myenedis", "teleinfo", "linky_local"] });
}
