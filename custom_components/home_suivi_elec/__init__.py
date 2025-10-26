
# -*- coding: utf-8 -*-
"""Home Suivi Élec — Services + API REST + copie UI simplifiée avec démarrage différé."""

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

    # ========================================
    # 🎯 AJOUT : Correcteur automatique de noms
    # ========================================
    try:
        await async_setup_sensor_name_fixer(hass)
        _LOGGER.info("✅ Correcteur automatique de noms activé")
    except Exception as e:
        _LOGGER.error(f"❌ Erreur activation correcteur de noms: {e}")
    
    # 🔧 Service manuel pour forcer la correction
    if not hass.services.has_service(DOMAIN, "fix_sensor_names"):
        async def handle_fix_sensor_names(call):
            """Service pour forcer la correction des noms."""
            try:
                fixed = await async_fix_all_long_sensors(hass)
                _LOGGER.info(f"✅ Service fix_sensor_names : {fixed} sensors corrigés")
            except Exception as e:
                _LOGGER.error(f"❌ Erreur service fix_sensor_names: {e}")
        
        hass.services.async_register(
            DOMAIN,
            "fix_sensor_names",
            handle_fix_sensor_names
        )
        _LOGGER.info("📋 Service 'fix_sensor_names' enregistré")
    # ========================================

    # === PANEL HOME ASSISTANT ===
    async def register_panel_when_ready(*args):
        """Enregistre le panel dans la sidebar après démarrage HA."""
        await asyncio.sleep(3)  # Attendre que frontend soit prêt
        try:
            frontend.async_register_built_in_panel(
                hass,
                component_name="iframe",
                sidebar_title="⚡ Suivi Élec",
                sidebar_icon="mdi:lightning-bolt",
                frontend_url_path="home-suivi-elec",
                config={
                    "url": "/local/community/home_suivi_elec_ui/index.html"
                },
                require_admin=False,
            )
            _LOGGER.info("✅ Panel Home Suivi Élec enregistré")
        except Exception as e:
            _LOGGER.error("❌ Erreur enregistrement panel: %s", e)

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, register_panel_when_ready)

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
#                await sync_utility_meters(entity_ids, hass)
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

            _LOGGER.exception("[RESET_UM] Erreur: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)
    hass.services.async_register(DOMAIN, "copy_ui_files", handle_copy_ui)
    hass.services.async_register(DOMAIN, "reset_integration_sensor", handle_reset_integration_sensor)
    hass.services.async_register(DOMAIN, "migrate_cleanup", handle_migrate_cleanup)
#    hass.services.async_register(DOMAIN, "reset_all_utility_meters", handle_reset_all_utility_meters)

    # --- API REST existantes (sans sync_manager pour l'instant) ---
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

                # === DUMP GLOBAL BACKEND : résumé de TOUS les capteurs (actifs ou non) ===
                all_detected = detected
                selection_data = selection

                dump_sensors = []
                for sensor in all_detected or []:
                    eid = sensor.get("entity_id")
                    dump_sensors.append({
                        "entity_id": eid,
                        "nom": sensor.get("friendly_name", sensor.get("nom", eid)),
                        "zone": sensor.get("zone"),
                        "type": sensor.get("type"),
                        "integration": sensor.get("integration"),
                        "enabled": eid in selected_ids,
                        "anomaly": None
                    })

                dump_global = {
                    "total_detected": len(all_detected),
                    "total_selected": len(selected_ids),
                    "total_non_selected": len([x for x in dump_sensors if not x["enabled"]]),
                    "sensors": dump_sensors
                }
                
#                _LOGGER.warning(">>>> DUMP TEST: entrée diagnostic backend")
#                _LOGGER.warning("[DUMP BACKEND]\n%s", json.dumps(dump_global, indent=2, ensure_ascii=False))
                _LOGGER.warning("[DUMP BACKEND] %s", dump_global)
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
                    },
                    "global_dump": dump_global
                })

            except Exception as e:
                _LOGGER.exception("Erreur get_diagnostics: %s", e)
                return self.json({
                    "global_status": "error",
                    "sources": [],
                    "integration_sensors": [],
                    "utility_meters": [],
                    "alerts": [],
                    "global_dump": {"error": str(e)}
                }, status_code=500)

        def _load_json(self, path: str):
            import json
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)

    hass.http.register_view(SetIgnoredEntityView(hass))
    hass.http.register_view(ChooseBestForDeviceView(hass))
    hass.http.register_view(DiagnosticsView(hass))
    hass.http.register_view(SuiviElecProxyView())

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
    
    # ✅ NOUVEAU : Fonction de setup différé
    async def setup_sensors_after_detection():
        """Setup sensors après que la détection soit terminée."""
        _LOGGER.info("[INIT] Attente démarrage HA pour détection...")
        
        # Attendre que HA soit démarré
        event = asyncio.Event()
        
        @callback
        def on_started(event_data):
            event.set()
        
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, on_started)
        await event.wait()
        
        # Attendre encore 5 secondes pour que tous les states soient chargés
        await asyncio.sleep(5)
        
        _LOGGER.info("[INIT] Lancement détection avec tous les states disponibles")
        try:
            await run_detect_local(hass=hass, entry=entry)
            _LOGGER.info("[INIT] ✅ Détection terminée")
        except Exception as e:
            _LOGGER.exception("Erreur détection: %s", e)
            return
        
        # Setup energy tracking Phase 2
        _LOGGER.info("[INIT] Setup energy tracking...")
        try:
            await async_setup_energy_tracking(hass, entry)
        except Exception as e:
            _LOGGER.exception("Erreur energy tracking: %s", e)
        
        # PHASE 2.5: Power Monitoring (temps réel W)
        _LOGGER.info("[INIT] Setup power monitoring...")
        try:
            from .power_monitoring import async_setup_power_monitoring
            await async_setup_power_monitoring(hass, entry)
        except Exception as e:
            _LOGGER.exception("Erreur power monitoring: %s", e)
        
        # ✅ PHASE 2.6: Sensor Sync Manager (synchronisation automatique)
        _LOGGER.info("[INIT] Setup sensor sync manager...")
        try:
            from .sensor_sync_manager import SensorSyncManager
            sync_manager = SensorSyncManager(hass)
            hass.data[DOMAIN]["sync_manager"] = sync_manager
            
            # Démarrer la synchronisation
            await sync_manager.start()
            _LOGGER.info("[INIT] ✅ Sensor Sync Manager démarré")
            
            # Enregistrer les APIs REST de sync
            await manage_selection.async_setup_selection_api(hass, sync_manager)
            
        except Exception as e:
            _LOGGER.exception("Erreur sensor sync manager: %s", e)
        
        # Enregistrer les sensors manuellement via entity platform
        if "energy_sensors" in hass.data.get(DOMAIN, {}):
            energy_sensors = hass.data[DOMAIN]["energy_sensors"]
            live_sensors = hass.data[DOMAIN].get("live_power_sensors", [])
            all_sensors = energy_sensors + live_sensors
            
            if all_sensors:
                _LOGGER.info(f"[INIT] 📊 Enregistrement direct de {len(all_sensors)} sensors")
                
                # Importer async_add_entities
                from homeassistant.helpers import entity_platform
                
                # Récupérer la plateforme sensor
                platform = entity_platform.async_get_platforms(hass, DOMAIN)
                sensor_platform = None
                for p in platform:
                    if p.domain == "sensor":
                        sensor_platform = p
                        break
                
                if sensor_platform:
                    await sensor_platform.async_add_entities(all_sensors, True)
                    _LOGGER.info(f"[INIT] ✅ {len(all_sensors)} sensors enregistrés avec succès")
                else:
                    _LOGGER.error("[INIT] ❌ Plateforme sensor introuvable")

    
# Lancer la tâche en arrière-plan
    asyncio.create_task(setup_sensors_after_detection())
    
    asyncio.create_task(_delayed_start(hass, entry))

    loop = asyncio.get_running_loop()
    src = hass.config.path("custom_components", "home_suivi_elec", "web_static")
    dst = hass.config.path("www", "community", "home_suivi_elec_ui")
    await loop.run_in_executor(None, lambda: _copy_ui_blocking(src, dst))

    _LOGGER.info("[SETUP_ENTRY] ✅ Home Suivi Élec setup terminé (sensors seront chargés après détection)")
    
    # ✅ Charger la plateforme sensor pour enregistrer les sensors HSE
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
    """
    Charge les capteurs sélectionnés depuis capteurs_selection.json.

    Phase 2 : Métadonnées enrichies (is_virtual, reliability_score, tags)

    Returns:
        Liste des capteurs avec métadonnées:
        [
            {
                "entity_id": "sensor.xxx",
                "type": "energy" | "power",
                "is_virtual": bool,
                "reliability_score": float,
                "reference_type": str,
                "tags": list[str]
            }
        ]
    """
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

            # Parcourir toutes les catégories
            for category, items in data.items():
                if not isinstance(items, list):
                    continue

                for sensor in items:
                    # Vérifier que le capteur est activé
                    if not sensor.get("enabled", False):
                        continue

                    entity_id = sensor.get("entity_id")
                    if not entity_id:
                        continue

                    # Déterminer le type (energy ou power)
                    sensor_type = sensor.get("type")
                    if not sensor_type:
                        # Fallback: détecter via unit
                        unit = sensor.get("unit", "").lower()
                        if unit in ("kwh", "wh"):
                            sensor_type = "energy"
                        elif unit in ("w", "watt", "watts"):
                            sensor_type = "power"
                        else:
                            # Default: power (plus sûr pour intégration)
                            sensor_type = "power"
                            _LOGGER.debug(
                                f"Type non détecté pour {entity_id}, "
                                f"défini par défaut: power"
                            )

                    # Extraire métadonnées Phase 2
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

    # Exécuter I/O dans thread séparé
    result = await hass.async_add_executor_job(_load_file)
    _LOGGER.info(f"📊 {len(result)} capteurs chargés depuis {selection_file.name}")
    return result


async def async_setup_energy_tracking(hass: HomeAssistant, entry: ConfigEntry):
    """
    Configure le tracking d'énergie (Phase 2).

    Détection automatique:
    - type = "energy" → CumulativeEnergyCycleSensor (delta tracking)
    - type = "power" → PowerEnergyCycleSensor (intégration trapézoïdale)

    Cycles: hourly, daily, weekly, monthly, yearly
    Propagation: is_virtual, reliability_score, reference_type, tags
    """
    from .energy_tracking import create_energy_sensors

    _LOGGER.info("🔋 [PHASE 2] Configuration Energy Tracking...")

    # Charger capteurs sélectionnés avec métadonnées
    capteurs_selection = await load_capteurs_selection(hass)

    if not capteurs_selection:
        _LOGGER.info("ℹ️ Aucun capteur sélectionné, skip energy tracking")
        return

    _LOGGER.info(f"📊 {len(capteurs_selection)} capteurs à tracker")

    # Créer sensors (5 cycles × N capteurs)
    energy_sensors = await create_energy_sensors(hass, capteurs_selection)

    # Stocker dans hass.data
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    hass.data[DOMAIN]["energy_sensors"] = energy_sensors

    _LOGGER.info(f"✅ {len(energy_sensors)} sensors d'énergie créés")

    # Stats détaillées
    energy_count = sum(
        1 for s in energy_sensors 
        if s.extra_state_attributes.get('source_type') == 'energy'
    )
    power_count = sum(
        1 for s in energy_sensors 
        if s.extra_state_attributes.get('source_type') == 'power'
    )

    virtual_count = sum(
        1 for s in energy_sensors 
        if s.extra_state_attributes.get('is_virtual', False)
    )

    _LOGGER.info(
        f"📈 Répartition: "
        f"{energy_count} energy (delta), "
        f"{power_count} power (intégration), "
        f"{virtual_count} virtuels"
    )
