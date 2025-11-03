"use strict";

import { getSensors, getUserOptions, saveSelection, saveUserOptions, setIgnoredEntity, chooseBestForDevice } from "./configuration.api.js";
import { hydrateUserConfig, bindUserOptions } from "./configuration.state.js";
import { ensureUserConfigAbove, renderDuplicatesColumn } from "./configuration.view.js";
import { renderSelectionColumns } from "./selectionPanel.js";
import { initReferencePanel } from "./referencePanel.js";
import { emit } from "../shared/eventBus.js";
import { toast } from "../shared/uiToast.js";

console.info("[config] module chargé (modulaire, référence séparée via referencePanel.js)]");

// ✅ NOUVEAU : Fonctions de scoring de qualité
async function enrichWithQualityScores(allCapteurs) {
  try {
    const response = await fetch('/api/home_suivi_elec/get_sensor_quality_scores');
    if (!response.ok) {
      console.warn('[config] API quality_scores non disponible');
      return allCapteurs;
    }
    
    const data = await response.json();
    if (!data.success || !data.sensors) return allCapteurs;
    
    // Créer un map pour accès rapide
    const scoresMap = {};
    data.sensors.forEach(s => {
      const score = computeSensorScore(s);
      scoresMap[s.entity_id] = {
        score,
        unit: s.unit,
        recommendation: getRecommendationLabel(score),
        stars: getStars(score)
      };
    });
    
    // Enrichir allCapteurs
    Object.keys(allCapteurs).forEach(entityId => {
      if (scoresMap[entityId]) {
        allCapteurs[entityId].quality_score = scoresMap[entityId].score;
        allCapteurs[entityId].quality_recommendation = scoresMap[entityId].recommendation;
        allCapteurs[entityId].quality_stars = scoresMap[entityId].stars;
      }
    });
                             
    console.log('[config] ✅ Scores de qualité chargés');
    return allCapteurs;
  } catch (error) {
    console.error('[config] Erreur enrichissement scores:', error);
    return allCapteurs;
  }
}

function computeSensorScore(sensor) {
  let score = 0;
  
  const unit = (sensor.unit || sensor.unit_of_measurement || '').toLowerCase();
  if (unit.includes('kwh') || unit.includes('wh')) {
    score += 100;
  } else if (unit.includes('w')) {
    score += 50;
  }
  
  if (sensor.state_class === 'total') score += 20;
  else if (sensor.state_class === 'measurement') score += 10;
  
  if (sensor.is_premium) score += 15;
  if (['platinum', 'gold'].includes(sensor.quality_scale)) score += 10;
  
  if (!sensor.is_virtual) score += 10;
  
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


export function createQualityBadgeHTML(sensor) {
  if (!sensor || !sensor.quality_score) return '';
  
  const score = sensor.quality_score;
  let badgeClass = 'quality-badge';
  
  if (score >= 130) badgeClass += ' excellent';
  else if (score >= 100) badgeClass += ' good';
  else if (score >= 70) badgeClass += ' acceptable';
  else if (score >= 50) badgeClass += ' medium';
  else badgeClass += ' poor';
  
  const icon = (sensor.unit || '').toLowerCase().includes('kwh') ? '🔋' : '⚡';
  
  return `
    <span class="${badgeClass}" title="Score de qualité: ${score}/150">
      <span class="badge-icon">${icon}</span>
      <span class="badge-label">${sensor.quality_recommendation || ''}</span>
      <span class="badge-stars">${sensor.quality_stars || ''}</span>
      <span class="badge-score">${score}/150</span>
    </span>
  `;
}

/**
 * ✅ ÉTAPE 3/4 : Sépare les capteurs physiques des helpers
 * 
 * @param {Object} sensors - Objet {entity_id: capteur}
 * @returns {Object} { physical, helpers }
 */
export function categorizeSensors(sensors) {
  const physical = {};
  const helpers = {};
  
  const helperIntegrations = [
    'min_max', 'statistics', 'average', 'template', 
    'utility_meter', 'integration', 'history_stats',
    'derivative', 'filter'
  ];
  
  Object.entries(sensors || {}).forEach(([entityId, sensor]) => {
    if (!sensor) return;
    
    const integration = (sensor.integration || '').toLowerCase();
    const isHelper = helperIntegrations.includes(integration) || 
                     sensor.is_helper === true ||
                     entityId.includes('_helper_') ||
                     entityId.includes('_average_') ||
                     entityId.includes('_total_') ||
                     entityId.includes('_sum_');
    
    if (isHelper) {
      helpers[entityId] = { ...sensor, is_helper: true };
    } else {
      physical[entityId] = { ...sensor, is_helper: false };
    }
  });
  
  console.log(`[config] 📊 Catégorisation : ${Object.keys(physical).length} physiques, ${Object.keys(helpers).length} helpers`);
  
  return { physical, helpers };
}

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

// ✅ ANCIENNE FONCTION (gardée pour compatibilité)
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

// ✅ NOUVELLE FONCTION (Phase 2.6) : Groupe par duplicate_group (nom+zone+type)
function indexByDuplicateGroup(allCapteurs) {
  const groups = new Map();
  Object.values(allCapteurs || {}).forEach(c => {
    if (!c || !c.duplicate_group) return;
    const sig = c.duplicate_group;
    if (!groups.has(sig)) {
      groups.set(sig, { 
        name: c.friendly_name || c.nom || c.device_name || "", 
        area: c.zone || c.area || c.area_name || "", 
        members: [] 
      });
    }
    const g = groups.get(sig);
    g.members.push({ 
      entity_id: c.entity_id, 
      integration: c.integration || "unknown",
      friendly_name: c.friendly_name || c.nom || c.entity_id 
    });
  });
  
  // Filtrer : garder uniquement les groupes avec >= 2 membres
  const filtered = new Map();
  groups.forEach((g, sig) => {
    if (g.members.length >= 2) {
      filtered.set(sig, g);
    }
  });
  
  return filtered;           
}

function annotateSameDevice(selectedMap, alternativesMap) {
  // Construire allCapteurs depuis les deux maps
  const allCapteurs = {};
  for (const map of [selectedMap, alternativesMap]) {
    Object.values(map || {}).flat().forEach(c => {
      if (c && c.entity_id) allCapteurs[c.entity_id] = c;
    });
  }
  
  // ✅ CORRECTION : Utiliser indexByDuplicateGroup au lieu de indexByDeviceId
  // Cela groupe par (nom + zone + TYPE) au lieu de device_id seul
  const groups = indexByDuplicateGroup(allCapteurs);
  
  const flagList = (lst) => (lst || []).forEach(c => {
    if (!c) return;
    const sig = c.duplicate_group || "";
    if (!sig) return;
    const g = groups.get(sig);
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
  
  // ✅ CORRECTION : Retour silencieux si onglet pas actif ou conteneur absent
  if (!content || !document.getElementById("configuration")?.classList.contains("active")) {
    // Onglet pas monté/actif: ne rien faire (chargera quand l'onglet s'ouvre)
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
    // ✅ NOUVEAU : Enrichir avec les scores de qualité
    await enrichWithQualityScores(allCapteurs);
    window.__ALL_CAPTEURS__ = allCapteurs;

    const { outSel, outAlt } = applyIgnoredFilter(selected, alternatives, ignored_entities);
    annotateSameDevice(outSel, outAlt);
    
    // ✅ CORRECTION (Phase 2.6) : Utiliser duplicate_group au lieu de device_id
    const groupsByDevice = indexByDuplicateGroup(allCapteurs);
    
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

    content.innerHTML = "";
    
    // ✅ NOUVEAU : Bandeau explicatif
    const banner = document.createElement("div");
    banner.style.cssText = `
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 14px;
    `;
    banner.innerHTML = `
      <strong>ℹ️ Gestion des doublons multi-intégrations</strong><br>
      Un seul capteur par appareil physique (par type : energy/power) peut être activé.<br>
      Les capteurs en conflit seront automatiquement ignorés lors de l'activation.
    `;
    content.appendChild(banner);

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
      checkbox: async (entityId, checked) => {
        // 1. Validation anti-doublons AVANT toute action
        if (checked) {
          const sensor = allCapteurs[entityId];
          
          if (sensor && sensor.is_multi_platform) {
            const signature = sensor.physical_signature;
            const sensorType = sensor.type;
            
            // Trouver les sensors du même device physique (même type, autre intégration)
            const conflicts = Object.values(allCapteurs).filter(c => 
              c.physical_signature === signature &&
              c.type === sensorType &&
              c.entity_id !== entityId &&
              c.integration !== sensor.integration
            );
            
            // Vérifier si un conflit est déjà activé (coché)
            const activeConflicts = conflicts.filter(c => {
              const conflictCheckbox = content.querySelector(
                `input.capteur-checkbox[data-entity="${c.entity_id}"]`
              );
              return conflictCheckbox?.checked;
            });
            
            if (activeConflicts.length > 0) {
              const conflict = activeConflicts[0];
              toast.error(`⚠️ Conflit détecté : ${conflict.friendly_name || conflict.entity_id} (${conflict.integration}) est déjà activé. Ignorez-le d'abord.`);
              
              // ANNULER le cochage
              setTimeout(() => {
                const checkbox = content.querySelector(
                  `input.capteur-checkbox[data-entity="${entityId}"]`
                );
                if (checkbox) checkbox.checked = false;
              }, 0);
              
              return; // ❌ BLOQUER l'activation
            }
            
            // ✅ NOUVEAU : Auto-ignorer les conflits non cochés
            for (const conflict of conflicts) {
              await setIgnoredEntity(conflict.entity_id, true);
            }
            
            if (conflicts.length > 0) {
              toast.success(`✅ ${conflicts.length} capteur(s) en conflit ignoré(s) automatiquement`);
            }
          }
        }
        
        // 2. Si validation OK → Sauvegarder
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
        try { return JSON.parse(sessionStorage.getItem(`fold:${k}:${c}`) || "false"); } catch { return false; }
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
