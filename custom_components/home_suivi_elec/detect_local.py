# -*- coding: utf-8 -*-
"""Détection locale des capteurs de puissance (W) pour Home Suivi Élec."""

import os
import json
import logging
import asyncio
from functools import partial
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er, area_registry as ar

_LOGGER = logging.getLogger(__name__)

async def run_detect_local(hass: HomeAssistant, entry=None):
    """Détecter les capteurs de puissance et sauvegarder leurs infos."""
    _LOGGER.info("🔍 Détection locale des capteurs de puissance (power)")

    # --- Dossier de stockage ---
    data_dir = os.path.join(hass.config.path("custom_components"), "home_suivi_elec", "data")
    os.makedirs(data_dir, exist_ok=True)
    power_path = os.path.join(data_dir, "capteurs_power.json")

    # --- Récupération des registres ---
    dev_reg = dr.async_get(hass)
    ent_reg = er.async_get(hass)
    area_reg = ar.async_get(hass)

    capteurs = []

    for entity in ent_reg.entities.values():
        # Filtrer uniquement les capteurs de puissance
        if entity.domain != "sensor":
            continue

        device_class = entity.device_class or entity.original_device_class
        if device_class != "power":
            continue

        entity_id = entity.entity_id
        integration = entity.platform or "unknown"
        device = dev_reg.async_get(entity.device_id) if entity.device_id else None
        area = None

        # Récupération de la zone si disponible
        if device and device.area_id:
            area_obj = area_reg.async_get_area(device.area_id)
            area = area_obj.name if area_obj else None

        # État courant depuis Home Assistant
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

    # --- Sauvegarde dans un executor pour éviter le warning ---
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, partial(_save_json, power_path, capteurs))

    _LOGGER.info("📁 %d capteurs de puissance sauvegardés dans %s", len(capteurs), power_path)
    _LOGGER.info("✨ %d capteurs détectés localement", len(capteurs))


def _save_json(path, data):
    """Écriture JSON bloquante mais hors loop événementiel."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
