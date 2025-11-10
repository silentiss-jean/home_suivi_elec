"""
Energy Tracking - FINAL VERSION (CORRIGÉ)
Support complet ENERGY + POWER avec filtres anti-doublon
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path  # ✅ AJOUT
import hashlib
from typing import Dict, List, Any, Optional

from homeassistant.core import HomeAssistant, callback
from homeassistant.components.sensor import (
    SensorEntity,
    SensorDeviceClass,
    SensorStateClass,
)
from homeassistant.const import UnitOfEnergy, UnitOfPower
from homeassistant.helpers.event import async_track_state_change_event, async_track_utc_time_change
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.helpers import entity_registry as er
import homeassistant.util.dt as dt_util

from .const import DOMAIN
from .entity_name_registry import EntityNameRegistry

_LOGGER = logging.getLogger(__name__)

# Cycles de tracking
CYCLES = {
    "hourly": {"minute": 0, "second": 5},
    "daily": {"hour": 0, "minute": 0, "second": 5},
    "weekly": {"hour": 0, "minute": 1, "second": 0},
    "monthly": {"hour": 0, "minute": 2, "second": 0},
    "yearly": {"hour": 0, "minute": 3, "second": 0},
}


async def create_energy_sensors(
    hass: HomeAssistant,
    capteurs_selection: List[Dict[str, Any]]
) -> List[SensorEntity]:
    """Crée sensors energy cycles pour sources sélectionnées."""
    sensors = []

    # ✅ CORRECTION: Conversion en Path
    data_dir = hass.config.path(f"custom_components/{DOMAIN}/data")
    registry = EntityNameRegistry(Path(data_dir))
    await registry.async_load(hass)

    _LOGGER.info("[ENERGY-TRACKING] Début création sensors cycles")

    for capteur in capteurs_selection:
        entity_id = capteur.get("entity_id", "")

        if not entity_id:
            continue

        # ✅ Exclure nos sensors live internes
        if entity_id.startswith("sensor.hse_live_"):
            _LOGGER.debug(f"[SKIP-LIVE] {entity_id}")
            continue

        # ✅ Exclure sensors energy déjà créés
        if entity_id.startswith("sensor.hse_energy_"):
            _LOGGER.debug(f"[SKIP-ENERGY] {entity_id}")
            continue

        # Détection type source
        is_energy = "today_energy" in entity_id

        # Métadonnées enrichies
        metadata = {
            "is_virtual": capteur.get("is_virtual", False),
            "reliability_score": capteur.get("reliability_score", 100),
            "reference_type": capteur.get("reference_type", "physical"),
            "tags": capteur.get("tags", []),
        }

        if is_energy:
            _LOGGER.info(f"[PROCESS-ENERGY] {entity_id}")

            for cycle_name in CYCLES.keys():
                sensor = CumulativeEnergyCycleSensor(
                    hass, capteur, cycle_name, metadata
                )
                sensors.append(sensor)
        else:
            _LOGGER.info(f"[PROCESS-POWER] {entity_id}")

            for cycle_name in CYCLES.keys():
                sensor = PowerEnergyCycleSensor(
                    hass, capteur, cycle_name, metadata
                )
                sensors.append(sensor)

        # Enregistrer noms dans registry
        basename = entity_id.replace("sensor.", "").replace("_today_energy", "")
        for cycle in CYCLES.keys():
            if is_energy:
                sensor_id = f"sensor.hse_{basename}_{cycle}"
            else:
                sensor_id = f"sensor.hse_energy_{basename}_{cycle}"

            registry.register_sync(sensor_id, basename)

    await registry.async_save()

    _LOGGER.info(
        f"[CREATE-SENSOR] {len(sensors)} sensors energy créés "
        f"(filtres: hse_live_*, hse_energy_*)"
    )

    return sensors


class CumulativeEnergyCycleSensor(RestoreEntity, SensorEntity):
    """Sensor energy pour sources kWh cumulatives (Tapo)."""

    def __init__(
        self,
        hass: HomeAssistant,
        source: Dict[str, Any],
        cycle: str,
        metadata: Dict[str, Any]
    ):
        """Initialisation."""
        self.hass = hass
        self._source_entity = source.get("entity_id")
        self._cycle = cycle
        self._metadata = metadata

        basename = self._source_entity.replace("sensor.", "").replace("_today_energy", "")
        self._attr_name = f"HSE {basename} Energy {cycle.title()}"
        self._entity_id = f"sensor.hse_{basename}_{cycle}"

        hash_source = hashlib.md5(self._source_entity.encode()).hexdigest()[:4]
        self._attr_unique_id = f"hse_energy_{hash_source}_{cycle}"

        self._attr_device_class = SensorDeviceClass.ENERGY
        self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        self._attr_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
        self._attr_icon = "mdi:flash"

        self._attr_native_value = 0.0
        self._last_source_value = None
        self._cycle_start = datetime.now()

        _LOGGER.debug(f"[CREATE-ENERGY] {self._entity_id}")

    @property
    def entity_id(self):
        return self._entity_id

    @property
    def extra_state_attributes(self):
        return {
            "source_entity": self._source_entity,
            "cycle": self._cycle,
            "source_type": "energy",
            "cycle_start": self._cycle_start.isoformat() if self._cycle_start else None,
            **self._metadata,
        }

    async def async_added_to_hass(self):
        last_state = await self.async_get_last_state()
        if last_state:
            try:
                self._attr_native_value = float(last_state.state)
                _LOGGER.debug(f"[RESTORE] {self._entity_id}: {self._attr_native_value} kWh")
            except (ValueError, TypeError):
                pass

        async_track_state_change_event(
            self.hass, [self._source_entity], self._on_source_changed
        )
        self._setup_cycle_reset()

    @callback
    def _on_source_changed(self, event):
        new_state = event.data.get("new_state")
        if not new_state or new_state.state in ("unknown", "unavailable"):
            return

        try:
            new_value = float(new_state.state)

            if self._last_source_value is not None:
                delta = new_value - self._last_source_value
                if delta > 0:
                    self._attr_native_value += delta
                    self.async_write_ha_state()

            self._last_source_value = new_value
        except (ValueError, TypeError) as e:
            _LOGGER.warning(f"[ENERGY-ERROR] {self._entity_id}: {e}")

    def _setup_cycle_reset(self):
        config = CYCLES[self._cycle]

        if self._cycle in ["hourly", "daily"]:
            async_track_utc_time_change(self.hass, self._on_cycle_reset, **config)
        else:
            async_track_utc_time_change(self.hass, self._on_conditional_reset, **config)

    @callback
    def _on_cycle_reset(self, now):
        self._attr_native_value = 0.0
        self._last_source_value = None
        self._cycle_start = now
        self.async_write_ha_state()
        _LOGGER.debug(f"[RESET] {self._entity_id} → 0 kWh")

    @callback
    def _on_conditional_reset(self, now):
        should_reset = False

        if self._cycle == "weekly" and now.weekday() == 0:
            should_reset = True
        elif self._cycle == "monthly" and now.day == 1:
            should_reset = True
        elif self._cycle == "yearly" and now.month == 1 and now.day == 1:
            should_reset = True

        if should_reset:
            self._on_cycle_reset(now)


class PowerEnergyCycleSensor(RestoreEntity, SensorEntity):
    """Sensor energy pour sources POWER (W) avec intégration trapézoïdale."""

    def __init__(
        self,
        hass: HomeAssistant,
        source: Dict[str, Any],
        cycle: str,
        metadata: Dict[str, Any]
    ):
        """Initialisation."""
        self.hass = hass
        self._source_entity = source.get("entity_id")
        self._cycle = cycle
        self._metadata = metadata

        basename = self._source_entity.replace("sensor.", "")
        self._attr_name = f"HSE {basename} Energy {cycle.title()}"
        self._entity_id = f"sensor.hse_energy_{basename}_{cycle}"

        hash_source = hashlib.md5(self._source_entity.encode()).hexdigest()[:4]
        self._attr_unique_id = f"hse_power_energy_{hash_source}_{cycle}"

        self._attr_device_class = SensorDeviceClass.ENERGY
        self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        self._attr_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
        self._attr_icon = "mdi:flash"

        self._attr_native_value = 0.0
        self._last_power_w = None
        self._last_time = None
        self._cycle_start = datetime.now()

        _LOGGER.debug(f"[CREATE-POWER] {self._entity_id}")

    @property
    def entity_id(self):
        return self._entity_id

    @property
    def extra_state_attributes(self):
        return {
            "source_entity": self._source_entity,
            "cycle": self._cycle,
            "source_type": "power",
            "last_power_w": self._last_power_w,
            "cycle_start": self._cycle_start.isoformat() if self._cycle_start else None,
            **self._metadata,
        }

    async def async_added_to_hass(self):
        last_state = await self.async_get_last_state()
        if last_state:
            try:
                self._attr_native_value = float(last_state.state)
                _LOGGER.debug(f"[RESTORE] {self._entity_id}: {self._attr_native_value} kWh")
            except (ValueError, TypeError):
                pass

        async_track_state_change_event(
            self.hass, [self._source_entity], self._on_source_changed
        )
        self._setup_cycle_reset()

    @callback
    def _on_source_changed(self, event):
        new_state = event.data.get("new_state")
        if not new_state or new_state.state in ("unknown", "unavailable"):
            return

        try:
            new_power = float(new_state.state)
            now = dt_util.utcnow()

            if self._last_power_w is not None and self._last_time is not None:
                delta_time = (now - self._last_time).total_seconds() / 3600.0
                avg_power = (self._last_power_w + new_power) / 2.0
                energy_kwh = (avg_power / 1000.0) * delta_time

                if energy_kwh < 10.0:
                    self._attr_native_value += energy_kwh
                    self.async_write_ha_state()
                else:
                    _LOGGER.warning(
                        f"[POWER-INT] {self._entity_id}: Aberration ignorée ({energy_kwh:.2f} kWh)"
                    )

            self._last_power_w = new_power
            self._last_time = now
        except (ValueError, TypeError) as e:
            _LOGGER.warning(f"[POWER-ERROR] {self._entity_id}: {e}")

    def _setup_cycle_reset(self):
        config = CYCLES[self._cycle]

        if self._cycle in ["hourly", "daily"]:
            async_track_utc_time_change(self.hass, self._on_cycle_reset, **config)
        else:
            async_track_utc_time_change(self.hass, self._on_conditional_reset, **config)

    @callback
    def _on_cycle_reset(self, now):
        self._attr_native_value = 0.0
        self._last_power_w = None
        self._last_time = None
        self._cycle_start = now
        self.async_write_ha_state()
        _LOGGER.debug(f"[RESET] {self._entity_id} → 0 kWh")

    @callback
    def _on_conditional_reset(self, now):
        should_reset = False

        if self._cycle == "weekly" and now.weekday() == 0:
            should_reset = True
        elif self._cycle == "monthly" and now.day == 1:
            should_reset = True
        elif self._cycle == "yearly" and now.month == 1 and now.day == 1:
            should_reset = True

        if should_reset:
            self._on_cycle_reset(now)
