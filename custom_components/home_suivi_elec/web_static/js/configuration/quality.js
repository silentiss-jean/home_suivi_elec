// quality.js - Module pour badges de qualité des capteurs (extrait pour éviter import circulaire)
"use strict";

/**
 * Crée un badge HTML pour indiquer la qualité d'un capteur
 * @param {Object} quality - Objet qualité avec score et raisons
 * @returns {string} HTML du badge
 */
export function createQualityBadgeHTML(quality) {
  if (!quality || typeof quality.score === "undefined") {
    return "";
  }

  const score = quality.score;
  const reasons = quality.reasons || [];
  
  let badgeClass = "quality-badge";
  let icon = "🟢"; // Vert par défaut
  let title = "Capteur de bonne qualité";
  
  if (score < 3) {
    badgeClass += " quality-low";
    icon = "🔴"; // Rouge
    title = "Capteur de faible qualité";
  } else if (score < 7) {
    badgeClass += " quality-medium";
    icon = "🟡"; // Jaune
    title = "Capteur de qualité moyenne";
  } else {
    badgeClass += " quality-high";
    icon = "🟢"; // Vert
  }
  
  const reasonsText = reasons.length > 0 ? reasons.join(", ") : "";
  const fullTitle = reasonsText ? `${title}: ${reasonsText}` : title;
  
  return `<span class="${badgeClass}" title="${fullTitle}">${icon} ${score}/10</span>`;
}

/**
 * Catégorise les capteurs par intégration
 * @param {Array} capteurs - Liste des capteurs
 * @returns {Object} Capteurs groupés par intégration
 */
export function categorizeSensors(capteurs) {
  const result = {};
  
  (capteurs || []).forEach(capteur => {
    const integration = capteur.platform || "unknown";
    
    if (!result[integration]) {
      result[integration] = [];
    }
    
    result[integration].push(capteur);
  });
  
  return result;
}