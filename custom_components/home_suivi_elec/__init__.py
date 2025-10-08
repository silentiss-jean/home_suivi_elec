# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec (services + REST + panel HTML avec token)."""
import logging
import os
import shutil
from functools import partial
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.config_entries import ConfigEntry
from homeassistant.components import frontend

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
    """Initialisation de l’intégration Home Suivi Élec."""
    _LOGGER.info("[SETUP_ENTRY] Initialisation de Home Suivi Élec : %s", entry.data)

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Import dynamique pour éviter les cycles ---
    from . import manage_selection

    # -----------------------------------------------------------------------
    # Services
    # -----------------------------------------------------------------------
    async def handle_generate_local_data(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_local_data appelé")
        try:
            await run_detect_local(hass, entry)
            _LOGGER.info("[SERVICE] ✅ generate_local_data terminé avec succès")
        except Exception as e:
            _LOGGER.exception("[SERVICE] ❌ Erreur generate_local_data : %s", e)

    async def handle_generate_lovelace_auto(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_lovelace_auto appelé")
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
            _LOGGER.info("[SERVICE] ✅ generate_lovelace_auto terminé")
        except Exception as e:
            _LOGGER.exception("[SERVICE] ❌ Erreur generate_lovelace_auto : %s", e)

    async def handle_generate_selection(call: ServiceCall):
        _LOGGER.info("[SERVICE] generate_selection appelé")
        try:
            await manage_selection.run_generate_selection(hass)
            _LOGGER.info("[SERVICE] ✅ generate_selection terminé avec succès")
        except Exception as e:
            _LOGGER.exception("[SERVICE] ❌ Erreur generate_selection : %s", e)

    # --- Enregistrement des services ---
    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)

    _LOGGER.info("[SETUP_ENTRY] ✅ Services enregistrés")

    # -----------------------------------------------------------------------
    # Setup REST API (capteurs)
    # -----------------------------------------------------------------------
    await manage_selection.async_setup_selection_api(hass)

    # -----------------------------------------------------------------------
    # Scan debug JSON sets
    # -----------------------------------------------------------------------
    scan_sets(hass)

    # -----------------------------------------------------------------------
    # Auto-génération si activée
    # -----------------------------------------------------------------------
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] Option auto_generate activée")
        await run_all(hass, hass.data[DOMAIN]["options"])

    # -----------------------------------------------------------------------
    # Panneau HTML (REST + token)
    # -----------------------------------------------------------------------
    await async_setup_panel(hass)

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup complet")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de Home Suivi Élec")
    return True


@callback
def async_get_options_flow(config_entry: ConfigEntry):
    _LOGGER.debug("[OPTIONS_FLOW] async_get_options_flow appelé pour : %s", config_entry.title)
    return HomeSuiviElecOptionsFlow(config_entry)


# ---------------------------------------------------------------------------
# SETUP PANEL (HTML REST + TOKEN, via IFRAME)
# ---------------------------------------------------------------------------

async def async_setup_panel(hass: HomeAssistant):
    """Copie le panel HTML et JS dans /www/community/ et enregistre le panneau."""
    panel_src_dir = hass.config.path("custom_components", "home_suivi_elec", "panel_static")
    panel_dst_dir = hass.config.path("www", "community", "home_suivi_elec_panel")
    os.makedirs(panel_dst_dir, exist_ok=True)

    for filename in ("panel.html", "panel.js"):
        src = os.path.join(panel_src_dir, filename)
        dst = os.path.join(panel_dst_dir, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            _LOGGER.info("[PANEL] Copié : %s → %s", src, dst)
        else:
            _LOGGER.warning("[PANEL] Fichier manquant : %s", src)

    # Supprime ancien panneau iframe si présent
    try:
        await hass.components.frontend.async_remove_panel("suivi_elec")
        _LOGGER.info("[PANEL] Ancien panneau supprimé si présent.")
    except Exception:
        pass

    # Enregistre le panneau
    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="iframe",  # ✅ REST + token nécessite iframe
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            config={
                "url": "/local/community/home_suivi_elec_panel/panel.html"
            },
            require_admin=True,
        )
        hass.data["home_suivi_elec_panel_registered"] = True
        _LOGGER.info("[PANEL] ✅ Panneau Suivi Élec (REST+token, iframe) ajouté à la sidebar.")
    else:
        _LOGGER.debug("[PANEL] ⚙️ Panneau déjà enregistré, aucune action.")