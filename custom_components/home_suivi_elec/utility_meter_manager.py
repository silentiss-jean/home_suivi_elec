# -*- coding: utf-8 -*-
"""
Gestion dynamique Utility Meter pour Home Assistant.
- Détecte les capteurs de puissance (W) vs énergie (Wh/kWh)
- Crée un helper Integration (kWh) pour les capteurs de puissance
- Écrit le package YAML complet dans /config/packages/home_suivi_elec_utility_meter.yaml
"""

import os
import yaml
import shutil
import logging
import asyncio
from typing import Dict, Any, Iterable
from datetime import datetime, timedelta

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# Dossier packages par défaut
PACKAGES_DIR = "/config/packages"
PACKAGE_PATH = os.path.join(PACKAGES_DIR, "home_suivi_elec_utility_meter.yaml")
BACKUP_PATH = os.path.join(PACKAGES_DIR, "home_suivi_elec_utility_meter.yaml.bak")

UTILITY_METER_CYCLES = ["hourly", "daily", "weekly", "monthly", "yearly"]

# --------- Helpers nommage ---------
def _slug(eid: str) -> str:
    return eid.replace(".", "_")

def get_meter_name(entity_id: str, cycle: str) -> str:
    return f"hse_{_slug(entity_id)}_{cycle}"

def get_integration_helper_name(entity_id: str) -> str:
    # sensor.hse_energy_<entity>
    return f"hse_energy_{_slug(entity_id)}"

# --------- Détection type capteur ---------
def _classify_entity(hass: HomeAssistant, entity_id: str) -> str:
    """
    Retourne 'energy' si kWh/Wh ou device_class=energy,
            'power' si W/Watt(s) ou device_class=power,
            'unknown' sinon.
    """
    st = hass.states.get(entity_id)
    if not st:
        return "unknown"
    attrs = st.attributes or {}
    uom = str(attrs.get("unit_of_measurement", "")).strip().lower()
    dc = str(attrs.get("device_class", "")).strip().lower()
    if dc == "energy" or uom in ("kwh", "wh"):
        return "energy"
    if dc == "power" or uom in ("w", "watt", "watts"):
        return "power"
    return "unknown"

# --------- Lecture / écriture YAML ---------
def _load_existing_yaml() -> Dict[str, Any]:
    if not os.path.exists(PACKAGE_PATH):
        return {}
    try:
        with open(PACKAGE_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            if not isinstance(data, dict):
                return {}
            return data
    except Exception as e:
        _LOGGER.warning("[YAML] Lecture existante impossible (%s), on repart de zéro.", e)
        return {}

def _backup_package_file():
    if os.path.exists(PACKAGE_PATH):
        shutil.copyfile(PACKAGE_PATH, BACKUP_PATH)
        _LOGGER.info("[Backup] Copie avant modification : %s", BACKUP_PATH)

def _write_yaml_sync(data):
    os.makedirs(PACKAGES_DIR, exist_ok=True)
    with open(PACKAGE_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False)
    _LOGGER.info("[YAML] Fichier écrit : %s", PACKAGE_PATH)

async def write_yaml_package(data):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _write_yaml_sync, data)

# --------- Construction du package ---------
def _ensure_path(root: Dict[str, Any], path: Iterable[str]) -> Dict[str, Any]:
    """
    Garantit l'existence d'un sous-dict imbriqué, et le retourne.
    path: ex ("template", "sensor") ou ("integration",)
    """
    cur = root
    for p in path:
        cur = cur.setdefault(p, {})
    return cur

def _build_integration_sensor(entity_id: str) -> Dict[str, Any]:
    """
    Construit un bloc sensor.integration pour intégrer W -> kWh.
    Utilise state_class: total_increasing pour permettre les statistiques LTS.
    Méthode 'left' plus stable que 'trapezoidal' pour éviter les bugs d'accumulation.
    """
    return {
        "platform": "integration",
        "source": entity_id,
        "name": get_integration_helper_name(entity_id),
        "unit_prefix": "k",
        "unit_time": "h",
        "round": 3,
        "method": "left",  # ✅ Plus stable que trapezoidal
        "unit_of_measurement": "kWh",
        "device_class": "energy",
        "state_class": "total_increasing",  # ✅ CRUCIAL pour les stats LTS
    }

def _build_um_entries(source_entity_id: str, base_entity_id: str) -> Dict[str, Any]:
    """
    Construit les entrées utility_meter pour base_entity_id en s'appuyant sur source_entity_id.
    """
    meters = {}
    for cycle in UTILITY_METER_CYCLES:
        name = get_meter_name(base_entity_id, cycle)
        meters[name] = {
            "source": source_entity_id,
            "cycle": cycle
        }
    return meters

def build_package_yaml(hass: HomeAssistant, selected_entity_ids) -> Dict[str, Any]:
    """
    Construit le package complet:
      - platform: integration pour chaque capteur puissance (W) -> sensor.hse_energy_<...>
      - utility_meter pour chaque entité sélectionnée, source = helper énergie si power, sinon la source énergie directe
    Fusionne avec l'existant pour rester idempotent.
    """
    existing = _load_existing_yaml()
    result: Dict[str, Any] = dict(existing)

    sensors_node = _ensure_path(result, ("sensor",))
    if not isinstance(sensors_node, list):
        sensors_node = []
        result["sensor"] = sensors_node

    um_node = _ensure_path(result, ("utility_meter",))

    existing_integration_names = set()
    for it in result.get("sensor", []):
        if isinstance(it, dict) and it.get("platform") == "integration":
            nm = str(it.get("name", "")).strip()
            if nm:
                existing_integration_names.add(nm)
    existing_um_names = set(um_node.keys())

    for entity_id in selected_entity_ids or []:
        if not entity_id:
            continue

        kind = _classify_entity(hass, entity_id)
        source_for_um = entity_id

        if kind == "power":
            integ_name = get_integration_helper_name(entity_id)
            if integ_name not in existing_integration_names:
                sensors_node.append(_build_integration_sensor(entity_id))
                existing_integration_names.add(integ_name)
                _LOGGER.info("[Integration] Ajout intégrateur énergie pour %s -> %s", entity_id, integ_name)
            source_for_um = f"sensor.{integ_name}"

        elif kind == "energy":
            source_for_um = entity_id
        else:
            source_for_um = entity_id
            _LOGGER.warning("[Classify] Type inconnu pour %s (device_class/uom absents) — usage direct.", entity_id)

        new_meters = _build_um_entries(source_for_um, entity_id)
        for meter_name, meter_cfg in new_meters.items():
            um_node[meter_name] = meter_cfg

    return result

# --------- API publique appelée par les vues ---------
async def sync_utility_meters(selected_entity_ids, hass: HomeAssistant = None):
    """
    Écrit/merge le package YAML avec:
      - sensors d'intégration pour les capteurs de puissance
      - utility_meters pour tous
    """
    _LOGGER.info("[DEBUG] sync_utility_meters sélection: %s", selected_entity_ids)
    _backup_package_file()
    if hass is None:
        _LOGGER.warning("[WARN] hass non fourni à sync_utility_meters: la classification sera 'unknown' -> usage direct.")
    
    data = build_package_yaml(hass, selected_entity_ids)
    _LOGGER.info("[DEBUG] Package: %s UM, %s integrations", 
                 len(data.get("utility_meter", {}) or {}), 
                 len([s for s in data.get("sensor", []) if isinstance(s, dict) and s.get('platform') == 'integration']))
    await write_yaml_package(data)
    _LOGGER.info("[UtilityMeter] %d capteurs pris en compte. Fichier mis à jour.", len(selected_entity_ids))
    if not selected_entity_ids:
        _LOGGER.warning("[WARN] Aucun capteur sélectionné/valide.")

# --------- Cleanup des valeurs aberrantes ---------
async def cleanup_aberrant_statistics(hass: HomeAssistant, entity_id: str, max_kwh_total: float = 10000.0):
    """
    Détecte si un sensor d'intégration a des valeurs aberrantes (> max_kwh_total).
    Retourne True si nettoyage nécessaire.
    
    Args:
        hass: Instance Home Assistant
        entity_id: sensor.hse_energy_xxx
        max_kwh_total: Seuil d'alerte (défaut 10 000 kWh total)
    """
    try:
        state = hass.states.get(entity_id)
        if not state:
            return False
        
        try:
            value = float(state.state)
        except (ValueError, TypeError):
            return False
        
        if value > max_kwh_total:
            _LOGGER.warning(
                "[Cleanup] Valeur aberrante détectée pour %s: %.2f kWh (seuil: %.2f kWh)",
                entity_id, value, max_kwh_total
            )
            return True
        
        return False
    except Exception as e:
        _LOGGER.error("[Cleanup] Erreur lors de la vérification de %s: %s", entity_id, e)
        return False
