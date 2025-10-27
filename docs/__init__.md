===============================================================================
 INITIALISATION, SERVICES ET POINTS D'ENTRÉE DU SYSTÈME - HOME SUIVI ÉLEC
 Documentation complète - Octobre 2025
===============================================================================

📋 TABLE DES MATIÈRES
  1. Vue d'ensemble
  2. Architecture du système
  3. Fichiers créés et modifiés
  4. APIs REST disponibles
  5. Services personnalisés Home Assistant
  6. Workflow d'initialisation
  7. Dépannage
  8. Exemples d'utilisation

===============================================================================
1. VUE D'ENSEMBLE
===============================================================================

Le fichier `__init__.py` orchestre toute l'intégration Home Suivi Élec :
- Chargement des configurations et options utilisateur
- Initialisation asynchrone du composant et de ses entrées
- Enregistrement des panneaux frontend dans la sidebar Home Assistant
- Déclenchement de la détection automatique et du tracking énergétique
- Enregistrement de tous les services personnalisés et des API REST
- Lancement des tâches différées pour la synchronisation, le monitoring et la migration
- Gestion des événements clés du cycle de vie Home Assistant

===============================================================================
2. ARCHITECTURE DU SYSTÈME
===============================================================================

┌──────────────────────────────────────────────────────────┐
│ BACKEND (__init__.py)                                   │
├──────────────────────────────────────────────────────────┤
│  async_setup()              → Setup général du domaine   │
│  async_setup_entry()        → Setup de chaque config     │
│  register_panel_when_ready  → Ajout du panneau UI        │
│  async_add_entities         → Enregistrement sensors     │
│  handle_*                   → Services personnalisés     │
│  API REST                   → Diagnostics, best, ignore  │
│  Tasks asynchrones          → Détection, migration, UI   │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MODULES IMPORTÉS                                           │
├─────────────────────────────────────────────────────────────┤
│  .const, .detect_local, .generator, .debug_json_sets        │
│  .manage_selection, .options_flow, .sensor_name_fixer       │
│  .panel_static, .proxy_api, .migration_cleanup              │
│  .power_monitoring, .energy_tracking, .sensor_sync_manager  │
│  .manage_selection_views (APIs REST qualité/doublons)       │
└─────────────────────────────────────────────────────────────┘

===============================================================================
3. FICHIERS CRÉÉS ET MODIFIÉS
===============================================================================

📄 /config/custom_components/home_suivi_elec/__init__.py
    - Point d’entrée global de l’intégration
    - Enregistrement des services, APIs, et synchronisation

📝 Fichiers impactés :
    - manage_selection_views.py (APIs REST)
    - sensor_name_fixer.py (correcteur auto)
    - web_static/* (UI copiée en www/community/…)
    - migration_cleanup.py (migrations)

===============================================================================
4. APIs REST DISPONIBLES
===============================================================================

API 1 : Définir capteur ignoré
URL      : /api/home_suivi_elec/set_ignored_entity
Méthode  : POST
Réponse  : {"success": True, "ignored_entities": [...]}

API 2 : Choisir le meilleur capteur par device
URL      : /api/home_suivi_elec/choose_best_for_device
Méthode  : POST
Réponse  : {"success": True, "best": ..., "ignored": [...]}

API 3 : Diagnostics globaux capteurs
URL      : /api/home_suivi_elec/get_diagnostics
Méthode  : GET
Réponse  : Statut, sources, intégrations, utility_meters, dump global

API 4 : Proxy et autres vues (via SuiviElecProxyView)
URL      : /api/home_suivi_elec/...

===============================================================================
5. SERVICES PERSONNALISÉS HOME ASSISTANT
===============================================================================

- fix_sensor_names            : Correction automatique des noms des sensors
- generate_local_data         : Détection locale de tous les capteurs
- generate_lovelace_auto      : Génération automatisée de la config UI
- generate_selection          : Synchronisation YAML pour utility_meter
- copy_ui_files               : Copie des fichiers web_static dans www/community
- reset_integration_sensor    : Réinitialisation d’un sensor d’intégration
- migrate_cleanup             : Nettoyage massif sensors aberrants

Chaque service est accessible en appel via ServiceCall (dev tools HA → Services).

===============================================================================
6. WORKFLOW D'INITIALISATION
===============================================================================

1. Chargement du composant → `async_setup_entry`
    • Lit les configs/entrées utilisateur
    • Active le correcteur de noms
    • Enregistre tous les services et APIs
    • Met en place listeners pour le démarrage HA

2. Démarrage différé :
    • Attente démarrage HA (EVENT_HOMEASSISTANT_STARTED)
    • Lancement tâches :
        - Détection locale (detect_local.py)
        - Tracking énergétique (energy_tracking.py)
        - Power Monitoring (power_monitoring.py)
        - Sensor synchronizer (sensor_sync_manager.py)
        - UI et APIs REST (manage_selection_views.py)

3. Initialisation UI pane :
    • Ajout du panneau frontend “⚡ Suivi Élec” dans la sidebar
    • Copie web_static vers www/community/home_suivi_elec_ui

4. APIs REST et Services :
    • Exposées immédiatement après setup
    • Très faible latence locale (accès direct HTTP)

===============================================================================
7. DÉPANNAGE
===============================================================================

PROBLÈME 1 : Service non disponible
→ Vérifier dans Outils Dev HA > Services, recharger l’intégration si absent

PROBLÈME 2 : Panel UI non visible
→ Vérifier le log "[SETUP_ENTRY]" / relancer Home Assistant

PROBLÈME 3 : Erreur API REST
→ Consulter les logs. Tester en local :
  curl http://localhost:8123/api/home_suivi_elec/get_diagnostics

PROBLÈME 4 : Détection jamais lancée
→ S’assurer que EVENT_HOMEASSISTANT_STARTED est bien déclenché
→ Restart HA si besoin

===============================================================================
8. EXEMPLES D'UTILISATION
===============================================================================

Exemple : Correction noms capteurs
  - Dev Tools HA > Service "home_suivi_elec.fix_sensor_names", appeler

Exemple : Synchroniser YAML après détection
  - Service "home_suivi_elec.generate_selection", puis restart utility_meter

Exemple : Obtenir diagnostics globaux
  curl http://localhost:8123/api/home_suivi_elec/get_diagnostics

===============================================================================
HISTORIQUE DES VERSIONS
===============================================================================

v1.0 beta (27 octobre 2025)
  ✅ Initialisation complète async/await
  ✅ Services personnalisés et APIs REST implémentés
  ✅ Copie automatisée UI + Panel Home Assistant
  ✅ Détection et tracking énergétique avancé
  ✅ Synchronisation sensors/utility_meter

===============================================================================
SUPPORT ET CONTRIBUTION
===============================================================================

Pour toute question :
  - Vérifier la section dépannage ci-dessus
  - Ouvrir une issue sur le dépôt GitHub

Pour contribuer :
  • Proposer l’ajout de nouveaux services ou APIs REST
  • Améliorer le workflow d’initialisation selon votre cas d’usage

===============================================================================
FIN DE LA DOCUMENTATION
===============================================================================

