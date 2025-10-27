===============================================================================
 PLATEFORME SENSOR — ENREGISTREMENT DES SENSORS HSE - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Rôle du fichier
  2. Fonctionnement principal
  3. Intégration Phases 2/2.5
  4. Gestion des entités power/energy
  5. Points d’attention

===============================================================================
1. RÔLE DU FICHIER
===============================================================================

Le fichier  gère la **création et l’enregistrement dynamique de toutes les entités “sensor”** pour Home Suivi Élec :
- Inclut automatiquement tous les capteurs “energy” (kWh, cycles) et “power live” (W, temps réel)

===============================================================================
2. FONCTIONNEMENT PRINCIPAL
===============================================================================

- Définit async_setup_entry, point d’entrée pour l’enregistrement automatique :
  • Scanne les listes energy_sensors et live_power_sensors agrégées dans hass.data[DOMAIN]
  • Fusionne et enregistre tous les sensors pour Home Assistant en une seule fois (async_add_entities)

===============================================================================
3. INTÉGRATION PHASES 2/2.5
===============================================================================

- Phase 2 : energy tracking classique (création de sensor.hse_{slug}_daily, ..._weekly, etc.)
- Phase 2.5 : monitoring temps réel power (sensor.hse_live_{slug})

===============================================================================
4. GESTION DES ENTITÉS POWER/ENERGY
===============================================================================

- Permet d’avoir un inventaire auto-maintenu de tous les capteurs exposés par l’intégration
- Peut servir de base pour automatiser exportation ou l’historisation

===============================================================================
5. POINTS D’ATTENTION

- Si aucun sensor n’apparaît: vérifier que manage_selection, detect_local, et energy_tracking fonctionnent et populent bien hass.data
- Log très explicite pour le debug (compte sensors par type à l’enregistrement)

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================
