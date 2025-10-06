# -*- coding: utf-8 -*-
"""Initialisation principale de l’intégration Home Suivi Élec avec ConfigFlow et services."""

import logging
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.config_entries import ConfigEntry

from .const import DOMAIN
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Setup minimal (sans ConfigEntry)."""
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Setup d’une instance Home Suivi Élec via ConfigEntry."""
    _LOGGER.info("🔌 Initialisation de l’intégration Home Suivi Élec")

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Service 1 : Détection locale
    async def handle_generate_local_data(call: ServiceCall):
        try:
            _LOGGER.info("🔍 Service 'generate_local_data' lancé")
            await run_detect_local(hass, entry)
            _LOGGER.info("✅ Détection locale terminée")
        except Exception as e:
            _LOGGER.error("❌ Erreur dans generate_local_data : %s", e)

    # --- Service 2 : Génération Lovelace automatique
    async def handle_generate_lovelace_auto(call: ServiceCall):
        try:
            _LOGGER.info("🧩 Service 'generate_lovelace_auto' lancé")
            await run_all(hass, hass.data[DOMAIN]["options"])
            _LOGGER.info("✅ Interface Lovelace générée")
        except Exception as e:
            _LOGGER.error("⚠️ Erreur dans generate_lovelace_auto : %s", e)

    # --- Enregistrement des services
    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)

    # --- Scan debug JSON sets
    scan_sets(hass)

    _LOGGER.info("✅ Services enregistrés : generate_local_data, generate_lovelace_auto")
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Déchargement d’une instance."""
    _LOGGER.info("♻️ Déchargement Home Suivi Élec")
    return True
