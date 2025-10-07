# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec ConfigFlow, OptionsFlow, services et panneau HTML + WS."""
import logging
import os
import shutil
from functools import partial
import asyncio
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import frontend, websocket_api

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow

_LOGGER = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SETUP PRINCIPAL
# ---------------------------------------------------------------------------

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    _LOGGER.info("[SETUP] async_setup called with config keys: %s", list(config.keys()))
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
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

    async def handle_generate_selection(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_selection called")
        from . import manage_selection
        try:
            await manage_selection.run_generate_selection(hass)
            _LOGGER.info("[SERVICE] generate_selection finished successfully")
        except Exception as e:
            _LOGGER.exception("[SERVICE] Error in generate_selection: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)

    # --- Setup API sélection (REST optionnel)
    from . import manage_selection
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON sets
    scan_sets(hass)

    # --- Auto-génération si option activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] auto_generate_lovelace is enabled")
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Setup panneau HTML
    await async_setup_panel(hass)

    # --- WebSocket commands
    @websocket_api.async_response
    async def ws_get_sensors(hass, connection, msg):
        data = await manage_selection.async_get_sensors(hass)
        connection.send_result(msg["id"], data)

    @websocket_api.async_response
    async def ws_save_selection(hass, connection, msg):
        selection = msg.get("selection")
        await manage_selection.async_save_selection(hass, selection)
        connection.send_result(msg["id"], {"success": True})

    hass.components.websocket_api.async_register_command(
        "home_suivi_elec/get_sensors", ws_get_sensors
    )
    hass.components.websocket_api.async_register_command(
        "home_suivi_elec/save_selection", ws_save_selection
    )

    _LOGGER.info("[SETUP_ENTRY] Home Suivi Élec setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de Home Suivi Élec")
    return True


@callback
def async_get_options_flow(config_entry: ConfigEntry):
    _LOGGER.debug("[OPTIONS_FLOW] async_get_options_flow called for entry: %s", config_entry.title)
    return HomeSuiviElecOptionsFlow(config_entry)


# ---------------------------------------------------------------------------
# SETUP PANEL (SANS IFRAME)
# ---------------------------------------------------------------------------

async def async_setup_panel(hass: HomeAssistant):
    """Copie le panel HTML dans www et l'ajoute à la sidebar de HA (sans iframe)."""
    panel_src_dir = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst_dir = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst_dir, exist_ok=True)

    for filename in ("panel_option1.html",):
        src = os.path.join(panel_src_dir, filename)
        dst = os.path.join(panel_dst_dir, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            _LOGGER.info("[PANEL] Copied %s → %s", src, dst)
        else:
            _LOGGER.warning("[PANEL] Missing file: %s", src)

    # 🔹 Supprimer tout ancien panneau iframe
    try:
        await hass.components.frontend.async_remove_panel("suivi_elec")
        _LOGGER.info("[PANEL] Ancien panneau 'iframe' supprimé si présent.")
    except Exception as e:
        _LOGGER.debug("[PANEL] Aucun ancien panneau iframe à supprimer (%s)", e)

    # 🔹 Enregistrer un panneau frontend natif (non iframe)
    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="custom",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            require_admin=True,
            frontend_url_path="home_suivi_elec",
            config={
                "_panel_custom": {
                    "name": "home_suivi_elec_panel",
                    "embed_iframe": False,
                    "html_url": "/local/community/home_suivi_elec_panel/panel_option1.html",
                    "trust_external": True,
                }
            },
        )
        hass.data["home_suivi_elec_panel_registered"] = True
        _LOGGER.info("[PANEL] ✅ Panneau HTML Home Suivi Élec (non-iframe) ajouté à la barre latérale.")
    else:
        _LOGGER.debug("[PANEL] ⚙️ Panneau déjà enregistré, aucune action.")