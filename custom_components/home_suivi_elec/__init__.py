# -*- coding: utf-8 -*-
"""Home Suivi Élec — Services + API REST + copie UI simplifiée."""

import logging
import os
import shutil
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry
from aiohttp import web

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow

_LOGGER = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# SETUP PRINCIPAL
# -----------------------------------------------------------------------------
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

    # --- API REST pour capteurs
    from . import manage_selection

    async def handle_get_sensors(request):
        try:
            data = await manage_selection.get_sensors(hass)
        except Exception as e:
            data = {"error": str(e)}
        return web.json_response(data)

    hass.http.register_view(
        type(
            "HomeSuiviElecSensorsView",
            (web.View,),
            {
                "name": "home_suivi_elec_sensors",
                "url": "/api/home_suivi_elec/get_sensors",
                "get": handle_get_sensors,
            },
        )
    )

    # --- Scan debug JSON
    scan_sets(hass)

    # --- Auto-génération si activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Copie UI simplifiée
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

    for f in os.listdir(src):
        src_path = os.path.join(src, f)
        dst_path = os.path.join(dst, f)
        if os.path.isfile(src_path):
            await hass.async_add_executor_job(shutil.copy2, src_path, dst_path)
            _LOGGER.info(f"[UI] Copié : {src_path} → {dst_path}")
    _LOGGER.info("[UI] ✅ Interface copiée avec succès dans /www/community/home_suivi_elec_ui")
