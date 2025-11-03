// configuration.api.js — API centralisée
"use strict";
import { getToken } from "../shared/auth.js";

// Helper commun pour fetch même origine avec cookies
async function fetchJSON(url, options = {}) {
  const resp = await fetch(url, {
    credentials: "same-origin",
    // mode: "same-origin" est implicite ici; on évite no-cors
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}),
    ...options
  });
  if (!resp.ok) throw new Error(`${url.split("?")[0].split("#")[0].replace(location.origin, "")} failed`);
  return await resp.json();
}

export async function getSensors() {
  return await fetchJSON("/api/home_suivi_elec/get_sensors", { headers: {} });
}

export async function getUserOptions() {
  return await fetchJSON("/api/home_suivi_elec/get_user_options", { headers: {} });
}

export async function saveSelection(selections) {
  return await fetchJSON("/api/home_suivi_elec/save_selection", {
    method: "POST",
    body: JSON.stringify(selections)
  });
}

export async function saveUserOptions(data) {
  return await fetchJSON("/api/home_suivi_elec/save_user_options", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Extensions doublons
export async function setIgnoredEntity(entity_id, ignore) {
  return await fetchJSON("/api/home_suivi_elec/set_ignored_entity", {
    method: "POST",
    body: JSON.stringify({ entity_id, ignore: !!ignore })
  });
}

export async function chooseBestForDevice(device_id) {
  return await fetchJSON("/api/home_suivi_elec/choose_best_for_device", {
    method: "POST",
    body: JSON.stringify({ device_id })
  });
}
