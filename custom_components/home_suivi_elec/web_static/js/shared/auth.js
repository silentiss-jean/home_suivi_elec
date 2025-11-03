// auth.js - Gestion auth via contexte Home Assistant
"use strict";

let HA_TOKEN = null;

/**
 * Récupère le token depuis le contexte Home Assistant (panel iframe)
 */
export async function initAuth() {
  try {
    // Essayer de récupérer depuis le contexte HA
    const hass = window?.parent?.customElements?.get?.('home-assistant')?.hass;
    
    if (hass?.auth?.data?.access_token) {
      HA_TOKEN = hass.auth.data.access_token;
      console.log("[AUTH] Token récupéré depuis contexte HA");
      return true;
    }
    
    // Fallback : Mode sans auth (requires_auth = False)
    console.warn("[AUTH] Token HA non disponible, mode sans auth");
    return false;
  } catch (err) {
    console.error("[AUTH] Erreur récupération token:", err);
    return false;
  }
}

export function getToken() {
  return HA_TOKEN;
}

export async function fetchAuth(url, options = {}) {
  if (!HA_TOKEN) {
    await initAuth();
  }
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  
  if (HA_TOKEN) {
    headers["Authorization"] = `Bearer ${HA_TOKEN}`;
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}
