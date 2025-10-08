# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec panneau HTML IFRAME + services + API REST."""
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

    # --- API REST
    from . import manage_selection
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON
    scan_sets(hass)

    # --- Auto-génération
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Panel HTML
    await async_setup_panel(hass)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    return True

@callback
def async_get_options_flow(config_entry: ConfigEntry):
    return HomeSuiviElecOptionsFlow(config_entry)

async def async_setup_panel(hass: HomeAssistant):
    """Copie panel HTML/JS et enregistre panneau latéral IFRAME."""
    panel_src = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst, exist_ok=True)

    for filename in ("panel.html", "panel.js"):
        src = os.path.join(panel_src, filename)
        dst = os.path.join(panel_dst, filename)
        if os.path.exists(src):
            await hass.async_add_executor_job(shutil.copy2, src, dst)

    try:
        await hass.components.frontend.async_remove_panel("home_suivi_elec")
    except Exception:
        pass

    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            frontend_url_path="home_suivi_elec",
            require_admin=True,
            config={
                "url": "/local/community/home_suivi_elec_panel/panel.html",
                "embed_iframe": True,
                "trust_external": True,
            },
        )
        hass.data["home_suivi_elec_panel_registered"] = True
