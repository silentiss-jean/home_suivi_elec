# -*- coding: utf-8 -*-
"""
Gestion dynamique Utility Meter pour Home Assistant.
- Détecte les capteurs de puissance (W) vs énergie (Wh/kWh)
- Crée un helper Integration (kWh) pour les capteurs de puissance
- Écrit le package YAML complet dans /config/packages/home_suivi_elec_utility_meter.yaml
- Gère la synchronisation et resync manuel
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
PACKAGES_DIR = "/config/packages"
PACKAGE_PATH = os.path.join(PACKAGES_DIR, "home_suivi_elec_utility_meter.yaml")
BACKUP_PATH = os.path.join(PACKAGES_DIR, "home_suivi_elec_utility_meter.yaml.bak")
UTILITY_METER_CYCLES = ["hourly", "daily", "weekly", "monthly", "yearly"]
def _slug(eid: str) -> str:
    return eid.replace(".", "_")
def get_meter_name(entity_id: str, cycle: str) -> str:
    base = entity_id.replace("sensor.","")
    return f"hse_{base}_{cycle}"
def _classify_entity(hass, entity_id) -> str:
    # Dummy (pour migration): à remplacer par vrai  device_class/unit dans hass
    return "energy" if "energy" in entity_id else "power"
def _build_integration_sensor(entity_id: str) -> Dict[str,Any]:
    return {
        "platform":"integration",
        "source":entity_id,
        "name":f"Integration {entity_id}",
        "unit_of_measurement":"kWh",
        "method":"left",
        "state_class":"total_increasing"
    }
def _build_um_entries(source_entity_id: str, base_entity_id: str, user_config: dict = None) -> Dict[str,Any]:
    user_config = user_config or {}
    meters = {}
    for cycle in UTILITY_METER_CYCLES:
        name = get_meter_name(base_entity_id, cycle)
        meter_cfg = {
            "source": source_entity_id,
            "cycle": cycle,
        }
        if user_config.get("type_contrat") == "heures_creuses":
            meter_cfg["tariffs"] = ["hp","hc"]
        meters[name] = meter_cfg
    return meters
async def sync_utility_meters(selected_entity_ids: Iterable[str], hass: HomeAssistant, user_config: dict = None):
    sensors_section = []
    utility_meter_section = {}
    user_config = user_config or {}
    for entity_id in selected_entity_ids:
        typ = _classify_entity(hass, entity_id)
        source_for_um = entity_id
        base_entity_id = entity_id.replace("sensor.","")
        if typ == "power":
            # Crée un helper Integration sensor
            integration_id = f"sensor.integration_{base_entity_id}"
            sensors_section.append(_build_integration_sensor(entity_id))
            source_for_um = integration_id
        new_meters = _build_um_entries(source_for_um, base_entity_id, user_config)
        utility_meter_section.update(new_meters)
    package = {}
    if sensors_section:
        package["sensor"] = sensors_section
    if utility_meter_section:
        package["utility_meter"] = utility_meter_section
    if os.path.exists(PACKAGE_PATH):
        shutil.copyfile(PACKAGE_PATH, BACKUP_PATH)
    with open(PACKAGE_PATH,"w") as f:
        yaml.dump(package,f,default_flow_style=False,allow_unicode=True)
    _LOGGER.info(f"✅ Utility Meter YAML écrit: {PACKAGE_PATH} ({len(utility_meter_section)} meters)")
    return True
