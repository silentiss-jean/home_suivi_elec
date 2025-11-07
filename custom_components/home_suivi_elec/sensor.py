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
    """Set up sensors from a config entry — Correction EVENT-DRIVEN."""

    from homeassistant.core import callback

    LOGGER.info("🎯 [EVENT-DRIVEN] Setup sensor platform - Attente events...")

    @callback
    def on_hse_sensors_ready(event):
        """Callback JSON-safe pour tous les events HSE sensors."""
        try:
            # 1. Récupérer la liste d'entity_ids
            sensor_ids = event.data.get('sensor_ids', [])
            sensor_type = event.data.get('type', 'unknown')
            count = event.data.get('count', len(sensor_ids))
            timestamp = event.data.get('timestamp', 'unknown')

            # 2. Choisir la liste correcte depuis hass.data
            if sensor_type == 'energy':
                sensors = hass.data.get(DOMAIN, {}).get("energy_sensors", [])
            elif sensor_type == 'power':
                sensors = hass.data.get(DOMAIN, {}).get("live_power_sensors", [])
            else:
                LOGGER.warning(f"⚠️ [EVENT] Type inconnu: {sensor_type}")
                return

            # 3. Filtrer la liste pour ne garder que ceux présents dans sensor_ids (sécurité)
            sensors_filtered = [
                s for s in sensors if hasattr(s, 'entity_id') and s.entity_id in sensor_ids
            ] if sensor_ids else sensors

            if sensors_filtered:
                async_add_entities(sensors_filtered, True)
                LOGGER.info(f"✅ [EVENT-PROCESSED] {len(sensors_filtered)} sensors {sensor_type} enregistrés")
            else:
                LOGGER.warning(f"⚠️ [EVENT] Aucun sensor {sensor_type} trouvé dans hass.data pour {sensor_ids}")

        except Exception as e:
            LOGGER.exception(f"❌ [EVENT-ERROR] Erreur traitement event: {e}")

    # Setup des listeners
    hass.bus.async_listen('hse_energy_sensors_ready', on_hse_sensors_ready)
    hass.bus.async_listen('hse_power_sensors_ready', on_hse_sensors_ready)
    LOGGER.info("🎧 [EVENT-DRIVEN] Listeners activés - En attente des events sensors...")

    # 🎯 BACKUP: Enregistrement si sensors déjà présents
    energy_sensors = hass.data.get(DOMAIN, {}).get("energy_sensors", [])
    live_power_sensors = hass.data.get(DOMAIN, {}).get("live_power_sensors", [])

    if energy_sensors or live_power_sensors:
        total = len(energy_sensors) + len(live_power_sensors)
        LOGGER.info(f"🔄 [BACKUP] Sensors déjà présents: {len(energy_sensors)} energy + {len(live_power_sensors)} power")
        async_add_entities(energy_sensors + live_power_sensors, True)
        LOGGER.info(f"✅ [BACKUP] {total} sensors pré-existants enregistrés")
