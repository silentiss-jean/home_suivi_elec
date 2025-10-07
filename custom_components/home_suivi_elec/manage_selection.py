# -*- coding: utf-8 -*-
"""Gestion de la sélection des capteurs Home Suivi Élec."""
import os
import json
import logging
from homeassistant.core import HomeAssistant
from aiohttp import web

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")

async def async_setup_selection_api(hass: HomeAssistant):
    """Setup API pour lire/sauver la sélection des capteurs."""

    async def handle_get_sensors(request):
        if not os.path.exists(CAPTEURS_POWER_PATH):
            return web.json_response(
                {"error": "capteurs_power.json introuvable"}, status=404
            )
        with open(CAPTEURS_POWER_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Grouper par intégration
        integrations = {}
        for c in data:
            integ = c.get("integration", "unknown")
            integrations.setdefault(integ, []).append({
                "entity_id": c.get("entity_id"),
                "friendly_name": c.get("friendly_name"),
                "area": c.get("area"),
                "unit": c.get("unit"),
                "enabled": True
            })
        return web.json_response(integrations)

    async def handle_save_selection(request):
        try:
            body = await request.json()
        except Exception as e:
            _LOGGER.exception("Erreur lecture JSON dans save_selection: %s", e)
            return web.json_response({"error": "Invalid JSON"}, status=400)

        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CAPTEURS_SELECTION_PATH, "w", encoding="utf-8") as f:
            json.dump(body, f, indent=2, ensure_ascii=False)

        _LOGGER.info("✅ Sélection des capteurs sauvegardée")
        return web.json_response({"success": True}, status=200)

    # Enregistrement des routes API
    hass.http.register_view(web.View(
        name="HomeSuiviElecGetSensors",
        url_path="/api/home_suivi_elec/get_sensors",
        get=handle_get_sensors
    ))

    hass.http.register_view(web.View(
        name="HomeSuiviElecSaveSelection",
        url_path="/api/home_suivi_elec/save_selection",
        post=handle_save_selection
    ))

    _LOGGER.info("[SELECTION] API selection capteurs prête")
