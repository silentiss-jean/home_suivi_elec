// savePanel.js — Sauvegarde globale indépendante (hors capteur de référence)
"use strict";

import { saveSelection, saveUserOptions } from "./configuration.api.js";
import { emit } from "./eventBus.js";
import { toast } from "./uiToast.js";

/**
 * Initialise le panneau de sauvegarde globale.
 * - Gère le bouton #saveSelection
 * - Gère l’affichage dynamique HP/HC via #typeContrat
 * - N’affecte jamais la référence (capteur externe) gérée par referencePanel.js
 */
export function initSavePanel(root = document) {
  const btnSave = root.getElementById("saveSelection");
  const typeSel = root.getElementById("typeContrat");
  const hpHCFields = root.getElementById("hpHCFields");

  // Affichage dynamique HP/HC
  if (typeSel && hpHCFields) {
    const syncHpHc = () => {
      hpHCFields.style.display = (typeSel.value === "hp-hc") ? "block" : "none";
    };
    syncHpHc();
    typeSel.onchange = syncHpHc;
  }

  if (!btnSave) return;

  btnSave.addEventListener("click", async (ev) => {
    if (ev && typeof ev.preventDefault === "function") ev.preventDefault();

    // Sélections capteurs
    const selections = {};
    document.querySelectorAll("#content-configuration input[type='checkbox'].capteur-checkbox").forEach(cb => {
      const integ = cb.dataset.integration || "unknown";
      const eid = cb.dataset.entity;
      if (!eid) return;
      selections[integ] ??= [];
      selections[integ].push({ entity_id: eid, enabled: cb.checked });
    });

    // Options utilisateur (hors référence)
    const getVal = (id) => (document.getElementById(id)?.value ?? "").toString().trim();
    const toNum = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    const typeContrat = getVal("typeContrat") || "fixe";
    const userDataUI = {
      abonnementHT: toNum(getVal("abonnementHT")),
      abonnementTTC: toNum(getVal("abonnementTTC")),
      typeContrat,
      tarifHP: toNum(getVal("tarifHP")),
      tarifHC: toNum(getVal("tarifHC")),
      heuresHPDebut: getVal("heuresHPDebut"),
      heuresHPFin: getVal("heuresHPFin")
      // La référence est gérée par referencePanel.js et ne doit pas être perdue
    };

    // Contrôle local “même appareil” minimal
    try {
      const byDevice = new Map();
      document.querySelectorAll("#content-configuration input.capteur-checkbox:checked").forEach(cb => {
        const eid = cb.dataset.entity;
        const cap = window.__ALL_CAPTEURS__?.[eid]; // optionnel
        const did = cap?.device_id;
        if (!did) return;
        if (!byDevice.has(did)) byDevice.set(did, []);
        byDevice.get(did).push(eid);
      });
      const bad = [];
      byDevice.forEach((arr, did) => { if (arr.length > 1) bad.push({ device_id: did, entities: arr }); });
      if (bad.length) {
        alert("❌ Conflit: plusieurs mesures pour le même appareil:\n" + bad.map(b => `- ${b.device_id}: ${b.entities.join(", ")}`).join("\n"));
        return;
      }
    } catch {
      // ignore si __ALL_CAPTEURS__ non défini
    }

    try {
      // 1) Sauvegarde de la sélection capteurs
      const selJson = await saveSelection(selections);
      if (selJson && selJson.success === false) {
        const conflicts = selJson?.conflicts || [];
        const msg = conflicts.length
          ? "Doublons détectés:\n" + conflicts.map(c => `- ${c.friendly_name} (${c.entity_id}) [${c.integration}] - zone: ${c.area}`).join("\n")
          : (selJson?.error || "Erreur de sauvegarde");
        alert(msg);
        toast.warning("Conflits détectés, vérifie la sélection");
        return;
      }

      // 2) Merge côté front pour ne pas effacer la référence
      const current = await fetch("/api/home_suivi_elec/get_user_options").then(r => r.ok ? r.json() : {});

      // Adapter la forme UI -> backend attendu
      const merged = {
        ...current,
        // Champs communs
        abonnementHT: userDataUI.abonnementHT,
        abonnementTTC: userDataUI.abonnementTTC,
        typeContrat: userDataUI.typeContrat,
      };

      if (userDataUI.typeContrat === "fixe") {
        // Mappe vers prix_ht / prix_ttc
        merged.prix_ht = userDataUI.tarifHP || merged.prix_ht || 0;  // utilise le champ “HP” comme prix unique
        merged.prix_ttc = merged.prix_ttc || 0; // si tu as un champ TTC dédié, remplace ici
      } else {
        // HP/HC
        merged.prix_ht_hp = userDataUI.tarifHP || merged.prix_ht_hp || 0;
        merged.prix_ttc_hp = merged.prix_ttc_hp || 0; // ajouter si tu as un champ TTC UI
        merged.prix_ht_hc = userDataUI.tarifHC || merged.prix_ht_hc || 0;
        merged.prix_ttc_hc = merged.prix_ttc_hc || 0; // ajouter si tu as un champ TTC UI
        merged.hc_start = userDataUI.heuresHPDebut || merged.hc_start || "";
        merged.hc_end = userDataUI.heuresHPFin || merged.hc_end || "";
      }

      // Important: on ne touche pas aux clés de référence existantes (useExternal, externalCapteur, etc.)
      await saveUserOptions(merged);

      emit("selection:saved", selections);
      toast.success("Configuration enregistrée");
    } catch (err) {
      alert("❌ Erreur sauvegarde configuration");
      console.error(err);
      toast.error("Erreur de sauvegarde");
    }
  });
}
