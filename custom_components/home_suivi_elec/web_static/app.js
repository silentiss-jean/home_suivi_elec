// -*- coding: utf-8 -*-
// === 🏠 PAGE HOME / RÉSUMÉ GÉNÉRAL ===
async function loadSummary() {
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
    const [powerResp, selectionResp, userResp] = await Promise.all([
      fetch("/api/home_suivi_elec/get_file?name=capteurs_power.json"),
      fetch("/api/home_suivi_elec/get_file?name=capteurs_selection.json"),
      fetch("/api/home_suivi_elec/get_file?name=user_config.json")
    ]);

    if (!selectionResp.ok || !powerResp.ok) {
      console.warn("⛔ Fichiers de données manquants, attendre première configuration.");
      summaryMessage.style.display = "block";
      summaryData.style.display = "none";
      return;
    }

    const powerData = await powerResp.json();
    const selectionData = await selectionResp.json();
    const userData = userResp.ok ? await userResp.json() : {};

    let total = Array.isArray(powerData) ? powerData.length : 0;
    let actifs = 0;
    let consommationTotale = 0;

    for (const integ of Object.values(selectionData)) {
      actifs += integ.filter(c => c.enabled).length;
      consommationTotale += integ.filter(c => c.enabled).reduce((sum, c) => sum + (c.value || 0), 0);
    }

    let delta = 0;
    if (userData.consommationExterne) {
      delta = userData.consommationExterne - consommationTotale;
    }

    totalSpan.textContent = total;
    actifsSpan.textContent = `${actifs} / ${total}`;
    coutHT.textContent = userData.abonnementHT ? `${userData.abonnementHT.toFixed(2)} €` : "-";
    coutTTC.textContent = userData.abonnementTTC ? `${userData.abonnementTTC.toFixed(2)} €` : "-";
    consommationW.textContent = `${consommationTotale.toFixed(2)} W`;
    deltaConsommation.textContent = `${delta.toFixed(2)} W`;

    summaryMessage.style.display = "none";
    summaryData.style.display = "block";
    refreshSpan.textContent = new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Erreur chargement résumé:", err);
  }
}

document.getElementById("refreshHome").onclick = loadSummary;
loadSummary();

// === 🔍 DÉTECTION DES CAPTEURS ===
async function loadDetection() {
  const content = document.getElementById("content-detection");
  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const sensors = await resp.json();
    content.innerHTML = "";
    let total = 0;

    for (const [integration, list] of Object.entries(sensors)) {
      total += list.length;
      const block = document.createElement("div");
      block.className = "integration-block";
      block.innerHTML = `<h3>${integration}</h3>`;
      list.forEach(c => {
        const div = document.createElement("div");
        div.className = "sensor";
        const displayValue = c.value ?? 0;
        const displayUnit = c.unit || "?";
        div.textContent = `${c.friendly_name} — ${c.area || "?"} [${displayValue} ${displayUnit}]`;
        block.appendChild(div);
      });
      content.appendChild(block);
    }

    document.getElementById("total").textContent = total;
    document.getElementById("lastRefresh").textContent = new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Erreur détection:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

document.getElementById("refreshDetection").onclick = loadDetection;

// Onglet par défaut
showTab('home');
