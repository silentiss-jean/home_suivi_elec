# -*- coding: utf-8 -*-
"""
Home Suivi Élec — Backend principal de l'intégration Home Assistant.

Orchestrateur global : gère initialisation, cycle de vie, enregistrement des services Home Assistant, endpoints REST, configuration du panel UI, synchronisation et maintenance des capteurs énergétiques.
Coordonne les modules backend métiers : détection, sélection, scoring, diagnostics, tracking, backup.
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
from .utility_meter_manager import sync_utility_meters
from .proxy_api import SuiviElecProxyView
# ✅ AJOUT : Import du correcteur automatique de noms
from .sensor_name_fixer import async_setup_sensor_name_fixer, async_fix_all_long_sensors
from .manage_selection_views import HSESensorsPublicView

_LOGGER = logging.getLogger(__name__)

USER_STORE_KEY = f"{DOMAIN}_user_config_v1"

# ============================================================================
# VUES ADDITIONNELLES INLINE (évite imports manquants)
# ============================================================================

class PingView(HomeAssistantView):
    """Test simple pour vérifier que nos vues sont bien enregistrées."""
    url = "/api/home_suivi_elec/ping"
    name = "api:home_suivi_elec:ping"
    requires_auth = False
    cors_allowed = True

    async def get(self, request):
        return self.json({
            "success": True,
            "message": "Home Suivi Elec API is working",
            "timestamp": "2025-10-31T10:40:00Z"
        })

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """
    Setup minimal pour initialisation Home Suivi Élec.
    Initialise le log et prépare l'environnement Home Assistant pour une future configuration.
    Retourne True si l'environnement est prêt.
    """
    _LOGGER.info("[SETUP] async_setup appelé")
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """
    Point d'entrée principal du backend Home Suivi Élec lors de l'ajout ou du reload de l'intégration.

    - Initialise tous les modules critiques backend (dictionnaires hass.data, correcteur de noms, panel UI).
    - Enregistre tous les services Home Assistant (détection auto, sélection, génération Lovelace, maintenance...).
    - Déploie toutes les API REST pour accès frontend, selection, diagnostics, et actions personnalisées.
    - Orchestration complète du setup différé et fallback si certains modules ou states ne sont pas encore disponibles.
    - Débute la synchronisation et l'enregistrement des sensors (énergie + power live).
    Retourne True si tout le setup est réussi.
    """
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
        """
        Service Home Assistant : `generate_local_data`
        Déclenche une détection automatique complète des capteurs d'énergie/power intégrés dans Home Assistant.
        Appelle la fonction run_detect_local, met à jour hass.data, et expose les nouveaux capteurs en backend.
        Journalise les erreurs et exceptions durant la détection.
        """
        try:
            await run_detect_local(hass=hass, entry=entry)
        except Exception as e:
            _LOGGER.exception("Erreur generate_local_data: %s", e)

    async def handle_generate_lovelace_auto(call: ServiceCall):
        """
        Service Home Assistant : `generate_lovelace_auto`
        Génère et expose automatiquement le dashboard Lovelace en utilisant la configuration backend (options métier).
        Appelle run_all pour créer la config Lovelace/YAML adaptée à la sélection de capteurs.
        """
        try:
            await run_all(hass, hass.data[DOMAIN]["options"])
        except Exception as e:
            _LOGGER.exception("Erreur generate_lovelace_auto: %s", e)

    async def handle_generate_selection(call: ServiceCall):
        """
        Service Home Assistant : `generate_selection`
        Génère le mapping des capteurs sélectionnés pour synchronisation Utility Meter (YAML).
        Appelle manage_selection, extrait IDs actifs, journalise le résultat et toute exception.
        """
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
                
                # ✅ NOUVEAU : Synchronisation utility_meter
                user_config = hass.data[DOMAIN].get("config", {})
                await sync_utility_meters(entity_ids, hass, user_config)
                await hass.services.async_call("homeassistant", "reload_core_config")
                
                _LOGGER.info("[SERVICE] Utility Meter YAML synchronisé via service.")
        except Exception as e:
            _LOGGER.exception("Erreur handle_generate_selection: %s", e)

    async def handle_copy_ui(call: ServiceCall):
        """
        Service Home Assistant : `copy_ui_files`
        Copie manuellement tous les fichiers UI statiques dans le répertoire Home Assistant pour assurer l'accès panel.
        Journalise les actions et erreurs d'IO.
        """
        _LOGGER.info("[SERVICE] copy_ui_files appelé manuellement")
        await copy_ui_files(hass)
        _LOGGER.info("[SERVICE] ✅ UI copiée avec succès")

    async def handle_reset_integration_sensor(call: ServiceCall):
        """
        Service Home Assistant : `reset_integration_sensor`
        Réinitialise un capteur d'intégration selon son entity_id, supprime les valeurs aberrantes ou historiques trop élevées.
        Utilise migration_cleanup, recharge la config si besoin, journalise tout le cycle.
        """
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
        """
        Service Home Assistant : `migrate_cleanup`
        Nettoie tous les capteurs aberrants en une action globale, typiquement lors de migrations ou maintenance automatisée.
        Appelle migration_cleanup sur la base d'un seuil kWh configurable, recharge la configuration, journalise les résultats.
        """
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

    # ✅ NOUVEAU : Service pour nettoyer les anciens sensors custom HSE
    async def handle_cleanup_custom_sensors(call: ServiceCall):
        """
        Service Home Assistant : `cleanup_custom_sensors`
        Supprime tous les anciens sensors custom HSE (sensor.hse_*) pour migration vers utility_meter.
        """
        try:
            from .migrate_cleanup_custom_hse import migrate_cleanup_custom_hse_sensors
            
            _LOGGER.info("[CLEANUP] Lancement suppression sensors custom HSE")
            await migrate_cleanup_custom_hse_sensors(hass)
            _LOGGER.info("[CLEANUP] ✅ Nettoyage terminé")
                
        except Exception as e:
            _LOGGER.exception("[CLEANUP] Erreur lors du nettoyage: %s", e)

    hass.services.async_register(DOMAIN, "generate_local_data", handle_generate_local_data)
    hass.services.async_register(DOMAIN, "generate_lovelace_auto", handle_generate_lovelace_auto)
    hass.services.async_register(DOMAIN, "generate_selection", handle_generate_selection)
    hass.services.async_register(DOMAIN, "copy_ui_files", handle_copy_ui)
    hass.services.async_register(DOMAIN, "reset_integration_sensor", handle_reset_integration_sensor)
    hass.services.async_register(DOMAIN, "migrate_cleanup", handle_migrate_cleanup)
    hass.services.async_register(DOMAIN, "cleanup_custom_sensors", handle_cleanup_custom_sensors)
    
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
            """
            Diagnostic natif HSE (remplace UtilityMeter) :
            Liste tous les capteurs HSE activés, affiche leur état, statut, et remonte alertes/anomalies.
            Structure complète alignée sur manage_selection_views.py
            """
            try:
                from .manage_selection_views import _load_json, CAPTEURS_POWER_PATH, _enrich_device_info
                import os
                import asyncio

                loop = asyncio.get_running_loop()
                sensors = []
                if os.path.exists(CAPTEURS_POWER_PATH):
                    sensors = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH))
                    sensors = _enrich_device_info(self.hass, sensors or [])

                sources = []
                alerts = []
                dump_sensors = []

                for sensor in sensors:
                    eid = sensor.get("entity_id")
                    friendly = sensor.get("friendly_name", eid)
                    state_obj = self.hass.states.get(eid)
                    state = state_obj.state if state_obj else "unavailable"
                    unit = sensor.get("unit", "?")
                    last_changed = state_obj.last_changed.isoformat() if state_obj else None

                    # Détection et codage du statut
                    status = "✅ OK"
                    data_type = "numérique"
                    action = "-"
                    anomaly = None

                    if state in ("unknown", "unavailable"):
                        status = "❌ Indisponible" if state == "unavailable" else "⚠️ Unknown"
                        anomaly = status
                        alerts.append({
                            "type": "warning",
                            "entity_id": eid,
                            "message": f"Capteur {eid} est {state}"
                        })
                    else:
                        try:
                            float(state)
                        except Exception:
                            status = "⚠️ Non numérique"
                            data_type = "chaîne"
                            action = "Normaliser via template"
                            anomaly = status
                            alerts.append({
                                "type": "error",
                                "entity_id": eid,
                                "message": f"Capteur {eid} publie une chaîne: '{state}'"
                            })

                    sources.append({
                        "entity_id": eid,
                        "friendly_name": friendly,
                        "state": state,
                        "unit": unit,
                        "status": status,
                        "data_type": data_type,
                        "last_changed": last_changed,
                        "action": action
                    })
                    dump_sensors.append({
                        "entity_id": eid,
                        "nom": friendly,
                        "zone": sensor.get("zone"),
                        "type": sensor.get("type"),
                        "integration": sensor.get("integration"),
                        "enabled": sensor.get("enabled", True),
                        "anomaly": anomaly
                    })

                errors = len([a for a in alerts if a["type"] == "error"])
                warnings = len([a for a in alerts if a["type"] == "warning"])
                global_status = "error" if errors > 0 else "warning" if warnings > 0 else "ok"

                dump_global = {
                    "total_detected": len(sensors),
                    "total_enabled": len([s for s in dump_sensors if s["enabled"]]),
                    "total_non_enabled": len([s for s in dump_sensors if not s["enabled"]]),
                    "sensors": dump_sensors
                }

                # Retour complet de diagnostic natif
                return self.json({
                    "sources": sources,
                    "alerts": alerts,
                    "global_status": global_status,
                    "dump": dump_global
                })
            except Exception as e:
                _LOGGER.exception("Erreur get_diagnostics: %s", e)
                return self.json({"error": str(e)}, status_code=500)
    
    # ✅ NOUVELLES VUES INLINE (évite imports manquants)
    class EntityNameRegistryView(HomeAssistantView):
        """GET /api/home_suivi_elec/entity_name_registry - Registry nom court → nom complet"""
        url = "/api/home_suivi_elec/entity_name_registry"
        name = "api:home_suivi_elec:entity_name_registry"
        requires_auth = False
        cors_allowed = True

        def __init__(self, hass: HomeAssistant) -> None:
            self.hass = hass

        async def get(self, request):
            try:
                from pathlib import Path
                # Simuler registry basic (sera remplacé plus tard par le vrai module)
                return self.json({
                    "success": True,
                    "mappings": {},  # Vide pour l'instant, sera populé avec EntityNameRegistry
                    "stats": {"total": 0, "version": "1.0", "created": "2025-10-31T10:40:00Z"},
                })
            except Exception as e:
                _LOGGER.exception("[ENTITY-NAME-REGISTRY] GET failed: %s", e)
                return self.json({"success": False, "error": str(e)}, status_code=500)

    class DiagnosticGroupsView(HomeAssistantView):
        """GET /api/home_suivi_elec/diagnostic_groups - Regroupement parent→enfants + orphelins"""
        url = "/api/home_suivi_elec/diagnostic_groups"
        name = "api:home_suivi_elec:diagnostic_groups"
        requires_auth = False
        cors_allowed = True

        def __init__(self, hass: HomeAssistant) -> None:
            self.hass = hass

        async def get(self, request):
            try:
                states = self.hass.states.async_all("sensor")
                parents: List[Dict[str, Any]] = []
                children_by_parent: Dict[str, List[Dict[str, Any]]] = {}
                orphans: List[Dict[str, Any]] = []

                def is_parent(eid: str) -> bool:
                    # Parent : sensor.hse_live_* SANS suffixe cycle (_h, _d, _w, _m, _y)
                    if not eid.startswith("sensor.hse_live_"):
                        return False
                    # Vérifier que ça ne finit PAS par _X où X = h|d|w|m|y
                    return not (eid.endswith("_h") or eid.endswith("_d") or eid.endswith("_w") or eid.endswith("_m") or eid.endswith("_y"))

                def parent_key_from_child(eid: str) -> str | None:
                    # ✅ SIMPLIFIÉ: Plus de shortening = correspondance directe
                    if not eid.startswith("sensor.hse"):
                        return None
                    if not (eid.endswith("_h") or eid.endswith("_d") or eid.endswith("_w") or eid.endswith("_m") or eid.endswith("_y")):
                        return None
                    
                    # Parent = enfant SANS suffixe cycle
                    parent_expected = eid[:-2]  # Supprimer _h, _d, etc.
                    
                    # Recherche directe (plus besoin de reverse mapping!)
                    if parent_expected in children_by_parent:
                        return parent_expected
                    
                    return None  # ✅ Plus de fallback compliqué !

                # Index parents
                for s in states:
                    eid = s.entity_id
                    if is_parent(eid):
                        parents.append({
                            "entity_id": eid,
                            "state": s.state,
                            "friendly_name": s.attributes.get("friendly_name", eid),
                        })
                        children_by_parent[eid] = []

                # Associer enfants
                for s in states:
                    eid = s.entity_id
                    if eid.startswith("sensor.hse_") and (eid.endswith("_h") or eid.endswith("_d") or eid.endswith("_w") or eid.endswith("_m") or eid.endswith("_y")):
                        p = parent_key_from_child(eid)
                        if p and p in children_by_parent:
                            children_by_parent[p].append({
                                "entity_id": eid,
                                "state": s.state,
                                "friendly_name": s.attributes.get("friendly_name", eid),
                            })
                        else:
                            orphans.append({
                                "entity_id": eid,
                                "state": s.state,
                                "friendly_name": s.attributes.get("friendly_name", eid),
                            })

                stats = {
                    "parents": len(parents),
                    "children": sum(len(v) for v in children_by_parent.values()),
                    "orphans": len(orphans),
                }

                return self.json({
                    "success": True,
                    "parents": parents,
                    "children_by_parent": children_by_parent,
                    "orphans": orphans,
                    "stats": stats,
                })
            except Exception as e:
                _LOGGER.exception("diagnostic_groups error: %s", e)
                return self.json({"success": False, "error": str(e)}, status_code=500)

    # Import des vues de manage_selection_views
    from .manage_selection_views import (
        AutoSelectBestSensorsView,
        GetSensorQualityScoresView
    )
    
    hass.http.register_view(SetIgnoredEntityView(hass))
    hass.http.register_view(ChooseBestForDeviceView(hass))
    hass.http.register_view(DiagnosticsView(hass))
    hass.http.register_view(SuiviElecProxyView())
    hass.http.register_view(AutoSelectBestSensorsView(hass))
    hass.http.register_view(GetSensorQualityScoresView(hass))
    hass.http.register_view(HSESensorsPublicView(hass))

    # ✅ Enregistrer nos vues additionnelles INLINE
    _LOGGER.info("🔗 [API] Enregistrement des vues additionnelles...")
    try:
        hass.http.register_view(PingView())
        _LOGGER.info("✅ [API] PingView enregistrée: /api/home_suivi_elec/ping")
    except Exception as e:
        _LOGGER.error("❌ [API] Erreur PingView: %s", e)
    
    try:
        hass.http.register_view(EntityNameRegistryView(hass))
        _LOGGER.info("✅ [API] EntityNameRegistryView enregistrée: /api/home_suivi_elec/entity_name_registry")
    except Exception as e:
        _LOGGER.error("❌ [API] Erreur EntityNameRegistryView: %s", e)
    
    try:
        hass.http.register_view(DiagnosticGroupsView(hass))
        _LOGGER.info("✅ [API] DiagnosticGroupsView enregistrée: /api/home_suivi_elec/diagnostic_groups")
    except Exception as e:
        _LOGGER.error("❌ [API] Erreur DiagnosticGroupsView: %s", e)
    
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
        
        # ✅ NOUVEAU : Synchronisation utility_meter après détection
        _LOGGER.info("[INIT] Synchronisation utility_meter...")
        try:
            selection = await manage_selection.async_get_capteurs_index(hass)
            # Sélection sous forme dict entity_id → infos dict
            selected_ids = [eid for eid, d in (selection or {}).items() if d and not d.get("ignored", False)]
            user_config = hass.data[DOMAIN].get("config", {})
            
            await sync_utility_meters(selected_ids, hass, user_config)
            await hass.services.async_call("homeassistant", "reload_core_config")
            
            _LOGGER.info(f"✅ Génération utility_meter automatique pour {len(selected_ids)} capteurs")
        except Exception as e:
            _LOGGER.error(f"❌ Erreur fallback utility_meter: {e}")
        
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
    """
    import json
    from pathlib import Path

    selection_file = Path(__file__).parent / "data" / "capteurs_selection.json"

    def _load_file():
        try:
            if not selection_file.exists():
                _LOGGER.warning(f"⚠️ Fichier introuvable: {selection_file}")
                return []

            # 1. Charger capteurs_selection.json (sélection utilisateur)
            with open(selection_file, "r", encoding="utf-8") as f:
                selection_data = json.load(f)

            # 2. Charger capteurs_power.json (métadonnées complètes)
            power_file = Path(__file__).parent / "data" / "capteurs_power.json"
            if not power_file.exists():
                _LOGGER.warning(f"⚠️ Fichier power introuvable: {power_file}")
                return []
                
            with open(power_file, "r", encoding="utf-8") as f:
                power_data = json.load(f)

            # 3. Créer index power_data par entity_id pour fusion rapide
            power_index = {s["entity_id"]: s for s in power_data}

            capteurs = []
            # 4. Parcourir toutes les catégories
            for category, items in selection_data.items():
                if not isinstance(items, list):
                    continue

                for sensor in items:
                    # Vérifier que le capteur est activé
                    if not sensor.get("enabled", False):
                        continue

                    entity_id = sensor.get("entity_id")
                    if not entity_id:
                        continue

                    # ✅ FUSION: Récupérer métadonnées complètes depuis capteurs_power.json
                    if entity_id in power_index:
                        # Fusion complète des métadonnées
                        merged_sensor = power_index[entity_id].copy()
                        merged_sensor["enabled"] = sensor["enabled"]
                        capteurs.append(merged_sensor)
                        _LOGGER.debug(f"✅ [FUSION] {entity_id} → type: {merged_sensor.get('type', 'unknown')}")
                    else:
                        _LOGGER.warning(f"⚠️ [SKIP] {entity_id} absent de capteurs_power.json")

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
    
    # ✅ DEBUG CRITIQUE
    _LOGGER.info(f"🔍 [DEBUG] capteurs_selection: {len(capteurs_selection)} capteurs")
    if capteurs_selection:
        _LOGGER.debug(f"🔍 [DEBUG] Premier capteur: {capteurs_selection[0]}")

    if not capteurs_selection:
        _LOGGER.info("ℹ️ Aucun capteur sélectionné, skip energy tracking")
        return

    _LOGGER.info(f"📊 {len(capteurs_selection)} capteurs à tracker")

    # ✅ CRÉER les sensors avec protection d'erreur ET debug
    try:
        _LOGGER.info("🔋 [DEBUG] Appel create_energy_sensors...")
        energy_sensors = await create_energy_sensors(hass, capteurs_selection)
        _LOGGER.info(f"🔋 [DEBUG] Retour create_energy_sensors: {len(energy_sensors or [])}")
        
    except Exception as e:
        _LOGGER.exception(f"❌ [ENERGY-TRACKING] Erreur création sensors: {e}")
        energy_sensors = []

    # ✅ PROTECTION None
    if energy_sensors is None:
        _LOGGER.error("❌ create_energy_sensors a retourné None")
        energy_sensors = []

    # ✅ VÉRIFIER résultat
    if not energy_sensors:
        _LOGGER.warning("⚠️ Aucun sensor d'énergie créé")
        return

    _LOGGER.info(f"✅ {len(energy_sensors)} sensors d'énergie créés")

    # Stocker dans hass.data
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    hass.data[DOMAIN]["energy_sensors"] = energy_sensors
    _LOGGER.info(f"💾 [DEBUG] Stocké {len(energy_sensors)} sensors dans hass.data")

    # ✅ PROTECTION pour stats
    try:
        # Stats détaillées
        energy_count = sum(
            1 for s in energy_sensors 
            if hasattr(s, 'extra_state_attributes') and s.extra_state_attributes.get('source_type') == 'energy'
        )
        power_count = sum(
            1 for s in energy_sensors 
            if hasattr(s, 'extra_state_attributes') and s.extra_state_attributes.get('source_type') == 'power'
        )

        virtual_count = sum(
            1 for s in energy_sensors 
            if hasattr(s, 'extra_state_attributes') and s.extra_state_attributes.get('is_virtual', False)
        )

        _LOGGER.info(
            f"📈 Répartition: "
            f"{energy_count} energy (delta), "
            f"{power_count} power (intégration), "
            f"{virtual_count} virtuels"
        )
        
    except Exception as e:
        _LOGGER.exception(f"❌ Erreur calcul stats: {e}")
    
    _LOGGER.info("🔋 [PHASE 2] Energy Tracking configuré avec succès")
