from .utility_meter_manager import sync_utility_meters
import logging
_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass, entry):
    # Récupérer la sélection (adapte ici selon ta structure)
    try:
        # Par défaut/legacy, essaye de charger l'index de sélection
        from .manage_selection import async_get_capteurs_index
        selection = await async_get_capteurs_index(hass)
        # Sélection sous forme dict entity_id → infos dict
        selected_ids = [eid for eid, d in (selection or {}).items() if d and not d.get("ignored", False)]
        user_config = getattr(entry, 'data', {})
        await sync_utility_meters(selected_ids, hass, user_config)
        await hass.services.async_call("homeassistant", "reload_core_config")
        _LOGGER.info(f"✅ Génération utility_meter automatique pour {len(selected_ids)} capteurs")
    except Exception as e:
        _LOGGER.error(f"❌ Erreur fallback utility_meter: {e}")
    # Reprise de la suite de ton setup normalement... (panel UI, services, flows etc)
    return True
