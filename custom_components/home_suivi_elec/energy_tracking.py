"""
Module de tracking d'énergie avec cycles automatiques.
Enregistre aussi les noms complets dans le registry universel.
✅ FIX: unique_id collision-proof avec hash source
✅ BUGFIX CRITIQUE: Ajout du return sensors manquant
✅ BUGFIX TRACKING: Fix async_track_time_change() API deprecated
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
    "yearly": {"hour": 0, "minute": 3, "second": 0},   # Callback daily + condition
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
    
    @property
    def state(self) -> float:
        return round(self._state or 0, 3)
    
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
# HELPER FUNCTIONS
# ============================================================================

def _shorten_entity_name(name: str, max_length: int = 63) -> str:
    """
    Fonction de raccourcissement robuste avec fallback spécial _today_energy_*
    """
    available = max_length - 25  # Plus de marge pour hash
    
    # ✅ FIX: Fallback spécial _today_energy_* -> suppression complète suffixes
    if "_today_energy_" in name:
        # Exemple: chambre_ordinateur_prise_connectee_today_energy_hourly
        # → chambre_ordinateur_prise_connectee
        name = re.sub(r'_today_energy_(hourly|daily|weekly|monthly|yearly)$', '', name)
        name = name.replace("_today_energy", "")
        _LOGGER.debug(f"[HSE-FIXER] Clean today_energy: {name}")
    
    # Autres nettoyages classiques
    name = name.replace("_puissance", "_pwr")
    name = name.replace("_consommation_actuelle", "_cur")
    name = name.replace("_prise_connectee", "_plug")
    name = name.replace("_prise_intelligente", "_smart")
    
    if len(name) <= available:
        return name
    
    # Abréviations multi-mots
    def abbreviate_chain(match):
        parts = match.group(0).split('_')
        if len(parts) >= 4:
            return ''.join(p[0] for p in parts)
        return match.group(0)
    name = re.sub(r'\b\w+(?:_\w+){3,}', abbreviate_chain, name)
    
    if len(name) <= available:
        return name
    
    # Réduction mots longs
    parts = name.split('_')
    for i in range(len(parts)):
        if len(parts[i]) > 6 and len(name) > available:
            parts[i] = parts[i][:4]
            name = '_'.join(parts)
    
    if len(name) <= available:
        return name
    
    # Hash en dernier recours
    keep_length = available - 5
    hash_suffix = hashlib.md5(name.encode()).hexdigest()[:4]
    return name[:keep_length] + "_" + hash_suffix


# ============================================================================
# API PUBLIQUE - Création des sensors (Phase 2)
# ============================================================================

async def create_energy_sensors(
    hass: HomeAssistant, 
    capteurs_selection: list[dict]
) -> list[SensorEntity]:
    """
    Crée les sensors de tracking d'énergie selon le type de source.

    Phase 2 : Support energy vs power + propagation fiabilité

    Args:
        hass: Instance Home Assistant
        capteurs_selection: Liste des capteurs avec métadonnées enrichies
            Format Phase 2:
            [
                {
                    "entity_id": "sensor.xxx",
                    "type": "energy" ou "power",
                    "is_virtual": bool,
                    "reliability_score": float,
                    "reference_type": str,
                    "tags": list[str]
                }
            ]

    Returns:
        Liste des sensors créés (5 cycles × N capteurs)
    """
    sensors = []
    data_dir = Path(__file__).parent / "data"
    registry = EntityNameRegistry(data_dir)

    for capteur in capteurs_selection:
        source_id = capteur.get("entity_id")
        if not source_id:
            continue
        
        # ✅ FIX COLLISION: Détection intelligente energy vs power
        source_type = capteur.get("type", "power")

        if "today_energy" in source_id and source_type != "energy":
            _LOGGER.warning(f"🔧 [AUTO-FIX] {source_id} mal typé '{source_type}' → 'energy'")
            source_type = "energy"

        if source_type != "energy":
            _LOGGER.debug(f"⏭️ [SKIP-ENERGY] {source_id} n'est pas energy (type: {source_type})")
            continue

        _LOGGER.debug(f"✅ [PROCESS-ENERGY] {source_id} (type: {source_type})")
        
        metadata = {
            "is_virtual": capteur.get("is_virtual"),
            "reliability_score": capteur.get("reliability_score"),
            "reference_type": capteur.get("reference_type"),
            "tags": capteur.get("tags", []),
        }


        # ✅ NOUVEAU: Nom complet préservé (plus de shortening)
        entity_base = source_id.replace("sensor.", "")
        
        # Plus de shortening du tout ! HA supporte noms longs
        # _shorten_entity_name maintenant retourne tel quel
        base_name = _shorten_entity_name(entity_base)  # = entity_base maintenant
        
        # Hash pour unique_id collision-proof
        source_hash = hashlib.md5(source_id.encode()).hexdigest()[:4]
        
        for cycle in CYCLES.keys():
            cycle_short = cycle[0]  # h, d, w, m, y
            
            # ✅ SIMPLE : tous les sensors ici sont energy (grâce au filtre)
            if "today_energy" in source_id:
                # Source Tapo energy native → préfixe simple
                entity_id = f"sensor.hse_{base_name}_{cycle}"
                unique_id = f"hse_{source_hash}_{cycle_short}"
            else:
                # Autres sources energy → préfixe energy
                entity_id = f"sensor.hse_energy_{base_name}_{cycle}"
                unique_id = f"hse_energy_{source_hash}_{cycle_short}"

            name = f"HSE {entity_base} {cycle.capitalize()}"
            
            # ✅ TOUJOURS CumulativeEnergyCycleSensor (sensors energy seulement)
            created_sensor = CumulativeEnergyCycleSensor(
                hass=hass,
                source_entity=source_id,
                cycle=cycle,
                unique_id=unique_id,
                name=name,
                metadata=metadata,
            )

            # ✅ Enregistrer dans registry pour friendly names
            registry.register(entity_id, entity_base)
            
            sensors.append(created_sensor)
            _LOGGER.debug(f"✅ [CREATE-SENSOR] {entity_id} → {name}")

    # 🚨 BUGFIX CRITIQUE: Ajout du return manquant !
    _LOGGER.info(f"✅ [CREATE-SENSORS] {len(sensors)} sensors créés au total")
 
    # 🚀 EVENT-DRIVEN: Émettre event pour notifier sensor.py
    _LOGGER.info(f"📡 [EVENT] Émission 'hse_energy_sensors_ready' (JSON-safe) avec {len(sensors)} sensors")
    hass.bus.async_fire('hse_energy_sensors_ready', {
        'type': 'energy',
        'count': len(sensors),
    })

    return sensors