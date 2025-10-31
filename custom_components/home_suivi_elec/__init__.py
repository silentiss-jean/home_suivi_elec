# ... imports existants ...
from .api_extra_views import async_register_extra_views
# ...
    # Enregistrement des vues additionnelles (registry, diagnostic groups)
    try:
        await async_register_extra_views(hass)
        _LOGGER.info("✅ Vues additionnelles enregistrées (registry, diagnostic_groups)")
    except Exception as e:
        _LOGGER.error("❌ Enregistrement vues additionnelles: %s", e)
# ... reste du fichier ...
