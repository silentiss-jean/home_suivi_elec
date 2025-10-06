# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec ConfigFlow, OptionsFlow, services et panneau de sélection."""

import os
import logging
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.config_entries import ConfigEntry

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .manage_selection import run_generate_selection
from .panel_selection import async_setup_panel

_LOGGER = logging.getLogger(__name__)

BASE_PATH = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_PATH, "data")
PANEL_PATH = os.path.join(BASE_PATH, "panel_static")


def ensure_directories():
    """Créer automatiquement les dossiers nécessaires pour l'intégration."""
    os.makedirs(DATA_PATH, exist_ok=True)
    os.makedirs(PANEL_PATH, exist_ok=True)
    _LOGGER.info("[INIT] Dossiers vérifiés : data/ et panel_static/")


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Setup minimal (sans ConfigEntry)."""
    ensure_directories()
    _LOGGER.info("[SETUP] async_setup called with config keys: %s", list(config.keys()))
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Setup d’une instance Home Suivi Élec via ConfigEntry."""
    ensure_directories()
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

    async def handle_generate_selection(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_selection called")
        try:
            await run_generate_selection(hass)
            _LOGGER.info("[SERVICE] generate_selection finished successfully")
        except Exception as e:
            _LOGGER.exception("[SERVICE] Error in generate_selection: %s", e)

    async def handle_generate_lovelace_auto(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_lovelace_auto called")
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
            _LOGGER.info("[SERVICE] generate_lovelace_auto finished successfully")
        except Exception as e:
            _LOGGER.exception("[SERVICE] Error in generate_lovelace_auto: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)

    scan_sets(hass)

    await async_setup_panel(hass)  # 👈 Ajout du panneau après vérification du dossier

    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] auto_generate_lovelace is enabled")
        await run_all(hass, hass.data[DOMAIN]["options"])

    _LOGGER.info("[SETUP_ENTRY] Home Suivi Élec setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Déchargement d’une instance."""
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de Home Suivi Élec")
    return True