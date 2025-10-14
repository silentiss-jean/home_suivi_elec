// summary.js

export async function loadSummary() {
  const summaryMessage = document.getElementById("summaryMessage");
  const summaryData = document.getElementById("summaryData");
  const totalSpan = document.getElementById("totalCapteurs");
  const actifsSpan = document.getElementById("actifsCapteurs");
  const typeContratSpan = document.getElementById("typeContratSummary");
  const abonnementHTSummary = document.getElementById("abonnementHTSummary");
  const abonnementTTCSummary = document.getElementById("abonnementTTCSummary");
  const nombreCapteursSelectionnes = document.getElementById("nombreCapteursSelectionnes");
  const instantaneInterneSpan = document.getElementById("instantaneInterne");
  const externeCompactSpan = document.getElementById("externeCompact");
  const deltaPuissanceSpan = document.getElementById("deltaPuissance");
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

  try {
    // Récupère infos user et valeurs Utility Meter réelles
    const [optionsResp, consumptionsResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_user_options"),
      fetch("/api/home_suivi_elec/get_consumptions"),
    ]);
    const userData = optionsResp.ok ? await optionsResp.json() : {};
    const consumptionData = consumptionsResp.ok ? await consumptionsResp.json() : {};

    // ------ Informations capteurs sélectionnés ------
    // On extrait l'ensemble des capteurs de la sélection actuelle
    let actifs = 0;
    if (userData.selection) {
      for (const list of Object.values(userData.selection)) {
        actifs += (Array.isArray(list) ? list.filter(c => c.enabled).length : 0);
      }
    }
    const totalSensors =
      userData.selection
        ? Object.values(userData.selection).reduce(
            (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
            0,
          )
        : 0;

    if (totalSpan) totalSpan.textContent = totalSensors;
    if (actifsSpan) actifsSpan.textContent = `${actifs} / ${totalSensors} capteurs sélectionnés`;
    if (nombreCapteursSelectionnes) nombreCapteursSelectionnes.textContent = `${actifs}`;

    // ------ Récap général contrat -------
    if (typeContratSpan) typeContratSpan.textContent = userData.typeContrat || "-";
    if (abonnementHTSummary)
      abonnementHTSummary.textContent =
        userData.abonnementHT !== undefined ? Number(userData.abonnementHT).toFixed(2) : "-";
    if (abonnementTTCSummary)
      abonnementTTCSummary.textContent =
        userData.abonnementTTC !== undefined ? Number(userData.abonnementTTC).toFixed(2) : "-";

    // Bloc prix selon type contrat
    if (userData.typeContrat === "fixe") {
      if (blocFixe) blocFixe.style.display = "block";
      if (blocHpHc) blocHpHc.style.display = "none";
      if (prixFixeHTSpan) prixFixeHTSpan.textContent = userData.tarifHP !== undefined ? Number(userData.tarifHP).toFixed(4) : "-";
      if (prixFixeTTCSpan) prixFixeTTCSpan.textContent =
        userData.tarifHP !== undefined && userData.tarifHP > 0 ? (Number(userData.tarifHP) * 1.2).toFixed(4) : "-";
    } else if (userData.typeContrat === "hp-hc") {
      if (blocFixe) blocFixe.style.display = "none";
      if (blocHpHc) blocHpHc.style.display = "block";
      if (tarifHPHTSummary) tarifHPHTSummary.textContent = userData.tarifHP !== undefined ? Number(userData.tarifHP).toFixed(4) : "-";
      if (tarifHPTTCSummary) tarifHPTTCSummary.textContent =
        userData.tarifHP !== undefined ? (Number(userData.tarifHP) * 1.2).toFixed(4) : "-";
      if (tarifHCHTSummary) tarifHCHTSummary.textContent = userData.tarifHC !== undefined ? Number(userData.tarifHC).toFixed(4) : "-";
      if (tarifHCTTCSummary) tarifHCTTCSummary.textContent =
        userData.tarifHC !== undefined ? (Number(userData.tarifHC) * 1.2).toFixed(4) : "-";
      if (heuresHPDebutSummary) heuresHPDebutSummary.textContent = userData.heuresHPDebut || "-";
      if (heuresHPFinSummary) heuresHPFinSummary.textContent = userData.heuresHPFin || "-";
    } else {
      if (blocFixe) blocFixe.style.display = "none";
      if (blocHpHc) blocHpHc.style.display = "none";
    }

    // ------ Affichage DU TABLEAU Coût réel ------
    selectedTable.innerHTML = "";
    const cycles_nom = {
      hourly: "Dernière heure",
      daily: "Aujourd'hui",
      weekly: "Cette semaine",
      monthly: "Ce mois",
      yearly: "Cette année",
    };

    // Pour chaque capteur sélectionné
    for (const [entity_id, values] of Object.entries(consumptionData)) {
      Object.entries(values).forEach(([cycle, kwh]) => {
        // Coût calculé uniquement si valeur dispo
        let cout = "-";
        // On choisit un tarif selon type de contrat
        if (kwh !== null && !isNaN(kwh)) {
          let tarif = userData.typeContrat === "hp-hc" ? userData.tarifHP : userData.tarifHC;
          // Utilise tarifHP par défaut si absent (tu peux adapter)
          if (!tarif) tarif = userData.tarifHP || 0.0;
          cout = (parseFloat(kwh) * parseFloat(tarif)).toFixed(2) + " €";
        }
        const row = `
          <tr>
            <td style="text-align:center;">${cycles_nom[cycle] || cycle}</td>
            <td class="num" style="text-align:center;">${kwh !== null ? kwh : "Non disponible"}</td>
            <td class="num" style="text-align:center;">${cout}</td>
            <td class="num" style="text-align:center;">${cout}</td>
          </tr>`;
        selectedTable.insertAdjacentHTML("beforeend", row);
      });
    }

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";
  } catch (err) {
    console.error("Erreur chargement résumé réel:", err);
    if (summaryMessage) {
      summaryMessage.style.display = "block";
      summaryMessage.textContent = "Erreur lors du chargement du résumé";
    }
    if (summaryData) summaryData.style.display = "none";
  }
}

// Actualiser sur bouton
document.getElementById("refreshHome")?.addEventListener("click", loadSummary);
