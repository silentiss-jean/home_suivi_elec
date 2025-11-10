"""
Power Monitoring - Version v3 FINALE
✅ Correction: Async I/O pour éviter blocking calls
✅ Lit capteurs_selection.json
✅ Crée SEULEMENT sensors LIVE
"""

import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import json
import os

from homeassistant.core import HomeAssistant, callback
from homeassistant.components.sensor import (
    SensorEntity,
    SensorDeviceClass,
    SensorStateClass,
)
from homeassistant.const import UnitOfPower
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.helpers import entity_registry as er, device_registry as dr

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_load_power_sensors(hass: HomeAssistant) -> List[Dict[str, Any]]:
    """
    Charge liste capteurs power depuis capteurs_selection.json.
    Version ASYNC pour éviter blocking call.
    """
    data_dir = hass.config.path(f"custom_components/{DOMAIN}/data")
    capteurs_file = os.path.join(data_dir, "capteurs_selection.json")

    # Vérification existence (synchrone OK car rapide)
    if not os.path.exists(capteurs_file):
        _LOGGER.warning(f"[POWER MONITORING] Fichier {capteurs_file} introuvable")
        return []

    try:
        # ✅ Lecture async avec executor
        def _load_json():
            with open(capteurs_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        data = await hass.async_add_executor_job(_load_json)

        # Gérer les 2 formats possibles
        if isinstance(data, dict):
            # Format: {"power_sources": [...], "energy_sources": [...]}
            power_sensors = data.get("power_sources", [])
        elif isinstance(data, list):
            # Format: [...]
            power_sensors = data
        else:
            _LOGGER.error(f"[POWER MONITORING] Format JSON invalide: {type(data)}")
            return []

        _LOGGER.info(f"[POWER MONITORING] {len(power_sensors)} capteurs power chargés")
        return power_sensors

    except json.JSONDecodeError as e:
        _LOGGER.error(f"[POWER MONITORING] Erreur JSON: {e}")
        return []
    except Exception as e:
        _LOGGER.error(f"[POWER MONITORING] Erreur chargement capteurs: {e}")
        import traceback
        _LOGGER.error(traceback.format_exc())
        return []


def create_live_sensors(hass: HomeAssistant, power_sensors: List[Dict[str, Any]]) -> List[SensorEntity]:
    """Crée sensors LIVE pour monitoring temps réel puissance."""
    live_sensors = []

    for sensor_data in power_sensors:
        entity_id = sensor_data.get("entity_id")
        if not entity_id:
            _LOGGER.warning(f"[POWER MONITORING] Capteur sans entity_id: {sensor_data}")
            continue

        try:
            live_sensor = LivePowerSensor(
                hass=hass,
                source_entity=entity_id,
                sensor_data=sensor_data
            )
            live_sensors.append(live_sensor)

            _LOGGER.debug(f"[CREATE-LIVE] sensor.hse_live_{entity_id.replace('sensor.', '')} créé")

        except Exception as e:
            _LOGGER.error(f"[POWER MONITORING] Erreur création sensor live {entity_id}: {e}")

    _LOGGER.info(f"[POWER MONITORING] {len(live_sensors)} sensors live créés")
    return live_sensors


class LivePowerSensor(RestoreEntity, SensorEntity):
    """Sensor LIVE pour monitoring temps réel puissance (W)."""

    def __init__(
        self,
        hass: HomeAssistant,
        source_entity: str,
        sensor_data: Dict[str, Any]
    ):
        """Initialisation."""
        self.hass = hass
        self._source_entity = source_entity
        self._sensor_data = sensor_data

        # Noms
        basename = source_entity.replace("sensor.", "")
        self._attr_name = f"HSE Live {basename}"
        self._entity_id = f"sensor.hse_live_{basename}"

        # Unique ID
        import hashlib
        hash_source = hashlib.md5(source_entity.encode()).hexdigest()[:8]
        self._attr_unique_id = f"hse_live_power_{hash_source}"

        # Attributs sensor
        self._attr_device_class = SensorDeviceClass.POWER
        self._attr_state_class = SensorStateClass.MEASUREMENT
        self._attr_unit_of_measurement = UnitOfPower.WATT
        self._attr_icon = "mdi:flash"

        # État
        self._attr_native_value = None
        self._attr_available = True

    @property
    def entity_id(self):
        """Entity ID."""
        return self._entity_id

    @property
    def extra_state_attributes(self):
        """Attributs additionnels."""
        return {
            "source_entity": self._source_entity,
            "sensor_type": "live_power",
            "is_virtual": self._sensor_data.get("is_virtual", False),
            "reliability_score": self._sensor_data.get("reliability_score", 100),
            "reference_type": self._sensor_data.get("reference_type", "physical"),
        }

    async def async_added_to_hass(self):
        """Setup tracking."""
        # Restore state
        last_state = await self.async_get_last_state()
        if last_state and last_state.state not in ("unknown", "unavailable"):
            try:
                self._attr_native_value = float(last_state.state)
            except (ValueError, TypeError):
                pass

        # Track source sensor
        async_track_state_change_event(
            self.hass, [self._source_entity], self._on_source_changed
        )

        _LOGGER.debug(f"[LIVE-POWER] {self._entity_id} tracking {self._source_entity}")

    @callback
    def _on_source_changed(self, event):
        """Mise à jour sur changement source."""
        new_state = event.data.get("new_state")

        if not new_state:
            return

        if new_state.state in ("unknown", "unavailable"):
            self._attr_available = False
            self._attr_native_value = None
        else:
            try:
                self._attr_native_value = float(new_state.state)
                self._attr_available = True
            except (ValueError, TypeError):
                _LOGGER.warning(
                    f"[LIVE-POWER] {self._entity_id}: Valeur invalide {new_state.state}"
                )
                self._attr_available = False

        self.async_write_ha_state()


async def async_setup_power_monitoring(hass: HomeAssistant, entry) -> bool:
    """
    Configure power monitoring sensors.

    ✅ Crée SEULEMENT sensors LIVE (sensor.hse_live_*)
    ❌ Ne crée PLUS de cycles energy (géré par energy_tracking.py)
    """
    try:
        # ✅ Charger capteurs power (ASYNC)
        power_sensors = await async_load_power_sensors(hass)

        if not power_sensors:
            _LOGGER.warning("[POWER MONITORING] Aucun capteur power trouvé")
            return True

        # Créer SEULEMENT sensors LIVE
        live_sensors = create_live_sensors(hass, power_sensors)

        # Enregistrer dans hass.data
        if DOMAIN not in hass.data:
            hass.data[DOMAIN] = {}

        hass.data[DOMAIN]["live_power_sensors"] = live_sensors

        _LOGGER.info(
            f"[POWER MONITORING] ✅ {len(live_sensors)} sensors live créés. "
            f"Energy cycles gérés par energy_tracking.py"
        )

        return True

    except Exception as e:
        _LOGGER.error(f"[POWER MONITORING] ❌ Erreur setup: {e}")
        import traceback
        _LOGGER.error(traceback.format_exc())
        return False
