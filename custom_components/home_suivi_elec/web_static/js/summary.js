import { normalizeSensors, countTotalFromGrouped, findSensorValue, findSensorDetails } from './utils.js';

let summaryRefreshInterval;

export async function loadSummary() {
  if (summaryRefreshInterval) clearInterval(summaryRefreshInterval);
  summaryRefreshInterval = setInterval(loadSummary, 30000);

  const summaryMessage = document.getElementById("summaryMessage");
  const summaryData = document.getElementById("summaryData");
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const refreshSpan = document.getElementById("dernierRefresh");

  const typeContratSpan = document.getElementById("typeContratSummary");
  const abonnementHTSpan = document.getElementById("abonnementHTSummary");
  const abonnementTTcSpan = document.getElementById("abonnementTTCSummary");

  const prixFixeHTSpan = document.getElementById("prixFixeHT");
  const prixFixeTTCSpan = document.getElementById("prixFixeTTC");

  const tarifHPHTSummary = document.getElementById("tarifHPHTSummary");
  const tarifHPTTCSummary = document.getElementById("tarifHPTTCSummary");
  const tarifHCHTSummary = document.getElementById("tarifHCHTSummary");
  const tarifHCTTCSummary = document.getElementById("tarifHCTTCSummary");
  const heuresHPDebutSummary = document.getElementById("heuresHPDebutSummary");
  const heuresHPFinSummary = document.getElementById("heuresHPFinSummary");

  const tarifsWrap = document.getElementById("tarifsSummary");

  const selectedTable = document.querySelector("#summarySelectedSensors tbody");
  const externalTable = document.querySelector("#summaryExternalSensors tbody");
  const deltaTable = document.querySelector("#summaryDeltaSensors tbody");

  const instantaneInterneSpan = document.getElementById("instantaneInterne");
  const externeCompactSpan = document.getElementById("externeCompact");
  const deltaPuissanceSpan = document.getElementById("deltaPuissance");
  const externalTitle = document.getElementById("externalTitle");

  try {
    const [sensorsResp, optionsResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/api/home_suivi_elec/get_user_options"),
    ]);
    if (!sensorsResp.ok) throw new Error("Aucune détection de capteurs disponible");
    const sensorsRaw = await sensorsResp.json();
    const groupedSensors = normalizeSensors(sensorsRaw);
    const totalSensors = countTotalFromGrouped(groupedSensors);

    const userData = optionsResp.ok ? await optionsResp.json() : {};
    const selectionData = userData.selection || {};

    // ---- Capteurs sélectionnés (interne, hors externe) ----
    let consommationSelectionnee = 0;
    let actifs = 0;
    Object.entries(selectionData).forEach(([integ, sensList]) => {
      for (const s of sensList) {
        if (s.enabled) {
          actifs++;
          if (s.entity_id && s.entity_id !== userData.externalCapteur) {
            consommationSelectionnee += findSensorValue(s.entity_id, groupedSensors);
          }
        }
      }
    });

    // ---- Capteur externe (référence) ----
    let consommationExterne = 0;
    let externePuissance = "- W";
    let externalName = "-";
    let externalIntegration = "-";
    let externeIndispo = false; // <- FLAG Alerte
    if (userData.useExternal && userData.externalCapteur) {
      for (const list of Object.values(groupedSensors)) {
        const cap = list.find(s => s.entity_id === userData.externalCapteur);
        if (cap) {
          externalName = cap.friendly_name ?? cap.entity_id;
          externalIntegration = cap.integration ?? "integration";
          if (typeof cap.value === "number" && !isNaN(cap.value)) {
            consommationExterne = cap.value;
            externePuissance = cap.value.toFixed(1) + " W";
          } else {
            externeIndispo = true;
            externePuissance = "- W";
          }
          // Ajout d'un critère extra: value == 0 est considéré indisponible pour un capteur de puissance
          if (cap.value === 0 || cap.value === null || cap.value === undefined) {
            externeIndispo = true;
            externePuissance = (cap.value === 0) ? "0 W" : "- W";
          }
          break;
        }
      }
      // Si non trouvé dans groupedSensors, aussi afficher indisponible
      if (externalName === "-" && externalIntegration === "-") {
        externeIndispo = true;
      }
    }

    // ---- Delta consommation ----
    let deltaValeur = consommationExterne - consommationSelectionnee;
    let deltaText = (consommationExterne !== 0 || consommationSelectionnee !== 0)
      ? deltaValeur.toFixed(1) + " W"
      : "- W";               

    // ---- Affichage blocs ----
    if (totalSpan) totalSpan.textContent = totalSensors;
    if (actifsSpan) actifsSpan.textContent = `${actifs} / ${totalSensors} capteurs sélectionnés`;
    if (instantaneInterneSpan) instantaneInterneSpan.textContent = consommationSelectionnee > 0 ? consommationSelectionnee.toFixed(1) + " W" : "- W";
    if (externeCompactSpan) externeCompactSpan.textContent = externePuissance;
    if (externalTitle)
      externalTitle.innerHTML = (userData.useExternal && userData.externalCapteur)
        ? `Capteur externe de référence : ${externalIntegration} : ${externalName} (${externePuissance})` +
           (externeIndispo ? " <span style='color:red; font-weight:bold;'>⚠️ INDISPONIBLE</span>" : "")
        : "Capteur externe de référence : désactivé";
    if (deltaPuissanceSpan) deltaPuissanceSpan.textContent = deltaText;
    if (refreshSpan) refreshSpan.textContent = new Date().toLocaleString();

    if (typeContratSpan) typeContratSpan.textContent = userData.typeContrat || "-";
    if (abonnementHTSpan) abonnementHTSpan.textContent = 
      userData.abonnementHT != null ? Number(userData.abonnementHT).toFixed(2) : "0.00";
    if (abonnementTTcSpan) abonnementTTcSpan.textContent = 
      userData.abonnementTTC != null ? Number(userData.abonnementTTC).toFixed(2) : "0.00";

    // ---- Affichage Tarifs ----
    if (userData.typeContrat === "fixe") {
      const prixHT = Number(userData.prix_ht ?? 0);
      const prixTTC = Number(userData.prix_ttc ?? (prixHT * 1.2));
      if (prixFixeHTSpan) prixFixeHTSpan.textContent = prixHT.toFixed(4);
      if (prixFixeTTCSpan) prixFixeTTCSpan.textContent = prixTTC.toFixed(4);

      if (tarifsWrap) {
        tarifsWrap.innerHTML =
          `<strong>Tarif HT :</strong> ${prixHT.toFixed(4)} €/kWh <br>
           <strong>Tarif TTC :</strong> ${prixTTC.toFixed(4)} €/kWh`;
      }
    } else {
      const prixHPHT = Number(userData.prix_ht_hp ?? 0);
      const prixHPTTC = Number(userData.prix_ttc_hp ?? (prixHPHT * 1.2));
      const prixHCHT = Number(userData.prix_ht_hc ?? 0);
      const prixHCTTC = Number(userData.prix_ttc_hc ?? (prixHCHT * 1.2));
      if (tarifHPHTSummary) tarifHPHTSummary.textContent = prixHPHT.toFixed(4);
      if (tarifHPTTCSummary) tarifHPTTCSummary.textContent = prixHPTTC.toFixed(4);
      if (tarifHCHTSummary) tarifHCHTSummary.textContent = prixHCHT.toFixed(4);
      if (tarifHCTTCSummary) tarifHCTTCSummary.textContent = prixHCTTC.toFixed(4);
      if (heuresHPDebutSummary) heuresHPDebutSummary.textContent = userData.hc_start || "-";
      if (heuresHPFinSummary) heuresHPFinSummary.textContent = userData.hc_end || "-";
      if (tarifsWrap) {
        tarifsWrap.innerHTML =
          `<strong>Tarif HP HT :</strong> ${prixHPHT.toFixed(4)} €/kWh <br>
           <strong>Tarif HP TTC :</strong> ${prixHPTTC.toFixed(4)} €/kWh <br>
           <strong>Tarif HC HT :</strong> ${prixHCHT.toFixed(4)} €/kWh <br>
           <strong>Tarif HC TTC :</strong> ${prixHCTTC.toFixed(4)} €/kWh <br>
           <strong>HC :</strong> ${userData.hc_start || "-"} – ${userData.hc_end || "-"}`;
      }
    }

    // ---- Affichage alerte globale si capteur externe indisponible
    if (externeIndispo && summaryMessage) {
      summaryMessage.style.display = "block";
      summaryMessage.innerHTML = "⚠️ <b>Attention :</b> le capteur externe sélectionné est indisponible ou non mis à jour (état <i>unknown</i>, API non accessible ou login bloqué).";
    } else if (summaryMessage) {
      summaryMessage.style.display = "none";
    }

    summaryData.style.display = "block";

    // ---- Estimation période + abonnement réparti ----
    const periods = [
      { label: "Heure", factor: 1, abDiv: 30 * 24 },
      { label: "Jour", factor: 24, abDiv: 30 },
      { label: "Semaine", factor: 24 * 7, abDiv: 4.345 },
      { label: "Mois", factor: 24 * 30, abDiv: 1 },
      { label: "Année", factor: 24 * 365, abDiv: 1 / 12 }
    ];

    function getAbonnement(periodIdx, htOrTtc) {
      const abMensuelHT = Number(userData.abonnementHT || 0);
      const abMensuelTTC = Number(userData.abonnementTTC || 0);
      const { abDiv } = periods[periodIdx];
      return htOrTtc === "HT"
        ? abDiv !== 1 ? abMensuelHT / abDiv : abMensuelHT * (periodIdx === 4 ? 12 : 1)
        : abDiv !== 1 ? abMensuelTTC / abDiv : abMensuelTTC * (periodIdx === 4 ? 12 : 1);
    }

    function calcEstimation(watt, periodIdx, typeTarif = "") {
      const { factor } = periods[periodIdx];
      const kwh = Math.max(0, watt) / 1000 * factor;
      let tarifHT = 0, tarifTTC = 0;
      if (userData.typeContrat === "fixe") {
        tarifHT = Number(userData.prix_ht ?? 0);
        tarifTTC = Number(userData.prix_ttc ?? (tarifHT * 1.2));
      } else {
        if (typeTarif === "HC") {
          tarifHT = Number(userData.prix_ht_hc ?? 0);
          tarifTTC = Number(userData.prix_ttc_hc ?? (tarifHT * 1.2));
        } else {
          tarifHT = Number(userData.prix_ht_hp ?? 0);
          tarifTTC = Number(userData.prix_ttc_hp ?? (tarifHT * 1.2));
        }
      }
      const abonnementHT = getAbonnement(periodIdx, "HT");
      const abonnementTTC = getAbonnement(periodIdx, "TTC");
      return {
        kwh,
        coutHT: kwh * tarifHT,
        coutTTC: kwh * tarifTTC,
        totalHT: kwh * tarifHT + abonnementHT,
        totalTTC: kwh * tarifTTC + abonnementTTC,
      };
    }

    function createRow(est, periodLabel) {
      return `<tr>
        <td>${periodLabel}</td>
        <td>${est.kwh.toFixed(2)}</td>
        <td>${est.coutHT.toFixed(2)} €</td>
        <td>${est.coutTTC.toFixed(2)} €</td>
        <td>${est.totalHT.toFixed(2)} €</td>
        <td>${est.totalTTC.toFixed(2)} €</td>
      </tr>`;
    }

    function updateTable(tbody, watt, typeTarif, titre) {
      if (!tbody) return;
      tbody.innerHTML = "";
      periods.forEach((p, i) => {
        const est = calcEstimation(watt, i, typeTarif);
        tbody.insertAdjacentHTML("beforeend", createRow(est, p.label));
      });
    }

    updateTable(selectedTable, consommationSelectionnee, "HP", "Conso capteurs détectés");
    updateTable(externalTable, consommationExterne, "HP", "Conso capteur externe");
    updateTable(deltaTable, deltaValeur, "HP", "Delta (externe − interne)");

  } catch (err) {
    console.error("Erreur chargement résumé:", err);
    if (summaryMessage) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Erreur lors du chargement du résumé";
    }
    if (summaryData) summaryData.style.display = "none";
  }
}

document.getElementById("refreshHome")?.addEventListener("click", loadSummary);
if (!summaryRefreshInterval) summaryRefreshInterval = setInterval(loadSummary, 30000);
