# -*- coding: utf-8 -*-
"""
Vues REST (HTTP) pour Home Suivi Élec — isolées du métier.
Conserve les comportements existants et la validation par device_id.
✅ CORRIGÉ : Support natif des sensors HSE energy (sensor.hse_*_today_energy_{cycle})
"""

import os
import json
import logging
import asyncio
from typing import Any, Dict, List, Set, Optional, Tuple

from homeassistant.core import HomeAssistant
from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.storage import Store

from .manage_selection import (
    CAPTEURS_POWER_PATH, CAPTEURS_SELECTION_PATH, USER_CONFIG_PATH,
)
from .const import (
    DOMAIN, DEFAULTS,
    CONF_PRIX_HT, CONF_PRIX_TTC,
    CONF_PRIX_HT_HP, CONF_PRIX_TTC_HP,
    CONF_PRIX_HT_HC, CONF_PRIX_TTC_HC,
    CONF_HC_START, CONF_HC_END,
    CONF_ABONNEMENT_MENSUEL_HT, CONF_ABONNEMENT_MENSUEL_TTC
)

_LOGGER = logging.getLogger(__name__)

USER_STORE_KEY = f"{DOMAIN}_user_config_v1"


def _normalize(v: Optional[str]) -> str:
    return (v or "").strip().lower()

def _compute_signature(c: Dict[str, Any]) -> str:
    name = _normalize(c.get("friendly_name") or c.get("nom"))
    area = _normalize(c.get("area") or c.get("zone"))
    return f"{name}|{area}"

def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_json(path: str, data: Any) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def _load_quality_map_sync(hass: HomeAssistant) -> Dict[str, str]:
    yaml_path = os.path.join(os.path.dirname(__file__), "data", "integration_quality.yaml")
    if not os.path.exists(yaml_path):
        return {}
    try:
        import yaml as _yaml
    except Exception:
        return {}
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = _yaml.safe_load(f) or {}
        return {str(k): str(v) for k, v in data.items()}

def _is_premium(scale: str) -> bool:
    return scale in ("platinum", "gold")

def _enrich_base(c: Dict[str, Any], quality_map: Dict[str, str], reference_id: Optional[str]) -> Dict[str, Any]:
    c = dict(c)
    integ = c.get("integration")
    if "quality_scale" not in c:
        q = quality_map.get(integ, "custom")
        c["quality_scale"] = q
        c["is_premium"] = _is_premium(q)
    c["is_reference"] = (c.get("entity_id") == reference_id)
    return c

def _enrich_device_info(hass: HomeAssistant, caps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    from homeassistant.helpers import entity_registry as er, device_registry as dr, area_registry as ar
    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    area_reg = ar.async_get(hass)

    for c in caps:
        eid = c.get("entity_id")
        if not eid:
            continue
        entry = ent_reg.async_get(eid)
        if not entry:
            continue

        c["device_id"] = entry.device_id
        c["area_id"] = entry.area_id
                             
        dev = dev_reg.async_get(entry.device_id) if entry.device_id else None
        if dev:
            if not c.get("area_id"):
                c["area_id"] = dev.area_id
            c["device_identifiers"] = list(dev.identifiers) if dev.identifiers else []
            c["device_connections"] = list(dev.connections) if dev.connections else []
            c["device_name"] = dev.name_by_user or dev.name or ""
            c["manufacturer"] = dev.manufacturer or ""
            c["model"] = dev.model or ""

            if c.get("area_id"):
                area = area_reg.async_get_area(c["area_id"])
                if area:
                    c["area_name"] = area.name
    return caps

# ✅ CORRECTION CHIRURGICALE : Alignement parfait avec energy_tracking.py
def _build_hse_energy_sensor_id(source_entity_id: str, cycle: str) -> str:
    """
    ✅ ALIGNEMENT COMPLET avec energy_tracking.py
    
    Logique identique à energy_tracking.py lignes 183-189 :
    - today_energy → sensor.hse_{base_name}_{cycle}
    - autres → sensor.hse_energy_{base_name}_{cycle}
    - Noms complets préservés (plus de shortening)
    - Cycles complets (hourly, daily, etc.)
    """
    base_name = source_entity_id.replace("sensor.", "")
    
    # ✅ MÊME logique exacte que energy_tracking.py
    if "today_energy" in source_entity_id:
        return f"sensor.hse_{base_name}_{cycle}"
    else:
        return f"sensor.hse_energy_{base_name}_{cycle}"


class GetSensorsView(HomeAssistantView):
    url = "/api/home_suivi_elec/get_sensors"
    name = "api:home_suivi_elec:get_sensors"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            loop = asyncio.get_running_loop()

            data = []
            if os.path.exists(CAPTEURS_POWER_PATH):
                data = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH))

            selection_data = {}
            if os.path.exists(CAPTEURS_SELECTION_PATH):
                selection_data = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_SELECTION_PATH))

            reference_id = None
            if os.path.exists(USER_CONFIG_PATH):
                user_config = await loop.run_in_executor(None, lambda: _load_json(USER_CONFIG_PATH))
                reference_id = (user_config or {}).get("externalCapteur")

            quality_map = await loop.run_in_executor(None, lambda: _load_quality_map_sync(self.hass))
            data = _enrich_device_info(self.hass, data or [])

            enabled_ids: Set[str] = set()
            for integ, lst in (selection_data or {}).items():
                for row in lst or []:
                    if row.get("enabled") and row.get("entity_id"):
                        enabled_ids.add(row["entity_id"])

            selections: Dict[str, List[Dict[str, Any]]] = {}
            alternatives: Dict[str, List[Dict[str, Any]]] = {}
            reference_sensor: Dict[str, Any] = {}

            for c in data or []:
                integ = c.get("integration", "unknown")
                eid = c.get("entity_id")
                cap = _enrich_base(c, quality_map, reference_id)
                if eid in enabled_ids:
                    selections.setdefault(integ, []).append(cap)
                else:
                    alternatives.setdefault(integ, []).append(cap)
                if cap.get("is_reference"):
                    reference_sensor = cap

            return self.json({
                "selected": selections,
                "alternatives": alternatives,
                "reference_sensor": reference_sensor or {},
            })
        except Exception as e:
            _LOGGER.exception("Erreur get_sensors: %s", e)
            return self.json({"selected": {}, "alternatives": {}, "reference_sensor": {}})


class SaveSelectionView(HomeAssistantView):
    url = "/api/home_suivi_elec/save_selection"
    name = "api:home_suivi_elec:save_selection"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request):
        try:
            body = await request.json()
            os.makedirs(os.path.dirname(CAPTEURS_SELECTION_PATH), exist_ok=True)
            loop = asyncio.get_running_loop()

            detected = []
            if os.path.exists(CAPTEURS_POWER_PATH):
                detected = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH))
            detected = _enrich_device_info(self.hass, detected or [])

            by_id: Dict[str, Dict[str, Any]] = {c.get("entity_id"): c for c in detected if c.get("entity_id")}
            seen_signatures: Set[str] = set()
            conflicts: List[Dict[str, Any]] = []

            for integ, lst in (body or {}).items():
                for row in lst or []:
                    if not row.get("enabled"):
                        continue
                    eid = row.get("entity_id") or ""
                    cap = by_id.get(eid)
                    if not cap:
                        continue
                    sig = _compute_signature(cap)
                    if sig in seen_signatures:
                        conflicts.append({
                            "entity_id": eid,
                            "integration": integ,
                            "friendly_name": cap.get("friendly_name"),
                            "area": cap.get("area") or cap.get("zone"),
                            "signature": sig,
                            "type": "signature"
                        })
                    else:
                        seen_signatures.add(sig)

            device_to_entities: Dict[str, List[Tuple[str, str]]] = {}
            for integ, lst in (body or {}).items():
                for row in lst or []:
                    if not row.get("enabled"):
                        continue
                    eid = row.get("entity_id") or ""
                    cap = by_id.get(eid)
                    if not cap:
                        continue
                    did = cap.get("device_id")
                    if not did:
                        continue
                    device_to_entities.setdefault(did, []).append((eid, integ))

            device_conflicts: List[Dict[str, Any]] = []
            for did, items in device_to_entities.items():
                if len(items) > 1:
                    device_conflicts.append({
                        "device_id": did,
                        "entities": [{"entity_id": e, "integration": i} for e, i in items]
                    })

            if conflicts or device_conflicts:
                return self.json({
                    "success": False,
                    "error": "Conflits détectés (doublon ou même appareil).",
                    "conflicts": conflicts,
                    "device_conflicts": device_conflicts
                })

            _save_json(CAPTEURS_SELECTION_PATH, body)

            selected_ids: Set[str] = set()
            for integ, lst in (body or {}).items():
                for row in lst or []:
                    if row.get("enabled") and row.get("entity_id"):
                        selected_ids.add(row["entity_id"])

            return self.json({"success": True, "selected": sorted(selected_ids), "need_restart": True})
        except Exception as e:
            _LOGGER.exception("Erreur save_selection: %s", e)
            return self.json({"success": False, "need_restart": False, "error": str(e)})


class GetSelectionView(HomeAssistantView):
    url = "/api/home_suivi_elec/get_selection"
    name = "api:home_suivi_elec:get_selection"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            if not os.path.exists(CAPTEURS_SELECTION_PATH):
                return self.json({})
            loop = asyncio.get_running_loop()
            data = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_SELECTION_PATH))
            return self.json(data)
        except Exception as e:
            _LOGGER.exception("Erreur get_selection: %s", e)
            return self.json({})


class GetConsumptionsView(HomeAssistantView):
    """✅ CORRIGÉ : Utilise les sensors HSE energy natifs."""
    url = "/api/home_suivi_elec/get_consumptions"
    name = "api:home_suivi_elec:get_consumptions"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            loop = asyncio.get_running_loop()

            selections = await loop.run_in_executor(
                None, lambda: _load_json(CAPTEURS_SELECTION_PATH)
            ) if os.path.exists(CAPTEURS_SELECTION_PATH) else {}

            external_id = None
            use_external = False
            if os.path.exists(USER_CONFIG_PATH):
                conf = await loop.run_in_executor(None, lambda: _load_json(USER_CONFIG_PATH))
                use_external = bool((conf or {}).get("useExternal"))
                external_id = (conf or {}).get("externalCapteur")

            cycles = ["hourly", "daily", "weekly", "monthly", "yearly"]
            result: Dict[str, Dict[str, Optional[float]]] = {}

            # ✅ Nouveau système HSE : sensor.hse_{nom}_today_energy_{cycle}
            for integration, capteurs in (selections or {}).items():
                for c in (capteurs or []):
                    if not (c.get("enabled") and c.get("entity_id")):
                        continue
                    capteur_id = c["entity_id"]
                    result.setdefault(capteur_id, {})
                    
                    for cycle in cycles:
                        # ✅ Pattern HSE natif avec noms complets
                        hse_sensor_id = _build_hse_energy_sensor_id(capteur_id, cycle)
                        st = self.hass.states.get(hse_sensor_id)
                        
                        value: Optional[float] = None
                        if st and st.state not in (None, "unknown", "unavailable"):
                            try:
                                value = float(st.state)
                            except Exception:
                                value = None
                        
                        result[capteur_id][cycle] = value
                        
                        # 🐛 Debug si sensor introuvable
                        if value is None and st is None:
                            _LOGGER.debug(
                                f"[GetConsumptions] Sensor introuvable: {hse_sensor_id} "
                                f"(source: {capteur_id}, cycle: {cycle})"
                            )

            # ✅ Capteur externe (référence)
            if use_external and external_id:
                result.setdefault(external_id, {})
                for cycle in cycles:
                    hse_sensor_id = _build_hse_energy_sensor_id(external_id, cycle)
                    st = self.hass.states.get(hse_sensor_id)
                    
                    value: Optional[float] = None
                    if st and st.state not in (None, "unknown", "unavailable"):
                        try:
                            value = float(st.state)
                        except Exception:
                            value = None
                    
                    result[external_id][cycle] = value

            return self.json(result)
        except Exception as e:
            _LOGGER.exception("Erreur get_consumptions: %s", e)
            return self.json({})


class GetInstantPowerView(HomeAssistantView):
    url = "/api/home_suivi_elec/get_instant_puissance"
    name = "api:home_suivi_elec:get_instant_puissance"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            loop = asyncio.get_running_loop()
            selection = await loop.run_in_executor(
                None, lambda: _load_json(CAPTEURS_SELECTION_PATH)
            ) if os.path.exists(CAPTEURS_SELECTION_PATH) else {}

            entity_ids: List[str] = []
            for capteurs in (selection or {}).values():
                for c in (capteurs or []):
                    if c.get("enabled") and c.get("entity_id"):
                        entity_ids.append(c["entity_id"])

            use_external = False
            ext_id = None
            if os.path.exists(USER_CONFIG_PATH):
                conf = await loop.run_in_executor(None, lambda: _load_json(USER_CONFIG_PATH))
                use_external = bool((conf or {}).get("useExternal"))
                ext_id = (conf or {}).get("externalCapteur")
            if use_external and ext_id and ext_id not in entity_ids:
                entity_ids.append(ext_id)

            power_states: Dict[str, Optional[float]] = {}
            for entity_id in entity_ids:
                state = self.hass.states.get(entity_id)
                try:
                    if state is not None and state.state not in (None, "unknown", "unavailable"):
                        power_states[entity_id] = float(state.state)
                    else:
                        power_states[entity_id] = None
                except Exception:
                    power_states[entity_id] = None

            return self.json(power_states)
        except Exception as e:
            _LOGGER.exception("Erreur get_instant_puissance: %s", e)
            return self.json({})


class GetUserConfigView(HomeAssistantView):
    url = "/api/home_suivi_elec/get_user_config"
    name = "api:home_suivi_elec:get_user_config"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            if not os.path.exists(USER_CONFIG_PATH):
                return self.json({})
            loop = asyncio.get_running_loop()
            data = await loop.run_in_executor(None, lambda: _load_json(USER_CONFIG_PATH))
            return self.json(data)
        except Exception as e:
            _LOGGER.exception("Erreur get_user_config: %s", e)
            return self.json({})


class SaveUserConfigView(HomeAssistantView):
    url = "/api/home_suivi_elec/save_user_config"
    name = "api:home_suivi_elec:save_user_config"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request):
        try:
            body = await request.json()
            _save_json(USER_CONFIG_PATH, body)
            return self.json({"success": True})
        except Exception as e:
            _LOGGER.exception("Erreur save_user_config: %s", e)
            return self.json({"success": False})


class GetUserOptionsView(HomeAssistantView):
    url = "/api/home_suivi_elec/get_user_options"
    name = "api:home_suivi_elec:get_user_options"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Optional[Store] = None

    async def _load_ignored(self) -> List[str]:
        try:
            if self._store is None:
                self._store = Store(self.hass, 1, USER_STORE_KEY)
            cfg = await self._store.async_load() or {}
            return [str(x) for x in (cfg.get("ignored_entities") or []) if x]
        except Exception as e:
            _LOGGER.debug("GetUserOptionsView: ignored_entities load failed: %s", e)
            return []

    async def get(self, request):
        try:
            entries = self.hass.config_entries.async_entries("home_suivi_elec")
            if not entries:
                return self.json({})
            entry: ConfigEntry = entries[0]

            data = dict(entry.data or {})
            opts = dict(entry.options or {})
            eff = {**data, **opts}

            type_contrat = eff.get("type_contrat", "prix_unique")
            is_hc = type_contrat == "heures_creuses"
            type_ui = "hp-hc" if is_hc else "fixe"
            
            defaults_fixe = DEFAULTS.get("prix_unique", {})
            defaults_hc = DEFAULTS.get("heures_creuses", {})

            resp = {
                "typeContrat": type_ui,
                "abonnementHT": eff.get("abonnementHT", eff.get(CONF_ABONNEMENT_MENSUEL_HT, defaults_fixe.get(CONF_ABONNEMENT_MENSUEL_HT, 0))),
                "abonnementTTC": eff.get("abonnementTTC", eff.get(CONF_ABONNEMENT_MENSUEL_TTC, defaults_fixe.get(CONF_ABONNEMENT_MENSUEL_TTC, 0))),
                "prix_ht": eff.get(CONF_PRIX_HT, eff.get("prix_ht", defaults_fixe.get(CONF_PRIX_HT, 0))),
                "prix_ttc": eff.get(CONF_PRIX_TTC, eff.get("prix_ttc", defaults_fixe.get(CONF_PRIX_TTC, 0))),
                "prix_ht_hp": eff.get(CONF_PRIX_HT_HP, eff.get("prix_ht_hp", defaults_hc.get(CONF_PRIX_HT_HP, 0))),
                "prix_ttc_hp": eff.get(CONF_PRIX_TTC_HP, eff.get("prix_ttc_hp", defaults_hc.get(CONF_PRIX_TTC_HP, 0))),
                "prix_ht_hc": eff.get(CONF_PRIX_HT_HC, eff.get("prix_ht_hc", defaults_hc.get(CONF_PRIX_HT_HC, 0))),
                "prix_ttc_hc": eff.get(CONF_PRIX_TTC_HC, eff.get("prix_ttc_hc", defaults_hc.get(CONF_PRIX_TTC_HC, 0))),
                "hc_start": eff.get(CONF_HC_START, eff.get("hc_start", defaults_hc.get(CONF_HC_START, "22:00"))),
                "hc_end": eff.get(CONF_HC_END, eff.get("hc_end", defaults_hc.get(CONF_HC_END, "06:00"))),
                "useExternal": eff.get("useExternal", False),
                "externalCapteur": eff.get("externalCapteur", ""),
                "consommationExterne": eff.get("consommationExterne", 0),
                "mode": eff.get("mode", "sensor"),
            }
            resp["ignored_entities"] = await self._load_ignored()
            return self.json(resp)
        except Exception as e:
            _LOGGER.exception("Erreur get_user_options: %s", e)
            return self.json({})


class SaveUserOptionsView(HomeAssistantView):
    url = "/api/home_suivi_elec/save_user_options"
    name = "api:home_suivi_elec:save_user_options"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request):
        try:
            entries = self.hass.config_entries.async_entries("home_suivi_elec")
            if not entries:
                return self.json({"success": False})
            entry: ConfigEntry = entries[0]

            body = await request.json()
            current_opts = dict(entry.options or {})
            if isinstance(body, dict):
                current_opts.update(body)

            self.hass.config_entries.async_update_entry(entry, options=current_opts)
            return self.json({"success": True})
        except Exception as e:
            _LOGGER.exception("Erreur save_user_options: %s", e)
            return self.json({"success": False})


class GetSummaryView(HomeAssistantView):
    url = "/api/home_suivi_elec/get_summary"
    name = "api:home_suivi_elec:get_summary"
    requires_auth = False

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            loop = asyncio.get_running_loop()
            power = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH)) if os.path.exists(CAPTEURS_POWER_PATH) else []
            selection = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_SELECTION_PATH)) if os.path.exists(CAPTEURS_SELECTION_PATH) else {}
                             
            total = len(power or [])
            enabled_ids: Set[str] = set()
            for integ, lst in (selection or {}).items():
                for row in lst or []:
                    if row.get("enabled") and row.get("entity_id"):
                        enabled_ids.add(row["entity_id"])
            actifs = len(enabled_ids)

            by_sig: Dict[str, int] = {}
            for cap in power or []:
                sig = _compute_signature(cap)
                by_sig[sig] = by_sig.get(sig, 0) + 1
            duplicates = sum(1 for v in by_sig.values() if v > 1)

            return self.json({
                "total_capteurs": total,
                "actifs": actifs,
                "doublons_detectes": duplicates
            })
        except Exception as e:
            _LOGGER.exception("Erreur get_summary: %s", e)
            return self.json({})


class GetSyncStatusView(HomeAssistantView):
    """GET /api/home_suivi_elec/sync/status - Statut de la synchronisation."""
    url = "/api/home_suivi_elec/sync/status"
    name = "api:home_suivi_elec:sync:status"
    requires_auth = False

    def __init__(self, hass: HomeAssistant, sync_manager) -> None:
        self.hass = hass
        self.sync_manager = sync_manager

    async def get(self, request):
        try:
            status = self.sync_manager.get_status()
            return self.json(status)
        except Exception as e:
            _LOGGER.exception("Erreur get_sync_status: %s", e)
            return self.json({"error": str(e)}, status_code=500)


class ForceSyncView(HomeAssistantView):
    """POST /api/home_suivi_elec/sync/force - Force une synchronisation."""
    url = "/api/home_suivi_elec/sync/force"
    name = "api:home_suivi_elec:sync:force"
    requires_auth = False

    def __init__(self, hass: HomeAssistant, sync_manager) -> None:
        self.hass = hass
        self.sync_manager = sync_manager

    async def post(self, request):
        try:
            await self.sync_manager.force_sync()
            return self.json({"success": True})
        except Exception as e:
            _LOGGER.exception("Erreur force_sync: %s", e)
            return self.json({"success": False, "error": str(e)}, status_code=500)


class AutoSelectBestSensorsView(HomeAssistantView):
    """
    API pour sélectionner automatiquement les meilleurs capteurs.
    
    ✅ ÉTAPE 2/4 : Filtre les helpers (min_max, template, etc.) en utilisant is_physical_sensor()
    """
    url = "/api/home_suivi_elec/auto_select_best_sensors"
    name = "api:home_suivi_elec:auto_select_best_sensors"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request):
        """Sélection automatique intelligente (capteurs physiques uniquement)."""
        try:
            # ✅ Importer les fonctions de scoring
            from .sensor_quality_scorer import (
                auto_select_best_sensors,
                enrich_sensors_with_quality,
                is_physical_sensor  # ✅ NOUVEAU
            )
            
            loop = asyncio.get_running_loop()
            
            # Charger les capteurs détectés
            detected = []
            if os.path.exists(CAPTEURS_POWER_PATH):
                detected = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH))
            
            _LOGGER.info(f"[AUTO_SELECT] Total capteurs chargés : {len(detected)}")
            
            # Enrichir avec device_id, area, etc.
            detected = _enrich_device_info(self.hass, detected or [])
            
            # ✅ ÉTAPE 2/4 : Filtrer les capteurs physiques AVANT enrichissement
            physical_only = [s for s in detected if is_physical_sensor(s)]
            helpers_count = len(detected) - len(physical_only)
            
            _LOGGER.info(
                f"[AUTO_SELECT] Physiques : {len(physical_only)} | "
                f"Helpers exclus : {helpers_count}"
            )
            
            # Enrichir avec scores de qualité (UNIQUEMENT les physiques)
            physical_only = enrich_sensors_with_quality(physical_only)
            
            # Auto-sélectionner les meilleurs
            selected = auto_select_best_sensors(physical_only)
            
            # Formater pour sauvegarder
            selection_by_integration = {}
            for sensor in selected:
                integration = sensor.get("integration", "unknown")
                if integration not in selection_by_integration:
                    selection_by_integration[integration] = []
                
                selection_by_integration[integration].append({
                    "entity_id": sensor["entity_id"],
                    "enabled": True,
                    "auto_selected": True,
                    "quality_score": sensor["quality_score"]
                })
            
            # Sauvegarder
            _save_json(CAPTEURS_SELECTION_PATH, selection_by_integration)
            
            _LOGGER.info(
                f"[AUTO_SELECT] ✅ {len(selected)} capteurs physiques sélectionnés "
                f"({helpers_count} helpers exclus)"
            )
            
            return self.json({
                "success": True,
                "selected_count": len(selected),
                "physical_sensors": len(physical_only),
                "helpers_excluded": helpers_count,
                "selection": selection_by_integration,
                "message": (
                    f"{len(selected)} meilleurs capteurs physiques sélectionnés. "
                    f"{helpers_count} helpers exclus."
                )
            })
            
        except Exception as e:
            _LOGGER.exception("Erreur auto_select_best_sensors: %s", e)
            return self.json({"success": False, "error": str(e)}, status_code=500)


class GetSensorQualityScoresView(HomeAssistantView):
    """
    API pour obtenir les scores de qualité de tous les capteurs.
    
    ✅ ÉTAPE 2/4 : Ajoute le flag is_helper dans la réponse
    """
    url = "/api/home_suivi_elec/get_sensor_quality_scores"
    name = "api:home_suivi_elec:get_sensor_quality_scores"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        """Retourne les capteurs avec leurs scores (physiques et helpers séparés)."""
        try:
            from .sensor_quality_scorer import enrich_sensors_with_quality
            
            loop = asyncio.get_running_loop()
            
            # Charger capteurs
            detected = []
            if os.path.exists(CAPTEURS_POWER_PATH):
                detected = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH))
            
            detected = _enrich_device_info(self.hass, detected or [])
            
            # ✅ Enrichir avec scores (contient maintenant le flag is_helper)
            detected = enrich_sensors_with_quality(detected)
            
            # Séparer physiques vs helpers
            physical = [s for s in detected if not s.get("is_helper")]
            helpers = [s for s in detected if s.get("is_helper")]
            
            # Grouper par device (physiques uniquement)
            by_device = {}
            for sensor in physical:
                device_id = sensor.get("device_id", "no_device")
                if device_id not in by_device:
                    by_device[device_id] = []
                by_device[device_id].append(sensor)
            
            _LOGGER.debug(
                f"[QUALITY_SCORES] Total : {len(detected)} | "
                f"Physiques : {len(physical)} | Helpers : {len(helpers)}"
            )
            
            return self.json({
                "success": True,
                "total": len(detected),
                "physical_count": len(physical),
                "helpers_count": len(helpers),
                "sensors": detected,  # Tous les capteurs (avec flag is_helper)
                "physical": physical,  # Seulement les physiques
                "helpers": helpers,    # Seulement les helpers
                "by_device": by_device # Groupement par appareil (physiques uniquement)
            })
            
        except Exception as e:
            _LOGGER.exception("Erreur get_sensor_quality_scores: %s", e)
            return self.json({"success": False, "error": str(e)}, status_code=500)

class HSESensorsPublicView(HomeAssistantView):
    """GET /api/home_suivi_elec/lovelace_sensors - Liste tous les sensors HSE exposés, NON AUTH (usage local !)."""
    url = "/api/home_suivi_elec/lovelace_sensors"
    name = "api:home_suivi_elec:lovelace_sensors"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request):
        try:
            sensors = []
            for state in self.hass.states.async_all():
                if state.entity_id.startswith("sensor.hse_"):
                    sensors.append({
                        "entity_id": state.entity_id,
                        "state": state.state,
                        "attributes": dict(state.attributes)
                    })
            return self.json(sensors)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Erreur HSESensorsPublicView: {e}")
            return self.json([])

# Enregistre la vue dans async_setup ou async_setup_entry (__init__.py) :
# hass.http.register_view(HSESensorsPublicView(hass))

class SensorsHealthView(HomeAssistantView):
    """API diagnostic santé capteurs - TRANSFORMATION de /api/sensors."""
    url = "/api/home_suivi_elec/get_sensors_health"
    name = "api:home_suivi_elec:get_sensors_health"
    requires_auth = False
    cors_allowed = True
    
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
    
    async def get(self, request):
        """Transform /api/sensors vers format capteursSensor.js."""
        try:
            # ✅ Réutiliser ta logique /api/sensors existante
            from .manage_selection_views import load_json, CAPTEURS_POWER_PATH
            
            # Charger données capteurs depuis ton système
            if os.path.exists(CAPTEURS_POWER_PATH):
                capteurs_data = load_json(CAPTEURS_POWER_PATH)
            else:
                capteurs_data = {}
            
            # ✅ Transformation format pour capteursSensor.js
            sensors = {}
            
            for entity_id, sensor_info in capteurs_data.items():
                # État temps réel Home Assistant
                state_obj = self.hass.states.get(entity_id)
                
                # Calcul état santé (logique capteursSensor.js)
                health_state = "absent"
                if state_obj:
                    if state_obj.state in ["unavailable", "unknown", "error", "none"]:
                        health_state = "ko"
                    else:
                        health_state = "ok"
                
                # ✅ FORMAT EXACT attendu par capteursSensor.js
                sensors[entity_id] = {
                    "friendly_name": state_obj.attributes.get("friendly_name", entity_id) if state_obj else entity_id,
                    "value": state_obj.state if state_obj else "N/A",
                    "state": health_state,  # ← Clé pour le module !
                    "unit_of_measurement": state_obj.attributes.get("unit_of_measurement", "") if state_obj else "",
                    "integration": sensor_info.get("integration", "unknown"),
                    "quarantine": sensor_info.get("quarantine", False),
                    "last_seen": state_obj.last_changed.isoformat() if state_obj else None,
                    "device_id": sensor_info.get("device_id", ""),
                    "area": sensor_info.get("zone", ""),
                    "duplicate_group": sensor_info.get("duplicategroup", "")
                }
            
            # ✅ FORMAT FINAL pour capteursSensor.js
            return self.json({
                "success": True,  # ← success: true (pas error: false)
                "sensors": sensors,
                "count": len(sensors)
            })
            
        except Exception as e:
            _LOGGER.exception("Erreur get_sensors_health: %s", e)
            return self.json({"success": False, "error": str(e)})
