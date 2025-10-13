import { normalizeSensors, countTotalFromGrouped, findSensorValue } from './utils.js';

export async function loadSummary() {
  const summaryMessage = document.getElementById("summaryMessage");
  const summaryData = document.getElementById("summaryData");
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const refreshSpan = document.getElementById("dernierRefresh");

  const typeContratSpan = document.getElementById("typeContratSummary");
  const abonnementHTSpan = document.getElementById("abonnementHTSummary");
  const abonnementTTcSpan = document.getElementById("abonnementTTCSummary");

  // Conteneur dynamique des tarifs (AJOUT)
  const tarifsWrap = document.getElementById("tarifsSummary");

  const selectedTable = document.querySelector("#summarySelectedSensors tbody");
  const externalTable = document.querySelector("#summaryExternalSensors tbody");
  const deltaTable = document.querySelector("#summaryDeltaSensors tbody");

  try {
    const [sensorsResp, optionsResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_sensors"),
      fetch("/api/home_suivi_elec/get_user_options")
    ]);

    if (!sensorsResp.ok) throw new Error("Aucune détection de capteurs disponible");

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

    // --- Calcul consommation interne ---
    let actifs = 0;
    let consommationTotale = 0;
    for (const list of Object.values(selectionData)) {
      for (const s of list) {
        if (s.enabled) {
          actifs++;
          consommationTotale += findSensorValue(s.entity_id, groupedSensors);
        }
      }
    }

    // --- Consommation externe ---
    const externeActive = userData.useExternal && userData.externalCapteur;
    let consommationExterne = 0;
    let externalName = "-";
    if (externeActive) {
      consommationExterne = Number(userData.consommationExterne) || 0;
      for (const [integration, sensors] of Object.entries(groupedSensors)) {
        const s = sensors.find(x => x.entity_id === userData.externalCapteur);
        if (s) {
          externalName = s.friendly_name || s.entity_id || integration;
          break;
        }
      }
    }

    // --- Delta ---
    const delta = Math.max(0, consommationExterne - consommationTotale);

    // --- Infos de configuration ---
    if (typeContratSpan) typeContratSpan.textContent = userData.typeContrat || "-";
    if (abonnementHTSpan) abonnementHTSpan.textContent = userData.abonnementHT != null ? Number(userData.abonnementHT).toFixed(2) : "0.00";
    if (abonnementTTcSpan) abonnementTTcSpan.textContent = userData.abonnementTTC != null ? Number(userData.abonnementTTC).toFixed(2) : "0.00";

    // --- Tarifs dynamiques (AJOUT)
    if (tarifsWrap) {
      const isFixe = (userData.typeContrat === "fixe");
      if (isFixe) {
        const valFixe = Number(userData.tarifHP ?? userData.tarifHC ?? 0).toFixed(2);
        tarifsWrap.innerHTML = `
          <p><strong>Tarif :</strong> ${valFixe} €</p>
        `;
      } else {
        const hp = Number(userData.tarifHP ?? 0).toFixed(2);
        const hc = Number(userData.tarifHC ?? 0).toFixed(2);
        const start = userData.heuresHPDebut || "";
        const end = userData.heuresHPFin || "";
        const heuresRow = (start || end)
          ? `<p><strong>Plage HC :</strong> ${start} – ${end}</p>`
          : "";
        tarifsWrap.innerHTML = `
          <p><strong>Tarif HP :</strong> ${hp} €</p>
          <p><strong>Tarif HC :</strong> ${hc} €</p>
          ${heuresRow}
        `;
      }
    }

    // --- Affichage capteurs ---
    if (totalSpan) totalSpan.textContent = totalSensors;
    if (actifsSpan) actifsSpan.textContent = `${actifs} / ${totalSensors} capteurs sélectionnés`;
    if (refreshSpan) refreshSpan.textContent = new Date().toLocaleString();

    // Affichage mesure externe
    const externalTitle = document.getElementById("externalTitle");
    if (externalTitle) externalTitle.textContent = externeActive
      ? `Mesure externe : ${externalName}`
      : "Mesure externe : désactivée";

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";

    // --- Estimations (existant, conservé) ---
    const calcEstimation = (watt, period) => {
      const kwh = watt / 1000 * period;
      const unit = (userData.typeContrat === "hp-hc" ? (userData.tarifHP || 0) : (userData.tarifHC || 0));
      const coutHT = (kwh * unit) + (userData.abonnementHT || 0);
      const coutTTC = (kwh * unit) + (userData.abonnementTTC || 0);
      return { kwh, coutHT, coutTTC };
    };

    const now = new Date();
    const periods = [
      { label: `Instantané (${now.getHours()}h)`, factor: 1 / 60 },
      { label: `Heure (${now.toLocaleString()})`, factor: 1 },
      { label: `Jour (${now.toLocaleDateString()})`, factor: 24 },
      { label: `Mois (${now.getMonth()+1}/${now.getFullYear()})`, factor: 24*30 },
      { label: `Année (${now.getFullYear()})`, factor: 24*365 }
    ];

    const updateTable = (tbody, watt) => {
      if (!tbody) return;
      tbody.innerHTML = "";
      periods.forEach(p => {
        const est = calcEstimation(watt, p.factor);
        const row = `<tr>
          <td>${p.label}</td>
          <td>${est.kwh.toFixed(2)}</td>
          <td>${est.coutHT.toFixed(2)}</td>
          <td>${est.coutTTC.toFixed(2)}</td>
        </tr>`;
        tbody.insertAdjacentHTML("beforeend", row);
      });
    };

    updateTable(selectedTable, consommationTotale);
    updateTable(externalTable, consommationExterne);
    updateTable(deltaTable, delta);

  } catch (err) {
    console.error("Erreur chargement résumé:", err);
    if (summaryMessage) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Erreur lors du chargement du résumé";
    }
    if (summaryData) summaryData.style.display = "none";
  }
}

// --- Bouton d'actualisation ---
document.getElementById("refreshHome")?.addEventListener("click", loadSummary);
