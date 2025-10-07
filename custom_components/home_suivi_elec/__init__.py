# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec ConfigFlow, OptionsFlow, services et panneau HTML."""
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
    _LOGGER.info("[SETUP] async_setup called with config keys: %s", list(config.keys()))
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[SETUP_ENTRY] Initialisation de Home Suivi Élec, entry data: %s", entry.data)

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Services existants
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

    # --- Nouveau service generate_selection
    async def handle_generate_selection(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_selection called")
        from . import manage_selection
        try:
            await manage_selection.run_generate_selection(hass)
            _LOGGER.info("[SERVICE] generate_selection finished successfully")
        except Exception as e:
            _LOGGER.exception("[SERVICE] Error in generate_selection: %s", e)

    # Enregistrement des services
    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)

    # --- Setup API sélection
    from . import manage_selection
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON sets
    scan_sets(hass)

    # --- Auto-génération si option activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] auto_generate_lovelace is enabled")
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Setup du panneau HTML
    await async_setup_panel(hass)

    _LOGGER.info("[SETUP_ENTRY] Home Suivi Élec setup complete")
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de Home Suivi Élec")
    return True

@callback
def async_get_options_flow(config_entry: ConfigEntry):
    _LOGGER.debug("[OPTIONS_FLOW] async_get_options_flow called for entry: %s", config_entry.title)
    return HomeSuiviElecOptionsFlow(config_entry)

# --- Fonction interne pour le panneau HTML
async def async_setup_panel(hass: HomeAssistant):
    panel_src_dir = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst_dir = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst_dir, exist_ok=True)

    for filename in ("panel.html", "panel.js"):
        src = os.path.join(panel_src_dir, filename)
        dst = os.path.join(panel_dst_dir, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            _LOGGER.info("[PANEL] Copied %s → %s", src, dst)
        else:
            _LOGGER.warning("[PANEL] Missing file: %s", src)

    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="iframe",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            config={"url": "/local/community/home_suivi_elec_panel/panel.html"},
            require_admin=True
        )
        hass.data["home_suivi_elec_panel_registered"] = True
        _LOGGER.info("[PANEL] ✅ Panneau HTML Home Suivi Élec ajouté à la barre latérale")
    else:
        _LOGGER.debug("[PANEL] ⚙️ Panneau déjà enregistré, aucune action.")
