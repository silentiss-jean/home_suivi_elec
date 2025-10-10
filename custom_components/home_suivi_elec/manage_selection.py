# -*- coding: utf-8 -*-
"""Gestion REST des capteurs pour Home Suivi Élec (token compatible)."""

import os
import json
import logging
import asyncio
from functools import partial
from homeassistant.core import HomeAssistant
from homeassistant.components.http import HomeAssistantView

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")


async def async_setup_selection_api(hass: HomeAssistant):
    """Expose endpoints REST protégés (token)"""

    class GetSensorsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_sensors"
        name = "api:home_suivi_elec:get_sensors"
        requires_auth = False

        async def get(self, request):
            if not os.path.exists(CAPTEURS_POWER_PATH):
                _LOGGER.warning("[REST] capteurs_power.json introuvable")
                return self.json({})
            loop = asyncio.get_running_loop()
            data = await loop.run_in_executor(None, partial(load_json, CAPTEURS_POWER_PATH))
            integrations = {}
            for c in data:
                integ = c.get("integration", "unknown")
                integrations.setdefault(integ, []).append({
                    "entity_id": c.get("entity_id"),
                    "friendly_name": c.get("friendly_name"),
                    "area": c.get("area"),
                    "unit": c.get("unit"),
                    "value": c.get("value") if c.get("value") is not None else 0,
                    "enabled": True,
                })
            return self.json(integrations)

    class SaveSelectionView(HomeAssistantView):
        url = "/api/home_suivi_elec/save_selection"
        name = "api:home_suivi_elec:save_selection"
        requires_auth = False

        async def post(self, request):
            body = await request.json()
            os.makedirs(DATA_DIR, exist_ok=True)
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, partial(save_json, CAPTEURS_SELECTION_PATH, body))
            _LOGGER.info("[REST] ✅ Sélection sauvegardée.")
            return self.json({"success": True})

    class GetSummaryView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_summary"
        name = "api:home_suivi_elec:get_summary"
        requires_auth = False

        async def get(self, request):
            loop = asyncio.get_running_loop()
            power = await loop.run_in_executor(None, partial(load_json, CAPTEURS_POWER_PATH)) if os.path.exists(CAPTEURS_POWER_PATH) else []
            selection = await loop.run_in_executor(None, partial(load_json, CAPTEURS_SELECTION_PATH)) if os.path.exists(CAPTEURS_SELECTION_PATH) else {}
            total = len(power)
            selected = sum(len([c for c in v if c.get("enabled")]) for v in selection.values())
            return self.json({
                "total": total,
                "selected": selected
            })

    hass.http.register_view(GetSensorsView)
    hass.http.register_view(SaveSelectionView)
    hass.http.register_view(GetSummaryView)
    _LOGGER.info("[REST] API capteurs prête avec summary.")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


async def generate_selection(hass: HomeAssistant):
    """Génère capteurs_selection.json à partir de capteurs_power.json."""
    try:
        if not os.path.exists(CAPTEURS_POWER_PATH):
            _LOGGER.warning("[generate_selection] ⚠️ capteurs_power.json introuvable")
            return
        loop = asyncio.get_running_loop()
        data = await loop.run_in_executor(None, partial(load_json, CAPTEURS_POWER_PATH))
        integrations = {}
        for c in data:
            integ = c.get("integration", "unknown")
            integrations.setdefault(integ, []).append({
                "entity_id": c.get("entity_id"),
                "friendly_name": c.get("friendly_name"),
                "area": c.get("area"),
                "unit": c.get("unit"),
                "value": c.get("value") if c.get("value") is not None else 0,
                "enabled": True,
            })
        os.makedirs(DATA_DIR, exist_ok=True)
        await loop.run_in_executor(None, partial(save_json, CAPTEURS_SELECTION_PATH, integrations))
        _LOGGER.info("[generate_selection] ✅ capteurs_selection.json généré avec %d intégrations.", len(integrations))
    except Exception as e:
        _LOGGER.exception("[generate_selection] ❌ Erreur: %s", e)