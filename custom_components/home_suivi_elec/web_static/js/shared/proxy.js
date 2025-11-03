"use strict";

/**
 * Appelle une API via le proxy backend
 * @param {string} endpoint - L'endpoint à appeler (ex: "/api/home_suivi_elec/get_sensors")
 * @param {string} method - Méthode HTTP (GET, POST, etc.)
 * @param {object} payload - Données à envoyer (pour POST)
 * @returns {Promise<object>} - Réponse JSON
 */
export async function fetchViaProxy(endpoint, method = "GET", payload = null) {
  const resp = await fetch("/api/home_suivi_elec/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, method, payload })
  });
  
  if (!resp.ok) {
    throw new Error(`Proxy error: ${resp.status}`);
  }
  
  return await resp.json();
}
