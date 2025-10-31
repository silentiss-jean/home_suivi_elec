    _LOGGER.info("🔋 [PHASE 2] Energy Tracking configuré avec succès")
    
    # 🚨 FIX TIMING: Recharger la plateforme sensor MAINTENANT que hass.data est prêt
    _LOGGER.info("🔄 [TIMING-FIX] Rechargement plateforme sensor avec les 320 sensors")
    try:
        # Force reload de la plateforme sensor maintenant que hass.data["energy_sensors"] est populé
        await hass.config_entries.async_reload_platforms(entry, ["sensor"])
        _LOGGER.info("✅ [TIMING-FIX] Plateforme sensor rechargée avec succès")
    except Exception as e:
        _LOGGER.error(f"❌ [TIMING-FIX] Erreur rechargement sensor: {e}")