"""
Module de tracking d'énergie avec cycles automatiques.
Crée des sensors qui cumulent l'énergie et se reset automatiquement.

Architecture Phase 2 :
- CumulativeEnergyCycleSensor : Pour sources energy native (kWh) via delta tracking
- PowerEnergyCycleSensor : Pour sources power (W) via intégration trapézoïdale
- Propagation métadonnées : is_virtual, reliability_score, reference_type, tags
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers.event import async_track_time_change, async_track_state_change_event
from homeassistant.helpers.restore_state import RestoreEntity
from homeassistant.components.sensor import SensorEntity, SensorStateClass, SensorDeviceClass
from homeassistant.const import UnitOfEnergy

_LOGGER = logging.getLogger(__name__)

CYCLES = {
    "hourly": {"hour": None, "minute": 0, "second": 0},
    "daily": {"hour": 0, "minute": 0, "second": 0},
    "weekly": {"day": 1, "hour": 0, "minute": 0},  # Lundi
    "monthly": {"day": 1, "hour": 0, "minute": 0},  # 1er du mois
    "yearly": {"month": 1, "day": 1, "hour": 0, "minute": 0},  # 1er janvier
}


class CumulativeEnergyCycleSensor(RestoreEntity, SensorEntity):
    """
    Sensor pour sources ENERGY native (kWh déjà cumulé).

    Exemples : TP-Link, Shelly, Zigbee avec compteur intégré
    Méthode : Suivi des deltas (différence entre 2 lectures)
    Gestion des resets : Détecte quand le compteur repart à 0
    """

    def __init__(
        self,
        hass: HomeAssistant,
        source_entity: str,
        cycle: str,
        unique_id: str,
        name: str,
        metadata: Optional[dict] = None,
    ):
        """Initialize the cumulative energy cycle sensor."""
        self.hass = hass
        self._source_entity = source_entity
        self._cycle = cycle
        self._attr_unique_id = unique_id
        self._attr_name = name
        self._attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
        self._attr_device_class = SensorDeviceClass.ENERGY
        self._attr_state_class = SensorStateClass.TOTAL
        self._attr_icon = "mdi:lightning-bolt"

        self._value = 0.0
        self._last_reset = None
        self._last_source_value = None  # Dernière valeur du compteur source
        self._metadata = metadata or {}

    async def async_added_to_hass(self) -> None:
        """Restore previous state and setup listeners."""
        await super().async_added_to_hass()

        # Restaurer l'état précédent
        old_state = await self.async_get_last_state()
        if old_state is not None and old_state.state not in ("unknown", "unavailable"):
            try:
                self._value = float(old_state.state)
                _LOGGER.info(f"✅ [ENERGY-DELTA] État restauré pour {self.name}: {self._value} kWh")
            except (ValueError, TypeError):
                _LOGGER.warning(f"⚠️ [ENERGY-DELTA] Impossible de restaurer {self.name}")

        # Écouter les changements du sensor source
        self.async_on_remove(
            async_track_state_change_event(
                self.hass, [self._source_entity], self._handle_source_change
            )
        )

        # Configurer le reset automatique
        self._setup_auto_reset()

        # Initialiser avec la valeur actuelle du source
        source_state = self.hass.states.get(self._source_entity)
        if source_state and source_state.state not in ("unknown", "unavailable"):
            try:
                self._last_source_value = float(source_state.state)
                _LOGGER.debug(f"[{self.name}] Init: {self._last_source_value} kWh")
            except (ValueError, TypeError):
                pass

    @callback
    def _handle_source_change(self, event: Event) -> None:
        """Handle source sensor state change (energy cumulative)."""
        new_state = event.data.get("new_state")
        if new_state is None or new_state.state in ("unknown", "unavailable"):
            return

        try:
            current_value = float(new_state.state)

            # Première lecture
            if self._last_source_value is None:
                self._last_source_value = current_value
                _LOGGER.debug(f"[{self.name}] Initialisation: {current_value} kWh")
                return

            # Détection reset du compteur source
            if current_value < self._last_source_value:
                if current_value < 0.1:  # Vrai reset
                    _LOGGER.info(
                        f"🔄 [ENERGY-DELTA] Reset détecté: {self._source_entity} "
                        f"({self._last_source_value:.3f} → {current_value:.3f} kWh)"
                    )
                    # Ajouter la valeur finale avant reset au cycle
                    self._value += self._last_source_value
                else:
                    # Valeur suspecte, ignorer
                    _LOGGER.warning(
                        f"⚠️ [ENERGY-DELTA] Valeur suspecte ignorée: {self._source_entity} "
                        f"({self._last_source_value:.3f} → {current_value:.3f} kWh)"
                    )
                    return
            else:
                # Calcul du delta normal
                delta = current_value - self._last_source_value

                # Sécurité : ignorer les deltas aberrants (>100 kWh entre 2 lectures)
                if delta > 100:
                    _LOGGER.warning(
                        f"⚠️ [ENERGY-DELTA] Delta aberrant ignoré: {self._source_entity} "
                        f"+{delta:.3f} kWh (de {self._last_source_value:.3f} à {current_value:.3f})"
                    )
                    return

                self._value += delta

                _LOGGER.debug(
                    f"[{self.name}] ΔE = {delta:.6f} kWh "
                    f"(compteur: {self._last_source_value:.3f} → {current_value:.3f})"
                )

            # Mettre à jour la référence
            self._last_source_value = current_value
            self.async_write_ha_state()

        except (ValueError, TypeError) as err:
            _LOGGER.warning(f"⚠️ [ENERGY-DELTA] Erreur {self._source_entity}: {err}")

    def _setup_auto_reset(self) -> None:
        """Configure automatic reset based on cycle."""
        cycle_config = CYCLES.get(self._cycle)
        if not cycle_config:
            _LOGGER.error(f"❌ Cycle inconnu: {self._cycle}")
            return

        _LOGGER.info(f"🔄 Configuration reset {self.name} ({self._cycle})")

        if self._cycle == "weekly":
            async def weekly_reset(now):
                if now.weekday() == 0:  # Lundi = 0
                    self._reset_counter(now)

            async_track_time_change(
                self.hass, weekly_reset, hour=0, minute=0, second=0
            )
        else:
            async_track_time_change(self.hass, self._reset_counter, **cycle_config)

    @callback
    def _reset_counter(self, now) -> None:
        """Reset the counter."""
        _LOGGER.info(
            f"🔄 [ENERGY-DELTA] Reset {self.name} ({self._cycle}) - "
            f"Valeur avant: {self._value:.3f} kWh"
        )
        self._value = 0.0
        self._last_reset = now
        self._last_source_value = None
        self.async_write_ha_state()

    @property
    def native_value(self) -> float:
        """Return the state."""
        return round(self._value, 3)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extra attributes."""
        attrs = {
            "source_entity": self._source_entity,
            "cycle": self._cycle,
            "source_type": "energy",
            "method": "delta_tracking",
            "last_reset": self._last_reset.isoformat() if self._last_reset else None,
            "last_source_value_kwh": self._last_source_value,
        }

        # Propagation métadonnées Phase 2
        if self._metadata.get("is_virtual") is not None:
            attrs["is_virtual"] = self._metadata["is_virtual"]
        if self._metadata.get("reliability_score") is not None:
            attrs["reliability_score"] = self._metadata["reliability_score"]
        if self._metadata.get("reference_type"):
            attrs["reference_type"] = self._metadata["reference_type"]
        if self._metadata.get("tags"):
            attrs["tags"] = self._metadata["tags"]

        return attrs


class PowerEnergyCycleSensor(RestoreEntity, SensorEntity):
    """
    Sensor pour sources POWER (W instantané).

    Exemples : Linky (Atome), Zigbee power-only, simulateurs
    Méthode : Intégration trapézoïdale (W × temps → kWh)
    Précision : Update à chaque changement de la source
    """

    def __init__(
        self,
        hass: HomeAssistant,
        source_entity: str,
        cycle: str,
        unique_id: str,
        name: str,
        metadata: Optional[dict] = None,
    ):
        """Initialize the power-to-energy cycle sensor."""
        self.hass = hass
        self._source_entity = source_entity
        self._cycle = cycle
        self._attr_unique_id = unique_id
        self._attr_name = name
        self._attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
        self._attr_device_class = SensorDeviceClass.ENERGY
        self._attr_state_class = SensorStateClass.TOTAL
        self._attr_icon = "mdi:lightning-bolt"

        self._value = 0.0
        self._last_reset = None
        self._last_power = None
        self._last_update = None
        self._metadata = metadata or {}

    async def async_added_to_hass(self) -> None:
        """Restore previous state and setup listeners."""
        await super().async_added_to_hass()

        # Restaurer l'état précédent
        old_state = await self.async_get_last_state()
        if old_state is not None and old_state.state not in ("unknown", "unavailable"):
            try:
                self._value = float(old_state.state)
                _LOGGER.info(f"✅ [POWER-INTEGRATION] État restauré pour {self.name}: {self._value} kWh")
            except (ValueError, TypeError):
                _LOGGER.warning(f"⚠️ [POWER-INTEGRATION] Impossible de restaurer {self.name}")

        # Écouter les changements du sensor source
        self.async_on_remove(
            async_track_state_change_event(
                self.hass, [self._source_entity], self._handle_source_change
            )
        )

        # Configurer le reset automatique
        self._setup_auto_reset()

        # Initialiser last_update
        self._last_update = datetime.now()

    @callback
    def _handle_source_change(self, event: Event) -> None:
        """Handle source sensor state change (power integration)."""
        new_state = event.data.get("new_state")
        if new_state is None or new_state.state in ("unknown", "unavailable"):
            return

        try:
            power_w = float(new_state.state)

            # Calculer le temps écoulé
            now = datetime.now()
            if self._last_update is not None and self._last_power is not None:
                time_diff_hours = (now - self._last_update).total_seconds() / 3600.0

                # Intégration trapézoïdale
                avg_power = (self._last_power + power_w) / 2.0
                energy_kwh = (avg_power / 1000.0) * time_diff_hours

                # Sécurité : ignorer les calculs aberrants (>10 kWh en une update)
                if energy_kwh > 10.0:
                    _LOGGER.warning(
                        f"⚠️ [POWER-INTEGRATION] Énergie aberrante ignorée: {self._source_entity} "
                        f"+{energy_kwh:.3f} kWh (P_avg={avg_power:.1f}W, Δt={time_diff_hours*3600:.1f}s)"
                    )
                else:
                    self._value += energy_kwh

                    _LOGGER.debug(
                        f"[{self.name}] ΔE = {energy_kwh:.6f} kWh "
                        f"(Δt={time_diff_hours*3600:.1f}s, P_avg={avg_power:.1f}W)"
                    )

            # Mettre à jour les références
            self._last_power = power_w
            self._last_update = now

            self.async_write_ha_state()

        except (ValueError, TypeError) as err:
            _LOGGER.warning(f"⚠️ [POWER-INTEGRATION] Erreur {self._source_entity}: {err}")

    def _setup_auto_reset(self) -> None:
        """Configure automatic reset based on cycle."""
        cycle_config = CYCLES.get(self._cycle)
        if not cycle_config:
            _LOGGER.error(f"❌ Cycle inconnu: {self._cycle}")
            return

        _LOGGER.info(f"🔄 Configuration reset {self.name} ({self._cycle})")

        if self._cycle == "weekly":
            async def weekly_reset(now):
                if now.weekday() == 0:  # Lundi = 0
                    self._reset_counter(now)

            async_track_time_change(
                self.hass, weekly_reset, hour=0, minute=0, second=0
            )
        else:
            async_track_time_change(self.hass, self._reset_counter, **cycle_config)

    @callback
    def _reset_counter(self, now) -> None:
        """Reset the counter."""
        _LOGGER.info(
            f"🔄 [POWER-INTEGRATION] Reset {self.name} ({self._cycle}) - "
            f"Valeur avant: {self._value:.3f} kWh"
        )
        self._value = 0.0
        self._last_reset = now
        self._last_power = None
        self._last_update = now
        self.async_write_ha_state()

    @property
    def native_value(self) -> float:
        """Return the state."""
        return round(self._value, 3)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return extra attributes."""
        attrs = {
            "source_entity": self._source_entity,
            "cycle": self._cycle,
            "source_type": "power",
            "method": "trapezoidal_integration",
            "last_reset": self._last_reset.isoformat() if self._last_reset else None,
            "last_power_w": self._last_power,
        }

        # Propagation métadonnées Phase 2
        if self._metadata.get("is_virtual") is not None:
            attrs["is_virtual"] = self._metadata["is_virtual"]
        if self._metadata.get("reliability_score") is not None:
            attrs["reliability_score"] = self._metadata["reliability_score"]
        if self._metadata.get("reference_type"):
            attrs["reference_type"] = self._metadata["reference_type"]
        if self._metadata.get("tags"):
            attrs["tags"] = self._metadata["tags"]

        return attrs


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

    for capteur in capteurs_selection:
        source_id = capteur.get("entity_id")
        if not source_id:
            continue

        source_type = capteur.get("type", "power")  # Default: power

        # Extraire métadonnées Phase 2
        metadata = {
            "is_virtual": capteur.get("is_virtual"),
            "reliability_score": capteur.get("reliability_score"),
            "reference_type": capteur.get("reference_type"),
            "tags": capteur.get("tags", []),
        }

        # Nommage
        base_name = source_id.replace("sensor.", "")
        sensor_name = base_name.replace("_", " ").title()

        # Créer 5 cycles (hourly, daily, weekly, monthly, yearly)
        for cycle in CYCLES.keys():
            unique_id = f"hse_{base_name}_{cycle}_energy"
            name = f"HSE {sensor_name} {cycle.capitalize()}"

            # Choisir la classe selon type
            if source_type == "energy":
                sensor = CumulativeEnergyCycleSensor(
                    hass=hass,
                    source_entity=source_id,
                    cycle=cycle,
                    unique_id=unique_id,
                    name=name,
                    metadata=metadata,
                )
                _LOGGER.debug(f"✅ ENERGY sensor créé: {name} (delta tracking)")
            else:  # power
                sensor = PowerEnergyCycleSensor(
                    hass=hass,
                    source_entity=source_id,
                    cycle=cycle,
                    unique_id=unique_id,
                    name=name,
                    metadata=metadata,
                )
                _LOGGER.debug(f"✅ POWER sensor créé: {name} (intégration)")

            sensors.append(sensor)

    return sensors
