# -*- coding: utf-8 -*-
"""Gestion de la sélection des capteurs de puissance par intégration."""

import os
import json
import logging
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")


async def run_generate_selection(hass: HomeAssistant):
    """Regroupe les capteurs par intégration et crée un fichier de sélection."""
    _LOGGER.info("⚙️ [SELECTION] Génération du fichier de sélection des capteurs")

    # --- Charger les capteurs détectés
    if not os.path.exists(CAPTEURS_POWER_PATH):
        _LOGGER.error("❌ Fichier %s introuvable. Lance d’abord generate_local_data.", CAPTEURS_POWER_PATH)
        return

    with open(CAPTEURS_POWER_PATH, "r", encoding="utf-8") as f:
        capteurs = json.load(f)

    if not capteurs:
        _LOGGER.warning("⚠️ Aucun capteur détecté dans %s", CAPTEURS_POWER_PATH)
        return

    # --- Regrouper par intégration
    regroupement = {}
    for c in capteurs:
        integration = c.get("integration", "inconnue")
        regroupement.setdefault(integration, [])
        regroupement[integration].append({
            "entity_id": c.get("entity_id"),
            "friendly_name": c.get("friendly_name"),
            "area": c.get("area"),
            "unit": c.get("unit"),
            "enabled": True  # activé par défaut
        })

    # --- Sauvegarder la sélection
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CAPTEURS_SELECTION_PATH, "w", encoding="utf-8") as f:
        json.dump(regroupement, f, indent=2, ensure_ascii=False)

    _LOGGER.info("✅ [SELECTION] Fichier de sélection créé : %s", CAPTEURS_SELECTION_PATH)
    _LOGGER.info("📊 %d intégrations détectées", len(regroupement))
    for integ, items in regroupement.items():
        _LOGGER.info("  • %s → %d capteurs", integ, len(items))

    return regroupement
