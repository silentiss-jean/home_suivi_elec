# -*- coding: utf-8 -*-
"""Plateforme sensor pour Home Suivi Élec — Correction JSON-safe."""

import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities):
    """Setup sensor platform."""
    _LOGGER.error("🔥 [SENSOR.PY] Setup entry appelé")
    
    # ✅ Attendre que energy_sensors soit disponible
    max_wait = 30
    waited = 0
    while DOMAIN not in hass.data or "energy_sensors" not in hass.data[DOMAIN]:
        if waited >= max_wait:
            _LOGGER.error("❌ [SENSOR.PY] Timeout: energy_sensors non disponible")
            return
        await asyncio.sleep(1)
        waited += 1
        if waited % 5 == 0:  # Log toutes les 5 secondes
            _LOGGER.debug(f"[SENSOR.PY] Attente energy_sensors... {waited}s")
    
    _LOGGER.error("🔥 [SENSOR.PY] energy_sensors disponible!")
    
    energy_sensors = hass.data[DOMAIN].get("energy_sensors", [])
    live_power_sensors = hass.data[DOMAIN].get("live_power_sensors", [])
    all_sensors = energy_sensors + live_power_sensors
    
    _LOGGER.error(f"🔥 [SENSOR.PY] Energy: {len(energy_sensors)}, Live power: {len(live_power_sensors)}")
    
    if not all_sensors:
        _LOGGER.error("⚠️ [SENSOR.PY] Aucun sensor à enregistrer")
        return
    
    _LOGGER.error(f"🔥 [SENSOR.PY] Enregistrement de {len(all_sensors)} sensors")
    async_add_entities(all_sensors, True)
    _LOGGER.error("🔥 [SENSOR.PY] ✅ Sensors enregistrés avec succès")
