"""
Module de tracking d'énergie avec cycles automatiques.
Enregistre aussi les noms complets dans le registry universel.

✅ FIX: unique_id collision-proof avec hash source
✅ BUGFIX CRITIQUE: Ajout du return sensors manquant
✅ BUGFIX TRACKING: Fix async_track_time_change() API deprecated
✅ BUGFIX STATE: Lecture initiale + publication état initial
✅ CORRECTION 2025-11-08: Gestion type null + support power/energy
"""
from __future__ import annotations

import logging
import re
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional, Dict
from pathlib import Path

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers.event import async_track_utc_time_change, async_track_state_change_event
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.components.sensor import SensorEntity, SensorStateClass, SensorDeviceClass
from homeassistant.const import UnitOfEnergy

from .entity_name_registry import EntityNameRegistry
from .sensor_name_fixer import _shorten_entity_name

_LOGGER = logging.getLogger(__name__)

# ✅ FIX: API moderne compatible Home Assistant
CYCLES = {
    "hourly": {"minute": 0, "second": 5},
    "daily": {"hour": 0, "minute": 0, "second": 5},
    "weekly": {"hour": 0, "minute": 1, "second": 0},  # Callback daily + condition
    "monthly": {"hour": 0, "minute": 2, "second": 0},  # Callback daily + condition
    "yearly": {"hour": 0, "minute": 3, "second": 0},  # Callback daily + condition
}


class CumulativeEnergyCycleSensor(RestoreEntity, SensorEntity):
    """
    Sensor HSE pour capteurs energy cumulatifs (kWh).
    
    Tracking par delta : suit les variations d'un compteur kWh existant,
    remet à zero à chaque cycle (hourly, daily, etc.).
    """
    
    def __init__(
        self,
        hass: HomeAssistant,
        source_entity: str,
        cycle: str,
        unique_id: str,
        name: str,
        metadata: Dict[str, Any] | None = None
    ):
        self.hass = hass
        self.source_entity = source_entity
        self.cycle = cycle
        self._unique_id = unique_id
        self._name = name
        self.metadata = metadata or {}
        
        self._state: Optional[float] = 0.0
        self._last_source_value: Optional[float] = None
        self._cycle_start_time: Optional[datetime] = None
        
        self._cycle_config = CYCLES[cycle]
        
    async def async_added_to_hass(self) -> None:
        """Setup initial du sensor."""
        await super().async_added_to_hass()
        
        # Restaurer l'état précédent
        if (restored := await self.async_get_last_state()):
            try:
                self._state = float(restored.state)
            except (ValueError, TypeError):
                self._state = 0.0
        
        # ✅ AJOUT 1 : Lire la valeur initiale du sensor source
        await self._read_initial_source_value()
        
        # ✅ AJOUT 2 : Publier l'état initial (même si 0)
        self.async_write_ha_state()
        
        # Démarrer le tracking
        self._setup_tracking()
    
    async def _read_initial_source_value(self):
        """Lit la valeur actuelle du sensor source au démarrage."""
        source_state = self.hass.states.get(self.source_entity)
        if source_state and source_state.state not in ("unknown", "unavailable"):
            try:
                self._last_source_value = float(source_state.state)
                _LOGGER.debug(
                    f"📍 [INIT] {self._name}: source={self.source_entity}, "
                    f"valeur_initiale={self._last_source_value}, state={self._state}"
                )
            except (ValueError, TypeError):
                _LOGGER.warning(
                    f"⚠️ [INIT] {self._name}: impossible de lire {self.source_entity} "
                    f"(state={source_state.state})"
                )
        
    def _setup_tracking(self):
        """Configure le tracking des changements et cycles."""
        # Écouter changements du capteur source
        async_track_state_change_event(
            self.hass, 
            [self.source_entity], 
            self._on_source_changed
        )
        
        # ✅ FIX: API moderne pour reset cyclique
        if self.cycle in ["hourly", "daily"]:
            # Reset direct pour hourly/daily
            async_track_utc_time_change(
                self.hass,
                self._on_cycle_reset,
                **self._cycle_config
            )
        else:
            # Reset conditionnel pour weekly/monthly/yearly
            async_track_utc_time_change(
                self.hass,
                self._on_conditional_reset,
                **self._cycle_config
            )
    
    @callback
    async def _on_source_changed(self, event: Event):
        """Callback sur changement du capteur source."""
        new_state = event.data.get("new_state")
        if not new_state or new_state.state in ("unknown", "unavailable"):
            return
            
        try:
            new_value = float(new_state.state)
        except (ValueError, TypeError):
            return
            
        if self._last_source_value is not None:
            # Calculer delta
            delta = new_value - self._last_source_value
            if delta > 0:  # Seulement increments positifs
                self._state = (self._state or 0) + delta
                # ✅ AJOUT 3 : Log du delta pour debug
                _LOGGER.debug(
                    f"📈 [UPDATE] {self._name}: delta=+{delta:.3f} kWh, "
                    f"total={self._state:.3f} kWh"
                )
                self.async_write_ha_state()
        
        self._last_source_value = new_value
    
    @callback
    async def _on_cycle_reset(self, *args):
        """Reset du compteur à chaque cycle (hourly/daily)."""
        _LOGGER.debug(f"🔄 Reset cycle {self.cycle} pour {self.entity_id}")
        self._state = 0.0
        self._cycle_start_time = datetime.now()
        self.async_write_ha_state()
    
    @callback
    async def _on_conditional_reset(self, now, *args):
        """Reset conditionnel pour weekly/monthly/yearly."""
        should_reset = False
        if self.cycle == "weekly" and now.weekday() == 0:  # Lundi
            should_reset = True
        elif self.cycle == "monthly" and now.day == 1:  # 1er du mois
            should_reset = True
        elif self.cycle == "yearly" and now.month == 1 and now.day == 1:  # 1er janvier
            should_reset = True
        
        if should_reset:
            _LOGGER.debug(f"🔄 Reset cycle {self.cycle} pour {self.entity_id}")
            self._state = 0.0
            self._cycle_start_time = now
            self.async_write_ha_state()
    
    @property
    def unique_id(self) -> str:
        return self._unique_id
    
    @property
    def name(self) -> str:
        return self._name
    
    # ✅ AJOUT 4 : S'assurer que state retourne toujours un nombre
    @property
    def state(self) -> float:
        return round(self._state or 0, 3)
    
    # ✅ AJOUT 5 : Garantir native_value non-null
    @property
    def native_value(self) -> float:
        return self.state
    
    @property
    def unit_of_measurement(self) -> str:
        return UnitOfEnergy.KILO_WATT_HOUR
    
    @property
    def device_class(self) -> str:
        return SensorDeviceClass.ENERGY
    
    @property
    def state_class(self) -> str:
        return SensorStateClass.TOTAL_INCREASING
    
    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        attrs = {
            "source_entity": self.source_entity,
            "cycle": self.cycle,
            "source_type": "energy",
            "last_source_value": self._last_source_value,
        }
        
        # Ajouter métadonnées
        if self.metadata:
            attrs.update({
                "is_virtual": self.metadata.get("is_virtual", False),
                "reliability_score": self.metadata.get("reliability_score", 1.0),
                "reference_type": self.metadata.get("reference_type", "unknown"),
                "tags": self.metadata.get("tags", []),
            })
        
        return attrs


class PowerEnergyCycleSensor(RestoreEntity, SensorEntity):
    """
    Sensor HSE pour capteurs power instantané (W).
    
    Intégration trapézoïdale : W → kWh via calcul temporel,
    remet à zero à chaque cycle.
    """
    
    def __init__(
        self,
        hass: HomeAssistant,
        source_entity: str,
        cycle: str,
        unique_id: str,
        name: str,
        metadata: Dict[str, Any] | None = None
    ):
        self.hass = hass
        self.source_entity = source_entity
        self.cycle = cycle
        self._unique_id = unique_id
        self._name = name
        self.metadata = metadata or {}
        
        self._state: Optional[float] = 0.0
        self._last_power_value: Optional[float] = None
        self._last_update_time: Optional[datetime] = None
        self._cycle_start_time: Optional[datetime] = None
        
        self._cycle_config = CYCLES[cycle]
        
    async def async_added_to_hass(self) -> None:
        """Setup initial du sensor."""
        await super().async_added_to_hass()
        
        # Restaurer l'état précédent
        if (restored := await self.async_get_last_state()):
            try:
                self._state = float(restored.state)
            except (ValueError, TypeError):
                self._state = 0.0
        
        # ✅ AJOUT : Publier l'état initial
        self.async_write_ha_state()
        
        # Démarrer le tracking
        self._setup_tracking()
        
    def _setup_tracking(self):
        """Configure le tracking des changements et cycles."""
        # Écouter changements du capteur source
        async_track_state_change_event(
            self.hass, 
            [self.source_entity], 
            self._on_source_changed
        )
        
        # ✅ FIX: API moderne pour reset cyclique
        if self.cycle in ["hourly", "daily"]:
            # Reset direct pour hourly/daily
            async_track_utc_time_change(
                self.hass,
                self._on_cycle_reset,
                **self._cycle_config
            )
        else:
            # Reset conditionnel pour weekly/monthly/yearly
            async_track_utc_time_change(
                self.hass,
                self._on_conditional_reset,
                **self._cycle_config
            )
    
    @callback
    async def _on_source_changed(self, event: Event):
        """Callback sur changement du capteur power source."""
        new_state = event.data.get("new_state")
        if not new_state or new_state.state in ("unknown", "unavailable"):
            return
            
        try:
            power_w = float(new_state.state)
        except (ValueError, TypeError):
            return
            
        now = datetime.now()
        
        # Intégration trapézoïdale si on a une valeur précédente
        if self._last_power_value is not None and self._last_update_time is not None:
            # Temps écoulé en heures
            time_diff = (now - self._last_update_time).total_seconds() / 3600.0
            
            # Puissance moyenne et énergie
            avg_power = (self._last_power_value + power_w) / 2.0
            energy_kwh = (avg_power / 1000.0) * time_diff
            
            # Sécurité: ignorer les aberrations
            if 0 <= energy_kwh <= 10.0:  # Max 10 kWh par update
                self._state = (self._state or 0) + energy_kwh
                self.async_write_ha_state()
            else:
                _LOGGER.warning(
                    f"⚠️ [POWER-INT] Énergie aberrante ignorée {self.entity_id}: "
                    f"{energy_kwh:.3f} kWh (Δt={time_diff*3600:.1f}s, P_avg={avg_power:.1f}W)"
                )
        
        # Mettre à jour les références
        self._last_power_value = power_w
        self._last_update_time = now
    
    @callback
    async def _on_cycle_reset(self, *args):
        """Reset standard (hourly, daily)."""
        self._reset_counter()
    
    @callback
    async def _on_conditional_reset(self, now, *args):
        """Reset conditionnel pour weekly/monthly/yearly."""
        should_reset = False
        if self.cycle == "weekly" and now.weekday() == 0:  # Lundi
            should_reset = True
        elif self.cycle == "monthly" and now.day == 1:  # 1er du mois
            should_reset = True
        elif self.cycle == "yearly" and now.month == 1 and now.day == 1:  # 1er janvier
            should_reset = True
        
        if should_reset:
            self._reset_counter()
    
    def _reset_counter(self):
        """Reset du compteur."""
        _LOGGER.debug(f"🔄 Reset {self.cycle} pour {self.entity_id}: {self._state:.3f} kWh → 0")
        self._state = 0.0
        self._cycle_start_time = datetime.now()
        self._last_power_value = None
        self._last_update_time = None
        self.async_write_ha_state()
    
    @property
    def unique_id(self) -> str:
        return self._unique_id
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def state(self) -> float:
        return round(self._state or 0, 3)
    
    @property
    def native_value(self) -> float:
        return self.state
    
    @property
    def unit_of_measurement(self) -> str:
        return UnitOfEnergy.KILO_WATT_HOUR
    
    @property
    def device_class(self) -> str:
        return SensorDeviceClass.ENERGY
    
    @property
    def state_class(self) -> str:
        return SensorStateClass.TOTAL_INCREASING
    
    @property
    def extra_state_attributes(self) -> Dict[str, Any]:
        attrs = {
            "source_entity": self.source_entity,
            "cycle": self.cycle,
            "source_type": "power",
            "last_power_w": self._last_power_value,
            "cycle_start": self._cycle_start_time.isoformat() if self._cycle_start_time else None,
        }
        
        # Ajouter métadonnées
        if self.metadata:
            attrs.update({
                "is_virtual": self.metadata.get("is_virtual", False),
                "reliability_score": self.metadata.get("reliability_score", 1.0),
                "reference_type": self.metadata.get("reference_type", "unknown"),
                "tags": self.metadata.get("tags", []),
            })
        
        return attrs


# ============================================================================
# API PUBLIQUE - Création des sensors (Phase 2) — ✅ CORRECTION 2025-11-08
# ============================================================================

async def create_energy_sensors(
    hass: HomeAssistant, 
    capteurs_selection: list[dict]
) -> list[SensorEntity]:
    """
    Crée les sensors de tracking d'énergie selon le type de source.

    Phase 2 : Support energy vs power + propagation fiabilité
    ✅ CORRECTION 2025-11-08: Gestion robuste type null + support power

    Args:
        hass: Instance Home Assistant
        capteurs_selection: Liste des capteurs avec métadonnées enrichies

    Returns:
        Liste des sensors créés (5 cycles × N capteurs)
    """
    sensors = []
    data_dir = Path(__file__).parent / "data"
    registry = EntityNameRegistry(data_dir)
    
    # ✅ OBLIGATOIRE : Charger le registry de manière async
    await registry.async_load()

    for capteur in capteurs_selection:
        source_id = capteur.get("entity_id")
        if not source_id:
            continue
        
        # ✅ CORRECTION: Validation robuste du type
        source_type = capteur.get("type")
        
        # ⚠️ VALIDATION CRITIQUE: Type obligatoire !
        if not source_type:
            _LOGGER.error(
                f"❌ [SKIP-NULL] {source_id} a un type null ! "
                f"Vérifier capteurs_selection.json"
            )
            continue
        
        # ✅ FILTRAGE: Accepter energy ET power
        if source_type not in ["energy", "power"]:
            _LOGGER.warning(f"⏭️ [SKIP] {source_id} type invalide: {source_type}")
            continue
        
        _LOGGER.info(f"✅ [PROCESS] {source_id} (type: {source_type})")
        
        metadata = {
            "is_virtual": capteur.get("is_virtual"),
            "reliability_score": capteur.get("reliability_score"),
            "reference_type": capteur.get("reference_type"),
            "tags": capteur.get("tags", []),
        }

        # ✅ NOUVEAU: Nom complet préservé
        entity_base = source_id.replace("sensor.", "")
        base_name = _shorten_entity_name(entity_base)
        
        # Hash pour unique_id collision-proof
        source_hash = hashlib.md5(source_id.encode()).hexdigest()[:4]
        
        for cycle in CYCLES.keys():
            cycle_short = cycle[0]  # h, d, w, m, y
            
            # Nommage des entity_id
            if "today_energy" in source_id:
                entity_id = f"sensor.hse_{base_name}_{cycle}"
                unique_id = f"hse_{source_hash}_{cycle_short}"
            else:
                entity_id = f"sensor.hse_energy_{base_name}_{cycle}"
                unique_id = f"hse_energy_{source_hash}_{cycle_short}"

            name = f"HSE {entity_base} {cycle.capitalize()}"
            
            # ✅ CORRECTION MAJEURE: Choix du sensor selon le type
            if source_type == "energy":
                # Type energy → CumulativeEnergyCycleSensor (Delta tracking)
                created_sensor = CumulativeEnergyCycleSensor(
                    hass=hass,
                    source_entity=source_id,
                    cycle=cycle,
                    unique_id=unique_id,
                    name=name,
                    metadata=metadata,
                )
                _LOGGER.debug(f"✅ [CREATE-ENERGY] {entity_id} → CumulativeEnergyCycleSensor")
            else:  # source_type == "power"
                # Type power → PowerEnergyCycleSensor (Intégration trapézoïdale)
                created_sensor = PowerEnergyCycleSensor(
                    hass=hass,
                    source_entity=source_id,
                    cycle=cycle,
                    unique_id=unique_id,
                    name=name,
                    metadata=metadata,
                )
                _LOGGER.debug(f"✅ [CREATE-POWER] {entity_id} → PowerEnergyCycleSensor")

            # ✅ Enregistrer dans registry pour friendly names
            await registry.async_register(entity_id, entity_base)
            
            sensors.append(created_sensor)

    # ✅ Return + événement
    _LOGGER.info(f"✅ [CREATE-SENSORS] {len(sensors)} sensors créés au total")
 
    hass.bus.async_fire('hse_energy_sensors_ready', {
        'type': 'energy',
        'count': len(sensors)
    })

    return sensors
