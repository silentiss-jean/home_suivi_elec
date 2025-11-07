from homeassistant.helpers.entity_registry import async_get as entity_registry_async_get
import logging

_LOGGER = logging.getLogger(__name__)

async def migrate_cleanup_custom_hse_sensors(hass):
    """Supprime tous les sensors custom HSE pour migrer vers utility_meter natif."""
    er = entity_registry_async_get(hass)
    custom_sensors = [
        entity.entity_id
        for entity in er.entities.values()
        if entity.entity_id.startswith("sensor.hse_") and entity.platform == "home_suivi_elec"
    ]
    _LOGGER.info(f"🔄 Migration: {len(custom_sensors)} sensors custom à supprimer")
    for entity_id in custom_sensors:
        try:
            er.async_remove(entity_id)
            _LOGGER.info(f"🗑️ Supprimé: {entity_id}")
        except Exception as e:
            _LOGGER.error(f"❌ Erreur suppression {entity_id}: {e}")
    _LOGGER.info("✅ Migration terminée : sensors custom supprimés")

# Ajout d'une fonction manuelle pour l'appel HA service
async def handle_migrate_cleanup_custom_sensors(call):
    hass = call.hass
    await migrate_cleanup_custom_hse_sensors(hass)
    _LOGGER.info("✅ Service cleanup_sensors_custom_hse exécuté")
