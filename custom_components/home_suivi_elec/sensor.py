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
    """Set up sensors from a config entry — Phase 3: EVENT-DRIVEN.

    🚀 NOUVELLE ARCHITECTURE: Les sensors sont ajoutés via events au lieu du setup timing.
    
    Events écoutés:
      - 'hse_energy_sensors_ready' : sensors energy cycles (energy_tracking.py)  
      - 'hse_power_sensors_ready'  : sensors power temps réel (power_monitoring.py)
    """
    from homeassistant.core import callback
    
    LOGGER.info("🎯 [EVENT-DRIVEN] Setup sensor platform - Attente events...")
    
    @callback
    def on_hse_sensors_ready(event):
        """Callback unifié pour tous les events HSE sensors."""
        try:
            sensors = event.data.get('sensors', [])
            sensor_type = event.data.get('type', 'unknown')
            count = event.data.get('count', len(sensors))
            timestamp = event.data.get('timestamp', 'unknown')
            
            LOGGER.info(f"📡 [EVENT REÇU] {sensor_type.upper()}: {count} sensors à ajouter")
            LOGGER.debug(f"🕒 [EVENT] Timestamp: {timestamp}")
            
            if sensors:
                # Ajouter immédiatement les sensors reçus
                async_add_entities(sensors, True)
                LOGGER.info(f"✅ [EVENT-PROCESSED] {len(sensors)} sensors {sensor_type} enregistrés")
            else:
                LOGGER.warning(f"⚠️ [EVENT] Aucun sensor dans l'event {sensor_type}")
                
        except Exception as e:
            LOGGER.exception(f"❌ [EVENT-ERROR] Erreur traitement event: {e}")
    
    # Setup listeners pour tous les events HSE
    hass.bus.async_listen('hse_energy_sensors_ready', on_hse_sensors_ready)
    hass.bus.async_listen('hse_power_sensors_ready', on_hse_sensors_ready)
    
    LOGGER.info("🎧 [EVENT-DRIVEN] Listeners activés - En attente des events sensors...")
    
    # 🎯 BACKUP: Vérifier si sensors déjà présents (cas de redémarrage)
    energy_sensors = hass.data.get(DOMAIN, {}).get("energy_sensors", [])
    live_power_sensors = hass.data.get(DOMAIN, {}).get("live_power_sensors", [])
    
    if energy_sensors or live_power_sensors:
        total = len(energy_sensors) + len(live_power_sensors)
        LOGGER.info(f"🔄 [BACKUP] Sensors déjà présents: {len(energy_sensors)} energy + {len(live_power_sensors)} power")
        async_add_entities(energy_sensors + live_power_sensors, True)
        LOGGER.info(f"✅ [BACKUP] {total} sensors pré-existants enregistrés")
