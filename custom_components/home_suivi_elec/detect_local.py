# -*- coding: utf-8 -*-
"""Détection locale des capteurs physiques (sans API)."""

import logging
import json
import aiofiles
from pathlib import Path
from homeassistant.util.dt import now
from .const import FICHIER_CAPTEURS

_LOGGER = logging.getLogger(__name__)

def collect_power_entities(hass):
    """Collecte toutes les entités sensor de puissance/énergie locales."""
    capteurs = []
    for entity_id in hass.states.async_entity_ids("sensor"):
        state = hass.states.get(entity_id)
        if state and state.attributes.get("device_class") in ("power", "energy"):
            capteurs.append({
                "entity_id": entity_id,
                "unit": state.attributes.get("unit_of_measurement"),
                "state_class": state.attributes.get("state_class"),
            })
    return capteurs

async def enregistrer_capteurs_detectes_async(capteurs):
    """Sauvegarde des capteurs détectés."""
    path = Path(FICHIER_CAPTEURS)
    path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(path, "w", encoding="utf-8") as f:
        await f.write(json.dumps(capteurs, indent=2, ensure_ascii=False))
    _LOGGER.info("📁 %d capteurs détectés sauvegardés dans %s", len(capteurs), path)

async def run_detect_local(hass, entry, mode_flux="complet"):
    """Routine principale de détection locale."""
    _LOGGER.info("🔍 Détection locale des capteurs (%s)", mode_flux)
    capteurs = collect_power_entities(hass)
    await enregistrer_capteurs_detectes_async(capteurs)
    hass.data["home_suivi_elec"]["capteurs"] = capteurs

    hass.states.async_set(
        "sensor.home_suivi_elec_capteurs_detectes",
        str(len(capteurs)),
        {"derniere_mise_a_jour": now().isoformat()}
    )
    _LOGGER.info("✅ %d capteurs trouvés localement", len(capteurs))