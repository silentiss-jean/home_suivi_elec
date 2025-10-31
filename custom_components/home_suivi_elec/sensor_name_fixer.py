"""
Correcteur automatique des noms de sensors HSE trop longs.
Écoute la création des sensors et corrige silencieusement si nécessaire.
✅ FIX: fallback pour _today_energy_* (suppression propre des suffixes)
"""
import logging
import re
import hashlib
from typing import Optional

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers import entity_registry as er
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED

_LOGGER = logging.getLogger(__name__)

MAX_ENTITY_ID_LENGTH = 50

def _shorten_entity_name(entity_name: str, max_length: int = 999) -> str:
    """
    ✅ NO-SHORTENING VERSION COMPLÈTE
    Plus de transformation du tout ! Préserve entity_id complet.
    """
    name = entity_name
    
    # ✅ Nettoyer SEULEMENT patterns _today_energy legacy
    name = name.replace("_today_energy_hourly", "")
    name = name.replace("_today_energy_daily", "")
    name = name.replace("_today_energy_weekly", "")
    name = name.replace("_today_energy_monthly", "")
    name = name.replace("_today_energy_yearly", "")
    name = name.replace("_today_energy", "")
    
    # ❌ SUPPRIMER TOUTES ces transformations qui cassent le mapping !
    # name = name.replace("_puissance", "_pwr")              # ❌ SUPPRIMÉ
    # name = name.replace("_consommation_actuelle", "_cur")  # ❌ SUPPRIMÉ
    # name = name.replace("_prise_connectee", "_plug")       # ❌ SUPPRIMÉ
    # name = name.replace("_prise_intelligente", "_smart")   # ❌ SUPPRIMÉ
    
    _LOGGER.debug(f"[NO-TRANSFORM] {entity_name} → {name} (len: {len(name)})")
    
    return name  # ✅ PRÉSERVÉ INTÉGRALEMENT
    
def _compute_short_entity_id(long_entity_id: str) -> Optional[str]:
    if not long_entity_id.startswith("sensor.hse_"):
        return None
    
    # ✅ FIX: Support _today_energy_* patterns
    match_today = re.match(r'sensor\.hse_(.+)_today_energy_([hdwmy])$', long_entity_id)
    match_live = re.match(r'sensor\.hse_live_(.+)_([hdwmy])$', long_entity_id)
    match_energy = re.match(r'sensor\.hse_(.+)_([hdwmy])$', long_entity_id)
    
    if match_today:
        base_long = match_today.group(1)
        cycle = match_today.group(2)
        prefix = "sensor.hse_"
    elif match_live:
        base_long = match_live.group(1)
        cycle = match_live.group(2)
        prefix = "sensor.hse_live_"
    elif match_energy:
        base_long = match_energy.group(1)
        cycle = match_energy.group(2)
        prefix = "sensor.hse_"
    else:
        return None
    
    base_short = _shorten_entity_name(base_long)
    return f"{prefix}{base_short}_{cycle}"

@callback
async def _fix_long_sensor_name(hass: HomeAssistant, entity_id: str) -> bool:
    if len(entity_id) <= MAX_ENTITY_ID_LENGTH:
        return False
    new_entity_id = _compute_short_entity_id(entity_id)
    if not new_entity_id:
        # ✅ FIX: Fallback pour les cas difficiles (plus de warning)
        _LOGGER.debug(f"[HSE-FIXER] Pattern non supporté, ignore: {entity_id}")
        return False
    registry = er.async_get(hass)
    if registry.async_get(new_entity_id):
        _LOGGER.debug(f"✅ [HSE] Nom court existe déjà : {new_entity_id}")
        registry.async_remove(entity_id)
        return True
    try:
        entity_entry = registry.async_get(entity_id)
        if entity_entry:
            registry.async_update_entity(entity_id, new_entity_id=new_entity_id)
            _LOGGER.info(f"✂️ [HSE] Nom raccourci : {entity_id} ({len(entity_id)}) → {new_entity_id} ({len(new_entity_id)})")
            return True
    except Exception as e:
        _LOGGER.error(f"❌ [HSE] Erreur renommage {entity_id}: {e}")
    return False

@callback
async def _on_entity_registry_updated(hass: HomeAssistant, event: Event) -> None:
    action = event.data.get("action")
    entity_id = event.data.get("entity_id")
    if action != "create" or not entity_id or not entity_id.startswith("sensor.hse_"):
        return
    await _fix_long_sensor_name(hass, entity_id)

async def async_fix_all_long_sensors(hass: HomeAssistant) -> int:
    _LOGGER.info("🔧 [HSE] Démarrage correction massive des noms longs...")
    registry = er.async_get(hass)
    fixed_count = 0
    for entity in list(registry.entities.values()):
        entity_id = entity.entity_id
        if entity_id.startswith("sensor.hse_") and len(entity_id) > MAX_ENTITY_ID_LENGTH:
            if await _fix_long_sensor_name(hass, entity_id):
                fixed_count += 1
    _LOGGER.info(f"✅ [HSE] Correction terminée : {fixed_count} sensors raccourcis")
    return fixed_count

async def async_setup_sensor_name_fixer(hass: HomeAssistant) -> None:
    _LOGGER.info("🎯 [HSE] Activation du correcteur automatique de noms")
    hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, lambda event: _on_entity_registry_updated(hass, event))
    @callback
    async def _fix_on_startup(event: Event) -> None:
        await async_fix_all_long_sensors(hass)
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _fix_on_startup)
    _LOGGER.info("✅ [HSE] Correcteur automatique activé")
