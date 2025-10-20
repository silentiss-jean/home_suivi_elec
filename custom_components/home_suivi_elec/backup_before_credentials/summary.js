"use strict";

let summaryRefreshInterval = null;
let isLoadingSummary = false;

function setText(el, text) { if (el) el.textContent = text; }
function normalizeToKwh(value, unit = "kWh") { 
  if (typeof value !== "number" || !isFinite(value)) return 0;
  // Si l'unité est Wh, divise par 1000, sinon retourne tel quel
  return unit === "Wh" ? value / 1000 : value;
}

export async function loadSummary() {
  const homeTab = document.getElementById("home");
  if (!homeTab || !homeTab.classList.contains("active")) return;
  if (isLoadingSummary) return;
  isLoadingSummary = true;

  const summaryMessage = document.getElementById("summaryMessage");
  const summaryData = document.getElementById("summaryData");
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const refreshSpan = document.getElementById("dernierRefresh");
  const instantaneInterneSpan = document.getElementById("instantaneInterne");
  const externeCompactSpan = document.getElementById("externeCompact");
  const deltaPuissanceSpan = document.getElementById("deltaPuissance");
  const externalTitle = document.getElementById("externalTitle");

  const typeContratSpan = document.getElementById("typeContratSummary");
  const abonnementHTSpan = document.getElementById("abonnementHTSummary");
  const abonnementTTcSpan = document.getElementById("abonnementTTCSummary");
  const blocFixe = document.getElementById("blocFixe");
  const blocHpHc = document.getElementById("blocHpHc");
  const prixFixeHTSpan = document.getElementById("prixFixeHT");
  const prixFixeTTCSpan = document.getElementById("prixFixeTTC");
  const tarifHPHTSummary = document.getElementById("tarifHPHTSummary");
  const tarifHPTTCSummary = document.getElementById("tarifHPTTCSummary");
  const tarifHCHTSummary = document.getElementById("tarifHCHTSummary");
  const tarifHCTTCSummary = document.getElementById("tarifHCTTCSummary");
  const heuresHPDebutSummary = document.getElementById("heuresHPDebutSummary");
  const heuresHPFinSummary = document.getElementById("heuresHPFinSummary");
  const selectedTable = document.querySelector("#summarySelectedSensors tbody");
  const externalTableEl = document.getElementById("summaryExternalSensors");
  const externalTable = externalTableEl ? externalTableEl.querySelector("tbody") : null;
  const deltaTableEl = document.getElementById("summaryDeltaSensors");
  const deltaTable = deltaTableEl ? deltaTableEl.querySelector("tbody") : null;

  try {
    const [sensorsResp, selectionResp, optionsResp, instantResp, consResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/api/home_suivi_elec/get_selection"),
      fetch("/api/home_suivi_elec/get_user_options"),
      fetch("/api/home_suivi_elec/get_instant_puissance"),
      fetch("/api/home_suivi_elec/get_consumptions")
    ]);
    if (!sensorsResp.ok) throw new Error("Aucune détection de capteurs disponible");

    const sensorsRaw = await sensorsResp.json();
    const selectionData = selectionResp.ok ? await selectionResp.json() : {};
    const userData = optionsResp.ok ? await optionsResp.json() : {};
    const instantMap = instantResp.ok ? await instantResp.json() : {};
    const cons = consResp.ok ? await consResp.json() : {};

    console.log("[summary] userData:", userData);

    // Liste des entités sélectionnées (dédupliquées)
    let selectedIds = [];
    Object.values(selectionData || {}).forEach(lst => {
      (lst || []).forEach(row => {
        if (row?.enabled && row?.entity_id && !selectedIds.includes(row.entity_id)) selectedIds.push(row.entity_id);
      });
    });

    console.log("[summary] ===== DIAGNOSTIC CONSOMMATIONS =====");
    console.log("[summary] userData:", userData);
    console.log("[summary] Consommations reçues (cons):", cons);
    console.log("[summary] Capteurs sélectionnés (selectedIds):", selectedIds);
    if (selectedIds.length > 0) {
      console.log("[summary] Premier capteur:", selectedIds[0]);
      console.log("[summary] Données du premier capteur:", cons?.[selectedIds[0]]);
    }
    console.log("[summary] Nombre de clés dans cons:", Object.keys(cons || {}).length);
    console.log("[summary] Exemple de clés dans cons:", Object.keys(cons || {}).slice(0, 5));
    console.log("[summary] =========================================");

    // ✅ CORRECTION : Gestion du mode manuel du capteur de référence
    const useExternal = !!userData.useExternal;
    const mode = userData.mode || "sensor";
    const externalId = (useExternal && mode === "sensor") ? userData.externalCapteur : null;
    const manualValue = (useExternal && mode === "manual") ? (userData.consommationExterne || 0) : 0;

    // Puissance instantanée (interne hors référence)
    let puissanceInterne = 0;
    selectedIds.forEach(eid => {
      if (externalId && eid === externalId) return;
      const v = instantMap?.[eid];
      if (typeof v === "number" && isFinite(v)) puissanceInterne += Math.max(0, v);
    });

    // ✅ Externe (capteur OU manuel)
    let consommationExterne = 0;
    let externePuissance = "- W";
    let externeIndispo = false;
    let externalName = "-";
    let externalIntegration = "-";
    
    if (useExternal) {
      if (mode === "manual") {
        // Mode manuel
        consommationExterne = manualValue;
        externePuissance = manualValue.toFixed(1) + " W";
        externalName = "Valeur manuelle";
        externalIntegration = "Manuel";
      } else if (externalId) {
        // Mode capteur
        const v = instantMap?.[externalId];
        const ref = Object.values(sensorsRaw.selected || {}).flat().concat(Object.values(sensorsRaw.alternatives || {}).flat()).find(c => c.entity_id === externalId);
        if (ref) {
          externalName = ref.friendly_name ?? ref.entity_id;
          externalIntegration = ref.integration ?? "integration";
        } else {
          externalName = externalId;
        }
        if (typeof v === "number" && isFinite(v)) {
          consommationExterne = Math.max(0, v);
          externePuissance = v.toFixed(1) + " W";
        } else {
          externeIndispo = true;
        }
      }
    }

    const deltaW = consommationExterne - puissanceInterne;
    const deltaText = (consommationExterne !== 0 || puissanceInterne !== 0) ? deltaW.toFixed(1) + " W" : "- W";

    setText(totalSpan, Object.values(sensorsRaw.selected || {}).flat().length + Object.values(sensorsRaw.alternatives || {}).flat().length);
    setText(actifsSpan, `${selectedIds.length} / ${Object.values(sensorsRaw.selected || {}).flat().length + Object.values(sensorsRaw.alternatives || {}).flat().length} capteurs sélectionnés`);
    setText(instantaneInterneSpan, puissanceInterne > 0 ? puissanceInterne.toFixed(1) + " W" : "- W");
    
    if (useExternal) {
      setText(externeCompactSpan, externePuissance);
      if (externalTitle) {
        externalTitle.innerHTML = `Capteur externe de référence : ${externalIntegration} : ${externalName} (${externePuissance})` 
          + (externeIndispo ? " <span style='color:red; font-weight:bold;'>⚠️ INDISPONIBLE</span>" : "");
      }
      setText(deltaPuissanceSpan, deltaText);
    } else {
      setText(externeCompactSpan, "- W");
      if (externalTitle) externalTitle.textContent = "Capteur externe de référence : désactivé";
      setText(deltaPuissanceSpan, "- W");
    }

    if (refreshSpan) refreshSpan.textContent = new Date().toLocaleString();
    
    const typeContrat = userData.typeContrat || "fixe";
    setText(typeContratSpan, typeContrat === "hp-hc" ? "HP/HC" : "Fixe");
    setText(abonnementHTSpan, userData.abonnementHT != null ? Number(userData.abonnementHT).toFixed(2) : (userData.abonnementht != null ? Number(userData.abonnementht).toFixed(2) : "-"));
    setText(abonnementTTcSpan, userData.abonnementTTC != null ? Number(userData.abonnementTTC).toFixed(2) : (userData.abonnementttc != null ? Number(userData.abonnementttc).toFixed(2) : "-"));
    
    if (typeContrat === "fixe") {
      if (blocFixe) blocFixe.style.display = "block";
      if (blocHpHc) blocHpHc.style.display = "none";
      setText(prixFixeHTSpan, Number(userData.prix_ht ?? userData.prixht ?? userData.prixHT ?? 0).toFixed(4));
      setText(prixFixeTTCSpan, Number(userData.prix_ttc ?? userData.prixttc ?? userData.prixTTC ?? 0).toFixed(4));
    } else if (typeContrat === "hp-hc") {
      if (blocFixe) blocFixe.style.display = "none";
      if (blocHpHc) blocHpHc.style.display = "block";
      setText(tarifHPHTSummary, Number(userData.prix_ht_hp ?? userData.prixhthp ?? userData.prixHTHP ?? 0).toFixed(4));
      setText(tarifHPTTCSummary, Number(userData.prix_ttc_hp ?? userData.prixttchp ?? userData.prixTTCHP ?? 0).toFixed(4));
      setText(tarifHCHTSummary, Number(userData.prix_ht_hc ?? userData.prixhthc ?? userData.prixHTHC ?? 0).toFixed(4));
      setText(tarifHCTTCSummary, Number(userData.prix_ttc_hc ?? userData.prixttchc ?? userData.prixTTCHC ?? 0).toFixed(4));
      setText(heuresHPDebutSummary, userData.hc_start ?? userData.hcstart ?? userData.heuresHPDebut ?? "-");
      setText(heuresHPFinSummary, userData.hc_end ?? userData.hcend ?? userData.heuresHPFin ?? "-");
    } else {
      if (blocFixe) blocFixe.style.display = "none";
      if (blocHpHc) blocHpHc.style.display = "none";
    }

    const periods = [
      { label: "Heure", key: "hourly", abDiv: 30 * 24 },
      { label: "Jour", key: "daily", abDiv: 30 },
      { label: "Semaine", key: "weekly", abDiv: 4.345 },
      { label: "Mois", key: "monthly", abDiv: 1 },
      { label: "Année", key: "yearly", abDiv: 1 / 12 }
    ];

    function getAbonnementHT(periodIdx) {
      const v = Number(userData.abonnementHT ?? userData.abonnementht ?? 0);
      const { abDiv } = periods[periodIdx];
      return abDiv !== 1 ? v / abDiv : v * (periodIdx === 4 ? 12 : 1);
    }
    function getAbonnementTTC(periodIdx) {
      const v = Number(userData.abonnementTTC ?? userData.abonnementttc ?? 0);
      const { abDiv } = periods[periodIdx];
      return abDiv !== 1 ? v / abDiv : v * (periodIdx === 4 ? 12 : 1);
    }

    function sumKwhForPeriod(key, ids) {
      let sum = 0;
      ids.forEach(eid => {
        if (externalId && eid === externalId) return;
        const v = cons?.[eid]?.[key];
        const n = typeof v === "number" && isFinite(v) ? normalizeToKwh(v) : 0;
        sum += Math.max(0, n);
      });
      return sum;
    }
    
    function getKwhForEntity(key, eid) {
      const v = cons?.[eid]?.[key];
      return typeof v === "number" && isFinite(v) ? normalizeToKwh(v) : 0;
    }
    
    function renderTable(tbody, kwhMap) {
      if (!tbody) return;
      tbody.innerHTML = "";
      periods.forEach((p, idx) => {
        const kwh = kwhMap(p.key);
        let tarifHT = 0, tarifTTC = 0;
        if (typeContrat === "fixe") {
          tarifHT = Number(userData.prix_ht ?? userData.prixht ?? userData.prixHT ?? 0);
          tarifTTC = Number(userData.prix_ttc ?? userData.prixttc ?? userData.prixTTC ?? 0);
        } else {
          tarifHT = Number(userData.prix_ht_hp ?? userData.prixhthp ?? userData.prixHTHP ?? 0);
          tarifTTC = Number(userData.prix_ttc_hp ?? userData.prixttchp ?? userData.prixTTCHP ?? 0);
        }
        const coutHT = kwh * tarifHT;
        const coutTTC = kwh * tarifTTC;
        const totalHT = coutHT + getAbonnementHT(idx);
        const totalTTC = coutTTC + getAbonnementTTC(idx);

        tbody.insertAdjacentHTML("beforeend", `
<tr>
  <td>${p.label}</td>
  <td>${kwh.toFixed(2)}</td>
  <td>${coutHT.toFixed(2)} €</td>
  <td>${coutTTC.toFixed(2)} €</td>
  <td>${totalHT.toFixed(2)} €</td>
  <td>${totalTTC.toFixed(2)} €</td>
</tr>`);
      });
    }
    
    renderTable(selectedTable, (key) => sumKwhForPeriod(key, selectedIds));
    
    if (useExternal) {
      externalTableEl && (externalTableEl.style.display = "");
      deltaTableEl && (deltaTableEl.style.display = "");
      
      // ✅ CORRECTION : Pour mode manuel, on ne peut pas avoir de consommation historique
      if (mode === "manual") {
        // Mode manuel : pas de données historiques, tableau externe vide ou message
        if (externalTable) {
          externalTable.innerHTML = "";
          periods.forEach(p => {
            externalTable.insertAdjacentHTML("beforeend", `
<tr>
  <td>${p.label}</td>
  <td colspan="5" style="text-align:center; color:#999;">Mode manuel : pas d'historique disponible</td>
</tr>`);
          });
        }
        if (deltaTable) deltaTable.innerHTML = "";
      } else if (externalId) {
        // Mode capteur : afficher les vrais historiques
        renderTable(externalTable, (key) => getKwhForEntity(key, externalId));
        renderTable(deltaTable, (key) => {
          const ext = getKwhForEntity(key, externalId);
          const sel = sumKwhForPeriod(key, selectedIds);
          return Math.max(0, ext - sel);
        });
      }
    } else {
      if (externalTable) externalTable.innerHTML = "";
      if (deltaTable) deltaTable.innerHTML = "";
      if (externalTableEl) externalTableEl.style.display = "none";
      if (deltaTableEl) deltaTableEl.style.display = "none";
    }
    
    if (summaryMessage) {
      if (useExternal && mode === "sensor" && externePuissance === "- W") {
        summaryMessage.style.display = "block";
        summaryMessage.textContent = "⚠️ Capteur externe de référence indisponible.";
      } else {
        summaryMessage.style.display = "none";
      }
    }
    if (summaryData) summaryData.style.display = "block";
  } catch (err) {
    console.error("Erreur chargement résumé:", err);
    if (summaryMessage) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Erreur lors du chargement du résumé";
    }
    if (summaryData) summaryData.style.display = "none";
  } finally {
    isLoadingSummary = false;
  }
}

if (summaryRefreshInterval) clearInterval(summaryRefreshInterval);
summaryRefreshInterval = setInterval(() => {
  const homeTab = document.getElementById("home");
  if (homeTab && homeTab.classList.contains("active")) {
    loadSummary();
  }
}, 30000);

document.getElementById("refreshHome")?.addEventListener("click", loadSummary);
