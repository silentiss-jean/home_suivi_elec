# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec panneau HTML IFRAME + services + API REST."""
import logging
import os
import shutil
from functools import partial
import asyncio
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import frontend

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
            _LOGGER.info("[SERVICE] ✅ generate_local_data terminé avec succès")
        except Exception as e:
            _LOGGER.exception("[SERVICE] ❌ Erreur: %s", e)

    async def handle_generate_lovelace_auto(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_lovelace_auto called")
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
            _LOGGER.info("[SERVICE] ✅ generate_lovelace_auto terminé avec succès")
        except Exception as e:
            _LOGGER.exception("[SERVICE] ❌ Erreur: %s", e)

    async def handle_generate_selection(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_selection called")
        from . import manage_selection
        try:
            await manage_selection.run_generate_selection(hass)
            _LOGGER.info("[SERVICE] ✅ generate_selection terminé avec succès")
        except Exception as e:
            _LOGGER.exception("[SERVICE] ❌ Erreur: %s", e)

    # Enregistrement
    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)

    # --- API REST sélection capteurs
    from . import manage_selection
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON
    scan_sets(hass)

    # --- Auto génération si activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] Auto-génération Lovelace activée")
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Panneau HTML
    await async_setup_panel(hass)

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup complet terminé")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de Home Suivi Élec")
    return True


@callback
def async_get_options_flow(config_entry: ConfigEntry):
    _LOGGER.debug("[OPTIONS_FLOW] async_get_options_flow pour entry: %s", config_entry.title)
    return HomeSuiviElecOptionsFlow(config_entry)


# -----------------------------------------------------------------------------
# SETUP PANEL (HTML IFRAME)
# -----------------------------------------------------------------------------

async def async_setup_panel(hass: HomeAssistant):
    """Copie le panel HTML/JS et l'ajoute comme panneau latéral."""
    panel_src = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst, exist_ok=True)

    # Copie des fichiers via async executor pour éviter le blocking call
    for filename in ("panel.html", "panel.js"):
        src = os.path.join(panel_src, filename)
        dst = os.path.join(panel_dst, filename)
        if os.path.exists(src):
            await hass.async_add_executor_job(shutil.copy2, src, dst)
            _LOGGER.info(f"[PANEL] Copié : {src} → {dst}")
        else:
            _LOGGER.warning(f"[PANEL] Fichier manquant : {src}")

    # Supprimer un éventuel ancien panneau
    try:
        await hass.components.frontend.async_remove_panel("home_suivi_elec")
    except Exception:
        pass

    # Enregistrement compatible HA 2025.x
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
        _LOGGER.info("[PANEL] ✅ Panneau enregistré correctement.")
    
    frontend.async_register_built_in_panel(
        hass,
        component_name="custom",
        sidebar_title="Test Panel",
        sidebar_icon="mdi:flash",
        frontend_url_path="home_suivi_elec_test",
        require_admin=True,
        config={
            "url": "/local/community/home_suivi_elec_panel/test_panel.html",
            "embed_iframe": True,
            "trust_external": True,
        },
    )