# -*- coding: utf-8 -*-
"""Home Suivi Élec — Services + API REST + copie UI simplifiée avec démarrage différé."""

import logging
import os
import shutil
import asyncio
from homeassistant.core import HomeAssistant, ServiceCall, callback, EVENT_HOMEASSISTANT_STARTED
from homeassistant.config_entries import ConfigEntry
from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow
from . import manage_selection  # pour les API REST et generate_selection

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    _LOGGER.info("[SETUP] async_setup appelé")
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[SETUP_ENTRY] Initialisation Home Suivi Élec")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # --- Services ---
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
            await manage_selection.generate_selection(hass)
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

    # --- API REST pour capteurs ---
    await manage_selection.async_setup_selection_api(hass)

    # --- Scan debug JSON ---
    scan_sets(hass)

    # --- Auto-génération si activée ---
    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    async def start_detection_selection(*args):
        _LOGGER.info("[INIT] Lancement détection et génération selection")
        try:
            await run_detect_local(hass, entry)
            await manage_selection.generate_selection(hass)
        except Exception as e:
            _LOGGER.exception("Erreur init detection/selection: %s", e)

    # --- Attente de HA démarré ou timeout 60s ---
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, start_detection_selection)
    asyncio.create_task(_delayed_start(hass, entry))

    # --- Copie UI au démarrage sans bloquer le loop ---
    loop = asyncio.get_running_loop()
    src = hass.config.path("custom_components", "home_suivi_elec", "web_static")
    dst = hass.config.path("www", "community", "home_suivi_elec_ui")
    await loop.run_in_executor(None, lambda: _copy_ui_blocking(src, dst))

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup terminé")
    return True

async def _delayed_start(hass: HomeAssistant, entry: ConfigEntry, timeout: int = 60):
    """Démarrage différé au cas où EVENT_HOMEASSISTANT_STARTED n'arrive pas."""
    await asyncio.sleep(timeout)
    _LOGGER.info(f"[INIT] Timeout atteint ({timeout}s), lancement fallback detection/selection")
    try:
        await run_detect_local(hass, entry)
        await manage_selection.generate_selection(hass)
    except Exception as e:
        _LOGGER.exception("Erreur fallback detection/selection: %s", e)

def _copy_ui_blocking(src, dst):
    """Copie récursive de l'UI (web_static → www/community/home_suivi_elec_ui)."""
    if not os.path.exists(src):
        _LOGGER.warning(f"[COPY_UI] Dossier source introuvable: {src}")
        return

    os.makedirs(dst, exist_ok=True)

    for root, dirs, files in os.walk(src):
        rel_path = os.path.relpath(root, src)
        target_dir = os.path.join(dst, rel_path)
        os.makedirs(target_dir, exist_ok=True)

        for file in files:
            src_file = os.path.join(root, file)
            dst_file = os.path.join(target_dir, file)
            shutil.copy2(src_file, dst_file)
            _LOGGER.debug(f"[COPY_UI] Copié: {src_file} → {dst_file}")

@callback
def async_get_options_flow(config_entry: ConfigEntry):
    return HomeSuiviElecOptionsFlow(config_entry)