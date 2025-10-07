# -*- coding: utf-8 -*-
"""Gestion de la sélection des capteurs Home Suivi Élec."""
import os
import json
import logging
from homeassistant.core import HomeAssistant
from homeassistant.components.http import HomeAssistantView

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")

async def async_setup_selection_api(hass: HomeAssistant):
    """Setup API pour lire/sauver la sélection des capteurs."""

    class GetSensorsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_sensors"
        name = "api:home_suivi_elec:get_sensors"

        async def get(self, request):
            if not os.path.exists(CAPTEURS_POWER_PATH):
                return self.json({"error": "capteurs_power.json introuvable"}, status=404)
            with open(CAPTEURS_POWER_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
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
            return self.json(integrations)

    class SaveSelectionView(HomeAssistantView):
        url = "/api/home_suivi_elec/save_selection"
        name = "api:home_suivi_elec:save_selection"

        async def post(self, request):
            body = await request.json()
            os.makedirs(DATA_DIR, exist_ok=True)
            with open(CAPTEURS_SELECTION_PATH, "w", encoding="utf-8") as f:
                json.dump(body, f, indent=2, ensure_ascii=False)
            _LOGGER.info("✅ Sélection des capteurs sauvegardée")
            return self.json({"success": True})

    # Enregistre les vues
    hass.http.register_view(GetSensorsView)
    hass.http.register_view(SaveSelectionView)
    _LOGGER.info("[SELECTION] API selection capteurs prête")
