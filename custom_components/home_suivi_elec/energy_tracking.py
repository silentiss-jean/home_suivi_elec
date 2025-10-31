"""
Module de tracking d'énergie avec cycles automatiques.
Enregistre aussi les noms complets dans le registry universel.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers.event import async_track_time_change, async_track_state_change_event
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.components.sensor import SensorEntity, SensorStateClass, SensorDeviceClass
from homeassistant.const import UnitOfEnergy

from .entity_name_registry import EntityNameRegistry
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

CYCLES = {
    "hourly": {"hour": None, "minute": 0, "second": 0},
    "daily": {"hour": 0, "minute": 0, "second": 0},
    "weekly": {"day": 1, "hour": 0, "minute": 0},
    "monthly": {"day": 1, "hour": 0, "minute": 0},
    "yearly": {"month": 1, "day": 1, "hour": 0, "minute": 0},
}

# ... (classes CumulativeEnergyCycleSensor et PowerEnergyCycleSensor inchangées) ...

# ============================================================================
# API PUBLIQUE - Création des sensors (Phase 2)
# ============================================================================
import re
import hashlib

def _shorten_entity_name(name: str, max_length: int = 63) -> str:
    available = max_length - 20
    name = name.replace("_today_energy", "")
    tech_abbrev = {
        "_puissance": "_pwr",
        "_consommation_actuelle": "_cur",
        "_prise_connectee": "_plug",
        "_prise_intelligente": "_smart",
    }
    for old, new in tech_abbrev.items():
        name = name.replace(old, new)
    if len(name) <= available:
        return name
    def abbreviate_chain(match):
        parts = match.group(0).split('_')
        if len(parts) >= 4:
            return ''.join(p[0] for p in parts)
        return match.group(0)
    name = re.sub(r'\b\w+(?:_\w+){3,}', abbreviate_chain, name)
    if len(name) <= available:
        return name
    parts = name.split('_')
    for i in range(len(parts)):
        if len(parts[i]) > 6 and len(name) > available:
            parts[i] = parts[i][:4]
            name = '_'.join(parts)
    if len(name) <= available:
        return name
    keep_length = available - 5
    hash_suffix = hashlib.md5(name.encode()).hexdigest()[:4]
    return name[:keep_length] + "_" + hash_suffix

async def create_energy_sensors(
    hass: HomeAssistant, 
    capteurs_selection: list[dict]
) -> list[SensorEntity]:
    sensors = []
    data_dir = Path(__file__).parent / "data"
    registry = EntityNameRegistry(data_dir)

    for capteur in capteurs_selection:
        source_id = capteur.get("entity_id")
        if not source_id:
            continue
        source_type = capteur.get("type", "power")
        metadata = {
            "is_virtual": capteur.get("is_virtual"),
            "reliability_score": capteur.get("reliability_score"),
            "reference_type": capteur.get("reference_type"),
            "tags": capteur.get("tags", []),
        }
        base_name = source_id.replace("sensor.", "")
        base_short = _shorten_entity_name(base_name)
        # 🔗 Enregistrer mapping court → complet
        display_full = registry.register(source_id, base_short)
        sensor_name = display_full

        for cycle in CYCLES.keys():
            cycle_short = cycle[0]
            if source_type == "energy":
                unique_id = f"hse_{base_short}_{cycle_short}"
                name = f"HSE {sensor_name} {cycle.capitalize()}"
                sensor = CumulativeEnergyCycleSensor(
                    hass=hass, source_entity=source_id, cycle=cycle,
                    unique_id=unique_id, name=name, metadata=metadata,
                )
            else:
                unique_id = f"hse_live_{base_short}_{cycle_short}"
                name = f"HSE {sensor_name} {cycle.capitalize()}"
                sensor = PowerEnergyCycleSensor(
                    hass=hass, source_entity=source_id, cycle=cycle,
                    unique_id=unique_id, name=name, metadata=metadata,
                )
            sensors.append(sensor)
    return sensors
