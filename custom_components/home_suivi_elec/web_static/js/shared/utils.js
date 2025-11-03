// -*- coding: utf-8 -*-
// Fonctions utilitaires communes

export function normalizeSensors(sensorsRaw) {
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

export function countTotalFromGrouped(grouped) {
  return Object.values(grouped).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
}

export function findSensorValue(entityId, grouped) {
  for (const list of Object.values(grouped)) {
    if (!Array.isArray(list)) continue;
    const s = list.find(x => x.entity_id === entityId);
    if (s) return Number(s.value ?? 0);
  }
  return 0;
}

export function findSensorDetails(entityId, grouped) {
  for (const list of Object.values(grouped)) {
    if (!Array.isArray(list)) continue;
    const s = list.find(x => x.entity_id === entityId);
    if (s) return { friendly_name: s.friendly_name ?? s.entity_id, integration: s.integration ?? "unknown" };
  }
  return { friendly_name: entityId, integration: "unknown" };
}
