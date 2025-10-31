# -*- coding: utf-8 -*-
"""
Home Suivi Élec — Backend principal de l’intégration Home Assistant.

Orchestrateur global : gère initialisation, cycle de vie, enregistrement des services Home Assistant, endpoints REST, configuration du panel UI, synchronisation et maintenance des capteurs énergétiques.
Coordonne les modules backend métiers : détection, sélection, scoring, diagnostics, tracking, backup.
Toutes les clés métier et hass.data transitent par ce module central.
"""


import logging
import os
import shutil
import asyncio
import json
from typing import Any, Dict, List, Optional
from datetime import datetime

from homeassistant.core import HomeAssistant, ServiceCall, callback, EVENT_HOMEASSISTANT_STARTED
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.storage import Store
from homeassistant.components import frontend

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow
from . import manage_selection
#from .utility_meter_manager import sync_utility_meters, get_meter_name, get_integration_helper_name, UTILITY_METER_CYCLES
from .proxy_api import SuiviElecProxyView
# ✅ AJOUT : Import du correcteur automatique de noms
from .sensor_name_fixer import async_setup_sensor_name_fixer, async_fix_all_long_sensors
from .manage_selection_views import HSESensorsPublicView
# ✅ AJOUT : Import enregistrement vues additionnelles (registry, diagnostic_groups, ping)
from .api_extra_views import async_register_extra_views


_LOGGER = logging.getLogger(__name__)

USER_STORE_KEY = f"{DOMAIN}_user_config_v1"


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    _LOGGER.info("[SETUP] async_setup appelé")
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    _LOGGER.info("[SETUP_ENTRY] Initialisation Home Suivi Élec")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["config"] = dict(entry.data)
    hass.data[DOMAIN]["options"] = dict(entry.options or {})

    # Correcteur noms
    try:
        await async_setup_sensor_name_fixer(hass)
        _LOGGER.info("✅ Correcteur automatique de noms activé")
    except Exception as e:
        _LOGGER.error(f"❌ Erreur activation correcteur de noms: {e}")
    
    if not hass.services.has_service(DOMAIN, "fix_sensor_names"):
        async def handle_fix_sensor_names(call):
            try:
                fixed = await async_fix_all_long_sensors(hass)
                _LOGGER.info(f"✅ Service fix_sensor_names : {fixed} sensors corrigés")
            except Exception as e:
                _LOGGER.error(f"❌ Erreur service fix_sensor_names: {e}")
        hass.services.async_register(DOMAIN, "fix_sensor_names", handle_fix_sensor_names)
        _LOGGER.info("📋 Service 'fix_sensor_names' enregistré")

    # PANEL
    async def register_panel_when_ready(*args):
        await asyncio.sleep(3)
        try:
            frontend.async_register_built_in_panel(
                hass,
                component_name="iframe",
                sidebar_title="⚡ Suivi Élec",
                sidebar_icon="mdi:lightning-bolt",
                frontend_url_path="home-suivi-elec",
                config={"url": "/local/community/home_suivi_elec_ui/index.html"},
                require_admin=False,
            )
            _LOGGER.info("✅ Panel Home Suivi Élec enregistré")
        except Exception as e:
            _LOGGER.error("❌ Erreur enregistrement panel: %s", e)
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, register_panel_when_ready)

    # Services
    async def handle_generate_local_data(call: ServiceCall):
        try:
            await run_detect_local(hass=hass, entry=entry)
        except Exception as e:
            _LOGGER.exception("Erreur generate_local_data: %s", e)
    async def handle_generate_lovelace_auto(call: ServiceCall):
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
        except Exception as e:
            _LOGGER.exception("Erreur generate_lovelace_auto: %s", e)
    async def handle_generate_selection(call: ServiceCall):
        try:
            from .manage_selection import CAPTEURS_SELECTION_PATH, load_json
            loop = asyncio.get_running_loop()
            if os.path.exists(CAPTEURS_SELECTION_PATH):
                selection = await loop.run_in_executor(None, lambda: load_json(CAPTEURS_SELECTION_PATH))
                def extract_ids(selection_dict):
                    ids = set()
                    for lst in selection_dict.values():
                        ids.update([c.get("entity_id") for c in lst if c.get("enabled")])
                    return ids
                entity_ids = extract_ids(selection)
                _LOGGER.info("[SERVICE] Utility Meter YAML synchronisé via service.")
        except Exception as e:
            _LOGGER.exception("Erreur handle_generate_selection: %s", e)
    async def handle_copy_ui(call: ServiceCall):
        _LOGGER.info("[SERVICE] copy_ui_files appelé manuellement")
        await copy_ui_files(hass)
        _LOGGER.info("[SERVICE] ✅ UI copiée avec succès")
    async def handle_reset_integration_sensor(call: ServiceCall):
        entity_id = call.data.get("entity_id")
        threshold = call.data.get("threshold_kwh", 1000.0)
        if not entity_id:
            _LOGGER.error("[RESET] entity_id requis")
            return
        if not entity_id.startswith("sensor.hse_energy_"):
            _LOGGER.error("[RESET] entity_id doit commencer par sensor.hse_energy_")
            return
        try:
            from .migration_cleanup import migrate_cleanup_integration_sensors
            _LOGGER.info("[RESET] Nettoyage de %s (seuil: %.2f kWh)", entity_id, threshold)
            count = await migrate_cleanup_integration_sensors(hass, threshold_kwh=threshold)
            if count > 0:
                _LOGGER.info("[RESET] %d sensor(s) nettoyé(s)", count)
                await hass.config_entries.async_reload(entry.entry_id)
                _LOGGER.info("[RESET] ✅ Sensors réinitialisés avec succès")
            else:
                _LOGGER.warning("[RESET] Aucun sensor nettoyé (valeurs en dessous du seuil)")
        except Exception as e:
            _LOGGER.exception("[RESET] Erreur lors du reset: %s", e)
    async def handle_migrate_cleanup(call: ServiceCall):
        threshold = call.data.get("threshold_kwh", 1000.0)
        try:
            from .migration_cleanup import migrate_cleanup_integration_sensors
            _LOGGER.info("[MIGRATION] Lancement nettoyage automatique (seuil: %.2f kWh)", threshold)
            count = await migrate_cleanup_integration_sensors(hass, threshold_kwh=threshold)
            if count > 0:
                _LOGGER.info("[MIGRATION] %d sensor(s) nettoyé(s)", count)
                await hass.config_entries.async_reload(entry.entry_id)
                _LOGGER.info("[MIGRATION] ✅ Migration terminée avec succès")
            else:
                _LOGGER.info("[MIGRATION] Aucun sensor aberrant détecté")
        except Exception as e:
            _LOGGER.exception("[MIGRATION] Erreur lors de la migration: %s", e)
            _LOGGER.exception("[RESET_UM] Erreur: %s", e)
    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)
    hass.services.async_register(DOMAIN, "copy_ui_files", handle_copy_ui)
    hass.services.async_register(DOMAIN, "reset_integration_sensor", handle_reset_integration_sensor)
    hass.services.async_register(DOMAIN, "migrate_cleanup", handle_migrate_cleanup)

    # APIs existantes
    await manage_selection.async_setup_selection_api(hass)

    # Vues REST locales
    store = Store(hass, 1, USER_STORE_KEY)

    class SetIgnoredEntityView(HomeAssistantView):
        url = "/api/home_suivi_elec/set_ignored_entity"
        name = "api:home_suivi_elec:set_ignored_entity"
        requires_auth = False
        cors_allowed = True
        def __init__(self, hass: HomeAssistant) -> None:
            self.hass = hass
            self.store = store
        async def post(self, request):
            try:
                data = await request.json()
                entity_id = (data or {}).get("entity_id")
                ignore = bool((data or {}).get("ignore"))
                if not entity_id:
                    return self.json({"success": False, "error": "entity_id missing"}, status_code=400)
                cfg: Dict[str, Any] = await self.store.async_load() or {}
                ignored: List[str] = list({*(cfg.get("ignored_entities") or [])})
                s = set(ignored)
                if ignore:
                    s.add(entity_id)
                else:
                    s.discard(entity_id)
                cfg["ignored_entities"] = sorted(s)
                await self.store.async_save(cfg)
                return self.json({"success": True, "ignored_entities": cfg["ignored_entities"]})
            except Exception as e:
                _LOGGER.exception("set_ignored_entity error: %s", e)
                return self.json({"success": False, "error": "internal"}, status_code=500)

    class ChooseBestForDeviceView(HomeAssistantView):
        url = "/api/home_suivi_elec/choose_best_for_device"
        name = "api:home_suivi_elec:choose_best_for_device"
        requires_auth = False
        cors_allowed = True
        def __init__(self, hass: HomeAssistant) -> None:
            self.hass = hass
            self.store = store
        async def post(self, request):
            try:
                data = await request.json()
                device_id = (data or {}).get("device_id")
                if not device_id:
                    return self.json({"success": False, "error": "device_id missing"}, status_code=400)
                idx: Dict[str, Dict[str, Any]] = {}
                try:
                    idx = await manage_selection.async_get_capteurs_index(self.hass)
                except Exception:
                    idx = (self.hass.data.get(DOMAIN) or {}).get("capteurs_index") or {}
                members = [eid for eid, info in (idx or {}).items() if (info or {}).get("device_id") == device_id]
                if not members:
                    return self.json({"success": True, "best": None, "ignored": []})
                if len(members) == 1:
                    return self.json({"success": True, "best": members[0], "ignored": []})
                def score(info: Dict[str, Any]) -> int:
                    s = 0
                    unit = info.get("unit_of_measurement") or info.get("unit")
                    if unit == "W": s += 5
                    if info.get("state_class") == "measurement": s += 3
                    if info.get("is_premium"): s += 2
                    if info.get("ui_checked"): s += 1
                    if not info.get("ignored", False): s += 1
                    return s
                best: Optional[str] = None
                best_s = -999
                for eid in members:
                    info = (idx or {}).get(eid) or {}
                    sc = score(info)
                    if sc > best_s:
                        best = eid
                        best_s = sc
                cfg: Dict[str, Any] = await self.store.async_load() or {}
                ignored: List[str] = list({*(cfg.get("ignored_entities") or [])})
                s = set(ignored)
                for eid in members:
                    if eid != best:
                        s.add(eid)
                cfg["ignored_entities"] = sorted(s)
                await self.store.async_save(cfg)
                others = [eid for eid in members if eid != best]
                return self.json({"success": True, "best": best, "ignored": others})
            except Exception as e:
                _LOGGER.exception("choose_best_for_device error: %s", e)
                return self.json({"success": False, "error": "internal"}, status_code=500)

    from .manage_selection_views import (
        AutoSelectBestSensorsView,
        GetSensorQualityScoresView
    )
    
    hass.http.register_view(SetIgnoredEntityView(hass))
    hass.http.register_view(ChooseBestForDeviceView(hass))
    hass.http.register_view(SuiviElecProxyView())
    hass.http.register_view(AutoSelectBestSensorsView(hass))
    hass.http.register_view(GetSensorQualityScoresView(hass))
    hass.http.register_view(HSESensorsPublicView(hass))

    # ✅ Enregistrer nos vues additionnelles (registry, diagnostic_groups, ping)
    try:
        await async_register_extra_views(hass)
        _LOGGER.info("✅ Vues additionnelles enregistrées (registry, diagnostic_groups, ping)")
    except Exception as e:
        _LOGGER.error("❌ Enregistrement vues additionnelles: %s", e)

    try:
        await scan_sets(hass)
    except TypeError:
        scan_sets(hass)

    if hass.data[DOMAIN]["options"].get(CONF_AUTO_GENERATE, True):
        await run_all(hass, hass.data[DOMAIN]["options"])

    async def start_detection_selection(*args):
        _LOGGER.info("[INIT] Lancement détection et génération selection")
        try:
            await run_detect_local(hass=hass, entry=entry)
        except Exception as e:
            _LOGGER.exception("Erreur init detection/selection: %s", e)
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, start_detection_selection)

    async def setup_sensors_after_detection():
        _LOGGER.info("[INIT] Attente démarrage HA pour détection...")
        event = asyncio.Event()
        @callback
        def on_started(event_data):
            event.set()
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, on_started)
        await event.wait()
        await asyncio.sleep(5)
        _LOGGER.info("[INIT] Lancement détection avec tous les states disponibles")
        try:
            await run_detect_local(hass=hass, entry=entry)
            _LOGGER.info("[INIT] ✅ Détection terminée")
        except Exception as e:
            _LOGGER.exception("Erreur détection: %s", e)
            return
        _LOGGER.info("[INIT] Setup energy tracking...")
        try:
            await async_setup_energy_tracking(hass, entry)
        except Exception as e:
            _LOGGER.exception("Erreur energy tracking: %s", e)
        _LOGGER.info("[INIT] Setup power monitoring...")
        try:
            from .power_monitoring import async_setup_power_monitoring
            await async_setup_power_monitoring(hass, entry)
        except Exception as e:
            _LOGGER.exception("Erreur power monitoring: %s", e)
        _LOGGER.info("[INIT] Setup sensor sync manager...")
        try:
            from .sensor_sync_manager import SensorSyncManager
            sync_manager = SensorSyncManager(hass)
            hass.data[DOMAIN]["sync_manager"] = sync_manager
            await sync_manager.start()
            _LOGGER.info("[INIT] ✅ Sensor Sync Manager démarré")
            await manage_selection.async_setup_selection_api(hass, sync_manager)
        except Exception as e:
            _LOGGER.exception("Erreur sensor sync manager: %s", e)
    
    asyncio.create_task(setup_sensors_after_detection())
    asyncio.create_task(_delayed_start(hass, entry))

    loop = asyncio.get_running_loop()
    src = hass.config.path("custom_components", "home_suivi_elec", "web_static")
    dst = hass.config.path("www", "community", "home_suivi_elec_ui")
    await loop.run_in_executor(None, lambda: _copy_ui_blocking(src, dst))

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup terminé (sensors seront chargés après détection)")
    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])
    _LOGGER.info("[SETUP_ENTRY] 🚀 Plateforme sensor chargée")
    return True

async def _delayed_start(hass: HomeAssistant, entry: ConfigEntry, timeout: int = 60):
    await asyncio.sleep(timeout)
    _LOGGER.info(f"[INIT] Timeout atteint ({timeout}s), lancement fallback detection/selection")
    try:
        await run_detect_local(hass=hass, entry=entry)
    except Exception as e:
        _LOGGER.exception("Erreur fallback detection/selection: %s", e)


def _copy_ui_blocking(src, dst):
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

async def copy_ui_files(hass: HomeAssistant):
    loop = asyncio.get_running_loop()
    src = hass.config.path("custom_components", "home_suivi_elec", "web_static")
    dst = hass.config.path("www", "community", "home_suivi_elec_ui")
    await loop.run_in_executor(None, lambda: _copy_ui_blocking(src, dst))

@callback
def async_get_options_flow(config_entry: ConfigEntry):
    return HomeSuiviElecOptionsFlow(config_entry)

# ============================================================================
# ENERGY TRACKING - Phase 2 (support energy vs power + propagation fiabilité)
# ============================================================================

async def load_capteurs_selection(hass: HomeAssistant) -> list[dict]:
    import json
    from pathlib import Path
    selection_file = Path(__file__).parent / "data" / "capteurs_selection.json"
    def _load_file():
        try:
            if not selection_file.exists():
                _LOGGER.warning(f"⚠️ Fichier introuvable: {selection_file}")
                return []
            with open(selection_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            capteurs = []
            for category, items in data.items():
                if not isinstance(items, list):
                    continue
                for sensor in items:
                    if not sensor.get("enabled", False):
                        continue
                    entity_id = sensor.get("entity_id")
                    if not entity_id:
                        continue
                    sensor_type = sensor.get("type")
                    if not sensor_type:
                        unit = sensor.get("unit", "").lower()
                        if unit in ("kwh", "wh"):
                            sensor_type = "energy"
                        elif unit in ("w", "watt", "watts"):
                            sensor_type = "power"
                        else:
                            sensor_type = "power"
                    capteurs.append({
                        "entity_id": entity_id,
                        "type": sensor_type,
                        "is_virtual": sensor.get("is_virtual", False),
                        "reliability_score": sensor.get("reliability_score", 1.0),
                        "reference_type": sensor.get("reference_type", "unknown"),
                        "tags": sensor.get("tags", []),
                    })
            return capteurs
        except Exception as e:
            _LOGGER.error(f"❌ Erreur chargement capteurs_selection.json: {e}")
            return []
    result = await hass.async_add_executor_job(_load_file)
    _LOGGER.info(f"📊 {len(result)} capteurs chargés depuis {selection_file.name}")
    return result

async def async_setup_energy_tracking(hass: HomeAssistant, entry: ConfigEntry):
    from .energy_tracking import create_energy_sensors
    _LOGGER.info("🔋 [PHASE 2] Configuration Energy Tracking...")
    capteurs_selection = await load_capteurs_selection(hass)
    if not capteurs_selection:
        _LOGGER.info("ℹ️ Aucun capteur sélectionné, skip energy tracking")
        return
    _LOGGER.info(f"📊 {len(capteurs_selection)} capteurs à tracker")
    energy_sensors = await create_energy_sensors(hass, capteurs_selection)
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}
    hass.data[DOMAIN]["energy_sensors"] = energy_sensors
    _LOGGER.info(f"✅ {len(energy_sensors)} sensors d'énergie créés")
    energy_count = sum(1 for s in energy_sensors if s.extra_state_attributes.get('source_type') == 'energy')
    power_count = sum(1 for s in energy_sensors if s.extra_state_attributes.get('source_type') == 'power')
    virtual_count = sum(1 for s in energy_sensors if s.extra_state_attributes.get('is_virtual', False))
    _LOGGER.info(f"📈 Répartition: {energy_count} energy (delta), {power_count} power (intégration), {virtual_count} virtuels")
