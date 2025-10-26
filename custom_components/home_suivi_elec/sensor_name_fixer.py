"""
Correcteur automatique des noms de sensors HSE trop longs.
Écoute la création des sensors et corrige silencieusement si nécessaire.
"""
import logging
import re
import hashlib
from typing import Optional

from homeassistant.core import HomeAssistant, callback, Event
from homeassistant.helpers import entity_registry as er
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED

_LOGGER = logging.getLogger(__name__)

MAX_ENTITY_ID_LENGTH = 50  # Longueur maximale acceptable


def _shorten_entity_name(name: str, max_length: int = 63) -> str:
    """Fonction de raccourcissement (identique à energy_tracking.py)"""
    available = max_length - 20
    name = name.replace("_today_energy", "")
    
    tech_abbrev = {
        "_puissance": "_pwr",
        "_consommation_actuelle": "_cur",
        "_prise_connectee": "_plug",
        "_prise_intelligente": "_smart",
    }
    for old, new in tech_abbrev.items():
        name = name.replace(old, new)
    
    if len(name) <= available:
        return name
    
    def abbreviate_chain(match):
        parts = match.group(0).split('_')
        if len(parts) >= 4:
            return ''.join(p[0] for p in parts)
        return match.group(0)
    
    name = re.sub(r'\b\w+(?:_\w+){3,}', abbreviate_chain, name)
    
    if len(name) <= available:
        return name
    
    parts = name.split('_')
    for i in range(len(parts)):
        if len(parts[i]) > 6 and len(name) > available:
            parts[i] = parts[i][:4]
            name = '_'.join(parts)
    
    if len(name) <= available:
        return name
    
    keep_length = available - 5
    hash_suffix = hashlib.md5(name.encode()).hexdigest()[:4]
    return name[:keep_length] + "_" + hash_suffix


def _compute_short_entity_id(long_entity_id: str) -> Optional[str]:
    """
    Calcule l'entity_id court à partir d'un entity_id long.
    
    Exemples :
    - sensor.hse_clim_appart1_wifi_commutateur_sur_rail_din_puissance_hourly
      → sensor.hse_live_cwcsrdp_h
    """
    if not long_entity_id.startswith("sensor.hse_"):
        return None
    
    # Extraire base et cycle
    match_live = re.match(r'sensor\.hse_live_(.+)_([hdwmy])$', long_entity_id)
    match_energy = re.match(r'sensor\.hse_(.+)_([hdwmy])$', long_entity_id)
    
    if match_live:
        base_long = match_live.group(1)
        cycle = match_live.group(2)
        prefix = "sensor.hse_live_"
    elif match_energy:
        base_long = match_energy.group(1)
        cycle = match_energy.group(2)
        prefix = "sensor.hse_"
    else:
        return None
    
    # Raccourcir
    base_short = _shorten_entity_name(base_long)
    return f"{prefix}{base_short}_{cycle}"


@callback
async def _fix_long_sensor_name(hass: HomeAssistant, entity_id: str) -> bool:
    """
    Corrige un sensor avec un entity_id trop long.
    Retourne True si correction effectuée.
    """
    if len(entity_id) <= MAX_ENTITY_ID_LENGTH:
        return False
    
    # Calculer le nouveau nom
    new_entity_id = _compute_short_entity_id(entity_id)
    if not new_entity_id:
        _LOGGER.warning(f"⚠️ [HSE] Impossible de calculer nom court pour : {entity_id}")
        return False
    
    # Vérifier que le nouveau n'existe pas déjà
    registry = er.async_get(hass)
    if registry.async_get(new_entity_id):
        _LOGGER.debug(f"✅ [HSE] Nom court existe déjà : {new_entity_id}")
        # Supprimer l'ancien long
        registry.async_remove(entity_id)
        return True
    
    # Renommer
    try:
        entity_entry = registry.async_get(entity_id)
        if entity_entry:
            registry.async_update_entity(entity_id, new_entity_id=new_entity_id)
            _LOGGER.info(
                f"✂️ [HSE] Nom raccourci : {entity_id} ({len(entity_id)}) "
                f"→ {new_entity_id} ({len(new_entity_id)})"
            )
            return True
    except Exception as e:
        _LOGGER.error(f"❌ [HSE] Erreur renommage {entity_id}: {e}")
    
    return False


@callback
async def _on_entity_registry_updated(hass: HomeAssistant, event: Event) -> None:
    """Callback appelé quand le entity_registry est modifié."""
    action = event.data.get("action")
    entity_id = event.data.get("entity_id")
    
    # Surveiller uniquement les créations de sensors HSE
    if action != "create" or not entity_id or not entity_id.startswith("sensor.hse_"):
        return
    
    # Vérifier et corriger si nécessaire
    await _fix_long_sensor_name(hass, entity_id)


async def async_fix_all_long_sensors(hass: HomeAssistant) -> int:
    """
    Corrige TOUS les sensors HSE avec noms trop longs.
    Utilisé par le service manuel.
    
    Returns:
        Nombre de sensors corrigés
    """
    _LOGGER.info("🔧 [HSE] Démarrage correction massive des noms longs...")
    
    registry = er.async_get(hass)
    fixed_count = 0
    
    # Récupérer tous les sensors HSE
    for entity in list(registry.entities.values()):
        entity_id = entity.entity_id
        
        if entity_id.startswith("sensor.hse_") and len(entity_id) > MAX_ENTITY_ID_LENGTH:
            if await _fix_long_sensor_name(hass, entity_id):
                fixed_count += 1
    
    _LOGGER.info(f"✅ [HSE] Correction terminée : {fixed_count} sensors raccourcis")
    return fixed_count


async def async_setup_sensor_name_fixer(hass: HomeAssistant) -> None:
    """
    Configure le système de correction automatique des noms.
    À appeler depuis __init__.py au démarrage de l'intégration.
    """
    _LOGGER.info("🎯 [HSE] Activation du correcteur automatique de noms")
    
    # Écouter les modifications du entity_registry
    hass.bus.async_listen(
        er.EVENT_ENTITY_REGISTRY_UPDATED,
        lambda event: _on_entity_registry_updated(hass, event)
    )
    
    # Correction initiale au démarrage de HA
    @callback
    async def _fix_on_startup(event: Event) -> None:
        await async_fix_all_long_sensors(hass)
    
    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _fix_on_startup)
    
    _LOGGER.info("✅ [HSE] Correcteur automatique activé")
