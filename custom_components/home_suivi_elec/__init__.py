# -*- coding: utf-8 -*-
"""Home Suivi Élec — Services + API REST + copie UI simplifiée."""

import logging
import os
import shutil
from functools import partial
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import HomeAssistantView

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow
from . import manage_selection  # pour les API REST

_LOGGER = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# SETUP PRINCIPAL
# -----------------------------------------------------------------------------
async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    _LOGGER.info("[SETUP] async_setup appelé")
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
        try:
            await manage_selection.run_generate_selection(hass)
        except Exception as e:
            _LOGGER.exception("Erreur generate_selection: %s", e)

    async def handle_copy_ui(call: ServiceCall):
        _LOGGER.info("[SERVICE] copy_ui_files appelé manuellement")
        await copy_ui_files(hass)
        _LOGGER.info("[SERVICE] ✅ UI copiée avec succès")

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)
    hass.services.async_register(DOMAIN, "copy_ui_files", handle_copy_ui)

    # --- API REST pour capteurs
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON
    scan_sets(hass)

    # --- Auto-génération si activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Copie UI au démarrage
    await copy_ui_files(hass)

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup terminé")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True


@callback
def async_get_options_flow(config_entry: ConfigEntry):
    return HomeSuiviElecOptionsFlow(config_entry)


# -----------------------------------------------------------------------------
# COPIE FICHIERS UI
# -----------------------------------------------------------------------------
async def copy_ui_files(hass: HomeAssistant):
    """Copie les fichiers HTML/JS vers /www/community/home_suivi_elec_ui"""
    src = hass.config.path("custom_components", "home_suivi_elec", "web_static")
    dst = hass.config.path("www", "community", "home_suivi_elec_ui")
    os.makedirs(dst, exist_ok=True)

    # ⚡ Utilisation d'un executor pour os.listdir afin de ne pas bloquer la boucle async
    loop = hass.loop if hasattr(hass, 'loop') else None
    import asyncio
    loop = asyncio.get_running_loop()
    files = await loop.run_in_executor(None, os.listdir, src)

    for f in files:
        src_path = os.path.join(src, f)
        dst_path = os.path.join(dst, f)
        if os.path.isfile(src_path):
            await hass.async_add_executor_job(shutil.copy2, src_path, dst_path)
            _LOGGER.info(f"[UI] Copié : {src_path} → {dst_path}")

    _LOGGER.info("[UI] ✅ Interface copiée avec succès dans /www/community/home_suivi_elec_ui")
