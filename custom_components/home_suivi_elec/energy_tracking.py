    # 🚨 BUGFIX CRITIQUE: Ajout du return manquant !
    _LOGGER.info(f"✅ [CREATE-SENSORS] {len(sensors)} sensors créés au total")
    
    # 🚀 EVENT-DRIVEN: Émettre event pour notifier sensor.py
    _LOGGER.info(f"📡 [EVENT] Émission 'hse_energy_sensors_ready' avec {len(sensors)} sensors")
    hass.bus.async_fire('hse_energy_sensors_ready', {
        'sensors': sensors,
        'count': len(sensors),
        'type': 'energy',
        'timestamp': datetime.now().isoformat()
    })
    
    return sensors