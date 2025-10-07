# -*- coding: utf-8 -*-
import logging
import os
import shutil
from homeassistant.core import HomeAssistant, ConfigEntry, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import frontend

from .const import DOMAIN, CONF_AUTO_GENERATE
from .generator import run_all
from .detect_local import run_detect_local
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow
from . import manage_selection

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Services
    async def handle_generate_local_data(call):
        await run_detect_local(hass, entry)

    async def handle_generate_lovelace_auto(call):
        await run_all(hass, hass.data[DOMAIN]["options"])

    async def handle_generate_selection(call):
        await manage_selection.run_generate_selection(hass)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)

    # --- Setup API REST
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON sets
    scan_sets(hass)

    # --- Auto-génération si activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Setup panel HTML
    await async_setup_panel(hass)
    return True


async def async_setup_panel(hass: HomeAssistant):
    """Copie le panel HTML et l’enregistre en panel_custom."""
    panel_src_dir = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst_dir = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst_dir, exist_ok=True)

    src = os.path.join(panel_src_dir, "panel_option1.html")
    dst = os.path.join(panel_dst_dir, "panel_option1.html")
    if os.path.exists(src):
        shutil.copy2(src, dst)

    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="panel_custom",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            frontend_url_path="home_suivi_elec",
            require_admin=True,
            config={
                "_panel_custom": {
                    "name": "home_suivi_elec_panel",
                    "html_url": "/local/community/home_suivi_elec_panel/panel_option1.html",
                    "embed_iframe": False,
                    "trust_external": True,
                }
            },
        )
        hass.data["home_suivi_elec_panel_registered"] = True