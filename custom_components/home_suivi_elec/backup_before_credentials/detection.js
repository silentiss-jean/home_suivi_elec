// detection.js — Affichage des capteurs détectés

// Helper : normalise la réponse get_sensors en { integration: [sensors...] }
function normalizeSensors(sensorsRaw) {
  if (!sensorsRaw) return {};
  if (Array.isArray(sensorsRaw)) {
    return sensorsRaw.reduce((acc, c) => {
      const integ = c.integration || "unknown";
      acc[integ] ??= [];
      acc[integ].push(c);
      return acc;
    }, {});
  }
  if (typeof sensorsRaw === "object") return sensorsRaw;
  return {};
}

function countTotalFromGrouped(grouped) {
  return Object.values(grouped).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
}

// ✅ Export de la fonction principale
export async function loadDetection() {
  const content = document.getElementById("content-detection");
  if (!content) return;
  
  content.innerHTML = "Chargement...";
  try {
    const resp = await fetch("/api/home_suivi_elec/get_sensors");
    if (!resp.ok) throw new Error(`Erreur HTTP ${resp.status}`);
    const data = await resp.json();
    
    // ✅ L'API retourne {selected: {...}, alternatives: {...}, reference_sensor: {...}}
    const selected = data.selected || {};
    const alternatives = data.alternatives || {};
    const reference = data.reference_sensor || {};

    content.innerHTML = "";
    let total = 0;
    
    // ✅ Afficher les capteurs sélectionnés
    if (Object.keys(selected).length > 0) {
      const selectedBlock = document.createElement("div");
      selectedBlock.className = "card";
      selectedBlock.innerHTML = "<h3 style='color:#28a745;'>✅ Capteurs sélectionnés</h3>";
      
      for (const [integration, list] of Object.entries(selected)) {
        if (!Array.isArray(list)) continue;
        total += list.length;
        
        const block = document.createElement("div");
        block.className = "integration-block";
        block.innerHTML = `<h3>${integration} (${list.length})</h3>`;
        
        list.forEach(c => {
          const div = document.createElement("div");
          div.className = "sensor";
          const displayValue = c.value ?? 0;
          const displayUnit = c.unit || "?";
          div.textContent = `${c.friendly_name} — ${c.area || "?"} [${displayValue} ${displayUnit}]`;
          block.appendChild(div);
        });
        
        selectedBlock.appendChild(block);
      }
      content.appendChild(selectedBlock);
    }
    
    // ✅ Afficher les capteurs alternatifs
    if (Object.keys(alternatives).length > 0) {
      const altBlock = document.createElement("div");
      altBlock.className = "card";
      altBlock.innerHTML = "<h3 style='color:#666;'>➕ Capteurs disponibles (non sélectionnés)</h3>";
      
      for (const [integration, list] of Object.entries(alternatives)) {
        if (!Array.isArray(list)) continue;
        total += list.length;
        
        const block = document.createElement("div");
        block.className = "integration-block";
        block.innerHTML = `<h3>${integration} (${list.length})</h3>`;
        
        list.forEach(c => {
          const div = document.createElement("div");
          div.className = "sensor";
          const displayValue = c.value ?? 0;
          const displayUnit = c.unit || "?";
          div.textContent = `${c.friendly_name} — ${c.area || "?"} [${displayValue} ${displayUnit}]`;
          block.appendChild(div);
        });
        
        altBlock.appendChild(block);
      }
      content.appendChild(altBlock);
    }
    
    // ✅ Afficher le capteur de référence
    if (reference && reference.entity_id) {
      const refBlock = document.createElement("div");
      refBlock.className = "card";
      refBlock.style.background = "#eef4ff";
      refBlock.style.borderLeft = "4px solid #0078d4";
      refBlock.innerHTML = `
        <h3 style='color:#0078d4;'>🎯 Capteur de référence</h3>
        <p><strong>${reference.friendly_name || reference.entity_id}</strong></p>
        <p>Intégration: ${reference.integration || "?"} | Zone: ${reference.area || "?"}</p>
        <p>Valeur: ${reference.value ?? 0} ${reference.unit || "W"}</p>
      `;
      content.appendChild(refBlock);
    }

    const totalElem = document.getElementById("total");
    const refreshElem = document.getElementById("lastRefresh");
    if (totalElem) totalElem.textContent = total;
    if (refreshElem) refreshElem.textContent = new Date().toLocaleTimeString('fr-FR');
  } catch (err) {
    console.error("Erreur détection:", err);
    content.innerHTML = `<p style="color:red;">❌ ${err.message}</p>`;
  }
}

// Gestion du bouton rafraîchir
document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshDetection");
  if (refreshBtn) {
    refreshBtn.onclick = () => loadDetection();
  }
});

