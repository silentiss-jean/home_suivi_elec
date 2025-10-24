# -*- coding: utf-8 -*-
"""
Monitoring temps réel de la puissance (W).

Crée des sensors HSE Live pour affichage instantané dans l'UI.
Pas de cycles, pas de reset, juste un miroir enrichi du sensor source.

VERSION : 2.5
DATE : 22 octobre 2025

FONCTIONNALITÉS :
  - Crée sensor.hse_live_{slug} pour chaque sensor power
  - Synchronisation temps réel avec le sensor source
  - Métadonnées enrichies (zone, intégration, fiabilité)
  - Compatible cartes Lovelace

USAGE :
  - Affichage instantané de la consommation (W)
  - Cartes temps réel dans l'UI
  - Alertes sur consommation élevée
"""
import logging
import os
import json
from typing import Any, Dict, List

from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.components.sensor import SensorEntity

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_FILE = os.path.join(DATA_DIR, "capteurs_power.json")


class LivePowerSensor(SensorEntity):
    """
    Sensor de puissance temps réel (W).

    Miroir enrichi du sensor source avec préfixe HSE.
    Mise à jour automatique à chaque changement du sensor source.
    """

    def __init__(
        self,
        hass: HomeAssistant,
        source_entity: str,
        metadata: Dict[str, Any]
    ):
        """Initialise le sensor live."""
        self.hass = hass
        self._source_entity = source_entity
        self._metadata = metadata

        # Générer entity_id HSE
        slug = source_entity.replace("sensor.", "")
        slug = slug.replace("_current_power", "").replace("_device_power", "").replace("_power", "")
        slug = slug[:50]  # Limiter la longueur

        self._attr_unique_id = f"hse_live_{slug}"
        self.entity_id = f"sensor.hse_live_{slug}"

        # Attributs
        nom = metadata.get("nom", slug.replace("_", " ").title())
        self._attr_name = f"HSE Live {nom}"
        self._attr_device_class = "power"
        self._attr_state_class = "measurement"
        self._attr_unit_of_measurement = "W"
        self._attr_icon = "mdi:lightning-bolt"

        # État initial
        self._state = None
        self._available = True

        _LOGGER.debug(
            f"🔴 Création LivePowerSensor: {self.entity_id} "
            f"(source: {source_entity})"
        )

    @property
    def state(self):
        """Retourne la puissance actuelle."""
        return self._state

    @property
    def available(self):
        """Disponibilité du sensor."""
        return self._available

    @property
    def extra_state_attributes(self):
        """Métadonnées enrichies."""
        return {
            "source_entity": self._source_entity,
            "integration": self._metadata.get("integration"),
            "zone": self._metadata.get("zone"),
            "is_virtual": self._metadata.get("is_virtual"),
            "reliability_score": self._metadata.get("reliability_score"),
            "related_energy": self._metadata.get("related_energy"),
            "device_id": self._metadata.get("device_id"),
            "reference_type": self._metadata.get("reference_type"),
        }

    async def async_added_to_hass(self):
        """S'abonner aux changements du sensor source."""
        _LOGGER.debug(f"🔴 {self.entity_id} → Abonnement à {self._source_entity}")

        # S'abonner aux changements
        async_track_state_change_event(
            self.hass,
            self._source_entity,
            self._handle_state_change
        )

        # État initial
        source_state = self.hass.states.get(self._source_entity)
        if source_state:
            await self._update_from_source(source_state)

    async def _handle_state_change(self, event):
        """Mise à jour à chaque changement du sensor source."""
        new_state = event.data.get("new_state")
        if new_state:
            await self._update_from_source(new_state)

    async def _update_from_source(self, source_state):
        """Copie l'état du sensor source."""
        if source_state.state in ("unknown", "unavailable"):
            self._available = False
            self._state = None
            _LOGGER.debug(f"⚠️  {self.entity_id} → Source indisponible")
        else:
            try:
                self._state = float(source_state.state)
                self._available = True
                _LOGGER.debug(f"🔄 {self.entity_id} → {self._state} W")
            except (ValueError, TypeError):
                self._available = False
                self._state = None
                _LOGGER.warning(
                    f"❌ {self.entity_id} → Valeur invalide: {source_state.state}"
                )

        self.async_write_ha_state()


def load_power_sensors(hass: HomeAssistant) -> List[Dict[str, Any]]:
    """
    Charge les sensors power depuis capteurs_power.json.

    Filtre uniquement les sensors avec:
      - type = "power"
      - usage = "monitoring"

    Returns: Liste de sensors power pour monitoring temps réel
    """
    if not os.path.exists(CAPTEURS_FILE):
        _LOGGER.warning(f"⚠️  Fichier non trouvé: {CAPTEURS_FILE}")
        return []

    with open(CAPTEURS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Filtrer uniquement les sensors power pour monitoring
    power_sensors = [
        s for s in data 
        if s.get("type") == "power" and s.get("usage") == "monitoring"
    ]

    _LOGGER.debug(f"📂 Chargé {len(power_sensors)} sensors power pour monitoring")
    return power_sensors


def create_live_power_sensors(
    hass: HomeAssistant, 
    power_sensors: List[Dict[str, Any]]
) -> List[LivePowerSensor]:
    """
    Crée les sensors HSE Live pour chaque sensor power.

    Args:
        hass: Instance HomeAssistant
        power_sensors: Liste des sensors power depuis capteurs_power.json

    Returns: Liste des LivePowerSensor créés
    """
    sensors = []

    for sensor_data in power_sensors:
        entity_id = sensor_data.get("entity_id")
        if not entity_id:
            _LOGGER.warning(f"⚠️  Sensor sans entity_id: {sensor_data}")
            continue

        # Créer le sensor live
        live_sensor = LivePowerSensor(hass, entity_id, sensor_data)
        sensors.append(live_sensor)

        _LOGGER.debug(
            f"🔴 LIVE: {sensor_data.get('nom')} → {live_sensor.entity_id} "
            f"(source: {entity_id})"
        )

    return sensors


async def async_setup_power_monitoring(hass: HomeAssistant, entry) -> None:
    """
    Configure le monitoring temps réel.

    Point d'entrée appelé par __init__.py.

    Processus:
      1. Charger les sensors power depuis capteurs_power.json
      2. Créer les LivePowerSensor (sensor.hse_live_*)
      3. Stocker dans hass.data pour enregistrement via sensor.py
    """
    _LOGGER.info("🔴 POWER MONITORING: Chargement des sensors temps réel...")

    # Charger les sensors power
    power_sensors = await hass.async_add_executor_job(load_power_sensors, hass)

    if not power_sensors:
        _LOGGER.warning("⚠️  Aucun sensor power trouvé pour monitoring")
        return

    # Créer les sensors HSE Live
    live_sensors = create_live_power_sensors(hass, power_sensors)

    # Stocker dans hass.data
    from .const import DOMAIN
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}
    hass.data[DOMAIN]["live_power_sensors"] = live_sensors

    _LOGGER.info(f"✅ POWER MONITORING: {len(live_sensors)} sensors temps réel créés")
    _LOGGER.debug(
        f"🔴 Sensors créés: {[s.entity_id for s in live_sensors[:5]]}{'...' if len(live_sensors) > 5 else ''}"
    )
