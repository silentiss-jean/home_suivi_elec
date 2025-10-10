# -*- coding: utf-8 -*-
"""Détection locale des capteurs de puissance (W) pour Home Suivi Élec."""

import os
import json
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er, area_registry as ar

_LOGGER = logging.getLogger(__name__)

DATA_DIR = None
CAPTEURS_POWER_PATH = None

async def run_detect_local(hass: HomeAssistant, entry=None):
    global DATA_DIR, CAPTEURS_POWER_PATH
    _LOGGER.info("🔍 Détection locale des capteurs de puissance (power)")

    DATA_DIR = os.path.join(hass.config.path("custom_components"), "home_suivi_elec", "data")
    os.makedirs(DATA_DIR, exist_ok=True)
    CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")

    dev_reg = dr.async_get(hass)
    ent_reg = er.async_get(hass)
    area_reg = ar.async_get(hass)

    capteurs = []
    for entity in ent_reg.entities.values():
        if entity.domain != "sensor":
            continue
        device_class = entity.device_class or entity.original_device_class
        if device_class != "power":
            continue

        entity_id = entity.entity_id
        integration = entity.platform or "unknown"
        device = dev_reg.async_get(entity.device_id) if entity.device_id else None
        area = None
        if device and device.area_id:
            area_obj = area_reg.async_get_area(device.area_id)
            area = area_obj.name if area_obj else None

        state = hass.states.get(entity_id)
        unit = state.attributes.get("unit_of_measurement") if state else None
        friendly_name = state.attributes.get("friendly_name") if state else entity.original_name or entity_id
        value = state.state if state else None

        capteurs.append({
            "entity_id": entity_id,
            "friendly_name": friendly_name,
            "integration": integration,
            "area": area,
            "unit": unit,
            "value": value,
        })

    # Charger anciens capteurs pour détecter les nouveaux
    anciens = []
    if os.path.exists(CAPTEURS_POWER_PATH):
        with open(CAPTEURS_POWER_PATH, "r", encoding="utf-8") as f:
            anciens = json.load(f)
    anciens_ids = {c["entity_id"] for c in anciens}

    nouveaux = [c for c in capteurs if c["entity_id"] not in anciens_ids]

    # Sauvegarde
    with open(CAPTEURS_POWER_PATH, "w", encoding="utf-8") as f:
        json.dump(capteurs, f, indent=2, ensure_ascii=False)

    _LOGGER.info("📁 %d capteurs de puissance sauvegardés dans %s", len(capteurs), CAPTEURS_POWER_PATH)
    if nouveaux:
        _LOGGER.info("✨ %d nouveaux capteurs détectés", len(nouveaux))
    return nouveaux
