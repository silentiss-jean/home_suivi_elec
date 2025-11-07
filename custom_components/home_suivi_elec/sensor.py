# -*- coding: utf-8 -*-
"""Plateforme sensor pour Home Suivi Élec — Correction JSON-safe."""

import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN

LOGGER = logging.getLogger(__name__)

async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    from homeassistant.core import callback
    LOGGER.info("🎯 [EVENT-DRIVEN] Setup sensor platform - Attente events...")

    @callback
    def on_hse_sensors_ready(event):
        sensor_type = event.data.get('type', 'unknown')
        count = event.data.get('count', 0)
        LOGGER.info(f"📡 [EVENT REÇU] {sensor_type.upper()} [signalé] (count={count})")
        if sensor_type == 'energy':
            sensors = hass.data.get(DOMAIN, {}).get("energy_sensors", [])
        elif sensor_type == 'power':
            sensors = hass.data.get(DOMAIN, {}).get("live_power_sensors", [])
        else:
            LOGGER.warning(f"⚠️ [EVENT] Type inconnu: {sensor_type}")
            return
        if sensors:
            async_add_entities(sensors, True)
            LOGGER.info(f"✅ [EVENT-PROCESSED] {len(sensors)} sensors {sensor_type} enregistrés")
        else:
            LOGGER.warning(f"⚠️ [EVENT] Aucun sensor {sensor_type} trouvé dans hass.data.")

    hass.bus.async_listen('hse_energy_sensors_ready', on_hse_sensors_ready)
    hass.bus.async_listen('hse_power_sensors_ready', on_hse_sensors_ready)
    LOGGER.info("🎧 [EVENT-DRIVEN] Listeners activés - En attente des events sensors...")
    # Setup initial si sensors déjà présents
    energy_sensors = hass.data.get(DOMAIN, {}).get("energy_sensors", [])
    live_power_sensors = hass.data.get(DOMAIN, {}).get("live_power_sensors", [])
    if energy_sensors or live_power_sensors:
        async_add_entities(energy_sensors + live_power_sensors, True)
