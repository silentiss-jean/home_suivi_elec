"use strict";

// Importer la fonction proxy
import { fetchViaProxy } from "../shared/proxy.js";

async function loadDiagnostics() {
  // ✅ CORRECTION : Chercher diagnosticsGlobal d'abord, fallback vers diagnostics-container
  const container = document.getElementById("diagnosticsGlobal") || document.getElementById("diagnostics-container");
  
  if (!container) {
    // L'UI "classique" n'est pas montée → on sort proprement
    return;
  }
  
  try {
    // Utiliser le proxy au lieu de fetch direct
    const data = await fetchViaProxy("/api/home_suivi_elec/get_diagnostics");
    
    if (!data || Object.keys(data).length === 0) {
      container.innerHTML = "<p>Aucun diagnostic disponible.</p>";
      return;
    }
    
    // Afficher les diagnostics (format JSON pour test)
    container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    console.log("✅ Diagnostics chargés via proxy:", data);
    
  } catch (err) {
    console.error("❌ Erreur chargement diagnostic:", err);
    container.innerHTML = 
      `<p style="color:red">❌ Erreur: ${err.message}</p>`;
  }
}

// Exporter pour utilisation dans app.js
export { loadDiagnostics };

// Auto-chargement si le conteneur existe
if (document.getElementById("diagnostics-container") || document.getElementById("diagnosticsGlobal")) {
  loadDiagnostics();
}
