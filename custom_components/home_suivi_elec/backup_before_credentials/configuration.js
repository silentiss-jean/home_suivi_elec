"use strict";

import { getSensors, getUserOptions, saveSelection, saveUserOptions, setIgnoredEntity, chooseBestForDevice } from "./configuration.api.js";
import { hydrateUserConfig, bindUserOptions } from "./configuration.state.js";
import { ensureUserConfigAbove, renderDuplicatesColumn } from "./configuration.view.js";
import { renderSelectionColumns } from "./selectionPanel.js";
import { initReferencePanel } from "./referencePanel.js";
import { emit } from "./eventBus.js";
import { toast } from "./uiToast.js";

console.info("[config] module chargé (modulaire, référence séparée via referencePanel.js)]");

function deepClone(obj) {
  try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
}

async function getInstantPowerMap() {
  try {
    const resp = await fetch("/api/home_suivi_elec/get_instant_puissance");
    if (!resp.ok) return {};
    return await resp.json();
  } catch { return {}; }
}

function indexByDeviceId(maps) {
  const groups = new Map();
  const touch = (c, integration) => {
    const did = c?.device_id || "";
    if (!did) return;
    if (!groups.has(did)) groups.set(did, { name: c.device_name || "", area: c.area_name || "", members: [] });
    const g = groups.get(did);
    g.name = g.name || c.device_name || "";
    g.area = g.area || c.area_name || "";
    g.members.push({ entity_id: c.entity_id, integration, friendly_name: c.friendly_name || c.entity_id });
  };
  for (const map of maps) {
    for (const [integ, lst] of Object.entries(map || {})) (lst || []).forEach(c => c && touch(c, integ));
  }
  return groups;
}

function annotateSameDevice(selectedMap, alternativesMap) {
  const groups = indexByDeviceId([selectedMap, alternativesMap]);
  const flagList = (lst) => (lst || []).forEach(c => {
    if (!c) return;
    const did = c.device_id || "";
    if (!did) return;
    const g = groups.get(did);
    if (g && g.members.length >= 2) {
      c.ui_same_device_count = g.members.length;
      c.ui_device_label = `${g.name || "Appareil"}${g.area ? " — " + g.area : ""}`;
    } else {
      c.ui_same_device_count = 0;
      c.ui_device_label = `${c.device_name || "Appareil"}${c.area_name ? " — " + c.area_name : ""}`;
    }
  });
  for (const [, lst] of Object.entries(selectedMap || {})) flagList(lst);
  for (const [, lst] of Object.entries(alternativesMap || {})) flagList(lst);
}

function applyIgnoredFilter(selectedMap, alternativesMap, ignoredSet) {
  const filt = (lst) => (lst || []).filter(c => !ignoredSet.has(c.entity_id));
  const outSel = {};
  const outAlt = {};
  for (const [k, v] of Object.entries(selectedMap || {})) outSel[k] = filt(v);
  for (const [k, v] of Object.entries(alternativesMap || {})) outAlt[k] = filt(v);
  return { outSel, outAlt };
}

export async function loadConfiguration() {
  const content = document.getElementById("content-configuration");
  if (!content) {
    console.error("[config] #content-configuration introuvable");
    return;
  }
  content.innerHTML = "Chargement...";

  try {
    const [sensorsRaw, options] = await Promise.all([
      getSensors(),
      getUserOptions()
    ]);

    let { selected = {}, alternatives = {}, reference_sensor = {} } = deepClone(sensorsRaw || {});
    const refEntityId = reference_sensor?.entity_id || "";
    const ignored_entities = new Set((options?.ignored_entities || []).filter(Boolean));

    const allCapteurs = {};
    for (const lst of [selected, alternatives]) {
      Object.values(lst || {}).flat().forEach(c => { if (c && c.entity_id) allCapteurs[c.entity_id] = c; });
    }
    window.__ALL_CAPTEURS__ = allCapteurs;

    const { outSel, outAlt } = applyIgnoredFilter(selected, alternatives, ignored_entities);
    annotateSameDevice(outSel, outAlt);
    const groupsByDevice = indexByDeviceId([selected, alternatives]);
    const instantById = await getInstantPowerMap();

    ensureUserConfigAbove(content);
    
    console.log("[config] 1. Appel hydrateUserConfig");
    hydrateUserConfig(options || {});
    
    // ✅ UTILISATION DE referencePanel.js (remplace renderReferencePanel)
    const referencePanel = document.getElementById('reference-panel');
    if (referencePanel) {
      console.log("[config] 2. Appel initReferencePanel");
      await initReferencePanel(referencePanel, allCapteurs);
    }
    
    content.innerHTML = "";

    const handlers = {
      selectAll: async (integration) => {
        content.querySelectorAll(`.capteur-checkbox[data-integration="${integration}"]`).forEach(cb => cb.checked = true);
        await saveSelectionToBackend();
        toast.success("Sélection mise à jour");
      },
      deselectAll: async (integration) => {
        content.querySelectorAll(`.capteur-checkbox[data-integration="${integration}"]`).forEach(cb => cb.checked = false);
        await saveSelectionToBackend();
        toast.success("Sélection mise à jour");
      },
      checkbox: async () => { 
        await saveSelectionToBackend();
        toast.info("Sélection enregistrée");
      }
    };

    renderSelectionColumns(content, {
      selected: outSel,
      alternatives: outAlt, 
      refEntityId,
      handlers,
      getFold: (k, c) => {
        try { return JSON.parse(sessionStorage.getItem(`fold:${k}:${c}`) || "true"); } catch { return true; }
      },
      setFold: (k, c, v) => {
        try { sessionStorage.setItem(`fold:${k}:${c}`, JSON.stringify(!!v)); } catch {}
      }
    });

    renderDuplicatesColumn(content, {
      groupsByDevice,
      ignored: ignored_entities,
      allCapteurs,
      onIgnore: async (entity_id, ignore) => {
        try {
          await setIgnoredEntity(entity_id, ignore);
          await loadConfiguration();
          toast.info(ignore ? "Capteur ignoré" : "Capteur réintégré");
        } catch (err) {
          alert("❌ Erreur mise à jour des ignorés");
          console.error(err);
          toast.error("Erreur mise à jour ignorés");
        }
      },
      onKeepBest: async (device_id) => {
        try {
          const result = await chooseBestForDevice(device_id);
          if (result?.best) {
            toast.success("Meilleure mesure sélectionnée");
          }
          await loadConfiguration();
        } catch (err) {
          console.error(err);
          alert("❌ Erreur lors du choix automatique");
          toast.error("Erreur choix automatique");
        }
      },
      refEntityId,
      instantById
    });

    console.log("[config] 3. Appel bindUserOptions");
    bindUserOptions(async (payload) => {
      console.log("[config] ✅ Sauvegarde options avec payload:", payload);
      await saveUserOptions(payload);
      await loadConfiguration();
      toast.success("Options enregistrées");
    });

    const onSaveSelection = async () => {
      try { await saveSelectionToBackend(); } catch { /* noop */ }
    };
    window.removeEventListener("hse:save-selection", onSaveSelection);
    window.addEventListener("hse:save-selection", onSaveSelection);

    async function saveSelectionToBackend() {
      const selections = {};
      content.querySelectorAll("input.capteur-checkbox").forEach(cb => {
        const integ = cb.dataset.integration || "unknown";
        const eid = cb.dataset.entity;
        if (!eid) return;
        selections[integ] ??= [];
        selections[integ].push({ entity_id: eid, enabled: cb.checked });
      });

      const byDevice = new Map();
      content.querySelectorAll("input.capteur-checkbox:checked").forEach(cb => {
        const eid = cb.dataset.entity;
        const cap = allCapteurs[eid];
        const did = cap?.device_id;
        if (!did) return;
        if (!byDevice.has(did)) byDevice.set(did, []);
        byDevice.get(did).push(eid);
      });
      const bad = [];
      byDevice.forEach((arr, did) => { if (arr.length > 1) bad.push({ device_id: did, entities: arr }); });
      if (bad.length) {
        alert("❌ Conflit: plusieurs mesures pour le même appareil:\n" + bad.map(b => `- ${b.device_id}: ${b.entities.join(", ")}`).join("\n"));
        toast.warning("Conflit sur un même appareil");
        return;
      }

      try {
        const json = await saveSelection(selections);
        if (json && json.success === false) {
          const srvDev = json.device_conflicts || [];
          const srvDup = json.conflicts || [];
          let msg = "❌ Erreur de sauvegarde.\n";
          if (srvDev.length) msg += "Conflits même appareil:\n" + srvDev.map(d => `- ${d.device_id}: ${d.entities.map(x => x.entity_id).join(", ")}`).join("\n") + "\n";
          if (srvDup.length) msg += "Doublons:\n" + srvDup.map(c => `- ${c.friendly_name} (${c.entity_id}) [${c.integration}] - zone: ${c.area}`).join("\n");
          alert(msg);
          toast.warning("Conflits détectés");
          return;
        }
        emit("selection:saved", selections);
        await loadConfiguration();
      } catch (err) {
        console.error("[config] saveSelection — exception", err);
        alert("❌ Erreur de sauvegarde");
        toast.error("Erreur de sauvegarde");
      }
    }
  } catch (err) {
    console.error("[config] loadConfiguration() — erreur", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
    toast.error("Erreur de chargement configuration");
  }
}
