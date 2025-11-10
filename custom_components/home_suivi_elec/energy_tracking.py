"""
Energy Tracking Platform - Version FIXED COMPLETE
Crée sensors energy tracking avec cycles horaire/jour/semaine/mois/année
FIX: Ajout @property native_unit_of_measurement + fonction create_energy_sensors
Date: 2025-11-10
"""
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Any, List

from homeassistant.components.sensor import (
    RestoreEntity,
    SensorEntity,
    SensorDeviceClass,
    SensorStateClass,
)
from homeassistant.const import UnitOfEnergy, UnitOfPower
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)

CYCLES = {
    "hourly": {"duration": timedelta(hours=1), "offset": timedelta(seconds=5)},
    "daily": {"duration": timedelta(days=1), "offset": timedelta(seconds=5)},
    "weekly": {"duration": timedelta(weeks=1), "offset": timedelta(minutes=1)},
    "monthly": {"duration": timedelta(days=30), "offset": timedelta(minutes=2)},
    "yearly": {"duration": timedelta(days=365), "offset": timedelta(minutes=3)},
}


def create_energy_sensors(hass: HomeAssistant, entry=None) -> List[SensorEntity]:
    """
    Create energy sensors from capteurs_selection.json
    Appelée par __init__.py pour créer sensors manuellement
    """
    _LOGGER.info("[CREATE-ENERGY] Début création sensors via helper")
    
    import json
    import os
    
    selection_file = os.path.join(
        hass.config.config_dir,
        "custom_components/home_suivi_elec/data/capteurs_selection.json"
    )
    
    try:
        with open(selection_file, "r") as f:
            data = json.load(f)
            
        if isinstance(data, dict):
            capteurs = data.get("power_sources", [])
        else:
            capteurs = data
            
        _LOGGER.info(f"[CREATE-ENERGY] {len(capteurs)} capteurs à traiter")
        
    except Exception as e:
        _LOGGER.error(f"[CREATE-ENERGY] Erreur lecture capteurs: {e}")
        return []
    
    sensors = []
    
    for capteur in capteurs:
        entity_id = capteur.get("entity_id", "")
        
        if entity_id.startswith("sensor.hse_live_") or entity_id.startswith("sensor.hse_energy_"):
            _LOGGER.debug(f"[SKIP] {entity_id} déjà sensor HSE")
            continue
            
        is_energy = ("_energy" in entity_id or "_today_energy" in entity_id)
        basename = entity_id.replace("sensor.", "").replace("_today_energy", "")
        
        for cycle in CYCLES.keys():
            if is_energy:
                sensor_id = f"sensor.hse_{basename}_{cycle}"
            else:
                sensor_id = f"sensor.hse_energy_{basename}_{cycle}"
            
            _LOGGER.info(f"[CREATE-ENERGY] {sensor_id}")
            
            sensors.append(
                PowerEnergyCycleSensor(
                    hass=hass,
                    source_entity=entity_id,
                    cycle=cycle,
                    basename=basename,
                )
            )
    
    _LOGGER.info(f"[CREATE-ENERGY] {len(sensors)} sensors créés")
    return sensors


async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    """
    Setup energy tracking sensors via sensor platform
    Utilisé si configuré dans configuration.yaml
    """
    _LOGGER.info("[ENERGY-TRACKING] Setup via sensor platform")
    
    sensors = create_energy_sensors(hass)
    async_add_entities(sensors, True)


class PowerEnergyCycleSensor(RestoreEntity, SensorEntity):
    """Sensor intégrant puissance en énergie par cycle."""
    
    def __init__(self, hass, source_entity, cycle, basename):
        """Initialize."""
        self.hass = hass
        self._source_entity = source_entity
        self._cycle = cycle
        self._basename = basename
        
        self._attr_name = f"HSE {basename.replace('_', ' ').title()} Energy {cycle.title()}"
        self._attr_unique_id = f"hse_energy_{basename}_{cycle}"
        self._attr_suggested_object_id = f"hse_energy_{basename}_{cycle}"
        
        self._attr_device_class = SensorDeviceClass.ENERGY
        self._attr_state_class = SensorStateClass.TOTAL_INCREASING
        self._attr_icon = "mdi:flash"
        
        self._state = 0.0
        self._last_power = None
        self._last_update = None
        self._cycle_start = None
        
    @property
    def native_value(self):
        """Return state."""
        return self._state
    
    @property
    def native_unit_of_measurement(self) -> str:
        """Return unit of measurement - FIX pour Energy Dashboard."""
        return UnitOfEnergy.KILO_WATT_HOUR
    
    @property
    def extra_state_attributes(self):
        """Return attributes."""
        attrs = {
            "source_entity": self._source_entity,
            "cycle": self._cycle,
            "source_type": "power",
        }
        
        if self._last_power is not None:
            attrs["last_power_w"] = self._last_power
            
        if self._cycle_start:
            attrs["cycle_start"] = self._cycle_start.isoformat()
            
        return attrs
    
    async def async_added_to_hass(self):
        """Setup tracking."""
        await super().async_added_to_hass()
        
        if (last_state := await self.async_get_last_state()) is not None:
            self._state = float(last_state.state or 0)
            
            if attrs := last_state.attributes:
                if cycle_start_str := attrs.get("cycle_start"):
                    try:
                        self._cycle_start = datetime.fromisoformat(cycle_start_str)
                    except:
                        pass
        
        if not self._cycle_start:
            self._cycle_start = self._get_cycle_start()
        
        _LOGGER.info(f"[LIVE-POWER] {self.entity_id} tracking {self._source_entity}")
        
        self.async_on_remove(
            async_track_state_change_event(
                self.hass,
                [self._source_entity],
                self._on_source_changed,
            )
        )
        
        self._schedule_cycle_reset()
    
    @callback
    def _on_source_changed(self, event):
        """Handle source state change."""
        new_state = event.data.get("new_state")
        if not new_state or new_state.state in ["unknown", "unavailable"]:
            return
        
        try:
            power = float(new_state.state)
        except ValueError:
            return
        
        now = dt_util.now()
        
        if self._last_power is not None and self._last_update is not None:
            delta_hours = (now - self._last_update).total_seconds() / 3600.0
            avg_power = (power + self._last_power) / 2.0
            energy_kwh = (avg_power / 1000.0) * delta_hours
            
            self._state += energy_kwh
        
        self._last_power = power
        self._last_update = now
        
        self.async_write_ha_state()
    
    def _get_cycle_start(self):
        """Calculate cycle start."""
        now = dt_util.now()
        
        if self._cycle == "hourly":
            return now.replace(minute=0, second=5, microsecond=0)
        elif self._cycle == "daily":
            return now.replace(hour=0, minute=0, second=5, microsecond=0)
        elif self._cycle == "weekly":
            days_since_monday = now.weekday()
            monday = now - timedelta(days=days_since_monday)
            return monday.replace(hour=0, minute=1, second=0, microsecond=0)
        elif self._cycle == "monthly":
            return now.replace(day=1, hour=0, minute=2, second=0, microsecond=0)
        elif self._cycle == "yearly":
            return now.replace(month=1, day=1, hour=0, minute=3, second=0, microsecond=0)
        
        return now
    
    def _schedule_cycle_reset(self):
        """Schedule next cycle reset."""
        cycle_config = CYCLES[self._cycle]
        next_reset = self._cycle_start + cycle_config["duration"]
        
        while next_reset < dt_util.now():
            next_reset += cycle_config["duration"]
        
        delay = (next_reset - dt_util.now()).total_seconds()
        
        async def reset_cycle():
            self._state = 0.0
            self._cycle_start = next_reset
            self._last_power = None
            self._last_update = None
            self.async_write_ha_state()
            self._schedule_cycle_reset()
        
        self.hass.loop.call_later(delay, lambda: asyncio.create_task(reset_cycle()))