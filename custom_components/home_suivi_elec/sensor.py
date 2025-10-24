# -*- coding: utf-8 -*-
"""Plateforme sensor pour Home Suivi Élec — Phase 2.5."""

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
    """Set up sensors from a config entry — Phase 2 + Phase 2.5.

    Phase 2: Energy tracking (cycles kWh)
      - sensor.hse_{slug}_hourly
      - sensor.hse_{slug}_daily
      - sensor.hse_{slug}_weekly
      - sensor.hse_{slug}_monthly
      - sensor.hse_{slug}_yearly

    Phase 2.5: Power monitoring (temps réel W)
      - sensor.hse_live_{slug}
    """
    # Phase 2: Energy tracking (cycles)
    energy_sensors = hass.data.get(DOMAIN, {}).get("energy_sensors", [])

    # Phase 2.5: Power monitoring (temps réel)
    live_power_sensors = hass.data.get(DOMAIN, {}).get("live_power_sensors", [])

    # Fusionner tous les sensors
    all_sensors = energy_sensors + live_power_sensors

    if all_sensors:
        LOGGER.info(
            f"📊 SENSOR.PY: Enregistrement de {len(energy_sensors)} sensors energy "
            f"+ {len(live_power_sensors)} sensors power live"
        )
        async_add_entities(all_sensors, True)
    else:
        LOGGER.warning("⚠️  SENSOR.PY: Aucun sensor d'énergie à enregistrer")
