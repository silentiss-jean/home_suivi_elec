# -*- coding: utf-8 -*-
"""Home Suivi Élec — Services + API REST + copie UI simplifiée avec démarrage différé."""

import logging
import os
import shutil
import asyncio
from typing import Any, Dict, List, Optional
from datetime import datetime

from homeassistant.core import HomeAssistant, ServiceCall, callback, EVENT_HOMEASSISTANT_STARTED
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.storage import Store

from .const import DOMAIN, CONF_AUTO_GENERATE
from .detect_local import run_detect_local
from .generator import run_all
from .debug_json_sets import scan_sets
from .options_flow import HomeSuiviElecOptionsFlow
from . import manage_selection
from .utility_meter_manager import sync_utility_meters, get_meter_name, get_integration_helper_name, UTILITY_METER_CYCLES

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

    # --- Services ---
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
                await sync_utility_meters(entity_ids, hass)
                _LOGGER.info("[SERVICE] Utility Meter YAML synchronisé via service.")
        except Exception as e:
            _LOGGER.exception("Erreur handle_generate_selection: %s", e)

    async def handle_copy_ui(call: ServiceCall):
        _LOGGER.info("[SERVICE] copy_ui_files appelé manuellement")
        await copy_ui_files(hass)
        _LOGGER.info("[SERVICE] ✅ UI copiée avec succès")

    async def handle_reset_integration_sensor(call: ServiceCall):
        """Service pour réinitialiser un sensor d'intégration spécifique."""
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
        """Service pour nettoyer tous les sensors aberrants en une fois."""
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

    async def handle_reset_all_utility_meters(call: ServiceCall):
        """Service pour calibrer tous les utility meters aberrants."""
        threshold = call.data.get("threshold_kwh", 1000.0)
        
        try:
            to_reset = []
            for entity_id in hass.states.async_entity_ids("sensor"):
                if not entity_id.startswith("sensor.hse_sensor_"):
                    continue
                if "_monthly" not in entity_id and "_yearly" not in entity_id:
                    continue
                
                state = hass.states.get(entity_id)
                if not state:
                    continue
                
                try:
                    value = float(state.state)
                    if value > threshold:
                        last_valid = state.attributes.get("last_valid_state", 0)
                        to_reset.append({
                            "entity_id": entity_id,
                            "current": value,
                            "new": last_valid
                        })
                except:
                    continue
            
            if not to_reset:
                _LOGGER.info("[RESET_UM] Aucun utility meter aberrant détecté")
                return
            
            _LOGGER.info("[RESET_UM] %d utility meters à calibrer", len(to_reset))
            
            for item in to_reset:
                _LOGGER.info(
                    "[RESET_UM] Calibration de %s : %.2f kWh -> %.2f kWh",
                    item["entity_id"], item["current"], item["new"]
                )
                await hass.services.async_call(
                    "utility_meter",
                    "calibrate",
                    {
                        "entity_id": item["entity_id"],
                        "value": str(item["new"])
                    },
                    blocking=True
                )
            
            _LOGGER.info("[RESET_UM] ✅ %d utility meters calibrés", len(to_reset))
            
        except Exception as e:
            _LOGGER.exception("[RESET_UM] Erreur: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)
    hass.services.async_register(DOMAIN, "copy_ui_files", handle_copy_ui)
    hass.services.async_register(DOMAIN, "reset_integration_sensor", handle_reset_integration_sensor)
    hass.services.async_register(DOMAIN, "migrate_cleanup", handle_migrate_cleanup)
    hass.services.async_register(DOMAIN, "reset_all_utility_meters", handle_reset_all_utility_meters)

    # --- API REST existantes ---
    await manage_selection.async_setup_selection_api(hass)

    # --- API REST: doublons/ignored + best-per-device ---
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
                    if unit == "W":
                        s += 5
                    if info.get("state_class") == "measurement":
                        s += 3
                    if info.get("is_premium"):
                        s += 2
                    if info.get("ui_checked"):
                        s += 1
                    if not info.get("ignored", False):
                        s += 1
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

    class DiagnosticsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_diagnostics"
        name = "api:home_suivi_elec:get_diagnostics"
        requires_auth = False
        cors_allowed = True

        def __init__(self, hass: HomeAssistant) -> None:
            self.hass = hass

        async def get(self, request):
            try:
                loop = asyncio.get_running_loop()
                from .manage_selection import CAPTEURS_SELECTION_PATH, CAPTEURS_POWER_PATH, USER_CONFIG_PATH

                detected = []
                if os.path.exists(CAPTEURS_POWER_PATH):
                    detected = await loop.run_in_executor(None, lambda: self._load_json(CAPTEURS_POWER_PATH))

                selection = {}
                if os.path.exists(CAPTEURS_SELECTION_PATH):
                    selection = await loop.run_in_executor(None, lambda: self._load_json(CAPTEURS_SELECTION_PATH))

                selected_ids = set()
                for integ, lst in (selection or {}).items():
                    for row in lst or []:
                        if row.get("enabled") and row.get("entity_id"):
                            selected_ids.add(row["entity_id"])

                sources = []
                integration_sensors = []
                utility_meters = []
                alerts = []

                for cap in detected or []:
                    eid = cap.get("entity_id")
                    if not eid or eid not in selected_ids:
                        continue

                    state_obj = self.hass.states.get(eid)
                    state_value = state_obj.state if state_obj else "unavailable"
                    last_changed = state_obj.last_changed.isoformat() if state_obj else None

                    status = "✅ OK"
                    data_type = "numérique"
                    action = "-"

                    if state_value in ("unknown", "unavailable"):
                        status = "❌ Indisponible" if state_value == "unavailable" else "⚠️ Unknown"
                        alerts.append({
                            "type": "warning",
                            "entity_id": eid,
                            "message": f"Capteur source {eid} est {state_value}"
                        })
                    else:
                        try:
                            float(state_value)
                        except:
                            status = "⚠️ Non numérique"
                            data_type = "chaîne"
                            action = "Normaliser via template"
                            alerts.append({
                                "type": "error",
                                "entity_id": eid,
                                "message": f"Capteur source {eid} publie une chaîne: '{state_value}'"
                            })

                    sources.append({
                        "entity_id": eid,
                        "friendly_name": cap.get("friendly_name", eid),
                        "state": state_value,
                        "unit": cap.get("unit", "?"),
                        "status": status,
                        "data_type": data_type,
                        "last_changed": last_changed,
                        "action": action
                    })

                    from .utility_meter_manager import _classify_entity
                    kind = _classify_entity(self.hass, eid)

                    if kind == "power":
                        integ_name = get_integration_helper_name(eid)
                        integ_entity_id = f"sensor.{integ_name}"
                        integ_state_obj = self.hass.states.get(integ_entity_id)
                        integ_state = integ_state_obj.state if integ_state_obj else "unavailable"
                        integ_status = "✅ OK"
                        integ_reason = "-"

                        if integ_state in ("unknown", "unavailable"):
                            integ_status = "⚠️ Unknown (attente 2 valeurs)" if integ_state == "unknown" else "❌ Unavailable"
                            if data_type == "chaîne":
                                integ_reason = "Source non numérique"
                            elif state_value in ("unavailable", "unknown"):
                                integ_reason = "Source indisponible"
                            alerts.append({
                                "type": "warning",
                                "entity_id": integ_entity_id,
                                "message": f"Sensor d'intégration {integ_entity_id} est {integ_state}"
                            })

                        integration_sensors.append({
                            "entity_id": integ_entity_id,
                            "source": eid,
                            "state": integ_state,
                            "unit": "kWh",
                            "status": integ_status,
                            "last_changed": integ_state_obj.last_changed.isoformat() if integ_state_obj else None,
                            "reason": integ_reason
                        })

                        for cycle in UTILITY_METER_CYCLES:
                            meter_name = get_meter_name(eid, cycle)
                            meter_entity_id = f"sensor.{meter_name}"
                            meter_state_obj = self.hass.states.get(meter_entity_id)
                            meter_state = meter_state_obj.state if meter_state_obj else "unavailable"
                            meter_status = "✅ OK"

                            if meter_state in ("unknown", "unavailable"):
                                meter_status = "⚠️ Unknown" if meter_state == "unknown" else "❌ Unavailable"
                                alerts.append({
                                    "type": "error",
                                    "entity_id": meter_entity_id,
                                    "message": f"Utility Meter {meter_entity_id} est {meter_state}"
                                })

                            utility_meters.append({
                                "entity_id": meter_entity_id,
                                "cycle": cycle,
                                "source": integ_entity_id,
                                "state": meter_state,
                                "unit": "kWh",
                                "status": meter_status
                            })

                    elif kind == "energy":
                        for cycle in UTILITY_METER_CYCLES:
                            meter_name = get_meter_name(eid, cycle)
                            meter_entity_id = f"sensor.{meter_name}"
                            meter_state_obj = self.hass.states.get(meter_entity_id)
                            meter_state = meter_state_obj.state if meter_state_obj else "unavailable"
                            meter_status = "✅ OK"

                            if meter_state in ("unknown", "unavailable"):
                                meter_status = "⚠️ Unknown" if meter_state == "unknown" else "❌ Unavailable"
                                alerts.append({
                                    "type": "error",
                                    "entity_id": meter_entity_id,
                                    "message": f"Utility Meter {meter_entity_id} est {meter_state}"
                                })

                            utility_meters.append({
                                "entity_id": meter_entity_id,
                                "cycle": cycle,
                                "source": eid,
                                "state": meter_state,
                                "unit": cap.get("unit", "kWh"),
                                "status": meter_status
                            })

                errors = len([a for a in alerts if a["type"] == "error"])
                warnings = len([a for a in alerts if a["type"] == "warning"])

                if errors > 0:
                    global_status = "error"
                elif warnings > 0:
                    global_status = "warning"
                else:
                    global_status = "ok"

                yaml_path = "/config/packages/home_suivi_elec_utility_meter.yaml"
                last_yaml_gen = None
                if os.path.exists(yaml_path):
                    mtime = os.path.getmtime(yaml_path)
                    last_yaml_gen = datetime.fromtimestamp(mtime).isoformat()

                return self.json({
                    "global_status": global_status,
                    "sources": sources,
                    "integration_sensors": integration_sensors,
                    "utility_meters": utility_meters,
                    "alerts": alerts,
                    "last_yaml_generation": last_yaml_gen,
                    "stats": {
                        "sources_ok": len([s for s in sources if s["status"] == "✅ OK"]),
                        "sources_total": len(sources),
                        "integration_sensors_ok": len([s for s in integration_sensors if s["status"] == "✅ OK"]),
                        "integration_sensors_total": len(integration_sensors),
                        "utility_meters_ok": len([m for m in utility_meters if m["status"] == "✅ OK"]),
                        "utility_meters_total": len(utility_meters)
                    }
                })

            except Exception as e:
                _LOGGER.exception("Erreur get_diagnostics: %s", e)
                return self.json({"global_status": "error", "sources": [], "integration_sensors": [], "utility_meters": [], "alerts": []}, status_code=500)

        def _load_json(self, path: str):
            import json
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)

    hass.http.register_view(SetIgnoredEntityView(hass))
    hass.http.register_view(ChooseBestForDeviceView(hass))
    hass.http.register_view(DiagnosticsView(hass))

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
    asyncio.create_task(_delayed_start(hass, entry))

    loop = asyncio.get_running_loop()
    src = hass.config.path("custom_components", "home_suivi_elec", "web_static")
    dst = hass.config.path("www", "community", "home_suivi_elec_ui")
    await loop.run_in_executor(None, lambda: _copy_ui_blocking(src, dst))

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup terminé")
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
