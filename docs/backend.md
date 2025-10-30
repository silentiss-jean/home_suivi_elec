# Documentation Backend — auto-générée

Ce fichier est généré automatiquement à partir des scripts Python de `custom_components/home_suivi_elec`.
Chaque section présente le rôle métier, les classes/fonctions/services/endpoints, logs et dépendances détectés.

---
## 🕸️ Dépendances backend (Mermaid)

```
graph TD
```

#### __init__.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/__init__.py`
- **Rôle métier** : Home Suivi Élec — Backend principal de l’intégration Home Assistant.

Orchestrateur global : gère initialisation, cycle de vie, enregistrement des services Home Assistant, endpoints REST, configuration du panel UI, synchronisation et maintenance des capteurs énergétiques.
Coordonne les modules backend métiers : détection, sélection, scoring, diagnostics, tracking, backup.
Toutes les clés métier et hass.data transitent par ce module central.
- **Fonction(s) critique(s) :**
    - `_copy_ui_blocking` : 
    - `async_get_options_flow` : 
- **Services HA :**
    - `reset_integration_sensor`
    - `generate_local_data`
    - `generate_selection`
    - `copy_ui_files`
    - `fix_sensor_names`
    - `generate_lovelace_auto`
- **Endpoints REST :**
    - `/api/home_suivi_elec/set_ignored_entity`
    - `/api/home_suivi_elec/get_diagnostics`
    - `/api/home_suivi_elec/choose_best_for_device`
- **Clés hass.data :**
    - hass.data[DOMAIN]
- **Logs/caractéristiques :** exception, debug, warning, error, info
- **Imports internes détectés** : manage_selection

---
#### __init__.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/helpers/__init__.py`
- **Rôle métier** : Package helpers pour Home Suivi Élec.

---
#### config_flow.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/config_flow.py`
- **Classe(s) principale(s) :**
    - `HomeSuiviElecFlow` : Config flow pour Home Suivi Élec avec nom du hub et tarifs.

---
#### const.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/const.py`
- **Rôle métier** : Constantes globales pour Home Suivi Élec.
- **Fonction(s) critique(s) :**
    - `de` :     Centralisation des constantes métier, chemins, options, clés, tarifs et conventions d’intégration.
[Source: backend.md, module const.py]
    Fonction insérée automatiquement — compléter logique métier.
    

---
#### debug_json_sets.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/debug_json_sets.py`
- **Rôle métier** : Outils de debug JSON pour Home Suivi Élec.
- **Fonction(s) critique(s) :**
    - `_read_json_file` : Lecture d’un fichier JSON dans un thread dédié (évite le warning Home Assistant).
- **Logs/caractéristiques :** error, warning

---
#### detect_energy.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/detect_energy.py`

---
#### detect_local.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/detect_local.py`
- **Rôle métier** : Détection automatique des capteurs power/energy depuis Home Assistant.

VERSION 2.10 : Détection multi-intégration complète
  ✅ Détection native sans subprocess jq
  ✅ Classification enrichie (device_class > unit > state_class)
  ✅ Filtrage intelligent avec valeurs par défaut
  ✅ Architecture prête pour config_entry.options (TODO CONFIG)
  ✅ Tagging des helpers
  ✅ Détection multi-plateforme enrichie
  ✅ NOUVEAU : Groupement par (device_id, integration) pour capturer TOUTES les intégrations
  ✅ NOUVEAU : Conservation des sensors de toutes les intégrations (Tapo + TP-Link + etc.)

PRIORITÉS :
  1. Energy (kWh) physique > Power (W) physique
  2. Energy virtuel (PowerCalc) > Power virtuel (PowerCalc)
  3. Physique > Virtuel > Helper
  4. today_energy > device_energy (pour Tapo/Tuya)

TAGS ENRICHIS :
  - integration: platform utilisé pour ce sensor
  - platform_declared: entry.platform (source officielle)
  - platform_detected: premier platform via device identifiers
  - is_multi_platform: true si même device physique dans plusieurs intégrations
  - all_platforms: liste de toutes les plateformes détectées
  - physical_signature: empreinte unique du device physique (pour groupement UI)
  - reference_type: "physical" | "calculated" | "aggregated"
  - is_virtual, is_helper, helper_type
- **Fonction(s) critique(s) :**
    - `__get_excluded_platforms` : 
    - `__get_helper_platforms` : 
    - `__should_detect_helpers` : 
    - `__get_energy_platforms_from_registry` : 
    - `__classify_sensor` : 
    - `__classify_platform` : 
    - `__calculate_priority` : 
    - `__calculate_reliability_score` : 
    - `__detect_all_platforms_from_device` : 
    - `__get_physical_device_signature` : 
    - `__detect_integration_complete` : 
    - `__read_json_sync` : 
    - `__write_json_sync` : 
    - `__load_quality_map_sync` : 
    - `__is_premium` : 
    - `__device_signature` : 
    - `__get_name_preference` : 
    - `__detect_from_hass` : VERSION 2.10 : Groupement par (device_id, integration) pour capturer
TOUTES les intégrations d'un même device physique.
    - `__annotate_and_deduplicate` : 
- **Logs/caractéristiques :** debug, error, info

---
#### detect_local_debug_standalone.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/detect_local_debug_standalone.py`
- **Rôle métier** : Diagnostic autonome : détection des intégrations et capteurs energy/power
--------------------------------------------------------------------------

Ce script lit directement la base SQLite de Home Assistant
(`/config/home-assistant_v2.db`) pour repérer les capteurs energy/power
et afficher les intégrations qui les fournissent.

✅ A exécuter directement depuis SSH :
    python3 /config/detect_local_debug_standalone.py
- **Fonction(s) critique(s) :**
    - `classify_sensor` : Détermine si le capteur est de type power / energy selon les attributs.
    - `detect_integrations` : 

---
#### energy_analytics.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/energy_analytics.py`
- **Rôle métier** : Module d'analyse des données d'énergie.
Détection d'anomalies, prédictions, comparaisons.
- **Logs/caractéristiques :** error

---
#### energy_export.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/energy_export.py`
- **Rôle métier** : Module d'export des données d'énergie.
Backup JSON et export InfluxDB optionnel.
- **Logs/caractéristiques :** debug, error, info

---
#### energy_tracking.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/energy_tracking.py`
- **Rôle métier** : Module de tracking d'énergie avec cycles automatiques.
Crée des sensors qui cumulent l'énergie et se reset automatiquement.

Architecture Phase 2 :
- CumulativeEnergyCycleSensor : Pour sources energy native (kWh) via delta tracking
- PowerEnergyCycleSensor : Pour sources power (W) via intégration trapézoïdale
- Propagation métadonnées : is_virtual, reliability_score, reference_type, tags
- ✅ FIX : Restauration de last_reset après redémarrage
- **Classe(s) principale(s) :**
    - `CumulativeEnergyCycleSensor` : Sensor pour sources ENERGY native (kWh déjà cumulé).

Exemples : TP-Link, Shelly, Zigbee avec compteur intégré
Méthode : Suivi des deltas (différence entre 2 lectures)
Gestion des resets : Détecte quand le compteur repart à 0
    - `PowerEnergyCycleSensor` : Sensor pour sources POWER (W instantané).

Exemples : Linky (Atome), Zigbee power-only, simulateurs
Méthode : Intégration trapézoïdale (W × temps → kWh)
Précision : Update à chaque changement de la source
- **Fonction(s) critique(s) :**
    - `_shorten_entity_name` : Raccourcit intelligemment les noms pour respecter la limite HA de 63 caractères.

Stratégie progressive :
1. Enlever suffixes redondants (_today_energy)
2. Abréger mots techniques (anglais clair)
3. Abréger chaînes longues (4+ mots)
4. Compression progressive si nécessaire
- **Logs/caractéristiques :** debug, error, info, warning

---
#### generator.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/generator.py`
- **Rôle métier** : Génération de cartes Lovelace pour Home Suivi Élec.

Génère automatiquement :
- Vue d'ensemble (Top 10)
- Graphiques historiques
- Distribution énergie
- Cartes par pièce
- **Fonction(s) critique(s) :**
    - `generate_overview_card` : Génère une carte vue d'ensemble (Top 10 consommateurs).

Args:
    sensors: Liste des sensors avec leurs valeurs
    
Returns:
    Configuration de carte Lovelace
    - `generate_history_card` : Génère une carte graphique historique (7 derniers jours).

Args:
    sensors: Liste des sensors
    
Returns:
    Configuration de carte Lovelace
    - `generate_energy_distribution_card` : Génère une carte distribution énergie (camembert).

Args:
    sensors: Liste des sensors
    
Returns:
    Configuration de carte Lovelace
    - `generate_gauge_card` : Génère une carte jauge pour un sensor.

Args:
    sensor: Sensor individuel
    max_value: Valeur max de la jauge (kWh)
    
Returns:
    Configuration de carte Lovelace
    - `generate_statistic_cards` : Génère des cartes statistiques pour chaque cycle.

Args:
    sensors: Liste des sensors
    
Returns:
    Liste de cartes statistiques
    - `generate_complete_dashboard` : Génère un dashboard complet avec toutes les cartes.

Args:
    sensors: Liste de tous les sensors HSE
    
Returns:
    Configuration complète du dashboard
- **Logs/caractéristiques :** info, warning

---
#### integration_quality_fetch.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/helpers/integration_quality_fetch.py`
- **Fonction(s) critique(s) :**
    - `fetch_integrations` : 

---
#### manage_selection.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/manage_selection.py`
- **Rôle métier** : Gestion métier + index capteurs pour Home Suivi Élec.
- Index entity_id -> infos enrichies (device, qualité, référence)
- Exposition utilitaire async_get_capteurs_index pour __init__.py
- Enregistrement des vues REST depuis manage_selection_views.py
- **Fonction(s) critique(s) :**
    - `_load_json` : 
    - `_load_quality_map_sync` : 
    - `_normalize` : 
    - `_is_premium` : 
    - `_enrich_base` : 
    - `_enrich_device_info` : 
- **Clés hass.data :**
    - hass.data["home_suivi_elec"]
- **Logs/caractéristiques :** info

---
#### manage_selection_views.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/manage_selection_views.py`
- **Rôle métier** : Vues REST (HTTP) pour Home Suivi Élec — isolées du métier.
Conserve les comportements existants et la validation par device_id.
✅ CORRIGÉ : Support natif des sensors HSE energy (sensor.hse_*_today_energy_{cycle})
- **Classe(s) principale(s) :**
    - `GetSensorsView` : 
    - `SaveSelectionView` : 
    - `GetSelectionView` : 
    - `GetConsumptionsView` : ✅ CORRIGÉ : Utilise les sensors HSE energy natifs.
    - `GetInstantPowerView` : 
    - `GetUserConfigView` : 
    - `SaveUserConfigView` : 
    - `GetUserOptionsView` : 
    - `SaveUserOptionsView` : 
    - `GetSummaryView` : 
    - `GetSyncStatusView` : GET /api/home_suivi_elec/sync/status - Statut de la synchronisation.
    - `ForceSyncView` : POST /api/home_suivi_elec/sync/force - Force une synchronisation.
    - `AutoSelectBestSensorsView` : API pour sélectionner automatiquement les meilleurs capteurs.

✅ ÉTAPE 2/4 : Filtre les helpers (min_max, template, etc.) en utilisant is_physical_sensor()
    - `GetSensorQualityScoresView` : API pour obtenir les scores de qualité de tous les capteurs.

✅ ÉTAPE 2/4 : Ajoute le flag is_helper dans la réponse
    - `HSESensorsPublicView` : GET /api/home_suivi_elec/lovelace_sensors - Liste tous les sensors HSE exposés, NON AUTH (usage local !).
- **Fonction(s) critique(s) :**
    - `_normalize` : 
    - `_compute_signature` : 
    - `_load_json` : 
    - `_save_json` : 
    - `_load_quality_map_sync` : 
    - `_is_premium` : 
    - `_enrich_base` : 
    - `_enrich_device_info` : 
    - `_shorten_entity_name` : Même fonction que dans energy_tracking.py
    - `_build_hse_energy_sensor_id` : Construit l'entity_id du sensor HSE energy.
    - `_build_hse_energy_sensor_id` : Construit l'entity_id du sensor HSE energy.

✅ ALIGNÉ avec energy_tracking.py (backend)

Supporte 2 types de sources :
1. ENERGY : sensor.xxx_today_energy → sensor.hse_xxx_today_energy_{cycle}
2. POWER  : sensor.xxx_puissance   → sensor.hse_live_xxx_puissance_today_energy_{cycle}
- **Endpoints REST :**
    - `/api/home_suivi_elec/sync/status`
    - `/api/home_suivi_elec/get_instant_puissance`
    - `/api/home_suivi_elec/save_selection`
    - `/api/home_suivi_elec/get_user_options`
    - `/api/home_suivi_elec/save_user_options`
    - `/api/home_suivi_elec/get_sensors`
    - `/api/home_suivi_elec/save_user_config`
    - `/api/home_suivi_elec/sync/force`
    - `/api/home_suivi_elec/get_summary`
    - `/api/home_suivi_elec/lovelace_sensors`
    - `/api/home_suivi_elec/get_selection`
    - `/api/home_suivi_elec/auto_select_best_sensors`
    - `/api/home_suivi_elec/get_sensor_quality_scores`
    - `/api/home_suivi_elec/get_consumptions`
    - `/api/home_suivi_elec/get_user_config`
- **Logs/caractéristiques :** exception, debug, info

---
#### migration_cleanup.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/migration_cleanup.py`
- **Rôle métier** : Script de migration pour nettoyer les sensors d'intégration aberrants.
Compatible Home Assistant 2024.x et 2025.x
Exécution asynchrone pour éviter le blocage de l'event loop.
- **Fonction(s) critique(s) :**
    - `_cleanup_sync` : Fonction synchrone de nettoyage (exécutée dans un executor).
- **Logs/caractéristiques :** debug, error, info, warning

---
#### options_flow.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/options_flow.py`
- **Classe(s) principale(s) :**
    - `HomeSuiviElecOptionsFlow` : Options flow pour Home Suivi Élec.

---
#### panel_selection.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/panel_selection.py`
- **Rôle métier** : Configuration et enregistrement du panneau statique Home Suivi Élec.
- **Clés hass.data :**
    - hass.data["home_suivi_elec_panel_registered"]
- **Logs/caractéristiques :** debug, info, warning

---
#### power_monitoring.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/power_monitoring.py`
- **Rôle métier** : Monitoring temps réel de la puissance (W).

Crée des sensors HSE Live pour affichage instantané dans l'UI.
Pas de cycles, pas de reset, juste un miroir enrichi du sensor source.

VERSION : 2.5
DATE : 22 octobre 2025

FONCTIONNALITÉS :
  - Crée sensor.hse_live_{slug} pour chaque sensor power
  - Synchronisation temps réel avec le sensor source
  - Métadonnées enrichies (zone, intégration, fiabilité)
  - Compatible cartes Lovelace

USAGE :
  - Affichage instantané de la consommation (W)
  - Cartes temps réel dans l'UI
  - Alertes sur consommation élevée
- **Classe(s) principale(s) :**
    - `LivePowerSensor` : Sensor de puissance temps réel (W).

Miroir enrichi du sensor source avec préfixe HSE.
Mise à jour automatique à chaque changement du sensor source.
- **Fonction(s) critique(s) :**
    - `load_power_sensors` : Charge les sensors power depuis capteurs_power.json.

Filtre uniquement les sensors avec:
  - type = "power"
  - usage = "monitoring"

Returns: Liste de sensors power pour monitoring temps réel
    - `create_live_power_sensors` : Crée les sensors HSE Live pour chaque sensor power.

Args:
    hass: Instance HomeAssistant
    power_sensors: Liste des sensors power depuis capteurs_power.json

Returns: Liste des LivePowerSensor créés
- **Clés hass.data :**
    - hass.data[DOMAIN]
- **Logs/caractéristiques :** debug, info, warning

---
#### proxy_api.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/proxy_api.py`
- **Rôle métier** : Proxy API pour authentification backend.
- **Classe(s) principale(s) :**
    - `SuiviElecProxyView` : Proxy les requêtes frontend vers les API backend.
- **Endpoints REST :**
    - `/api/home_suivi_elec/proxy`
- **Logs/caractéristiques :** error, info

---
#### sensor.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/sensor.py`
- **Rôle métier** : Plateforme sensor pour Home Suivi Élec — Phase 2.5.
- **Logs/caractéristiques :** info, warning

---
#### sensor_name_fixer.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/sensor_name_fixer.py`
- **Rôle métier** : Correcteur automatique des noms de sensors HSE trop longs.
Écoute la création des sensors et corrige silencieusement si nécessaire.
- **Fonction(s) critique(s) :**
    - `_shorten_entity_name` : Fonction de raccourcissement (identique à energy_tracking.py)
    - `_compute_short_entity_id` : Calcule l'entity_id court à partir d'un entity_id long.

Exemples :
- sensor.hse_clim_appart1_wifi_commutateur_sur_rail_din_puissance_hourly
  → sensor.hse_live_cwcsrdp_h
- **Logs/caractéristiques :** debug, error, info, warning

---
#### sensor_quality_scorer.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/sensor_quality_scorer.py`
- **Rôle métier** : Système de scoring de qualité pour les capteurs.
Aide à choisir automatiquement le meilleur capteur parmi plusieurs options.

⚠️  IMPORTANT : Les helpers (min_max, template, etc.) sont EXCLUS du calcul de coût.
- **Fonction(s) critique(s) :**
    - `is_physical_sensor` : Vérifie si un capteur est PHYSIQUE (pas un helper/agrégation).

Les capteurs physiques sont les SEULS valides pour le calcul de coût.
Les helpers (min_max, template, etc.) sont EXCLUS.

Args:
    sensor: Dictionnaire contenant les infos du capteur
    
Returns:
    True si c'est un capteur physique, False si c'est un helper
    
Examples:
    >>> is_physical_sensor({'integration': 'shelly'})
    True
    >>> is_physical_sensor({'integration': 'min_max'})
    False
    - `compute_sensor_score` : Calcule le score de qualité d'un capteur (0-150).

⚠️  IMPORTANT : Les helpers reçoivent un score réduit (max 50)
pour éviter qu'ils soient sélectionnés automatiquement.

Critères de notation :
- Type de mesure : Energy (kWh) = 100 pts, Power (W) = 50 pts
- State class : total = 20 pts, measurement = 10 pts
- Qualité intégration : Premium = 15 pts
- Physique vs virtuel : Non-virtuel = 10 pts
- Disponibilité : Disponible = 5 pts

Args:
    sensor: Dictionnaire avec métadonnées du capteur
    
Returns:
    Score total (0-150 pour physiques, 0-50 pour helpers)
    - `_compute_base_score` : Calcul du score de base (logique existante).
    - `get_sensor_recommendation_label` : Retourne un label de recommandation basé sur le score.
    - `get_sensor_stars` : Retourne une représentation en étoiles du score.
    - `auto_select_best_sensors` : Sélectionne automatiquement les meilleurs capteurs par appareil.

⚠️  FILTRE : Garde UNIQUEMENT les capteurs physiques (helpers exclus).

Logique :
- Filtre les helpers (min_max, template, etc.)
- Groupe les capteurs physiques par device_id
- Pour chaque appareil, choisit le capteur avec le meilleur score
- Si égalité, privilégie energy > power

Args:
    sensors: Liste de capteurs détectés
    
Returns:
    Liste des capteurs sélectionnés (1 par appareil, physiques uniquement)
    - `enrich_sensors_with_quality` : Enrichit une liste de capteurs avec leurs scores de qualité.

Args:
    sensors: Liste de capteurs bruts
    
Returns:
    Liste de capteurs enrichis avec quality_score, recommendation, stars
- **Logs/caractéristiques :** debug, info

---
#### sensor_sync_manager.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/sensor_sync_manager.py`
- **Rôle métier** : Gestionnaire de synchronisation automatique des capteurs.

FONCTIONNALITÉS :
  - Détection automatique des changements (ajout, suppression, indisponibilité)
  - Mise à jour incrémentale de capteurs_power.json
  - Backup automatique avant modifications
  - Gestion des états : active, unavailable, pending_removal, removed
  - Événements Home Assistant : entity_registry_updated, state_changed
  - Scan périodique throttled (toutes les 5 minutes si changements)

ARCHITECTURE :
  - Un seul fichier JSON (capteurs_power.json) enrichi
  - Pas de fichiers séparés (historique intégré)
  - Coordinateur léger (pas de stockage propre)
- **Classe(s) principale(s) :**
    - `SensorSyncManager` : Gestionnaire de synchronisation automatique des capteurs.
- **Logs/caractéristiques :** exception, debug, info, warning

---
#### validation.py — Documentation automatique

- **Fichier Python** : `custom_components/home_suivi_elec/helpers/validation.py`
- **Rôle métier** : Validation des champs pour Home Suivi Élec.
- **Fonction(s) critique(s) :**
    - `validate_time` : Vérifie que la valeur est au format HH:MM.
    - `HOUR_PATTERN` :     Validation centralisée des données et champs critiques (heure, période, float) ; protection des flows/config contre valeurs invalides.
[Source: backend.md, module helpers/validation.py]
    Fonction insérée automatiquement — compléter logique métier.
    

---
