# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec ConfigFlow, OptionsFlow et services."""

import logging
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Setup minimal (sans ConfigEntry)."""
    _LOGGER.info("[SETUP] async_setup called with config keys: %s", list(config.keys()))
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Setup d’une instance Home Suivi Élec via ConfigEntry."""
    _LOGGER.info("[SETUP_ENTRY] Initialisation de Home Suivi Élec, entry data: %s", entry.data)

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Services
    async def handle_generate_local_data(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_local_data called")
        try:
            await run_detect_local(hass, entry)
            _LOGGER.info("[SERVICE] generate_local_data finished successfully")
        except Exception as e:
            _LOGGER.exception("[SERVICE] Error in generate_local_data: %s", e)

    async def handle_generate_lovelace_auto(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_lovelace_auto called")
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
            _LOGGER.info("[SERVICE] generate_lovelace_auto finished successfully")
        except Exception as e:
            _LOGGER.exception("[SERVICE] Error in generate_lovelace_auto: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)

    # --- Scan debug JSON sets
    scan_sets(hass)

    # --- Détection automatique si option activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] auto_generate_lovelace is enabled")
        await run_all(hass, hass.data[DOMAIN]["options"])

    _LOGGER.info("[SETUP_ENTRY] Home Suivi Élec setup complete")
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Déchargement d’une instance."""
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de l'intégration Home Suivi Élec")
    return True

# --- Liaison avec OptionsFlow pour que la roue apparaisse
@staticmethod
@callback
def async_get_options_flow(config_entry: ConfigEntry):
    _LOGGER.debug("[OPTIONS_FLOW] async_get_options_flow called for entry: %s", config_entry.title)
    return HomeSuiviElecOptionsFlow(config_entry)