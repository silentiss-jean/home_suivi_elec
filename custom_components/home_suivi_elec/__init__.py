# -*- coding: utf-8 -*-
"""Initialisation de Home Suivi Élec avec ConfigFlow, OptionsFlow, services et panneau."""
import logging
import os
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
    """Setup minimal (sans ConfigEntry)."""
    _LOGGER.info("[SETUP] async_setup called with config keys: %s", list(config.keys()))
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Setup d’une instance Home Suivi Élec via ConfigEntry."""
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

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)

    # --- Scan debug JSON sets
    scan_sets(hass)

    # --- Détection automatique si option activée
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        _LOGGER.info("[SETUP_ENTRY] auto_generate_lovelace is enabled")
        await run_all(hass, hass.data[DOMAIN]["options"])

    # --- Création du dossier panel_static si nécessaire
    panel_dir = os.path.join(os.path.dirname(__file__), "panel_static")
    os.makedirs(panel_dir, exist_ok=True)

    # --- Ajout du panneau Home Suivi Élec
    await async_setup_panel(hass, panel_dir)

    _LOGGER.info("[SETUP_ENTRY] Home Suivi Élec setup complete")
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Déchargement d’une instance."""
    _LOGGER.info("[UNLOAD_ENTRY] Déchargement de Home Suivi Élec")
    return True

# --- Liaison avec OptionsFlow pour que la roue apparaisse
@callback
def async_get_options_flow(config_entry: ConfigEntry):
    _LOGGER.debug("[OPTIONS_FLOW] async_get_options_flow called for entry: %s", config_entry.title)
    return HomeSuiviElecOptionsFlow(config_entry)

# --- Fonction interne pour le panneau
async def async_setup_panel(hass: HomeAssistant, panel_dir: str):
    """Crée le panneau /home_suivi_elec s’il n’existe pas déjà."""
    panel_path = os.path.join(panel_dir, "panel.js")
    if not os.path.exists(panel_path):
        _LOGGER.warning("[PANEL] Fichier panel.js introuvable : %s", panel_path)
        return

    # Enregistre le répertoire complet comme ressource statique
    hass.http.async_register_static_paths(
        [frontend.StaticPathConfig("/home_suivi_elec", panel_dir)]
    )

    # Ajoute le panneau à la sidebar
    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="iframe",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            config={"url": "/home_suivi_elec/panel.js"},
            require_admin=True
        )
        hass.data["home_suivi_elec_panel_registered"] = True
        _LOGGER.info("[PANEL] ✅ Panneau Home Suivi Élec ajouté à la barre latérale")
    else:
        _LOGGER.debug("[PANEL] ⚙️ Panneau déjà enregistré, aucune action.")