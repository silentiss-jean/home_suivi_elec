# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec services + API REST + copie frontend."""

import logging
import os
import shutil
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import frontend

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    _LOGGER.info("[SETUP] async_setup called")
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[SETUP_ENTRY] Initialisation Home Suivi Élec")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Services
    async def handle_generate_local_data(call: ServiceCall):
        try:
            await run_detect_local(hass, entry)
        except Exception as e:
            _LOGGER.exception("Erreur generate_local_data: %s", e)

    async def handle_generate_lovelace_auto(call: ServiceCall):
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
        except Exception as e:
            _LOGGER.exception("Erreur generate_lovelace_auto: %s", e)

    async def handle_generate_selection(call: ServiceCall):
        from . import manage_selection
        try:
            await manage_selection.run_generate_selection(hass)
        except Exception as e:
            _LOGGER.exception("Erreur generate_selection: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)

    # --- API REST sélection capteurs
    from . import manage_selection
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON
    scan_sets(hass)

    # --- Auto-génération si activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Copie frontend HTML/JS au démarrage
    await copy_frontend_files(hass)

    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True

@callback
def async_get_options_flow(config_entry: ConfigEntry):
    return HomeSuiviElecOptionsFlow(config_entry)

# -----------------------------------------------------------------------------
# FONCTION UTILITAIRE POUR COPIE FRONTEND
# -----------------------------------------------------------------------------
async def copy_frontend_files(hass: HomeAssistant):
    """Copie les fichiers HTML/JS vers www/community pour accès via /local/"""
    panel_src = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst, exist_ok=True)

    for filename in ("panel.html", "panel.js"):
        src = os.path.join(panel_src, filename)
        dst = os.path.join(panel_dst, filename)
        if os.path.exists(src):
            await hass.async_add_executor_job(shutil.copy2, src, dst)
            _LOGGER.info(f"[FRONTEND] Copié {src} → {dst}")
        else:
            _LOGGER.warning(f"[FRONTEND] Fichier manquant : {src}")
