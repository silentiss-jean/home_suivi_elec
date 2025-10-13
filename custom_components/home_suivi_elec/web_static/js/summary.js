import { normalizeSensors, countTotalFromGrouped, findSensorValue } from './utils.js';

export async function loadSummary() {
  const summaryMessage = document.getElementById("summaryMessage");
  const summaryData = document.getElementById("summaryData");
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const coutHT = document.getElementById("coutHT");
  const coutTTC = document.getElementById("coutTTC");
  const consommationW = document.getElementById("consommationW");
  const deltaConsommation = document.getElementById("deltaConsommation");
  const refreshSpan = document.getElementById("dernierRefresh");

  try {
    const [sensorsResp, optionsResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/api/home_suivi_elec/get_user_options")
    ]);

    if (!sensorsResp.ok) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Aucune détection de capteurs disponible.";
      summaryData.style.display = "none";
      return;
    }

    const sensorsRaw = await sensorsResp.json();
    const groupedSensors = normalizeSensors(sensorsRaw);
    const totalSensors = countTotalFromGrouped(groupedSensors);

    const userData = optionsResp.ok ? await optionsResp.json() : {};
    const selectionData = userData.selection || {};

    if (!selectionData || Object.keys(selectionData).length === 0) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Aucune configuration sauvegardée pour le moment.";
      summaryData.style.display = "none";
      return;
    }

    let actifs = 0;
    let consommationTotale = 0;
    for (const [integration, list] of Object.entries(selectionData)) {
      for (const s of list) {
        if (s.enabled) {
          actifs += 1;
          consommationTotale += findSensorValue(s.entity_id, groupedSensors);
        }
      }
    }

    let delta = 0;
    if (userData.consommationExterne && userData.useExternal) {
      delta = Number(userData.consommationExterne) - consommationTotale;
    }

    totalSpan.textContent = totalSensors;
    actifsSpan.textContent = `${actifs} / ${totalSensors}`;
    coutHT.textContent = userData.abonnementHT != null ? `${Number(userData.abonnementHT).toFixed(2)} €` : "0 €";
    coutTTC.textContent = userData.abonnementTTC != null ? `${Number(userData.abonnementTTC).toFixed(2)} €` : "0 €";
    consommationW.textContent = `${consommationTotale.toFixed(2)} W`;
    deltaConsommation.textContent = `${delta.toFixed(2)} W`;
    refreshSpan.textContent = new Date().toLocaleTimeString();

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";

  } catch (err) {
    console.error("Erreur chargement résumé:", err);
    summaryMessage.style.display = "block";
    summaryMessage.textContent = "Erreur lors du chargement du résumé";
    summaryData.style.display = "none";
  }
}