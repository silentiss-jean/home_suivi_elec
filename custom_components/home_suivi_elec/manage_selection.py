# -*- coding: utf-8 -*-
"""Gestion sélection capteurs Home Suivi Élec (async-safe, WS compatible)."""
import os
import json
import logging
from homeassistant.core import HomeAssistant
import asyncio
from functools import partial

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")

async def async_setup_selection_api(hass: HomeAssistant):
    class GetSensorsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_sensors"
        name = "api:home_suivi_elec:get_sensors"
        requires_auth = True

        async def get(self, request):
            loop = asyncio.get_running_loop()
            data = await loop.run_in_executor(None, partial(load_json_file, CAPTEURS_POWER_PATH))
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
        requires_auth = True

        async def post(self, request):
            body = await request.json()
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, partial(save_json_file, CAPTEURS_SELECTION_PATH, body))
            _LOGGER.info("✅ Sélection des capteurs sauvegardée")
            return self.json({"success": True})

    hass.http.register_view(GetSensorsView)
    hass.http.register_view(SaveSelectionView)
    _LOGGER.info("[SELECTION] API selection capteurs prête")

async def async_get_sensors(hass: HomeAssistant):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, partial(load_json_file, CAPTEURS_POWER_PATH))

async def async_save_selection(hass: HomeAssistant, selection):
    os.makedirs(DATA_DIR, exist_ok=True)
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, partial(save_json_file, CAPTEURS_SELECTION_PATH, selection))
    _LOGGER.info("✅ [SELECTION] Fichier sauvegardé via WS")

async def run_generate_selection(hass: HomeAssistant):
    if not os.path.exists(CAPTEURS_POWER_PATH):
        _LOGGER.warning("capteurs_power.json introuvable. Lancez generate_local_data d'abord.")
        return
    loop = asyncio.get_running_loop()
    data = await loop.run_in_executor(None, partial(load_json_file, CAPTEURS_POWER_PATH))
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
    os.makedirs(DATA_DIR, exist_ok=True)
    await loop.run_in_executor(None, partial(save_json_file, CAPTEURS_SELECTION_PATH, integrations))
    _LOGGER.info("✅ [SELECTION] Fichier capteurs_selection.json créé/mis à jour")

def load_json_file(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json_file(path: str, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)