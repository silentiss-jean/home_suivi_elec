🧠 Documentation du Backend – home_suivi_elec

> **Navigation IA & Debug automatisé**
>
> Un script de navigation Python (`home_suivi_elec_backend_navigation.py`) est disponible dans [docs/scripts/] pour permettre à une IA, un agent CLI, ou à un dev de mapper instantanément chaque besoin métier, bug ou point d'entrée vers la bonne section de la documentation et le bon fichier backend.
>
> Utilisation type :  
> - Recherche rapide de la fonction/fichier à partir d'un bug, d'un log ou d'un besoin métier  
> - Automatisation du crawling debug ou des suggestions d'analyse par un agent AI  
> - Génération d'outils CLI/docs/outils test/maintenance automatique  
> 
> Voir l'index ci-dessous et le script pour usage avancé.

Mention "Un utilitaire CLI/AI de navigation backend est disponible dans docs/scripts/cli_backend_nav.py" 

✅ SUCCÈS NO-SHORTENING (Octobre 2025)
	•	Élimination complète des orphelins (0/125 vs 65/125 avant)
	•	Correspondance directe parent↔enfant sans raccourcissement
	•	Préservation noms complets et lisibles (143+ caractères supportés)
	•	API /diagnostic_groups pour validation temps réel des associations
	•	Solution structurelle permanente (plus de logique complexe de mapping)

**🔗 Interactions et dépendances** Autres fonctionnalités
	•	Synchronisation avec les entités natives Home Assistant (utility_meter)
	•	Exposition d'API backend pour piloter toutes les actions
	•	Automatisation de la génération de dashboards et exports
	•	Sécurisation et traçabilité via un proxy backend contrôlé

⸻

🏗️ Vue d'ensemble de l'architecture
	•	Principes clés : modularité, extensibilité, robustesse
	•	Schéma du flux global : voir section 2

⸻

## 2. Schéma global

📈 Diagramme du flux : schema_flux_hse.svg

🧩 Description synthétique :
Ce diagramme illustre la chaîne complète depuis la détection des capteurs jusqu'à la visualisation, le scoring et les exports.

⸻

## 🗂️ Index recherche rapide

| Besoin Métier / Fonction | Section | Fichier (chemin) |
|-------------------------|---------|------------------|
| Orchestration backend   | 3.1     | custom_components/home_suivi_elec/__init__.py |
| Détection capteurs      | 3.2     | custom_components/home_suivi_elec/detect_local.py |
| Sélection/mapping       | 3.3     | custom_components/home_suivi_elec/manage_selection.py |
| Scoring qualité         | 3.4     | custom_components/home_suivi_elec/sensor_quality_scorer.py |
| Création sensors HSE    | 3.5     | custom_components/home_suivi_elec/sensor.py |
| Energy tracking cycles  | 3.6     | custom_components/home_suivi_elec/energy_tracking.py |
| Génération Lovelace/YAML| 3.7     | custom_components/home_suivi_elec/generator.py |
| Validation données      | 3.8     | custom_components/home_suivi_elec/helpers/validation.py |
| Analytics énergétique   | 3.9     | custom_components/home_suivi_elec/energy_analytics.py |
| Export/backup énergie   | 3.10    | custom_components/home_suivi_elec/energy_export.py |
| Panel UI (sidebar)      | 3.11    | custom_components/home_suivi_elec/panel_selection.py |
| Correction noms sensors | 3.12    | custom_components/home_suivi_elec/sensor_name_fixer.py |
| Synchronisation sensors | 3.13    | custom_components/home_suivi_elec/sensor_sync_manager.py |
| Monitoring puissance    | 3.14    | custom_components/home_suivi_elec/power_monitoring.py |
| Debug JSON backend      | 3.15    | custom_components/home_suivi_elec/debug_json_sets.py |
| Constantes globales     | 3.16    | custom_components/home_suivi_elec/const.py |
| Config UI initiale      | 3.17    | custom_components/home_suivi_elec/config_flow.py |
| Options UI avancées     | 3.18    | custom_components/home_suivi_elec/options_flow.py |
| Proxy API frontend      | 3.19    | custom_components/home_suivi_elec/proxy_api.py |
| Registry noms universel | 3.20    | custom_components/home_suivi_elec/entity_name_registry.py |
| **API Unifiée GET** | **3.21** | **custom_components/home_suivi_elec/api/unified_api.py** |
| **API Configuration POST** | **3.22** | **custom_components/home_suivi_elec/api/unified_api_extensions.py** |
| **Endpoints REST sélection** | **3.23** | **custom_components/home_suivi_elec/manage_selection_views.py** |
| **API Registry noms (vue)** | **3.24** | **custom_components/home_suivi_elec/manage_selection_views_entity_registry.py** |
| **Vues additionnelles API** | **3.25** | **custom_components/home_suivi_elec/api_extra_views.py** |
| **Diagnostic groupes (vue)** | 3.25 | custom_components/home_suivi_elec/manage_selection_views_diagnostic_groups.py |
| Migration/cleanup | 5 | custom_components/home_suivi_elec/migration_cleanup.py |
| Debug standalone | 5 | custom_components/home_suivi_elec/detect_local_debug_standalone.py |
| Detect energy (util) | 5 | custom_components/home_suivi_elec/detect_energy.py |

⸻

## 1. Introduction générale

🎯 Objectif

Le backend de home_suivi_elec vise à :
	•	🔍 Détecter dynamiquement toutes les intégrations installées dans l'instance Home Assistant.
	•	⚡ Identifier les intégrations gérant de l'énergie (TP-Link, Tapo, Enedis, PowerCalc, utility_meter…).
	•	🔢 Récupérer et filtrer les capteurs qui mesurent la puissance ou l'énergie électrique.
	•	🧩 Enrichir ces capteurs : scoring qualité, ajout de métadonnées, normalisation et diagnostics.
	•	🪪 Créer et maintenir des entités sensors "tagguées HSE" dans Home Assistant pour un suivi optimal et centralisé.

🔁 Cycle de vie complet des capteurs
	•	Ajout automatique lors de la détection
	•	Suppression lors de la désactivation ou orphelinisation
	•	Mise en attente, archivage ou purge selon les cas (maintenance, diagnostics)

🔎 Supervision de la qualité et de la fiabilité
	•	Calcul de scores qualité
	•	Détection et gestion des doublons, capteurs orphelins, anomalies

🔗 Autres fonctionnalités
	•	Synchronisation avec les entités natives Home Assistant (utility_meter)
	•	Exposition d'API backend pour piloter toutes les actions
	•	Automatisation de la génération de dashboards et exports
	•	Sécurisation et traçabilité via un proxy backend contrôlé

⸻

🏗️ Vue d'ensemble de l'architecture
	•	Principes clés : modularité, extensibilité, robustesse
	•	Schéma du flux global : voir section 2

⸻

## 3. Modules principaux

⸻

#### 3.1 __init__.py — Résumé et accès rapide

**Rôle métier :** Orchestration et setup global de l'intégration, enregistrement services, endpoints, lifecycle et gestion hass.data.

**Fichier Python :** custom_components/home_suivi_elec/__init__.py

**Classe(s) principale(s) :** N/A (module fonctionnel), PingView, SetIgnoredEntityView, ChooseBestForDeviceView, DiagnosticsView, EntityNameRegistryView, DiagnosticGroupsView

**Fonctions critiques :** 
- async_setup, async_setup_entry
- async_setup_energy_tracking (Phase 2)
- load_capteurs_selection (Phase 2)
- setup_sensors_after_detection
- _delayed_start
- _copy_ui_fresh_complete

**Services HA :**
| Service | Description |
|---------|-------------|
| `generate_local_data` | Détection automatique capteurs |
| `generate_lovelace_auto` | Génération dashboard Lovelace |
| `generate_selection` | Mapping sélection capteurs |
| `fix_sensor_names` | **✅ NOUVEAU** - Correction automatique noms longs |
| `copy_ui_files` | Copie UI statique |
| `reset_integration_sensor` | Reset sensor aberrant |
| `migrate_cleanup` | Nettoyage migration automatique |

**Endpoints REST :** 
- ✅ `/api/home_suivi_elec/{resource}` — API Unifiée GET (voir 3.21)
- ✅ `/api/home_suivi_elec/config/{action}` — API Configuration POST (voir 3.22)
- `/api/home_suivi_elec/ping` — Test API
- `/api/home_suivi_elec/entity_name_registry` — Registry noms (voir 3.24)
- `/api/home_suivi_elec/diagnostic_groups` — Diagnostic parent↔enfant
- `/api/home_suivi_elec/set_ignored_entity`
- `/api/home_suivi_elec/choose_best_for_device`
- `/api/home_suivi_elec/get_diagnostics`
- Voir manage_selection_views.py (3.23) pour les autres endpoints

**Clés hass.data :** 
- DOMAIN
- config
- options
- energy_sensors (Phase 2)
- live_power_sensors
- sync_manager
- capteurs_index

**Logs/caractéristiques :** 
- [SETUP_ENTRY], [SERVICE], [INIT], [RESET], [MIGRATION]
- [COPY_UI], [PHASE 2], [DEBUG], [ENERGY-TRACKING]
- [API] pour enregistrement endpoints

**Exemples d'usage :** 
- Setup automatique après démarrage HA
- Orchestration modules backend
- Enregistrement panel UI sidebar
- Setup différé après détection complète
- Phase 2 : Energy tracking avec métadonnées enrichies

**Pour debuguer :** 
- Vérifier état services HA
- Endpoints REST avec logs [API]
- Analyser hass.data (energy_sensors, sync_manager)
- Logs setup global et Phase 2
- Event `hse_energy_sensors_ready` pour synchronisation

**🧠 Rôle métier**

- **Point d'entrée central** : initialise tous les modules backend, listeners, services HA et endpoints REST
- **Gère la chaîne complète** : détection → sélection → scoring → création/sync entités → dashboards → diagnostics → maintenance
- **Panel UI** : inscription automatique dans la sidebar via `frontend.async_register_built_in_panel`
- **Phase 2** : Support complet energy tracking avec métadonnées (is_virtual, reliability_score, tags)
- **API Unifiée** : Migration progressive vers architecture REST unifiée

**⚙️ Fonctionnement technique**

**Setup différé et phases d'initialisation :**
- **Phase 1** : Setup minimal et enregistrement services/API
- **Phase 2** : Détection sensors après `EVENT_HOMEASSISTANT_STARTED`  
- **Phase 2.5** : Energy tracking avec support energy vs power
- **Phase 2.6** : Power monitoring temps réel (W)
- **Phase 2.7** : Sensor Sync Manager (synchronisation automatique)
- Fallback automatique via `_delayed_start` si timeout 60s

**Endpoints REST — Architecture hybride :**

**✅ API Unifiée (nouveau système) :**
- `/api/home_suivi_elec/{resource}` - API GET unifiée (voir 3.21)
- `/api/home_suivi_elec/config/{action}` - API POST configuration (voir 3.22)

**API Legacy (inline dans __init__.py) :**
- `/api/home_suivi_elec/ping` - Test connexion API
- `/api/home_suivi_elec/entity_name_registry` - Registry noms courts→complets
- `/api/home_suivi_elec/diagnostic_groups` - Diagnostic associations parent↔enfant (NO-SHORTENING)
- `/api/home_suivi_elec/set_ignored_entity` - Ignorer/activer entité
- `/api/home_suivi_elec/choose_best_for_device` - Choix auto meilleur sensor par device
- `/api/home_suivi_elec/get_diagnostics` - Diagnostic natif HSE (remplace UtilityMeter)

**Phase 2 - Energy Tracking :**
- **`load_capteurs_selection`** : Charge capteurs avec métadonnées enrichies (is_virtual, reliability_score, reference_type, tags)
- **`async_setup_energy_tracking`** : Configure tracking avec détection automatique type source (energy vs power)
- **Fusion métadonnées** : capteurs_selection.json + capteurs_power.json
- **Event `hse_energy_sensors_ready`** : Signal fin création sensors pour synchronisation modules

**Copie UI (Fresh Complete) :**
- Suppression totale destination avant copie
- Copie atomique complète via `shutil.copytree`
- Évite reliquats et fichiers obsolètes

**🔗 Interactions et dépendances**

**Imports principaux :**
- detect_local, generator, manage_selection, manage_selection_views
- energy_tracking (Phase 2), power_monitoring, sensor_sync_manager  
- sensor_name_fixer (correction automatique)
- entity_name_registry (registry noms)
- api.unified_api, api.unified_api_extensions (API unifiée)

**Déclenche les flows :**
- config_flow.py, options_flow.py
- Tous les modules métiers backend

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Boot / reload | Setup complet, initialisation hass.data, fallback |
| EVENT_HOMEASSISTANT_STARTED | Détection sensors (5s delay) |
| Phase 2.5 | Energy tracking setup |
| Phase 2.6 | Power monitoring setup |
| Phase 2.7 | Sensor sync manager start |
| Unload | Nettoyage, reset listeners/services |

**🧪 Exemple(s)**

**Séquence de démarrage Phase 2 :**
```

1. [SETUP_ENTRY] Init services/API
2. [INIT] EVENT_HOMEASSISTANT_STARTED + 5s
3. [INIT] Détection avec tous les states
4. [PHASE 2] Energy tracking setup
    - Load capteurs avec métadonnées
    - Fusion capteurs_selection + capteurs_power
    - Création sensors (auto-detect energy vs power)
5. [EVENT] hse_energy_sensors_ready émis
6. [INIT] Power monitoring setup
7. [INIT] Sensor sync manager start
8. ✅ Setup terminé
```

**Debug & Repérage rapide (IA) :**

**Fonctions principales :**
- `async_setup`, `async_setup_entry`
- `async_setup_energy_tracking` (Phase 2)
- `load_capteurs_selection` (Phase 2)
- `setup_sensors_after_detection`
- `_delayed_start`, `_copy_ui_fresh_complete`

**Services HA enregistrés :** Voir tableau ci-dessus

**Endpoints REST :** Voir architecture hybride ci-dessus

**Clés hass.data manipulées :**
- `DOMAIN`, `config`, `options`
- `energy_sensors` (Phase 2 - liste SensorEntity)
- `live_power_sensors`
- `sync_manager`
- `capteurs_index`

**Logs caractéristiques :**
- `[SETUP_ENTRY]`, `[SERVICE]`, `[INIT]`, `[RESET]`, `[MIGRATION]`
- `[COPY_UI]`, `[PHASE 2]`, `[DEBUG]`, `[ENERGY-TRACKING]`
- `[API]` pour enregistrement endpoints
- `[EVENT]` pour hse_energy_sensors_ready

**Pour debuguer :**
1. Vérifier services HA et endpoints REST (logs [API])
2. Inspecter hass.data (energy_sensors, sync_manager)  
3. Vérifier panel UI sidebar
4. Analyser logs Phase 2 (fusion métadonnées, création sensors)
5. Suivre event `hse_energy_sensors_ready`
6. Vérifier fallback `_delayed_start` si timeout
7. Contrôler copie UI (suppression + copie complète)

⸻

#### 3.2 detect_local.py — Résumé et accès rapide

**Rôle métier :** Détection automatique, annotation et classification des capteurs power/energy physiques/virtuels/helpers.

**Fichier Python :** custom_components/home_suivi_elec/detect_local.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** run_detect_local, __detect_from_hass, __annotate_and_deduplicate

**Services HA :** run_detect_local

**Endpoints REST :** N/A

**Clés hass.data :** energy_sensors

**Logs/caractéristiques :** [DETECT], logs exclusion, doublons, multi-intégration

**Exemples d'usage :** Scan complet des capteurs lors du boot, enrichissement et priorisation, update du fichier JSON liste sensors.

**Pour debuguer :** Vérifier mapping JSON, logs détection, état hass.data et exclusions.

**🧠 Rôle métier**

Détecte automatiquement tous les capteurs "energy" et "power" présents dans l'instance Home Assistant, via analyse du registre d'entités, du registre de devices et des plateformes d'intégration.

Classe les capteurs selon leur type (physique, virtuel, helper), leur plateforme d'origine et leur fiabilité métier.

Enrichit chaque capteur avec des métadonnées détaillées : plateforme déclarée/détectée, signature physique, multi-intégration, type de référence, etc.

Annote et gère la déduplication par signature physique pour éviter les doublons.

**⚙️ Fonctionnement technique**

Fichier central pour la collecte et classification des sensors energy/power, exécute des groupements multi-intégration, et propose un mapping optimisé pour la suite du backend (sélection, scoring, tracking).

Filtrage intelligent selon la config, gestion des helpers, exclusions de plateformes non pertinentes.

Utilisation de priorités métier (energy physique > power physique > virtuel > helper etc.) et scoring "reliability".

Exporte tous les résultats dans un fichier JSON (_CAPTEURS_FILE) utilisé par les modules de selection/scoring/tracking.

Version 2.10+ : détection multi-intégration complète, tagging enrichi pour UI/groupement, détection approfondie des plateformes pour chaque device physique.

**🔗 Interactions et dépendances**

Exécuté et appelé via le service HA run_detect_local depuis init.py.

Donne ses résultats à manage_selection.py, sensor_quality_scorer.py pour mapping/scoring.

Utilise les helpers/validation pour le contrôle de fiabilité et exclusion métiers.

Écrit les capteurs détectés dans hass.data et sur disque pour diagnostic/audit.

**🔄 Cycle de vie**

À chaque scan/démarrage ou sur demande (service HA/API), relance la détection et l'annotation de tous les capteurs.

Gère l'ajout/suppression/mise à jour des capteurs selon leur disponibilité, fiabilité ou changement d'intégration.

Maintient la cohérence du mapping sur le backend (mise à jour du fichier JSON et état hass.data).

**🧪 Exemple**

Démarrage ou service HA run_detect_local : détecte physiquement tous les capteurs energy/power, enrichit leurs métadonnées, annote les doublons, priorise et stocke pour la suite des flows backend.

**Debug & Repérage rapide (IA) :**

Principales fonctions métier :

`__detect_from_hass(hass, config_entry)`, `__classify_sensor(state)`, `__classify_platform(...)`, `__annotate_and_deduplicate(...)`, `__get_energy_platforms_from_registry(...)`

Principal point d'entrée asynchrone : `async def run_detect_local(*args, **kwargs)`

Service HA associé : run_detect_local (déclencheur principal pour backend/diagnostic)

Clé hass.data impactée : typiquement energy_sensors (selon setup dans init.py)

Fichier exporté : _CAPTEURS_FILE (JSON des sensors annotés pour analyse/scoring)

Exceptions/logs caractéristiques :

[DETECT] — total, physique, virtuel, helpers, multi_platform, energy/power/doublons

Logs sur exclusion, doublons, multi-integrations (info/debug)

Warnings sur les plateformes non reconnues ou entités sans device_id.

Errors sur import Home Assistant registry ou structure corrompue

Pour debuguer :

Vérifier les appels du service HA run_detect_local dans init.py et CLI si débogage

Inspecter le fichier JSON _CAPTEURS_FILE pour la liste réelle, tags, doublons et alternatives

Contrôler hass.data pour la structure en RAM (resultats/doublons/groupes)

Suivre les logs [DETECT] pour état du scan et priorités métier

Vérifier l'effet des exclusions (platforms detectés/exclus, helpers activés/désactivés)

Toujours passer par les routines principales (__detect_from_hass, __annotate_and_deduplicate) pour analyse des cycles métier

⸻

#### 3.3 manage_selection.py — Résumé et accès rapide

**Rôle métier :** Indexation métier, mapping et enrichissement des capteurs, export sélection et accès panel.

**Fichier Python :** custom_components/home_suivi_elec/manage_selection.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** async_get_capteurs_index, _enrich_base, async_setup_selection_api

**Services HA :** generate_selection

**Endpoints REST :** /api/home_suivi_elec/selection, /api/home_suivi_elec/selection_view

**Clés hass.data :** capteurs_index

**Logs/caractéristiques :** logs enrichissement, mapping, warnings fichiers absents

**Exemples d'usage :** Génération index métier pour sélection et panel, mapping enrichi, export JSON/YAML sélection.

**Pour debuguer :** Utiliser async_get_capteurs_index, analyser index, logs mapping, fichiers JSON.

**🧠 Rôle métier**

Gère l'index métier enrichi des capteurs power (entity_id → infos détaillées : device, qualité, intégration, mapping, flags métier).

Applique critères métier, scoring qualité, mapping entre capteurs physiques, virtuels, helpers pour constituer la sélection backend optimale.

Permet l'enrichissement (tags, scoring, qualité intégration via fichier YAML, référence, premium…).

Exporte la sélection finale et tous les mappings vers le backend, la UI, et les autres modules métiers.

**⚙️ Fonctionnement technique**

Stocke l'index _CAPTEURS_INDEX (entity_id → dict enrichi) en RAM + hass.data.

Charge et sauvegarde les différents jeux de données : capteurs power JSON, sélection JSON, user_config JSON, intégration_quality YAML.

Enrichit via device_registry, entity_registry, area_registry tout capteur de l'index (zone, nom device, manufacturer, etc.).

Expose des fonctions utilitaires (async_get_capteurs_index) pour la récup et diagnostic capteurs côté init.py ou diag/REST.

Gère la classification premium/référence, tags d'exclusion ou d'alternative, flags mapping optimal.

**🔗 Interactions et dépendances**

Récupère en entrée le mapping capteurs depuis detect_local.py (via JSON/RAM).

Passage vers sensor_quality_scorer.py pour scoring métier et classification/doublons.

Enregistrement des vues REST et APIs (via manage_selection_views.py, async_setup_selection_api).

Échange avec user_config, options, qualité intégration.

**🔄 Cycle de vie**

Chargé à chaque scan/démarrage ou reload, met à jour l'index et la sélection active.

Structure en RAM et sur disque, exposée via API et diagnostic.

**🧪 Exemple**

Un device power, plusieurs capteurs (physiques/virtuels/helpers), manage_selection.py en fait l'index, tague le capteur optimal/référence, enrichit les métadonnées, expose la sélection pour la UI et le backend.

**Debug & Repérage rapide (IA) :**

Classe principale : (organisation fonctionnelle, index RAM : _CAPTEURS_INDEX)

Fonctions critiques :

`_enrich_base`, `_enrich_device_info` (pour enrichissement de l'index)

`async_get_capteurs_index(hass)` (point d'entrée principal pour l'index et diagnostic)

`_load_json`, `_load_quality_map_sync` (chargement datas métier, scoring)

Enregistrement API via `async_setup_selection_api(hass, sync_manager)`

Fichiers métier côté data :

capteurs_power.json, capteurs_selection.json, user_config.json, integration_quality.yaml

Services/API :

Index exposé par le service generate_selection (setup/init), API via manage_selection_views.py

Voir les vues REST : /api/home_suivi_elec/selection, /api/home_suivi_elec/selection_view, /api/home_suivi_elec/sync_status...

Clés hass.data manipulées :

`hass.data["home_suivi_elec"]["capteurs_index"]`

Logs/exceptions typiques :

Logs enrichissement device, zone, detection premium, mapping alternative/référence

Warnings sur fichiers JSON absents/corrompus, mapping impossible, zone/device missing

Pour debuguer :

Appeler `async_get_capteurs_index(hass)` pour obtenir l'état complet

Inspecter les JSON métiers pour index, sélection, qualité

Utiliser les endpoints REST pour diagnostic et visualisation

Vérifier les logs d'enrichissement et mapping sur panel selection/backend

⸻

#### 3.4 sensor_quality_scorer.py — Résumé et accès rapide

**Rôle métier :** Scoring qualité, diagnostic sensors, exclusion helpers/statistics pour auto-mapping backend.

**Fichier Python :** custom_components/home_suivi_elec/sensor_quality_scorer.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** compute_sensor_score, is_physical_sensor, auto_select_best_sensors, enrich_sensors_with_quality

**Services HA :** N/A

**Endpoints REST :** relayé via selection_view

**Clés hass.data :** N/A direct (index via manage_selection)

**Logs/caractéristiques :** [SCORE], [HELPER], logs exclusion/doublon

**Exemples d'usage :** Attribuer score métier, labelliser sensors, choisir automatiquement best mapping.

**Pour debuguer :** Tester enrich_sensors_with_quality, logs scoring/tags/exclusion helpers.

**🧠 Rôle métier**

Calcule et attribue un score de qualité (quantitatif et qualitatif) à chaque capteur énergétique détecté.

Différencie capteurs physiques, virtuels et helpers pour éviter la sélection automatisée de helpers/agrégateurs.

Permet de classifier et diagnostiquer la pertinence métier de chaque sensor (EXCELLENT, BON, ACCEPTABLE, HELPER, FAIBLE).

Alimente la logique auto-sélection pour les flows backend (sélection, mapping, diagnostics).

**⚙️ Fonctionnement technique**

Exclusion stricte des helpers/aggrégateurs (min_max, statistics, template, utility_meter, integration, etc.) pour les calculs de coût et scoring automatique.

Fonction centrale : `compute_sensor_score(sensor)` : applique pondération sur l'unité de mesure, state_class, qualité intégration, type physique/virtuel, disponibilité.

Méthodes de diagnostic et enrichissement : `get_sensor_recommendation_label(score)`, `get_sensor_stars(score)`, `enrich_sensors_with_quality(sensors)`.

Logique de sélection automatisée : `auto_select_best_sensors(sensors)` — par device_id, sépare orphelins et helpers exclus.

**🔗 Interactions et dépendances**

Invocable via manage_selection.py, panel_selection.py, flows backend (auto-mapping et export diagnostics).

Exposé via API backend, diagnostics, panel Lovelace.

Interagit avec les JSON/YAML métier pour l'intégration et scoring ("integration_quality", "user_config").

**🔄 Cycle de vie**

À chaque scan/reload/demande, enrichit l'ensemble des capteurs détectés ou sélectionnés avec scores, recommandations, diagnostics.

Structure enrichie exposée côté panel et diagnostic.

**🧪 Exemple**

Un capteur TP-Link energy physique reçoit score maximal, labellisé EXCELLENT. Un helper min_max ou template reçoit score réduit (<50), labellisé "Pour statistiques uniquement".

La sélection backend privilégie les capteurs physiques et tague les autres comme non-recommandés/statistiques.

**Debug & Repérage rapide (IA) :**

Fonctions critiques :

`is_physical_sensor(sensor)`, `compute_sensor_score(sensor)`, `get_sensor_recommendation_label(score)`, `get_sensor_stars(score)`

`auto_select_best_sensors(sensors)`, `enrich_sensors_with_quality(sensors)`

Exclusions intégrations : helpers/aggrégateurs listés dans EXCLUDED_FROM_COST_CALCULATION

Logs/exceptions typiques :

Logs : [AUTO_SELECT], [HELPER], [SCORE], diagnostics par device, stats sur helpers exclus.

Warn sur intégration inconnue, capteur non physique, score faible.

Pour debuguer :

Vérifier le score attribué à chaque sensor via compute_sensor_score et logs correspondants.

Utiliser la fonction auto_select_best_sensors pour voir la sélection auto/mapping backend.

Contrôler la labellisation (get_sensor_recommendation_label) pour dashboard/diagnostics.

Confirmer l'exclusion appropriée des helpers/stats via les logs et structuration JSON/YAML métier.

Passer la liste des sensors "bruts" dans enrich_sensors_with_quality pour obtenir structure complète côté panel/API.

Vérifier toute divergence métier en croisant avec integration_quality.yaml.

⸻

#### 3.5 sensor.py — Résumé et accès rapide

**Rôle métier :** Enregistrement/ajout de toutes les entités "sensor" (énergie et power live) dans Home Assistant.

**Fichier Python :** custom_components/home_suivi_elec/sensor.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** async_setup_entry

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** energy_sensors, live_power_sensors

**Logs/caractéristiques :** logs nombre de sensors, warning sensors absents

**Exemples d'usage :** Ajout complet des sensors HSE (cycles + live) dans la plateforme home assistant.

**Pour debuguer :** Analyser logs sensor.py, inspecter listes hass.data après setup.

**🧠 Rôle métier**

Gère l'enregistrement des entités "sensor" HSE dans Home Assistant, représentant cycles d'énergie (kWh) et mesures de puissance live (W).

Fusionne les listes de sensors d'énergie (hourly, daily, weekly, monthly, yearly) et de capteurs live vers la plateforme sensor Home Assistant.

Assure que tous les sensors sélectionnés/back-end (tracking et power live) sont exposés côté UI et utilisables sur le dashboard Lovelace ou toute automatisation.

**⚙️ Fonctionnement technique**

Fonction centrale : `async_setup_entry(hass, entry, async_add_entities)`

Récupère les sensors en RAM via `hass.data[DOMAIN]["energy_sensors"]` (cycles) et `hass.data[DOMAIN]["live_power_sensors"]` (puissance temps réel).

Fusionne toutes les listes en all_sensors.

Ajoute toutes les entités via la callback Home Assistant (`async_add_entities(all_sensors, True)`).

Log chaque enregistrement avec le nombre de sensors énergie et power live.

Émet un warning si aucun sensor n'est disponible à l'enregistrement.

**🔗 Interactions et dépendances**

Appelé automatiquement par __init__.py lors du setup "sensor" de l'intégration.

Dépend des flows d'initialisation et mapping : lists construites par energy_tracking.py, manage_selection.py et phase de setup.

Expose les sensors "hse_*" pour Lovelace, UI, automatisations et export backend.

**🔄 Cycle de vie**

À chaque entrée/configuration/reload : mise à jour complète des sensors exposés dans Home Assistant.

S'assure que tout changement côté backend ou mapping (ajout/suppression d'un sensor ou device) est reflété dans la plateforme sensor.

**🧪 Exemple(s)**

Sur un setup HSE, plusieurs sensors d'énergie (daily, monthly) et de puissance live sont listés en RAM, réunis et ajoutés d'un seul bloc côté Home Assistant.

**Debug & Repérage rapide (IA) :**

Fonction principale : `async_setup_entry`

Clés hass.data à vérifier :

`hass.data[DOMAIN]["energy_sensors"]`

`hass.data[DOMAIN]["live_power_sensors"]`

Callback HA : `async_add_entities(all_sensors, True)`

Logs/caractéristiques :

Enregistrement sensor : `LOGGER.info("📊 SENSOR.PY: ...")`

Aucun sensor : `LOGGER.warning("⚠️ SENSOR.PY: Aucun sensor d'énergie à enregistrer")`

🔧 PROBLÈME RÉSIDUEL IDENTIFIÉ (Solution NO-SHORTENING) :

Malgré la solution NO-SHORTENING (0 orphelins), un problème subsiste dans la chaîne :
create_energy_sensors() → sensor.py → entity_registry HA

Symptômes observés :
- Sensors créés avec succès (logs CREATE-SENSOR positifs)
- Correspondance parent↔enfant parfaite (API /diagnostic_groups : 0 orphelins)
- MAIS : Sensors parfois absents du entity_registry Home Assistant

Debug en cours :
1. Vérifier async_add_entities(all_sensors, True) dans async_setup_entry
2. Contrôler l'enregistrement effectif dans hass.data[DOMAIN]["energy_sensors"]
3. Analyser la séquence create_energy_sensors → sensor.py → HA registry
4. Valider que tous les sensors en RAM sont bien transmis à HA

Outils de diagnostic :
- API /diagnostic_groups : État temps réel des associations (0 orphelins ✅)
- Logs [ENERGY_TRACKING] : Traçabilité création sensors
- entity_registry HA : Vérification enregistrement final
- hass.data inspection : Cohérence listes energy_sensors/live_power_sensors

⸻

#### 3.6 energy_tracking.py — Résumé et accès rapide

**Rôle métier :** Tracking automatique cycles énergie (hourly, daily, weekly, monthly, yearly) avec support energy vs power.

**Fichier Python :** custom_components/home_suivi_elec/energy_tracking.py

**Classe(s) principale(s) :**
- CumulativeEnergyCycleSensor (RestoreEntity, SensorEntity)
- PowerEnergyCycleSensor (RestoreEntity, SensorEntity)

**Fonctions critiques :**
- create_energy_sensors (API publique Phase 2)
- _shorten_entity_name (correction noms)

**Services HA :** N/A (géré via __init__.py)

**Endpoints REST :** N/A

**Clés hass.data :** energy_sensors (stockage sensors créés)

**Logs/caractéristiques :**
- [CREATE-SENSOR], [PROCESS-ENERGY], [SKIP-ENERGY]
- [AUTO-FIX], [POWER-INT]
- [HSE-FIXER] pour nettoyage noms

**Exemples d'usage :**
- Tracking automatique cycles énergie
- Support sources energy (kWh cumulatif) et power (W → intégration)
- Propagation métadonnées (is_virtual, reliability_score, tags)

**Pour debuguer :**
- Vérifier logs [CREATE-SENSOR] pour création
- Contrôler type source (energy vs power)
- Analyser intégration trapézoïdale (logs [POWER-INT])
- Vérifier registry noms complets
- Event `hse_energy_sensors_ready`

**🧠 Rôle métier**

**Tracking cycles énergie automatiques :**
- **5 cycles** : hourly, daily, weekly, monthly, yearly
- **2 types sensors** selon source :
  - `CumulativeEnergyCycleSensor` : sources **energy** (kWh) - tracking par delta
  - `PowerEnergyCycleSensor` : sources **power** (W) - intégration trapézoïdale
- **Métadonnées enrichies** : is_virtual, reliability_score, reference_type, tags
- **Reset automatique** : à chaque fin de cycle (conditionnel pour weekly/monthly/yearly)
- **Restore state** : récupération état après restart HA

**⚙️ Fonctionnement technique**

**API Publique - create_energy_sensors :**

```

async def create_energy_sensors(
hass: HomeAssistant,
capteurs_selection: list[dict]
) -> list[SensorEntity]

```

**Format Phase 2 des capteurs :**
```

{
"entity_id": "sensor.xxx",
"type": "energy" ou "power",
"is_virtual": bool,
"reliability_score": float,
"reference_type": str,
"tags": ["tag1", "tag2"]
}

```

**Détection automatique type sensor :**
- **"today_energy" dans entity_id** → Auto-fix vers type "energy"
- **type = "energy"** → CumulativeEnergyCycleSensor (delta tracking)
- **type = "power"** → PowerEnergyCycleSensor (intégration trapézoïdale)

**CumulativeEnergyCycleSensor (sources energy kWh) :**
- **Principe** : Suit variations compteur kWh cumulatif
- **Calcul** : delta = nouvelle_valeur - dernière_valeur
- **Reset** : Remise à 0 à chaque cycle
- **Tracking** : `async_track_state_change_event` sur source
- **Cycles** : `async_track_utc_time_change` pour reset

**PowerEnergyCycleSensor (sources power W) :**
- **Principe** : Intégration trapézoïdale W → kWh
- **Calcul** : `energy_kwh = (P_avg / 1000) × Δt_hours`
- **Protection** : Ignore energy > 10 kWh par update (aberrations)
- **Reset** : Remise à 0 compteur + références (last_power, last_time)
- **Tracking** : Identique CumulativeEnergyCycleSensor

**Configuration cycles (CYCLES dict) :**
| Cycle | Reset | Méthode |
|-------|-------|---------|
| hourly | minute=0, second=5 | Direct |
| daily | hour=0, minute=0, second=5 | Direct |
| weekly | hour=0, minute=1, second=0 | Conditionnel (Lundi) |
| monthly | hour=0, minute=2, second=0 | Conditionnel (1er) |
| yearly | hour=0, minute=3, second=0 | Conditionnel (1er janvier) |

**Naming et Registry :**
- **✅ NO-SHORTENING** : Noms complets préservés (plus de hash)
- **EntityNameRegistry** : Enregistrement automatique noms courts→complets
- **Unique ID** : Hash MD5 source (4 chars) pour éviter collisions
- **Format entity_id** :
  - Sources Tapo native : `sensor.hse_{base}_{cycle}`
  - Autres sources : `sensor.hse_energy_{base}_{cycle}`

**🔗 Interactions et dépendances**

**Appelé par :** __init__.py (async_setup_energy_tracking)

**Importe :**
- entity_name_registry (EntityNameRegistry)
- sensor_name_fixer (_shorten_entity_name - maintenant NO-OP)

**Dépend de :**
- capteurs_selection.json (sélection utilisateur)
- capteurs_power.json (métadonnées complètes)
- Fusion des 2 fichiers dans load_capteurs_selection (__init__.py)

**Produit :**
- Liste SensorEntity stockée dans `hass.data[DOMAIN]["energy_sensors"]`
- Event `hse_energy_sensors_ready` après création

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Création | `create_energy_sensors` appelé par __init__.py Phase 2 |
| Setup sensors | `async_added_to_hass` : restore state + setup tracking |
| Tracking | Écoute changements source + reset cycles |
| Update | Callback sur changement source (delta ou intégration) |
| Reset | À chaque fin de cycle (direct ou conditionnel) |
| Restart HA | Restore state depuis dernier état |

**🧪 Exemple(s)**

**Exemple 1 - Source energy (Tapo today_energy) :**
```

Source: sensor.tapo_salon_plug_today_energy
Type: energy (détecté auto)
→ CumulativeEnergyCycleSensor
→ sensor.hse_tapo_salon_plug_energy_hourly
→ sensor.hse_tapo_salon_plug_energy_daily
→ ...
Tracking: delta kWh à chaque changement
Reset: hourly à :00:05, daily à 00:00:05

```

**Exemple 2 - Source power (TP-Link puissance) :**
```

Source: sensor.tplink_prise_power
Type: power
→ PowerEnergyCycleSensor
→ sensor.hse_energy_tplink_prise_hourly
→ ...
Tracking: intégration trapézoïdale W→kWh
Exemple: P1=100W (t1), P2=150W (t2), Δt=10min
→ P_avg=125W → energy=125/1000 × (10/60) ≈ 0.021 kWh
Reset: identique cycles hourly/daily

```

**Exemple 3 - Métadonnées enrichies :**
```

metadata = {
"is_virtual": False,
"reliability_score": 0.95,
"reference_type": "premium",
"tags": ["tapo", "prise_connectée"]
}
→ Propagé dans extra_state_attributes de chaque sensor

```

**Debug & Repérage rapide (IA) :**

**Classes principales :**
- `CumulativeEnergyCycleSensor` (sources energy kWh)
- `PowerEnergyCycleSensor` (sources power W)

**Fonction API publique :**
- `create_energy_sensors(hass, capteurs_selection) -> list[SensorEntity]`

**Helpers internes :**
- `_shorten_entity_name` (maintenant NO-OP pour NO-SHORTENING)

**Cycles tracking :**
- `CYCLES` dict : configuration reset par cycle
- `_setup_tracking()` : mise en place listeners
- `_on_source_changed()` : callback changement source
- `_on_cycle_reset()` : reset direct (hourly/daily)
- `_on_conditional_reset()` : reset conditionnel (weekly/monthly/yearly)

**Logs caractéristiques :**
- `✅ [CREATE-SENSOR]` : Sensor créé avec succès
- `✅ [PROCESS-ENERGY]` : Source energy traitée
- `⏭️ [SKIP-ENERGY]` : Source non-energy ignorée
- `🔧 [AUTO-FIX]` : Correction auto type source
- `🔄 Reset cycle` : Reset compteur fin de cycle
- `⚠️ [POWER-INT]` : Énergie aberrante ignorée (intégration)
- `[HSE-FIXER]` : Nettoyage noms (today_energy)

**Pour debuguer :**
1. **Vérifier logs [CREATE-SENSOR]** : Combien de sensors créés ?
2. **Contrôler type source** : energy vs power détecté correctement ?
3. **Analyser logs [PROCESS-ENERGY] vs [SKIP-ENERGY]** : Filtre OK ?
4. **Intégration trapézoïdale** : Logs [POWER-INT] pour détection aberrations
5. **Registry noms** : EntityNameRegistry peuplé ?
6. **Event ready** : `hse_energy_sensors_ready` émis après création ?
7. **Restore state** : État récupéré après restart HA ?
8. **Reset cycles** : Logs `🔄 Reset cycle` à l'heure attendue ?
9. **hass.data** : `energy_sensors` contient bien tous les sensors ?
10. **Fusion métadonnées** : capteurs_selection.json + capteurs_power.json fusionnés ?

**🐛 Bugs connus résolus :**
- ✅ **Return manquant** : `create_energy_sensors` retournait None
- ✅ **API deprecated** : Migration `async_track_time_change` → `async_track_utc_time_change`
- ✅ **Collisions unique_id** : Hash MD5 source ajouté
- ✅ **NO-SHORTENING** : Noms complets préservés

⸻

#### 3.7 generator.py — Résumé et accès rapide

**Rôle métier :** Génération automatique des dashboards Lovelace et exports YAML pour les capteurs suivis.

**Fichier Python :** custom_components/home_suivi_elec/generator.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** run_all, generate_complete_dashboard, generate_overview_card, write_yaml_file

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Log initialisation, nombre de sensors générés, warnings sensors manquants

**Exemples d'usage :** Génération/export d'un dashboard YAML adapté à l'énergie détectée pour insertion Raw Editor.

**Pour debuguer :** Vérifier run_all, logs dashboard, contenu export YAML généré.

**🧠 Rôle métier**

Génère automatiquement la configuration Lovelace basée sur l'ensemble des sensors HSE détectés/suivis.

Propose une vue d'ensemble : top 10 consommateurs, graphiques historiques, distribution d'énergie et dashboards par pièce/période.

Permet la génération/export asynchrone d'un dashboard YAML prêt à l'intégration (via l'UI ou en mode Raw Editor/YAML).

**⚙️ Fonctionnement technique**

Fonctions de génération vues/caractéristiques :

`generate_overview_card(sensors)`

`generate_history_card(sensors)`

`generate_energy_distribution_card(sensors)`

`generate_gauge_card(sensor, max_value)`

`generate_statistic_cards(sensors)`

`generate_complete_dashboard(sensors)`

Récupère dynamiquement tous les sensors HSE via `get_all_hse_sensors(hass)`.

Exporte en YAML via `generate_yaml_config(capteurs)` et `write_yaml_file(filename, content)`.

Point d'entrée principal : `async def run_all(hass, options)` qui orchestre la génération complète (dashboard + YAML).

**🔗 Interactions et dépendances**

Utilisé après sélection et scoring : consomme la liste des sensors issus manage_selection, tracking, scoring.

Écrit le dashboard YAML et le log dans `/config/home_suivi_elec_dashboard.yaml`.

Les dashboards et vues générées sont prêtes à intégrer dans l'UI Lovelace (Home Assistant) ou à personnaliser.

**🔄 Cycle de vie**

À chaque demande/scan/refresh, met à jour l'ensemble des vues et exports en fonction des sensors détectés.

Warning si aucun sensor HSE détecté, log complet sur la génération.

**🧪 Exemple**

Un appel à `run_all(hass, options)` génère :

Dashboard Lovelace complet (3 vues principales)

Export YAML auto-documenté prêt à être copié/collé dans l'UI ou le fichier ui-lovelace.yaml

Log détaillé du nombre de sensors inclus et des vues générées

**Debug & Repérage rapide (IA) :**

Fonctions clés :

`run_all(hass, options)` — lancement global génération/export

`get_all_hse_sensors(hass)`

Cartes : `generate_overview_card`, `generate_history_card`, `generate_energy_distribution_card`, `generate_gauge_card`, etc.

Export YAML : `write_yaml_file`

Logs/caractéristiques :

Log d'initialisation : 🧩 Lancement de la génération Lovelace Home Suivi Élec

Nombre de sensors détectés : 📊 {len(sensors)} sensors HSE détectés

Final export : ✅ Dashboard généré : {output_path}

Warning : ⚠️ Aucun sensor HSE trouvé !

Pour debuguer :

Lance la fonction principale `run_all`; inspecte le fichier YAML généré et les logs.

Vérifie la structure des sensors HSE récupérés (via `get_all_hse_sensors`).

Contrôle l'intégration du dashboard dans l'UI Lovelace (dashboard généré → Raw Editor ou ui-lovelace.yaml).

Pour chaque carte/vue, teste les paramètres sensors (top 10, mapping, cycles…).

En cas de sensors manquants, vérifie la chaîne de sélection/tracking/scoring.

⸻

#### 3.8 helpers/validation.py — Résumé et accès rapide

**Rôle métier :** Validation centralisée des données et champs critiques (heure, période, float) ; protection des flows/config contre valeurs invalides.

**Fichier Python :** custom_components/home_suivi_elec/helpers/validation.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** validate_time, HOUR_PATTERN

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Exception vol.Invalid, logs erreur validation horaires

**Exemples d'usage :** Validation format horaire/plage avant création ou update config/option ; filtration flows UI.

**Pour debuguer :** Appeler validate_time, vérifier logs error/invalid, enrichir règles Voluptuous.

**🧠 Rôle métier**

Fournit les routines de validation centralisées pour les champs et objets métiers manipulés par le backend ("Home Suivi Élec").

Garantit l'intégrité et la conformité des données avant stockage, exposition panel, ou exploitation backend.

**⚙️ Fonctionnement technique**

Utilisation de schémas Voluptuous (import vol) pour valider les formats et types utilisés dans la configuration ou les flows backend.

Validation stricte du format horaire avec une expression régulière :

Constante : `HOUR_PATTERN = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")`

Fonction principale : `validate_time(value: str) -> str`
→ Vérifie toute chaîne passée au backend (définition horaire, période de consommation…)
→ Lève une exception Voluptuous si le format n'est pas valide `vol.Invalid`

**🔗 Interactions et dépendances**

Appelée dans les flows de config et d'options (config_flow.py, options_flow.py), pour sécuriser la saisie utilisateur et éviter les erreurs de structuration.

Utilisée par les modules métiers pour validation horaire ou champs critiques (tracking, export, analytics).

**🔄 Cycle de vie**

Appel systématique pour tout champ critique devant être validé avant sauvegarde/export/back-end.

Produit logs/erreurs pour toute saisie non valide.

**🧪 Exemple**

Un utilisateur renseigne "18:30" comme période de déclenchement : `validate_time("18:30")` accepte la valeur.

Une saisie incorrecte "27:99" : exception Voluptuous levée, le backend rejette, loge et prévient côté UI/panel.

**Debug & Repérage rapide (IA) :**

Fonctions clés :

`validate_time(value: str) -> str`

Utilisation de la constante : `HOUR_PATTERN`

Librairie de validation : Voluptuous (import vol)

Logs/exceptions typiques :

Exception : `vol.Invalid`, message "'{value}' n'est pas un format horaire valide (HH:MM)"

Pour debuguer :

Appeler la fonction sur tous les champs horaires transmis en backend/flows.

Inspecter les logs métier en cas d'erreur d'intégrité/time parsing.

Ajouter de nouvelles règles métier ou d'autres schémas Voluptuous si besoin pour valider d'autres formats.

Corriger ou reporter toute exception pour prise en compte côté config/flows et UI.

Ce module est la "barrière de conformité" pour toutes les données critiques.

⸻

#### 3.9 energy_analytics.py — Résumé et accès rapide

**Rôle métier :** Analyse avancée de consommation énergétique, détection d'anomalies, prédictions et comparaisons annuelles.

**Fichier Python :** custom_components/home_suivi_elec/energy_analytics.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** detect_consumption_anomaly, predict_monthly_consumption, compare_yearly_consumption

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** [ANOMALIE], [PRÉDICTION], [COMPARAISON]

**Exemples d'usage :** Prédiction mensualisée, détection surconsommation, comparaison inter-annuelle.

**Pour debuguer :** Lancer fonctions sur historiques, analyser logs diagnostics détaillés.

**🧠 Rôle métier**

Réalise l'analyse détaillée des consommations énergétiques : détection d'anomalies, prédictions mensuelles, et comparaisons annuelles.

Détection automatique des consommations anormales par calcul statistique sur l'historique (écart-type, moyenne).

Génère des prédictions mensuelles (sur la base de l'historique journalier) et des comparaisons intelligentes avec les années précédentes.

**⚙️ Fonctionnement technique**

Détection d'anomalies :

Fonction : `async def detect_consumption_anomaly(hass, sensor_id, threshold_stddev=2.0)`

Récupère l'historique sur 30 jours via `hass.async_add_executor_job(history.state_changes_during_period,...)`

Algorithme : compare la valeur actuelle à la moyenne et l'écart-type

Signale l'anomalie si la déviation > threshold_stddev, retourne diagnostic métier/documenté

Prédiction mensuelle :

Fonction : `async def predict_monthly_consumption(hass, daily_sensor_id)`

Récupère l'historique du mois en cours, calcule la moyenne journalière et multiplie sur le mois entier

Retourne diagnostic et prédiction pour l'utilisateur/back-end

Comparaison annuelle :

Fonction : `async def compare_yearly_consumption(hass, yearly_sensor_id)`

Compare consommation actuelle à celle de l'année précédente à même date

Retourne info détaillée (différence, pourcentage, tendance, message business)

**🔗 Interactions et dépendances**

Utilise le module Home Assistant recorder/history pour accéder aux historiques des sensors.

Consommé par le panel selection, la UI backend, les exports analytics, ou les routines d'alerting avancées.

Appel asynchrone via service HA, API ou integration directe backend.

**🔄 Cycle de vie**

Appelé à chaque demande/refresh/back-end ou panel pour génération d'analyse sur demande.

Génère logs, diagnostics et messages métier pour visualisation UI et panel admin.

**🧪 Exemple**

`detect_consumption_anomaly(hass, "sensor.energy_daily")` -> signale s'il y a surconsommation ce jour vs historique.

`predict_monthly_consumption(hass, "sensor.energy_daily")` -> prédit la facture en fin de mois.

`compare_yearly_consumption(hass, "sensor.energy_yearly")` -> compare l'évolution de la consommation sur 2 ans.

**Debug & Repérage rapide (IA) :**

Fonctions clés :

`detect_consumption_anomaly`

`predict_monthly_consumption`

`compare_yearly_consumption`

Logs/caractéristiques :

Diagnostic détaillé : message retourné dans le dict ("⚠️ ANOMALIE DÉTECTÉE", "📊 Prédiction", "📈 Hausse/Baisse")

Erreurs : logs [ANOMALIE], [PRÉDICTION], [COMPARAISON], exceptions remontées au backend

Pour debuguer :

Appeler les fonctions via API/service et inspecter leurs diagnostics métier (valeurs, messages, statut)

Vérifier accès aux historiques recorder/HA pour l'intégrité des données

Analyser les logs/exceptions pour traitement des sensors absents ou données corrompues

Corriger le threshold ou la période si besoin pour affiner la détection et prédiction

⸻

#### 3.10 energy_export.py — Résumé et accès rapide

**Rôle métier :** Export, backup automatisé et intégration externe des données énergie (JSON, CSV, InfluxDB).

**Fichier Python :** custom_components/home_suivi_elec/energy_export.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** setup_json_backup, setup_influxdb_export, export_to_csv

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Log backup JSON, export CSV, export InfluxDB, erreurs backup

**Exemples d'usage :** Backup quotidien JSON, export CSV manuel, vérification dump InfluxDB.

**Pour debuguer :** Contrôler structure fichiers/backups, logs backup/export.

**🧠 Rôle métier**

Automatise le backup quotidien des données énergie en JSON.

Permet l'export au format CSV à la demande (pour audit, analyse ou import extranet).

Intègre nativement l'export vers InfluxDB si l'intégration Home Assistant est activée.

**⚙️ Fonctionnement technique**

Backup JSON :

Fonction principale : `async def setup_json_backup(hass, backup_enabled=True)`

Planificateur Home Assistant : backup lancé chaque jour à 00h05 via `async_track_time_change`

Toutes les entités contenant "_energy" sont serialisées avec leurs valeurs et attributs, dans `.storage/home_suivi_elec_energy_backup.json`

Export InfluxDB :

Fonction principale : `async def setup_influxdb_export(hass)`

Vérifie si l'intégration "influxdb" est présente dans les composants HA

Lance un callback toutes les heures pour gestion ou extension custom (export natif fait par HA)

Export CSV :

Fonction principale : `async def export_to_csv(hass, sensor_ids, output_file)`

Écrit un CSV horodaté des valeurs pour une liste de sensors (timestamp, sensor_id, valeur, unité)

Retourne True/False selon succès, logge le résultat

**🔗 Interactions et dépendances**

Appelé par init.py lors du setup, et utilisable à la demande ou via service HA/API.

Peut être couplé aux routines d'export ou de diagnostic du panel, ou utilisé pour backup externe.

Affecte le backup, la maintenance, l'audit qualité pour la version métier et partenaire.

**🔄 Cycle de vie**

Backup JSON planifié tous les jours.

Export InfluxDB activé automatiquement si disponible et configurable.

Export CSV sur demande ou dans la maintenance/audit.

**🧪 Exemple**

Lancement auto à 00h05 → backup du jour (`home_suivi_elec_energy_backup.json`)

Export CSV depuis backend : valeurs d'un sous-ensemble de sensors énergie.

InfluxDB gère les exports nativement, mais le module logge et peut servir pour traitements custom.

**Debug & Repérage rapide (IA) :**

Fonctions clés :

`setup_json_backup` : planification et exécution backup quotidien

`setup_influxdb_export` : vérification et lancement export horaire

`export_to_csv` : export CSV ciblé, résultat loggé

Fichiers générés :

`.storage/home_suivi_elec_energy_backup.json` (JSON complet)

Fichier CSV selon paramètre output_file

Logs et exceptions caractéristiques :

Backup : "✅ Backup JSON sauvegardé: {len(data['sensors'])} sensors → {backup_file}"

Export CSV : "✅ Export CSV: {len(sensor_ids)} sensors → {output_file}"

InfluxDB : "ℹ️ InfluxDB non installé, export désactivé" ou "✅ InfluxDB détecté, export horaire activé"

Erreur/exception : "❌ Erreur backup JSON: {e}", "❌ Erreur export CSV: {e}"

Pour debuguer :

Vérifier l'horaire et la structuration du fichier JSON (backup auto, sensors energy)

Contrôler le format CSV et l'intégrité des données exportées

Inspecter la présence et la configuration de l'intégration InfluxDB dans HA

Examiner les logs pour toute exception ou erreur d'écriture

⸻

#### 3.11 panel_selection.py — Résumé et accès rapide

**Rôle métier :** Initialisation automatique du panneau UI sidebar pour configuration et diagnostic métier.

**Fichier Python :** custom_components/home_suivi_elec/panel_selection.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** async_setup_panel

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** home_suivi_elec_panel_registered

**Logs/caractéristiques :** Création panel, absence de fichiers, logs registration

**Exemples d'usage :** Ajout automatique du panneau Home Suivi Élec dans la sidebar HA.

**Pour debuguer :** Vérifier présence panel.js/panel.html, logs registration et réparation.

**🧠 Rôle métier**

Met en place le panneau statique "Home Suivi Élec" accessible dans la barre latérale Home Assistant.

Gère la configuration, la création et l'enregistrement automatique des fichiers statiques nécessaires à l'UI (panel.js, panel.html).

Permet l'accès à la configuration avancée, sélection, visualisation et diagnostic métier du backend via une interface dédiée.

**⚙️ Fonctionnement technique**

Fonction principale : `async_setup_panel(hass: HomeAssistant)`

Vérifie la présence du dossier panel statique, le crée si absent.

Vérifie l'existence des fichiers panel.js et panel.html, génère un HTML minimal si nécessaire.

Enregistre le répertoire comme ressource statique accessible via `/home_suivi_elec`.

Ajoute le panneau dans la barre latérale Home Assistant grâce à `frontend.async_register_built_in_panel`.

Utilise une iframe pointant vers `/home_suivi_elec/panel.html` avec icône dédiée ("mdi:flash").

Stocke l'état d'enregistrement du panneau dans `hass.data["home_suivi_elec_panel_registered"]` pour éviter double setup.

**🔗 Interactions et dépendances**

Appelé par init.py lors du boot initial ou du reload backend.

Dépend du code statique frontend : panel.js et panel.html (gérés côté repo dans custom_components/home_suivi_elec/panel_static/).

Intégré avec la structure de données backend pour diagnostic, visualisation et configuration advanced via panel UI.

**🔄 Cycle de vie**

À chaque boot, vérifie le setup et l'enregistrement du panel sur la sidebar, évite la duplication via la marque backend.

Génère les fichiers statiques et HTML si absents, maintenance simplifiée depuis le backend (auto-repair).

**🧪 Exemple**

Démarrage backend :
→ Crée panel_static si besoin
→ Génère panel.html s'il manque
→ Ajoute Suivi Élec dans la barre latérale
→ Redirige vers l'UI avancée (sélection, mapping, diagnostics métiers)

**Debug & Repérage rapide (IA) :**

Fonction clé : `async_setup_panel(hass)`

Fichiers/dossiers contrôlés :

Dossier : `custom_components/home_suivi_elec/panel_static`

Fichiers : panel.js (frontend), panel.html (généré auto)

Clé hass.data associée : "home_suivi_elec_panel_registered"

Logs/exceptions typiques :

Missing panel.js : [PANEL] Fichier panel.js introuvable : ...

Création auto HTML : [PANEL] panel.html créé automatiquement

Registration : [PANEL] ✅ Panneau Home Suivi Élec ajouté à la barre latérale

Déjà enregistré : [PANEL] ⚙️ Panneau déjà enregistré, aucune action

Pour debuguer :

Inspecter la présence/validité des fichiers panel.js et panel.html dans le dossier statique

Sur erreur de UI, vérifier les logs backend pour auto-réparation/registre

Contrôler la clé dans hass.data pour éviter double initialisation

Confirmer la présence du panneau dans la sidebar après boot/reload

⸻

#### 3.12 sensor_name_fixer.py — Résumé et accès rapide

**Rôle métier :** Solution NO-SHORTENING - Préservation noms complets, élimination orphelins par correspondance directe.

**Fichier Python :** custom_components/home_suivi_elec/sensor_name_fixer.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** _shorten_entity_name (NO-SHORTENING), async_setup_sensor_name_fixer

**Services HA :** fix_sensor_names (via __init__.py)

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Plus de hash/troncature, préservation noms complets, 0 orphelins

**Exemples d'usage :** Validation que Home Assistant supporte noms longs (143+ chars), correspondance directe parent↔enfant.

**Pour debuguer :** Vérifier correspondance API /diagnostic_groups, contrôler noms préservés, valider 0 orphelins.

**🧠 Rôle métier**

**Solution NO-SHORTENING**

✅ NOUVEAU : Implémente la solution NO-SHORTENING (préservation noms complets)
❌ SUPPRIMÉ : Plus de raccourcissement/hash des entity_id  
🎯 OBJECTIF : Élimination complète des orphelins causés par mismatch de noms
🏆 RÉSULTAT : 100% de correspon

dance parent↔enfant (vs 48% avant)

**⚙️ Fonctionnement technique**

Fonction centrale MODIFIÉE :
```

def _shorten_entity_name(entity_name: str, max_length: int = 999) -> str:
"""NO-SHORTENING VERSION - Retour tel quel sauf _today_energy."""
name = entity_name.replace("_today_energy", "")
return name  \# ✅ TEL QUEL - plus de transformation !

```

Validation Home Assistant : Support natif noms longs (143+ caractères testés)
Correspondance directe : parent↔enfant sans raccourcissement
Hash éliminés : Plus de "sprclbcdah", "bppcdah", "cdppcdah"

**🔗 Interactions et dépendances**

Intégration avec energy_tracking.py pour préservation noms complets dans création sensors.
API /diagnostic_groups pour validation temps réel des associations parent↔enfant.
Plus de logique complexe de mapping - correspondance directe garantie.

**🔄 Cycle de vie**

Solution permanente : élimination structurelle des orphelins par design
Validation continue via API diagnostic_groups (0 orphelins maintenu)
Noms lisibles préservés dans logs et interface utilisateur

**🧪 Exemple(s)**

**AVANT (52% d'échec) :**
- Entity créé : sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_hourly
- Entity cherché : sensor.hse_live_sprclbcdah_h (hash illisible)
- Résultat : ❌ 65 orphelins sur 125 sensors

**MAINTENANT (100% de réussite) :**
- Entity créé : sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_h
- Parent attendu : sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation
- Résultat : ✅ 0 orphelin sur 125 sensors

**Debug & Repérage rapide (IA) :**

Fonction clé : `_shorten_entity_name` (retour TEL QUEL)
API diagnostic : `/api/home_suivi_elec/diagnostic_groups` (état associations temps réel)
Logs caractéristiques : Plus de hash, noms complets préservés
Métriques succès : 0 orphelins vs 65 avant, 100% correspondance vs 48%

Pour debuguer :
- Utiliser API /diagnostic_groups pour validation associations parent↔enfant
- Contrôler que les noms restent complets et lisibles dans logs
- Vérifier métriques : 0 orphelins maintenu, correspondance directe garantie
- Plus besoin de logique de mapping complexe - tout est direct maintenant

⸻

#### 3.13 sensor_sync_manager.py — Résumé et accès rapide

**Rôle métier :** Synchronisation automatique (add/remove/update/unavailability) des sensors dans le backend, backup JSON.

**Fichier Python :** custom_components/home_suivi_elec/sensor_sync_manager.py

**Classe(s) principale(s) :** SensorSyncManager

**Fonctions critiques :** get_status, _on_entity_registry_changed, force_sync

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** sync_manager

**Logs/caractéristiques :** Ajout/suppression sensors, backup, sync périodique, erreur

**Exemples d'usage :** Sync incrémentale suite à event HA, backup backups JSON avant purge.

**Pour debuguer :** Inspecter logs sync, status manager, cohérence fichier backups.

**🧠 Rôle métier**

Gère la synchronisation incrémentale et automatisée des capteurs "sensor" (ajout, suppression, indisponibilité, modification) dans le backend.

Assure la cohérence métier et la mise à jour continue du fichier capteurs_power.json à chaque changement décelé dans Home Assistant.

Automatisation du backup, gestion des états et suivi des sensors non disponibles ou en attente de suppression.

**⚙️ Fonctionnement technique**

Classe : `SensorSyncManager`

Abonné aux événements Home Assistant :

- `entity_registry_updated` (création, suppression, modification d'entités)
- `state_changed` (disponibilité réelle en HA)

Scan et synchronisation périodique (toutes les 5 minutes), throttling de synchronisation toutes les 30 secondes après un changement.

Backup automatique du fichier JSON avant toute modification, stockage séquentiel dans le dossier backup.

Méthodes :

- `_on_entity_registry_changed(event)`: détection et traitement des ajouts/suppressions/modifs
- `_on_state_changed(event)`: gestion du statut "unavailable"/"available"
- `_schedule_sync()`, `_process_pending_changes()`, `_periodic_sync()`: logiques asynchrones de synchronisation
- `_add_sensor`, `_remove_sensor`, `_update_sensor`, `_mark_unavailable`, `_mark_available`: gestion métier et cycle de vie du sensor
- `_cleanup_old_sensors`, `_backup_capteurs_file`, `_cleanup_old_backups`: maintenance et nettoyage
- `get_status()`: diagnostic métier backend du gestionnaire
- `force_sync()`: relance la synchronisation totale sur demande ou erreur

**🔗 Interactions et dépendances**

Relié à detect_local.py pour la redétection complète lors d'ajout ou suppression de capteur.

Lecture et écriture du fichier JSON capteurs_power.json, backups gérés dans /backups/

Utilisé par init.py pour coordination globale ou diagnostic backend.

**🔄 Cycle de vie**

Démarrage ou reload backend : setup/init du gestionnaire, relance du scan et écoute évènements.

Synchronisation et backup à chaque changement métier (création/suppression/indisponibilité).

Nettoyage automatique des capteurs obsolètes ou trop longtemps indisponibles.

**🧪 Exemple**

Création d'un sensor : registry event → add → incrémental sync → backup → mise à jour du JSON

Capteur indisponible pendant 7 jours : tag, suppression programmée, backup puis suppression physique

**Debug & Repérage rapide (IA) :**

Classe principale : `SensorSyncManager`

Fonctions clés à vérifier :

- `start()`, `stop()`
- `_on_entity_registry_changed`, `_on_state_changed`
- `_schedule_sync`, `_process_pending_changes`, `_backup_capteurs_file`, `force_sync()`
- `get_status()`

Fichiers manipulés :

- capteurs_power.json
- backups dans /backups/

Logs caractéristiques :

- Ajout : 📥 Nouveau sensor
- Suppression : 🗑️ Sensor supprimé
- Indisponibilité : ⚠️ Sensor unavailable
- Backup : 💾 Backup créé
- Sync périodique : 🔄 Sync périodique
- Erreur synchronisation : ❌ Erreur synchronisation

Pour debuguer :

- Vérifier l'enregistrement/lancement du manager au boot backend
- Contrôler la cohérence du fichier JSON (structure, valeurs, statuts)
- Examiner les logs sur chaque branche métier (add, remove, unavailable, available)
- Inspecter la présence et la rotation des backups
- Utiliser la méthode `get_status()` pour diagnostic côté API/backend

⸻

#### 3.14 power_monitoring.py — Résumé et accès rapide

**Rôle métier :** Création et mise à jour temps réel des sensors HSE Live pour tracking puissance électrique (W).

**Fichier Python :** custom_components/home_suivi_elec/power_monitoring.py

**Classe(s) principale(s) :** LivePowerSensor (SensorEntity)

**Fonctions critiques :** async_setup_power_monitoring, load_power_sensors, create_live_power_sensors, async_track_state_change_event

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** live_power_sensors

**Logs/caractéristiques :** Création sensor live, logs update valeur, indisponibilité, logs dashboard

**Exemples d'usage :** Suivi live puissance via sensors dédiés (hse_live_*), affichage dashboard Lovelace.

**Pour debuguer :** Vérifier création/mise à jour sensors, logs, dashboard panel.

**🧠 Rôle métier**

Crée et administre les sensors HSE Live pour le suivi instantané de la puissance électrique (W) dans Home Assistant.

Miroir enrichi des sensors "power" natifs : chaque entité source reçoit un "sensor.hse_live_*" synchronisé en temps réel.

Permet l'affichage sur les cartes Live Lovelace et la génération d'alertes sur consommation élevée.

**⚙️ Fonctionnement technique**

Classe principale : `LivePowerSensor(SensorEntity)`

Initialisation : entity_id en mode court (hse_live_*), nom formaté, device_class, icône, etc.

Métadonnées enrichies (zone, intégration, fiabilité, device_id…).

Miroir temps réel : mise à jour continue à chaque changement du sensor source grâce à Home Assistant event tracking.

Disponibilité automatique ("unknown", "unavailable" → sensor indisponible).

Fonctions principales :

- `load_power_sensors(hass)` : charge les sensors "power" à surveiller depuis capteurs_power.json.
- `create_live_power_sensors(hass, power_sensors)` : crée les instances LivePowerSensor pour chaque capteur "power".
- `async_setup_power_monitoring(hass, entry)` : point d'entrée pour initialiser et charger le monitoring via hass.data.

Stockage RAM :

Les sensors live sont stockés en liste dans `hass.data[DOMAIN]["live_power_sensors"]`, prêts à être enregistrés (via sensor.py) lors du setup.

**🔗 Interactions et dépendances**

Appelé par init.py lors du setup global backend.

Les sensors sont créés sur la base du fichier capteurs_power.json (généré par detect_local et sensor_sync_manager).

Exposé côté UI et dashboard Lovelace pour affichage temps réel.

**🔄 Cycle de vie**

À chaque scan/config/reload, génère la liste et initialise les "sensor.hse_live_*".

Met à jour en temps réel sur chaque changement d'état du sensor source.

Gère la disponibilité et les erreurs "unknown/unavailable" automatiquement.

**🧪 Exemple**

Pour chaque capteur power ("sensor.tp_link_energy_appart1_power"), la classe crée "sensor.hse_live_tp_link_energy_appart1" avec mirroring direct de la puissance.

Les valeurs sont affichées en temps réel sur Lovelace (carte Gauge, history…) et permettent le suivi instantané métier.

**Debug & Repérage rapide (IA) :**

Classe principale : `LivePowerSensor(SensorEntity)`

Fonctions clés à suivre :

- `async_setup_power_monitoring`
- `load_power_sensors`
- `create_live_power_sensors`
- Event handler : `async_track_state_change_event`

Clé hass.data associée : `live_power_sensors`

Logs caractéristiques :

- Création : 🔴 Création LivePowerSensor: {entity_id} (source: {source_entity})
- Indisponibilité : ⚠️ {entity_id} → Source indisponible
- Mise à jour : 🔄 {entity_id} → {state} W
- Valeur invalide : ❌ {entity_id} → Valeur invalide: {state}
- Initialisation : ✅ POWER MONITORING: {n} sensors temps réel créés

Pour debuguer :

- Vérifier la création/mise à jour des sensors dans hass.data et le frontend (dashboard)
- Contrôler les logs lors de l'ajout/création, mirroring d'état et indisponibilité
- Tester les updates temps réel et la gestion des erreurs/value
- Vérifier la structure JSON et la configuration backend (source, nom, device_id, etc.)

⸻

#### 3.15 debug_json_sets.py — Résumé et accès rapide

**Rôle métier :** Outils de scan et diagnostic des fichiers JSON backend (détection sets non sérialisables).

**Fichier Python :** custom_components/home_suivi_elec/debug_json_sets.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** scan_sets, _read_json_file

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Warning set détecté, logs fichier non conforme, erreur lecture

**Exemples d'usage :** Scan automatique avant migration, correction des formats de données.

**Pour debuguer :** Lancer scan_sets, lire logs, corriger structure JSON/dict/set.

**🧠 Rôle métier**

Fournit des outils de debug pour la vérification automatique des structures JSON utilisées dans le backend Home Suivi Élec.

Détecte notamment les sets ou types non convertibles dans les fichiers JSON métiers, évitant les warning/erreurs au parsing par Home Assistant.

**⚙️ Fonctionnement technique**

Fonction asynchrone principale : `async def scan_sets(hass)`

Parcourt le dossier `custom_components/home_suivi_elec/data/` à la recherche de fichiers .json

Lit chaque fichier dans un thread dédié (évite le warning de blocage principal HA)

Vérifie la structure parsed : signale en log tout set ou object non sérialisable

Exception catchée et loggée automatiquement (message d'erreur + nom du fichier concerné)

Fonction utilitaire interne : `_read_json_file(fichier: Path)`

Ouverture sécurisée et parsing JSON, log sur erreur de lecture ou conversion

**🔗 Interactions et dépendances**

Appelé lors du debug général backend, ou sur demande (shell, service custom, maintenance).

Couvre tous les JSON de data/intermédiaire du backend (sélection, mapping, index, analytics...).

**🔄 Cycle de vie**

À la demande, scan complet et log des datas utilisées dans le backend.

Permet diagnostic express pour maintenance, audit qualité ou vérification avant migration.

**🧪 Exemple**

Après refonte d'une structure ou migration, l'appel à `scan_sets(hass)` signale si un fichier JSON contient des objets non convertibles (ex : des sets python), pour correction immédiate avant blocage en production.

**Debug & Repérage rapide (IA) :**

Fonction principale à vérifier : `scan_sets(hass)`

Fonction utilitaire : `_read_json_file(fichier: Path)`

Dossier concerné : `custom_components/home_suivi_elec/data/`

Logs caractéristiques :

- Set détecté : ⚠️ Set détecté dans {fichier}
- Erreur lecture : ❌ Erreur lecture JSON {fichier} : {erreur}

Pour debuguer :

- Lancer la fonction sur le backend (via shell, service, ou script)
- Inspecter tous les logs pour warning de set/structuration incompatible
- Corriger dans le code source ou le backend métiers toute apparition de set ou type non sérialisable
- Repasser le scan pour confirmer la conformité des fichiers JSON avant update/backup ou migration

⸻

#### 3.16 const.py — Résumé et accès rapide

**Rôle métier :** Centralisation des constantes métier, chemins, options, clés, tarifs et conventions d'intégration.

**Fichier Python :** custom_components/home_suivi_elec/const.py

**Classe(s) principale(s) :** N/A

**Fonctions critiques :** N/A (ensemble de variables)

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** DOMAIN, FICHIER_CAPTEURS, CONF_PRIX_HT, autres clés métiers

**Logs/caractéristiques :** N/A

**Exemples d'usage :** Initialisation des valeurs flows/config/option, mapping d'options métier.

**Pour debuguer :** Vérifier la présence et la valeur des constantes en cas d'erreur de nommage ou de config.

**🧠 Rôle métier**

Centralise toutes les constantes, clés, conventions de nommage et valeurs par défaut utilisées par l'intégration Home Suivi Élec.

Garantit la cohérence des intitulés, types d'abonnement, tarifs, clés d'options et chemins des fichiers backend.

**⚙️ Fonctionnement technique**

Définit le domaine de l'intégration : `DOMAIN = "home_suivi_elec"`

Déclare le chemin centralisé du fichier capteurs détectés :

`FICHIER_CAPTEURS = "custom_components/home_suivi_elec/data/capteurs_detectes.json"`

Liste toutes les clés métiers pour le ConfigFlow, Options, tarifs d'électricité, abonnement, périodes HC/HP/HN, etc. (ex : CONF_PRIX_HT, CONF_TYPE_CONTRAT, CONF_HC_START)

Définit les types de contrat :

`CONTRATS = { "prix_unique": "Tarif unique", "heures_creuses": "Heures Pleines / Creuses" }`

Précise les valeurs par défaut métier pour chaque type de contrat, abonnement mensuel, plages horaires HC, prix HP/HC...

**🔗 Interactions et dépendances**

Importé par tous les modules critiques du backend (detect_local, manage_selection, config_flow, options_flow, generator, tracking...).

Utilisé pour initialiser, valider et manipuler les données de config/utilisateur dans les flows et UI.

**🔄 Cycle de vie**

Chargé à chaque setup ou import backend.

Utilisé à la création, configuration, validation et génération de tous les objets métiers.

**🧪 Exemple**

Génération d'un sensor énergie : utilise les clés et valeurs métier de const.py pour renseigner son nom, period et tarifs associés.

Création ou validation d'une nouvelle config : utilise les clés ConfigFlow/options et les valeurs par défaut métiers.

**Debug & Repérage rapide (IA) :**

Clés métiers principales :

- DOMAIN, FICHIER_CAPTEURS
- Tarifs/utilisateurs : CONF_PRIX_HT, CONF_PRIX_TTC, CONF_ABONNEMENT_MENSUEL_HT, etc.
- Contrats : CONTRATS, plages horaires HC/HP
- Valeurs par défaut : DEFAULTS

Pour debuguer :

- Vérifier en cas de bug sur une clé ou un libellé si celle-ci est bien définie dans const.py
- Contrôler le chemin métier et valeurs par défaut pour tout problème sur la configuration ou l'initialisation d'un sensor
- Maintenir const.py au centre du cycle métier (ne jamais dupliquer une constante hors de ce fichier)
- Corriger ou enrichir via ce fichier toute nouvelle clé métier ou option UI/flow/diagnostic backend

⸻

#### 3.17 config_flow.py — Résumé et accès rapide

**Rôle métier :** Gestion du flux de configuration UI principal à l'ajout de l'intégration (nom, contrat, tarifs…).

**Fichier Python :** custom_components/home_suivi_elec/config_flow.py

**Classe(s) principale(s) :** HomeSuiviElecFlow

**Fonctions critiques :** async_step_user, async_step_tarifs, async_get_options_flow

**Services HA :** N/A (flux config HA natif)

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Création entry, abort doublon, logs validation

**Exemples d'usage :** Formulaire initial d'installation, mapping options métier, configuration hub.

**Pour debuguer :** Tester chaque étape, vérifier logs, abort doublon, data entry.

**🧠 Rôle métier**

Gère le flux de configuration principal lors de l'ajout/installation de l'intégration "Home Suivi Élec" dans Home Assistant.

Permet à l'utilisateur de définir le nom du hub, le type de contrat d'électricité, les tarifs et options avancées par le biais de formulaires interactifs UI.

Centralise la gestion des doublons, validation et création des entrées de configuration dans Home Assistant.

**⚙️ Fonctionnement technique**

Classe principale : `HomeSuiviElecFlow(config_entries.ConfigFlow)`

Flux utilisateur :

- `async_step_user(self, user_input=None)` : formulaire premier niveau pour nom, type de contrat, auto_generate, avec validation et détection doublon (abort "hub_exists")
- `async_step_tarifs(self, user_input=None)` : formulaire suivant selon type de contrat (tarif unique ou heures creuses), avec valeurs métier et validation (schema spécifique)

Validation de float positif, valeurs par défaut, plages horaires via Voluptuous et config_validation

Création d'une nouvelle entrée avec titre et data consolidée, stockée en RAM et accessible à l'intégration

Liaison options : méthode statique async_get_options_flow, retourne le flow avancé (modification à posteriori via Options UI)

**🔗 Interactions et dépendances**

Utilise les constantes/dictionnaires métier de const.py (DOMAIN, CONTRATS, DEFAULTS, etc.)

Liaison à options_flow.py pour la gestion avancée (modification ultérieure)

Appelé automatiquement lors de l'installation ou de la configuration dans HA UI

**🔄 Cycle de vie**

À chaque installation ou ajout de l'intégration : setup initial guidé par formulaire

À chaque modification : options_flow associé pour changement des paramètres

**🧪 Exemple**

Utilisateur installe "Home Suivi Élec" :
→ Saisie du nom du hub, choix contrat, tarifs, horaires
→ Validation doublon et structure métier
→ Création de l'entrée et activation du backend

**Debug & Repérage rapide (IA) :**

Classe principale : `HomeSuiviElecFlow`

Étapes/fonctions clés :

- `async_step_user`
- `async_step_tarifs`
- `async_get_options_flow`

Validation métier :

- Voluptuous, config_validation (types, valeurs limites, horaires HC/HP)
- Contrats et valeurs par défaut via DEFAULTS/CONTRATS (const.py)
- Gestion de la détection de doublon (abort via hub_exists)

Logs/caractéristiques :

- Création : [CONFIG_FLOW] Entry created: {title}
- Validation/abort : [CONFIG_FLOW] Hub exists abort
- Erreur : [CONFIG_FLOW] Erreur sur valeur ou type

Pour debuguer :

- Tester chaque étape du flow UI (user/tarifs) et valider la data créée
- Vérifier le mapping avec const.py pour toute requête de contrat ou tarif
- Inspecter abort et gestion des doublons à chaque ajout
- Lier les modifications à options_flow pour extension métier

⸻

#### 3.18 options_flow.py — Résumé et accès rapide

**Rôle métier :** Flux UI avancé pour modification dynamique options contrat/tarif/config après installation.

**Fichier Python :** custom_components/home_suivi_elec/options_flow.py

**Classe(s) principale(s) :** HomeSuiviElecOptionsFlow

**Fonctions critiques :** async_step_init

**Services HA :** N/A

**Endpoints REST :** N/A

**Clés hass.data :** N/A

**Logs/caractéristiques :** Modification entry, logs validation, entry créée

**Exemples d'usage :** Changement de tarif, plage horaire, options backend et UI après installation.

**Pour debuguer :** Vérifier flux UI, logs création/modification entry, mapping avec const.py.

**🧠 Rôle métier**

Permet à l'utilisateur de modifier les paramètres de l'intégration "Home Suivi Élec" après installation, directement depuis l'UI Home Assistant.

Offre une interface avancée pour ajuster le contrat, tarifs, plages horaires, options d'auto-génération et d'abonnement, sans réinstaller.

Garantit la cohérence métier et la validation des entrées lors de chaque modification.

**⚙️ Fonctionnement technique**

Classe principale : `HomeSuiviElecOptionsFlow(config_entries.OptionsFlow)`

Fonction principale : `async_step_init(self, user_input=None)`

Charge les valeurs courantes ou les defaults métiers depuis DEFAULTS/const.py

Affiche tous les champs du config_flow, selon le contrat sélectionné (unique ou HC/HP)

Valide les données saisies via Voluptuous et config_validation (float positif, string, bool, choix métier)

Crée une nouvelle entrée d'options dans Home Assistant (stockée base, accessible à l'intégration)

**🔗 Interactions et dépendances**

Relié directement à config_flow.py (appel via async_get_options_flow)

Utilise toutes les constantes métiers définies dans const.py (tarifs, types, options clés)

Permet la modification dynamique sans restart via panel UI

**🔄 Cycle de vie**

Appelé à chaque modification utilisateur (menu Options, ou settings dans Home Assistant)

Permet la reconfiguration métier à la volée : contrats, tarifs, plages horaires, options avancées

Valide et sauvegarde chaque modification (impact backend direct)

**🧪 Exemple**

L'utilisateur change le tarif HC à 0.11 : formulaire dynamique → validation → sauvegarde entry → backend mis à jour.

**Debug & Repérage rapide (IA) :**

Classe principale : `HomeSuiviElecOptionsFlow`

Fonction clé à suivre :

- `async_step_init`

Validation métier :

- Voluptuous, config_validation, listes métiers de const.py (contrats, prix, horaires)
- Fusion de defaults et valeurs utilisateur

Logs/caractéristiques :

- Modification : [OPTIONS_FLOW] Options modifiées: {data}
- Validation : [OPTIONS_FLOW] Erreur saisie: {champ}
- Entry créée : [OPTIONS_FLOW] Entry created

Pour debuguer :

- Tester la modification des champs dans l'UI Options, valider la sauvegarde
- Vérifier correspondance avec DEFAULTS, CONTRATS et clés métiers de const.py
- Inspecter logs backend sur chaque modification et validation métiers
- Corriger tout problème de validation ou affichage via Voluptuous/schema

⸻

#### 3.19 proxy_api.py — Résumé et accès rapide

**Rôle métier :** Proxy API sécurisé pour accès frontend (UI/panel) à tous les endpoints backend métiers.

**Fichier Python :** custom_components/home_suivi_elec/proxy_api.py

**Classe(s) principale(s) :** SuiviElecProxyView (HomeAssistantView)

**Fonctions critiques :** post

**Services HA :** N/A

**Endpoints REST :** /api/home_suivi_elec/proxy

**Clés hass.data :** N/A

**Logs/caractéristiques :** Appel proxy, logs erreur, gestion CORS/auth, endpoint non transmis

**Exemples d'usage :** Appel centralisé backend via panel frontend, sécurité et log des accès distants.

**Pour debuguer :** Simuler POST proxy, lire logs, vérifier gestion endpoints/auth/CORS.

**🧠 Rôle métier**

Fait office de proxy entre les requêtes frontend (UI, panel) et les API backend métiers.

Permet de centraliser et sécuriser les appels depuis le panel ou la UI vers le backend, sans exposer directement tous les endpoints.

Peut contourner temporairement l'authentification Home Assistant pour certains endpoints (optionnelle via requires_auth).

**⚙️ Fonctionnement technique**

Classe principale : `SuiviElecProxyView(HomeAssistantView)`

URL du proxy : `/api/home_suivi_elec/proxy`

Nom de la route : `api:home_suivi_elec:proxy`

Authentification : `requires_auth = False` (modifiable si besoin)

CORS : `cors_allowed = True` pour accès cross-UI

Méthode : `async def post(self, request)`

Récupère le payload JSON, lit "endpoint" et "method"

Construit l'URL cible à partir du frontend

Lance la requête HTTP asynchrone via aiohttp.ClientSession()

Retourne la réponse brute (json ou texte selon type), status HTTP

Logge toutes les tentatives et erreurs proxy

Message d'erreur si endpoint non transmis ou exception rencontrée

**🔗 Interactions et dépendances**

Appelé par la UI frontend, panel_selection, ou toute interface JS personnalisée.

Centralise tous les appels du frontend pour sécuriser, monitorer et loguer l'accès aux APIs backend.

Relié à la route proxy `/api/home_suivi_elec/proxy` — n'expose pas les vrais endpoints backend en direct.

**🔄 Cycle de vie**

Initialisé au boot/reload dans le backend (via init.py ou directement par le panel)

Intercepte toutes les requêtes panel/frontend nécessitant accès backend

**🧪 Exemple**

L'UI frontend fait un POST `/api/home_suivi_elec/proxy` avec payload `{ "endpoint": "/api/home_suivi_elec/get_diagnostics" }` → le proxy transfère vers l'API backend, retourne la réponse sécurisée (auth facultative).

**Debug & Repérage rapide (IA) :**

Classe principale : `SuiviElecProxyView`

Fonction clé à surveiller : `post(self, request)`

URL proxy exposée : `/api/home_suivi_elec/proxy`

Logs caractéristiques :

- Appel : [PROXY] METHOD ENDPOINT
- Erreur requête : [PROXY] Erreur: ...
- Endpoint requis manquant : { "error": "endpoint requis" }
- Retour JSON/texte selon la réponse cible

Pour debuguer :

- Vérifier la construction du payload envoyé par la UI/panel frontend
- Examiner le log backend pour chaque appel ou erreur
- Tester différents endpoints backend via le proxy (requête HTTP simulateur/JS)
- Contrôler la gestion du CORS et de l'authentification selon besoin
- Remonter toute exception ou configuration incorrecte via logs et status HTTP

⸻

#### 3.20 entity_name_registry.py — Résumé et accès rapide

**Rôle métier :** Registry universel persistent mapping noms courts ↔ noms complets pour éviter duplication logique.

**Fichier Python :** custom_components/home_suivi_elec/entity_name_registry.py

**Classe principale :** EntityNameRegistry

**Fonctions critiques :**
- async_load, async_save
- register_sync  
- get_display_name
- _generate_display_name

**Services HA :** N/A

**Endpoints REST :** /api/home_suivi_elec/entity_name_registry (GET - voir 3.24)

**Clés hass.data :** N/A (stockage interne registry)

**Logs/caractéristiques :**
- Chargement/sauvegarde registry
- Nombre de mappings

**Exemples d'usage :**
- Enregistrement automatique dans energy_tracking et power_monitoring
- Génération friendly_names lisibles
- Éviter duplication calculs noms

**Pour debuguer :**
- Vérifier fichier entity_name_registry.json
- Contrôler mappings via API GET
- Logs chargement/sauvegarde

**🧠 Rôle métier**

**Registry persistent centralisé :**
- **Mapping bidirectionnel** : short_name (entity_id) ↔ display_name (friendly)
- **Évite duplication** : Plus besoin de recalculer noms dans chaque module
- **Async I/O** : Non-blocking pour Home Assistant
- **Génération automatique** : friendly_names lisibles depuis entity_id

**⚙️ Fonctionnement technique**

**Classe EntityNameRegistry :**

```

registry = EntityNameRegistry(data_dir)
await registry.async_load(hass)  \# Chargement async
registry.register_sync(entity_id, short_name)  \# Enregistrement
await registry.async_save()  \# Sauvegarde async

```

**Méthodes principales :**
| Méthode | Type | Description |
|---------|------|-------------|
| `async_load(hass)` | Async | Charge registry depuis disque |
| `async_save()` | Async | Sauvegarde registry sur disque |
| `register_sync(entity_id, short_name)` | Sync | Enregistre mapping (sans save auto) |
| `get_display_name(short_name)` | Sync | Récupère display_name |
| `get_all_mappings()` | Sync | Retourne tous mappings |
| `_generate_display_name(entity_id)` | Internal | Génère nom lisible |

**Génération display_name :**
- Suppression préfixes (`sensor.`, `_today_energy`)
- Expansion abréviations :
  - `pwr` → `puissance`
  - `cur` → `consommation actuelle`
  - `plug` → `prise connectée`
  - `smart` → `prise intelligente`
- Capitalisation intelligente des mots
- Cas spéciaux : "connectée", "intelligente"

**Stockage :**
- Fichier : `data/entity_name_registry.json`
- Format JSON : `{"short_name": "display_name", ...}`
- Async I/O via `hass.async_add_executor_job`

**🔗 Interactions et dépendances**

**Utilisé par :**
- energy_tracking.py (enregistrement sensors energy)
- power_monitoring.py (enregistrement sensors power live)

**API REST :**
- `/api/home_suivi_elec/entity_name_registry` (GET) - Vue dans 3.24

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Init | Création instance EntityNameRegistry(data_dir) |
| Load | async_load(hass) - chargement depuis JSON |
| Register | register_sync() pour chaque sensor créé |
| Save | async_save() après batch register |
| Query | get_display_name() pour récup noms |

**🧪 Exemple(s)**

**Exemple 1 - Enregistrement dans energy_tracking :**
```

registry = EntityNameRegistry(data_dir)
await registry.async_load(hass)

for cycle in CYCLES.keys():
entity_id = f"sensor.hse_{base_name}_{cycle}"
registry.register_sync(entity_id, base_name)

await registry.async_save()  \# Batch save

```

**Exemple 2 - Génération display_name :**
```

Input: sensor.chambre_pwr_plug_today_energy
→ Nettoyage: chambre_pwr_plug
→ Expansion: chambre_puissance_prise_connectée
→ Capitalisation: Chambre Puissance Prise Connectée

```

**Debug & Repérage rapide (IA) :**

**Classe principale :**
- `EntityNameRegistry`

**Méthodes critiques :**
- `async_load(hass)` : Chargement async
- `async_save()` : Sauvegarde async
- `register_sync(entity_id, short_name)` : Enregistrement
- `_generate_display_name(entity_id)` : Génération nom lisible

**Fichier stockage :**
- `custom_components/home_suivi_elec/data/entity_name_registry.json`

**Logs caractéristiques :**
- `📖 Registry chargé : N mappings`
- `💾 Registry sauvé : N mappings`
- `⚠️ Erreur chargement registry`
- `❌ Erreur sauvegarde registry`

**Pour debuguer :**
1. Vérifier fichier `entity_name_registry.json` existe
2. Contrôler format JSON et contenu
3. Tester API GET `/entity_name_registry` (voir 3.24)
4. Logs chargement/sauvegarde
5. Vérifier appels register_sync() dans energy_tracking/power_monitoring
6. Contrôler génération display_name (expansions, capitalisation)

⸻

#### 3.21 api/unified_api.py — Résumé et accès rapide

**Rôle métier :** API REST unifiée GET (nouvelle génération) exposant données backend réelles (capteurs, config, diagnostics, UI).

**Fichier Python :** custom_components/home_suivi_elec/api/unified_api.py

**Classe principale :** HomeElecUnifiedAPIView (HomeAssistantView)

**Fonctions critiques :**
- get (router principal)
- _handle_sensors, _handle_data, _handle_diagnostics, _handle_config, _handle_ui

**Services HA :** N/A

**Endpoints REST :**
- `/api/home_suivi_elec/sensors` — Liste capteurs détectés + sélection + état HA
- `/api/home_suivi_elec/data` — Données consommation (sensors energy)
- `/api/home_suivi_elec/diagnostics` — Santé système
- `/api/home_suivi_elec/config` — Configuration actuelle
- `/api/home_suivi_elec/ui` — Infos panel UI

**Clés hass.data :** DOMAIN (config, options)

**Logs/caractéristiques :**
- [API Unifiée GET], logs fusion capteurs, health check

**Exemples d'usage :**
- Monitoring externe backend
- Dashboard custom avec données temps réel
- Diagnostic automatisé

**Pour debuguer :**
- Tester chaque endpoint GET
- Vérifier fusion capteurs_power + capteurs_selection
- Analyser health check système

**🧠 Rôle métier**

**API REST moderne unifiée :**
- **Architecture RESTful** : Un endpoint unique `/api/home_suivi_elec/{resource}` avec router interne
- **Données réelles** : Connexion directe backend (capteurs_power.json, hass.data, états HA)
- **Fusion intelligente** : Combine détection + sélection + état live
- **Health monitoring** : Diagnostic automatique santé système
- **Migration progressive** : Remplace 18+ endpoints legacy

**⚙️ Fonctionnement technique**

**Classe HomeElecUnifiedAPIView :**
- URL pattern : `/api/home_suivi_elec/{resource}`
- Router GET avec switch sur resource
- Auth désactivée : `requires_auth = False`
- CORS autorisé : `cors_allowed = True`

**Endpoints disponibles :**

| Resource | Fonction | Données retournées |
|----------|----------|-------------------|
| `sensors` | _handle_sensors | Capteurs détectés + sélection + état HA live |
| `data` | _handle_data | Valeurs consommation sensors HSE energy |
| `diagnostics` | _handle_diagnostics | Santé système, stats capteurs |
| `config` | _handle_config | Configuration utilisateur + options |
| `ui` | _handle_ui | Infos panel, URLs, vues disponibles |
| *(autre)* | — | Meta info + endpoints disponibles |

**Fusion capteurs (endpoint /sensors) :**
1. Charge `capteurs_power.json` (détection)
2. Charge `capteurs_selection.json` (sélection user)
3. Crée index sélection pour fusion rapide
4. Enrichit avec état HA live (current_state, last_changed, attributes)
5. Retourne capteurs fusionnés + stats (total, enabled_count)

**Health monitoring (endpoint /diagnostics) :**
- Statut global : `operational`, `degraded` (>30% unavailable), `critical` (0 sensors)
- Stats : total_detected, hse_energy_sensors, unavailable_sensors
- Sources data : présence fichiers JSON + états HA

**🔗 Interactions et dépendances**

**Lit les fichiers :**
- capteurs_power.json (détection)
- capteurs_selection.json (sélection)

**Accède à :**
- hass.data[DOMAIN] (config, options)
- hass.states (états HA live)

**Utilisé par :**
- Frontend custom/dashboard externe
- Scripts monitoring/debug
- Panel UI avancé

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Init | Enregistrement dans __init__.py |
| Runtime | Réponse GET selon resource |
| Fusion | Load JSON + états HA à chaque requête |
| Cache | Pas de cache (données temps réel) |

**🧪 Exemple(s)**

**Exemple 1 - Liste capteurs fusionnés :**
```

GET /api/home_suivi_elec/sensors
→ {
"error": false,
"data": {
"sensors": [...],  \# Fusion détection + sélection + état HA
"count": 25,
"enabled_count": 18,
"source": "capteurs_power.json + capteurs_selection.json + live_states"
}
}

```

**Exemple 2 - Health check :**
```

GET /api/home_suivi_elec/diagnostics
→ {
"error": false,
"data": {
"system_status": "operational",
"health_check": {
"total_detected": 25,
"hse_energy_sensors": 120,
"unavailable_sensors": 2
},
"backend_connected": true
}
}

```

**Debug & Repérage rapide (IA) :**

**Classe principale :**
- `HomeElecUnifiedAPIView`

**Méthodes handler :**
- `_handle_sensors()` : Fusion capteurs
- `_handle_data()` : Consommations
- `_handle_diagnostics()` : Santé système
- `_handle_config()` : Config/options
- `_handle_ui()` : Infos panel

**Helpers internes :**
- `_load_sensors_data()` : Charge capteurs_power.json async
- `_load_selection_data()` : Charge capteurs_selection.json async
- `_get_hse_energy_sensors()` : Filtre sensors HSE depuis états HA
- `_extract_cycle_from_entity()` : Extrait cycle depuis entity_id

**Logs caractéristiques :**
- `🧪 API Unifiée GET: /{resource}`
- `🔀 Fusion: N capteurs détectés + M sélections`
- `📊 Fusion résultat: X/Y capteurs activés`
- `Erreur API GET: {e}`

**Pour debuguer :**
1. Tester chaque endpoint avec curl/Postman
2. Vérifier fusion capteurs (logs 🔀)
3. Contrôler health check diagnostics
4. Analyser états HA récupérés
5. Vérifier présence fichiers JSON source
6. Logger requêtes pour tracer appels frontend

⸻

#### 3.22 api/unified_api_extensions.py — Résumé et accès rapide

**Rôle métier :** API REST POST/PUT pour actions configuration : sauvegarde sélection, modification options, toggle sensors, reset.

**Fichier Python :** custom_components/home_suivi_elec/api/unified_api_extensions.py

**Classe principale :** HomeElecUnifiedConfigAPIView (HomeAssistantView)

**Fonctions critiques :**
- post (router principal)
- _save_sensor_selection, _update_integration_options, _toggle_sensor_state, _reset_configuration

**Services HA :** N/A

**Endpoints REST :**
- `/api/home_suivi_elec/config/save_selection` (POST)
- `/api/home_suivi_elec/config/update_options` (POST)
- `/api/home_suivi_elec/config/toggle_sensor` (POST)
- `/api/home_suivi_elec/config/reset_config` (POST)

**Clés hass.data :** DOMAIN (options modifiées dynamiquement)

**Logs/caractéristiques :**
- [API Config POST], logs sauvegarde, validation, reset

**Exemples d'usage :**
- Sauvegarde sélection depuis UI custom
- Modification options contractuelles à la volée
- Activation/désactivation capteur spécifique
- Reset config/sélection

**Pour debuguer :**
- Tester POST avec payload JSON
- Vérifier logs validation/sauvegarde
- Contrôler modification fichiers JSON

**🧠 Rôle métier**

**API Configuration moderne (actions POST) :**
- **Modifications dynamiques** : Sauvegarde sélection, options, toggle sans restart
- **Validation stricte** : Vérification structure payload avant modification
- **Sécurité** : Filtrage options valides, validation catégories
- **Traçabilité** : Logs complets de chaque action

**⚙️ Fonctionnement technique**

**Classe HomeElecUnifiedConfigAPIView :**
- URL pattern : `/api/home_suivi_elec/config/{action}`
- Router POST avec switch sur action
- Parsing JSON automatique du body
- Validation payload avant traitement

**Actions disponibles :**

| Action | Payload | Fonction | Effet |
|--------|---------|----------|-------|
| `save_selection` | `{selection: {...}}` | _save_sensor_selection | Sauvegarde capteurs_selection.json |
| `update_options` | `{options: {...}}` | _update_integration_options | MAJ hass.data[DOMAIN]["options"] |
| `toggle_sensor` | `{entity_id, enabled}` | _toggle_sensor_state | Active/désactive capteur |
| `reset_config` | `{type: "selection"/"options"}` | _reset_configuration | Reset config |

**Validation save_selection :**
- Catégories valides : salle_de_bain, cuisine, chauffage, general
- Structure : dict → list[dict] avec entity_id obligatoire
- Retour erreur 400 si structure invalide

**Validation update_options :**
- Options valides filtrées : auto_generate, tariff_type, contract_type, etc.
- Options inconnues ignorées avec warning
- Mise à jour directe hass.data (pas de restart requis)

**🔗 Interactions et dépendances**

**Modifie :**
- capteurs_selection.json (save_selection, toggle_sensor, reset)
- hass.data[DOMAIN]["options"] (update_options, reset)

**Validation via :**
- const.py (DOMAIN, clés options valides)

**Utilisé par :**
- Frontend UI custom
- Panel configuration avancée
- Scripts automatisation

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Init | Enregistrement dans __init__.py |
| Runtime | Réponse POST selon action |
| Validation | Contrôle structure + valeurs |
| Modification | Update JSON ou hass.data |
| Log | Traçabilité complète actions |

**🧪 Exemple(s)**

**Exemple 1 - Sauvegarde sélection :**
```

POST /api/home_suivi_elec/config/save_selection
Body: {
"selection": {
"cuisine": [
{"entity_id": "sensor.xxx", "enabled": true}
]
}
}
→ Sauvegarde dans capteurs_selection.json
→ {"success": true, "categories_saved": 1}

```

**Exemple 2 - Toggle capteur :**
```

POST /api/home_suivi_elec/config/toggle_sensor
Body: {"entity_id": "sensor.xxx", "enabled": false}
→ Désactive dans capteurs_selection.json
→ {"success": true, "enabled": false}

```

**Exemple 3 - Reset sélection :**
```

POST /api/home_suivi_elec/config/reset_config
Body: {"type": "selection"}
→ Réinitialise capteurs_selection.json (vide)
→ {"success": true, "reset_type": "selection"}

```

**Debug & Repérage rapide (IA) :**

**Classe principale :**
- `HomeElecUnifiedConfigAPIView`

**Méthodes handler :**
- `_save_sensor_selection()` : Sauvegarde sélection complète
- `_update_integration_options()` : MAJ options dynamiques
- `_toggle_sensor_state()` : Active/désactive un capteur
- `_reset_configuration()` : Reset selection ou options

**Helpers async I/O :**
- `_load_json_file()` : Lecture async
- `_save_json_file()` : Écriture async
- `_get_selection_file_path()` : Chemin selection JSON

**Logs caractéristiques :**
- `🛠️ API Config POST: /{action}`
- `✅ Sélection sauvegardée: N catégories`
- `✅ Options mises à jour: [keys]`
- `✅ Capteur {entity_id} activé/désactivé`
- `✅ Configuration réinitialisée: {type}`
- `JSON invalide: {e}`

**Pour debuguer :**
1. Tester POST avec curl/Postman + payload JSON
2. Vérifier validation structure (logs erreur 400)
3. Contrôler modifications fichiers JSON
4. Analyser logs sauvegarde/MAJ
5. Vérifier options filtrées vs ignorées
6. Tester reset et vérifier état après

⸻

#### 3.23 manage_selection_views.py — Résumé et accès rapide

**Rôle métier :** Ensemble complet d'endpoints REST legacy pour sélection, mapping, consommations, scoring, sync et diagnostic.

**Fichier Python :** custom_components/home_suivi_elec/manage_selection_views.py

**Classe(s) principale(s) :**
- GetSensorsView, SaveSelectionView, GetSelectionView
- GetConsumptionsView, GetInstantPowerView
- GetUserConfigView, SaveUserConfigView
- GetUserOptionsView, SaveUserOptionsView
- GetSummaryView
- GetSyncStatusView, ForceSyncView
- AutoSelectBestSensorsView, GetSensorQualityScoresView
- HSESensorsPublicView

**Fonctions critiques :**
- Handlers GET/POST pour chaque vue
- _enrich_device_info, _compute_signature, _build_hse_energy_sensor_id

**Services HA :** N/A

**Endpoints REST (pattern `/api/home_suivi_elec/xxx`) :**
- `get_sensors` — Liste capteurs avec sélection/alternatives/référence
- `save_selection` — Sauvegarde sélection (validation doublons/device)
- `get_selection` — Récupère sélection JSON
- `get_consumptions` — Valeurs HSE energy sensors par cycle
- `get_instant_puissance` — Valeurs power temps réel
- `get_user_config`, `save_user_config` — Config utilisateur
- `get_user_options`, `save_user_options` — Options intégration
- `get_summary` — Stats capteurs (total, actifs, doublons)
- `sync/status`, `sync/force` — État/force sync manager
- `auto_select_best_sensors` — Sélection auto (physiques uniquement)
- `get_sensor_quality_scores` — Scores qualité tous capteurs
- `lovelace_sensors` — Liste complète sensors HSE

**Clés hass.data :** N/A direct (accès via manage_selection)

**Logs/caractéristiques :**
- Logs validation, détection doublons/conflits device
- [AUTO_SELECT], [QUALITY_SCORES]
- Logs GetConsumptions avec sensors introuvables

**Exemples d'usage :**
- UI custom frontend pour sélection capteurs
- Dashboard temps réel consommations
- Auto-sélection intelligente capteurs physiques
- Diagnostic scoring qualité

**Pour debuguer :**
- Tester chaque endpoint individuellement
- Vérifier validation doublons (save_selection)
- Analyser fusion capteurs + sélection + état HA
- Contrôler exclusion helpers dans auto_select

**🧠 Rôle métier**

**Collection complète d'endpoints REST legacy :**
- **Sélection/mapping** : get_sensors, save_selection, get_selection
- **Données temps réel** : get_consumptions, get_instant_puissance
- **Configuration** : user_config, user_options
- **Diagnostic** : summary, sync status, quality scores
- **Intelligence** : auto_select (physiques), scoring qualité
- **Export UI** : lovelace_sensors (tous sensors HSE)

**⚙️ Fonctionnement technique**

**Architecture :**
- Chaque vue = classe HomeAssistantView dédiée
- Pattern URL dédié par fonction
- Auth désactivée pour majorité (local use)
- CORS autorisé pour accès cross-origin

**Fonctions helpers partagées :**
- `_enrich_device_info(hass, caps)` : Enrichit capteurs avec device/area/registry
- `_compute_signature(c)` : Signature unique (name+area) pour détection doublons
- `_build_hse_energy_sensor_id(source, cycle)` : Construit entity_id HSE energy
- `_load_json(path)`, `_save_json(path, data)` : I/O JSON sync

**✅ Correction chirurgicale (NO-SHORTENING) :**
```

def _build_hse_energy_sensor_id(source_entity_id: str, cycle: str) -> str:
"""Alignement PARFAIT avec energy_tracking.py"""
base_name = source_entity_id.replace("sensor.", "")

    if "today_energy" in source_entity_id:
        return f"sensor.hse_{base_name}_{cycle}"
    else:
        return f"sensor.hse_energy_{base_name}_{cycle}"
    ```

**Validation SaveSelectionView :**
1. Détection doublons par signature (name+area)
2. Détection conflits device (plusieurs capteurs même device)
3. Retour erreur + liste conflits si détecté
4. Sauvegarde uniquement si validation OK

**Auto-sélection (AutoSelectBestSensorsView) :**
- ✅ **Filtre helpers** : Utilise `is_physical_sensor()` (exclusion min_max, template, etc.)
- Enrichissement qualité : `enrich_sensors_with_quality()`
- Sélection best : `auto_select_best_sensors()` (par device)
- Sauvegarde automatique sélection optimale

**🔗 Interactions et dépendances**

**Importe :**
- manage_selection (chemins JSON)
- sensor_quality_scorer (scoring, auto_select, is_physical_sensor)
- const (DOMAIN, clés config)

**Lit/écrit :**
- capteurs_power.json
- capteurs_selection.json
- user_config.json
- integration_quality.yaml

**Accède à :**
- entity_registry, device_registry, area_registry (enrichissement)
- hass.states (données temps réel)
- hass.data[DOMAIN] (config, options)
- Store (ignored_entities)

**Utilisé par :**
- Frontend UI custom
- Panel selection avancé
- Scripts monitoring/automatisation

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Init | Enregistrement toutes vues dans __init__.py |
| Runtime | Réponse GET/POST selon endpoint |
| Validation | Contrôle structure + doublons |
| I/O | Lecture/écriture JSON async |
| Enrichissement | Fusion registries HA + métadonnées |

**🧪 Exemple(s)**

**Exemple 1 - Auto-sélection avec exclusion helpers :**
```

POST /api/home_suivi_elec/auto_select_best_sensors
→ Détection : 30 capteurs
→ Filtrage : 25 physiques, 5 helpers exclus
→ Scoring + sélection best par device
→ Sauvegarde capteurs_selection.json
→ {
"success": true,
"selected_count": 18,
"helpers_excluded": 5,
"message": "18 meilleurs capteurs physiques sélectionnés. 5 helpers exclus."
}

```

**Exemple 2 - Consommations avec fusion :**
```

GET /api/home_suivi_elec/get_consumptions
→ Pour chaque capteur sélectionné + 5 cycles
→ Cherche sensor.hse_{base}_{cycle} ou sensor.hse_energy_{base}_{cycle}
→ Retourne dict[entity_id][cycle] = valeur kWh

```

**Exemple 3 - Validation doublons save :**
```

POST /api/home_suivi_elec/save_selection
Body: {...sélection avec 2 capteurs même signature...}
→ Détection conflit
→ {
"success": false,
"error": "Conflits détectés",
"conflicts": [{...}],
"device_conflicts": [{...}]
}

```

**Debug & Repérage rapide (IA) :**

**Classes principales :**
- Voir liste complète ci-dessus (13 vues)

**Endpoints critiques :**
- `get_sensors` : Fusion capteurs + sélection + alternatives
- `save_selection` : Validation + sauvegarde
- `get_consumptions` : Valeurs HSE energy (corrigé NO-SHORTENING)
- `auto_select_best_sensors` : Sélection auto physiques
- `get_sensor_quality_scores` : Scoring tous capteurs

**Helpers clés :**
- `_build_hse_energy_sensor_id()` : Construction entity_id alignée energy_tracking
- `_enrich_device_info()` : Enrichissement registries HA
- `_compute_signature()` : Détection doublons

**Logs caractéristiques :**
- `[AUTO_SELECT] Total capteurs chargés : N`
- `[AUTO_SELECT] Physiques : N | Helpers exclus : M`
- `[AUTO_SELECT] ✅ N capteurs physiques sélectionnés`
- `[QUALITY_SCORES] Total : N | Physiques : X | Helpers : Y`
- `[GetConsumptions] Sensor introuvable: {entity_id}`
- Erreurs validation : JSON invalide, conflicts détectés

**Pour debuguer :**
1. Tester chaque endpoint avec curl/Postman
2. Vérifier validation doublons (save_selection)
3. Contrôler construction entity_id HSE (get_consumptions)
4. Analyser exclusion helpers (auto_select, quality_scores)
5. Vérifier enrichissement device/area
6. Tracer logs pour sensors introuvables
7. Valider cohérence avec energy_tracking.py (_build_hse_energy_sensor_id)

⸻

#### 3.24 manage_selection_views_entity_registry.py — Résumé et accès rapide

**Rôle métier :** Expose en API REST le registry universel des noms (courts ↔ complets) pour affichage UI et debug.

**Fichier Python :** custom_components/home_suivi_elec/manage_selection_views_entity_registry.py

**Classe principale :** GetEntityNameRegistryView (HomeAssistantView)

**Fonctions critiques :** get

**Services HA :** N/A

**Endpoints REST :**
- `/api/home_suivi_elec/entity_name_registry` (GET)

**Clés hass.data :** N/A (registry interne)

**Logs/caractéristiques :**
- [ENTITY-NAME-REGISTRY] GET, erreurs load

**Exemples d'usage :**
- Affichage noms lisibles dans UI
- Debug mapping noms
- Validation registry

**Pour debuguer :**
- GET endpoint et vérifier mappings
- Contrôler stats (total, version)
- Logs erreurs load

**🧠 Rôle métier**

**Exposition REST du registry universel :**
- Retourne tous les mappings short_name → display_name
- Statistiques registry (total, version, date création)
- Accès sans auth pour faciliter debug/UI

**⚙️ Fonctionnement technique**

**Classe GetEntityNameRegistryView :**
- URL : `/api/home_suivi_elec/entity_name_registry`
- Méthode : GET uniquement
- Auth désactivée : `requires_auth = False`
- CORS autorisé : `cors_allowed = True`

**Traitement :**
1. Instancie EntityNameRegistry(data_dir)
2. Récupère mappings via `registry.mappings()`
3. Récupère stats via `registry.stats()`
4. Retourne JSON avec success + data

**Format réponse :**
```

{
"success": true,
"mappings": {
"salon_plug": "Salon Prise Connectée",
"chambre_pwr": "Chambre Puissance"
},
"stats": {
"total": 150,
"version": "1.0",
"created": "2025-10-31T10:40:00Z"
}
}

```

**🔗 Interactions et dépendances**

**Utilise :**
- EntityNameRegistry (classe 3.20)

**Enregistré par :**
- api_extra_views.py (via async_register_extra_views)
- ou __init__.py directement

**Utilisé par :**
- Frontend UI pour affichage noms lisibles
- Scripts debug/validation
- Panel configuration

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Init | Enregistrement vue dans __init__.py |
| GET request | Instanciation registry + load |
| Response | Retour mappings + stats JSON |

**🧪 Exemple**

```

GET /api/home_suivi_elec/entity_name_registry
→ {
"success": true,
"mappings": {...150 mappings...},
"stats": {"total": 150, "version": "1.0"}
}

```

**Debug & Repérage rapide (IA) :**

**Classe principale :**
- `GetEntityNameRegistryView`

**Méthode handler :**
- `get(request)` : Retourne registry complet

**Dépendance :**
- `EntityNameRegistry(data_dir)` (voir 3.20)

**Logs caractéristiques :**
- `[ENTITY-NAME-REGISTRY] GET failed: {e}`

**Pour debuguer :**
1. GET endpoint et analyser JSON retourné
2. Vérifier présence entity_name_registry.json
3. Contrôler stats (total mappings)
4. Comparer mappings avec sensors créés
5. Logs erreurs si registry corrompu

⸻

#### 3.25 api_extra_views.py — Résumé et accès rapide

**Rôle métier :** Enregistrement centralisé des vues additionnelles (ping, entity_name_registry, diagnostic_groups).

**Fichier Python :** custom_components/home_suivi_elec/api_extra_views.py

**Classe(s) principale(s) :**
- PingView
- async_register_extra_views (fonction registration)

**Fonctions critiques :**
- async_register_extra_views

**Services HA :** N/A

**Endpoints REST :**
- `/api/home_suivi_elec/ping` (GET) — Test santé API

**Clés hass.data :** N/A

**Logs/caractéristiques :**
- [API] logs enregistrement vues
- ✅/❌ pour chaque vue enregistrée

**Exemples d'usage :**
- Test connexion API backend
- Enregistrement automatique vues auxiliaires
- Centralisation registration endpoints

**Pour debuguer :**
- GET /ping pour test API
- Vérifier logs [API] registration
- Contrôler enregistrement toutes vues

**🧠 Rôle métier**

**Centralisation registration vues additionnelles :**
- **PingView** : Test santé API simple
- **Registration automatique** : GetEntityNameRegistryView, DiagnosticGroupsView
- **Logs traçabilité** : Succès/erreur pour chaque vue
- **Facilite maintenance** : Un seul point d'enregistrement

**⚙️ Fonctionnement technique**

**Classe PingView :**
- URL : `/api/home_suivi_elec/ping`
- Retourne : `{"success": true, "message": "API is working"}`
- Utilisé pour health check rapide

**Fonction async_register_extra_views(hass) :**
```

async def async_register_extra_views(hass):
"""Enregistre toutes les vues additionnelles"""
hass.http.register_view(PingView())
hass.http.register_view(GetEntityNameRegistryView(hass))
hass.http.register_view(DiagnosticGroupsView(hass))

```

**Import vues externes :**
- manage_selection_views_entity_registry.GetEntityNameRegistryView
- manage_selection_views_diagnostic_groups.DiagnosticGroupsView

**🔗 Interactions et dépendances**

**Importe :**
- manage_selection_views_entity_registry
- manage_selection_views_diagnostic_groups

**Appelé par :**
- __init__.py (peut-être, selon architecture)

**Enregistre :**
- PingView locale
- Vues importées externes

**🔄 Cycle de vie**

| Phase | Action |
|-------|--------|
| Init | Appel async_register_extra_views(hass) |
| Registration | Enregistrement chaque vue avec logs |
| Runtime | Vues disponibles endpoints |

**🧪 Exemple**

```


# Dans __init__.py

from .api_extra_views import async_register_extra_views
await async_register_extra_views(hass)

# Logs:

# 🔗 [API] Enregistrement des vues additionnelles...

# ✅ [API] PingView enregistrée: /api/home_suivi_elec/ping

# ✅ [API] EntityNameRegistryView enregistrée

# ✅ [API] DiagnosticGroupsView enregistrée

```

```

GET /api/home_suivi_elec/ping
→ {"success": true, "message": "Home Suivi Elec API is working"}

```

**Debug & Repérage rapide (IA) :**

**Classe locale :**
- `PingView` : Test santé simple

**Fonction registration :**
- `async_register_extra_views(hass)` : Enregistrement centralisé

**Vues enregistrées :**
- PingView (locale)
- GetEntityNameRegistryView (importée)
- DiagnosticGroupsView (importée)

**Logs caractéristiques :**
- `🔗 [API] Enregistrement des vues additionnelles...`
- `✅ [API] PingView enregistrée: /api/home_suivi_elec/ping`
- `✅ [API] EntityNameRegistryView enregistrée`
- `✅ [API] DiagnosticGroupsView enregistrée`
- `❌ [API] Erreur {VueName}: {e}`

**Pour debuguer :**
1. Vérifier logs [API] au boot
2. Test GET /ping pour santé API
3. Contrôler enregistrement toutes vues
4. Vérifier imports modules externes
5. Analyser erreurs registration

#### 3.26 storage_manager.py — Résumé et accès rapide
Rôle métier : Gestionnaire centralisé Storage API - abstraction unifiée pour persistance des données métier (sélection capteurs, config utilisateur, entités ignorées).

Fichier Python : custom_components/home_suivi_elec/storage_manager.py

Classe(s) principale(s) : StorageManager

Fonctions critiques :

async_load_selection, async_save_selection

async_load_user_config, async_save_user_config

async_load_ignored_entities, async_save_ignored_entities

async_export_backup, async_import_backup

async_get_storage_info

Services HA :

home_suivi_elec.get_storage_stats (via init.py)

Endpoints REST : N/A (utilisé en interne backend)

Clés hass.data : storage_manager

Logs/caractéristiques :

[STORAGE], [MIGRATION], [BACKUP]

Logs chargement/sauvegarde/erreur

Métriques taille/temps

Exemples d'usage :

Chargement sélection capteurs au démarrage

Sauvegarde automatique après modification UI

Export backup avant migration

Rollback d'urgence vers legacy

Pour debuguer :

Vérifier fichiers .storage/home_suivi_elec_*

Analyser logs [STORAGE] pour erreurs I/O

Utiliser get_storage_stats pour diagnostic

Contrôler permissions fichiers .storage/

🧠 Rôle métier

Migration Storage API - Objectif stratégique :

✅ Persistance native HA : Utilise Home Assistant Storage API pour garantir la survie des données lors des mises à jour HACS

✅ Protection contre effacement : Plus de perte de sélection/config lors des updates (problème résolu définitivement)

✅ Rétrocompatibilité garantie : Migration automatique depuis fichiers JSON legacy sans perte de données

✅ Rollback d'urgence : Possibilité de revenir aux fichiers legacy en cas de problème

Abstraction Storage unifiée :

Centralise toutes les opérations de lecture/écriture vers Storage API

Gère automatiquement la migration des fichiers legacy (custom_components/home_suivi_elec/data/*.json)

Expose une interface simple et cohérente pour tous les modules backend

Garantit l'intégrité des données avec validation et backup automatique

Données gérées :

Type	Clé Storage	Fichier Legacy	Description
Sélection capteurs	home_suivi_elec_selection	capteurs_selection.json	Liste capteurs actifs utilisateur
Config utilisateur	home_suivi_elec_user_config	user_config.json	Préférences et paramètres personnalisés
Entités ignorées	home_suivi_elec_ignored	ignored_entities.json	Liste capteurs exclus manuellement
⚙️ Fonctionnement technique

Classe StorageManager :


manager = StorageManager(hass)
await manager.async_load_selection()  # Charge sélection (Storage → fallback legacy)
await manager.async_save_selection(data)  # Sauvegarde (Storage + backup legacy)
Architecture Storage API :

Stockage : .storage/home_suivi_elec_*.json (géré nativement par HA)

Protection HACS : Dossier .storage/ ignoré par HACS lors des updates

Atomic writes : Écriture atomique garantie par HA Storage API

Version tracking : Chaque fichier Storage inclut métadonnées de version

Méthodes principales :

Méthode	Type	Description
async_load_selection()	Async	Charge sélection capteurs (Storage → fallback legacy)
async_save_selection(data)	Async	Sauvegarde sélection (Storage + backup legacy)
async_load_user_config()	Async	Charge config utilisateur
async_save_user_config(data)	Async	Sauvegarde config utilisateur
async_load_ignored_entities()	Async	Charge liste entités ignorées
async_save_ignored_entities(data)	Async	Sauvegarde entités ignorées
async_export_backup()	Async	Export JSON complet pour backup externe
async_import_backup(backup_data)	Async	Restauration depuis backup JSON
async_get_storage_info()	Async	Statistiques et diagnostic Storage
Stratégie de migration :


1. Détection fichier legacy existant (capteurs_selection.json)
2. Lecture donnée legacy
3. Validation + conversion format Storage
4. Écriture Storage API
5. Backup fichier legacy (.bak)
6. Log succès migration
Fallback automatique :

Si Storage API indisponible → lecture legacy

Si fichier legacy corrompu → création fichier vide Storage

Si Storage corrompu → tentative restauration depuis legacy backup

Format Storage :

json
{
  "version": 1,
  "key": "home_suivi_elec_selection",
  "data": {
    "sensors": [...],
    "metadata": {
      "last_update": "2025-11-11T19:30:00Z",
      "source": "migration_from_legacy",
      "version": "1.0.0"
    }
  }
}
🔗 Interactions et dépendances

Appelé par :

init.py (setup - chargement initial Storage)

manage_selection.py (sauvegarde sélection après modification)

manage_selection_views.py (endpoints REST sauvegarde)

migration_storage.py (orchestration migration complète)

Dépend de :

Home Assistant Storage API (hass.helpers.storage.Store)

Fichiers JSON legacy pour migration initiale

migration_storage.py pour orchestration migration

Remplace progressivement :

Accès direct fichiers JSON dans custom_components/home_suivi_elec/data/

Logique de lecture/écriture manuelle éparpillée dans modules backend

Services exposés :

get_storage_stats : Diagnostic taille/état fichiers Storage

🔄 Cycle de vie

Phase	Action
Init	Création instance StorageManager(hass)
Setup	Chargement initial depuis Storage (ou migration legacy)
Runtime	Lecture/écriture transparente via API unifiée
Save	Sauvegarde atomique Storage + backup legacy optionnel
Migration	Détection + conversion automatique legacy→Storage
Rollback	Restauration legacy si nécessaire (service dédié)
🧪 Exemple(s)

Exemple 1 - Chargement avec fallback automatique :


manager = StorageManager(hass)

# Tentative chargement Storage API
selection = await manager.async_load_selection()

# Si Storage vide → fallback legacy automatique
# → Lecture capteurs_selection.json
# → Migration automatique vers Storage
# → Backup .bak du fichier legacy
Exemple 2 - Sauvegarde avec backup legacy :


new_selection = {
    "sensors": [
        {"entity_id": "sensor.tapo_salon", "enabled": True},
        {"entity_id": "sensor.tplink_chambre", "enabled": False}
    ]
}

# Sauvegarde Storage + backup legacy
await manager.async_save_selection(new_selection)
# → .storage/home_suivi_elec_selection.json (Storage API)
# → data/capteurs_selection.json.bak (backup legacy)
Exemple 3 - Export backup pour migration manuelle :


# Export complet toutes données Storage
backup_data = await manager.async_export_backup()

# Format export :
# {
#   "selection": {...},
#   "user_config": {...},
#   "ignored_entities": [...],
#   "metadata": {
#     "export_date": "2025-11-11T19:30:00Z",
#     "version": "1.0.0"
#   }
# }

# Sauvegarde fichier externe
with open("/backup/hse_backup.json", "w") as f:
    json.dump(backup_data, f)
Exemple 4 - Diagnostic Storage :


info = await manager.async_get_storage_info()
# Retourne :
# {
#   "storage_available": True,
#   "files": {
#     "selection": {"size": 2048, "exists": True},
#     "user_config": {"size": 512, "exists": True},
#     "ignored": {"size": 128, "exists": False}
#   },
#   "migration_status": "completed",
#   "last_backup": "2025-11-11T18:00:00Z"
# }
Debug & Repérage rapide (IA) :

Classe principale :

StorageManager

Méthodes critiques :

async_load_selection() : Chargement sélection

async_save_selection(data) : Sauvegarde sélection

async_load_user_config() : Config utilisateur

async_export_backup() : Export backup complet

async_get_storage_info() : Diagnostic Storage

Fichiers Storage :

.storage/home_suivi_elec_selection.json (sélection capteurs)

.storage/home_suivi_elec_user_config.json (config utilisateur)

.storage/home_suivi_elec_ignored.json (entités ignorées)

Fichiers legacy (migration) :

custom_components/home_suivi_elec/data/capteurs_selection.json

custom_components/home_suivi_elec/data/user_config.json

custom_components/home_suivi_elec/data/ignored_entities.json

Logs caractéristiques :

✅ [STORAGE] Sélection chargée : N capteurs

✅ [STORAGE] Config sauvegardée : Storage + backup legacy

🔄 [MIGRATION] Migration legacy→Storage : capteurs_selection.json

💾 [BACKUP] Backup legacy créé : data/capteurs_selection.json.bak

⚠️ [STORAGE] Fallback legacy : Storage indisponible

❌ [STORAGE] Erreur lecture Storage : {error}

Pour debuguer :

Vérifier fichiers Storage : .storage/home_suivi_elec_*.json existent ?

Contrôler permissions : Dossier .storage/ accessible en écriture ?

Analyser logs [STORAGE] : Migration réussie ? Fallback legacy ?

Utiliser get_storage_stats : État complet fichiers Storage

Vérifier migration : Fichiers .bak créés dans data/ ?

Tester fallback : Supprimer fichier Storage → fallback legacy OK ?

Export backup : Service export_storage_backup fonctionne ?

Rollback test : Service rollback_to_legacy restaure correctement ?

#### 3.27 migration_storage.py — Résumé et accès rapide
Rôle métier : Orchestrateur migration automatique/manuelle fichiers legacy → Storage API lors du setup, avec export backup et rollback d'urgence.

Fichier Python : custom_components/home_suivi_elec/migration_storage.py

Classe(s) principale(s) : N/A (fonctions asynchrones)

Fonctions critiques :

async_migrate_storage (migration auto/manuelle)

async_export_storage_backup (export JSON complet)

async_rollback_to_legacy (restauration urgence)

Services HA :

home_suivi_elec.export_storage_backup

home_suivi_elec.rollback_to_legacy

home_suivi_elec.get_storage_stats

Endpoints REST : N/A (services HA uniquement)

Clés hass.data : storage_manager

Logs/caractéristiques :

[MIGRATION], [STORAGE], [ROLLBACK]

Logs étapes migration détaillées

Statistiques migration (fichiers, taille, durée)

Exemples d'usage :

Migration automatique au premier démarrage post-update

Export backup avant migration manuelle

Rollback urgence si problème Storage API

Diagnostic complet état migration

Pour debuguer :

Vérifier logs [MIGRATION] pour étapes

Contrôler fichiers .bak créés

Utiliser get_storage_stats pour état

Tester rollback sur instance test

🧠 Rôle métier

Orchestration migration complète :

Migration automatique : Détectée et exécutée au setup si fichiers legacy présents

Migration manuelle : Service HA pour forcer migration ou re-migration

Export backup : Sauvegarde JSON complète avant toute opération destructive

Rollback d'urgence : Restauration rapide fichiers legacy en cas de problème

Protection des données :

Backup automatique : Fichiers .bak créés avant migration

Validation pré-migration : Vérification intégrité données legacy

Transaction atomique : Tout ou rien pour éviter états intermédiaires

Logs détaillés : Traçabilité complète migration pour audit

Cas d'usage couverts :

Scénario	Action	Résultat
Premier démarrage post-update	Migration auto	Storage créé + backup legacy
Migration échouée	Retry manuel	Tentative avec logs détaillés
Storage corrompu	Rollback	Restauration fichiers legacy
Backup avant modif majeure	Export backup	JSON complet exporté
Changement stratégie	Rollback manuel	Retour fichiers legacy
⚙️ Fonctionnement technique

Fonction async_migrate_storage :


await async_migrate_storage(
    hass,
    force=False,  # Force migration même si déjà faite
    backup_legacy=True  # Crée backup .bak fichiers legacy
)
Workflow migration :


1. [DETECTION] Fichiers legacy présents ?
   ├─ Oui → Migration nécessaire
   └─ Non → Vérifier Storage existe

2. [VALIDATION] Intégrité fichiers legacy
   ├─ capteurs_selection.json : format valide ?
   ├─ user_config.json : structure OK ?
   └─ ignored_entities.json : syntaxe correcte ?

3. [BACKUP] Création backups .bak
   ├─ capteurs_selection.json.bak
   ├─ user_config.json.bak
   └─ ignored_entities.json.bak

4. [MIGRATION] Transfert vers Storage API
   ├─ StorageManager.async_save_selection(data)
   ├─ StorageManager.async_save_user_config(data)
   └─ StorageManager.async_save_ignored_entities(data)

5. [VERIFICATION] Contrôle migration réussie
   ├─ Lecture Storage → données identiques ?
   ├─ Fichiers .storage/ créés ?
   └─ Permissions OK ?

6. [CLEANUP] Optionnel (si force_cleanup=True)
   ├─ Suppression fichiers legacy
   └─ Conservation backups .bak

7. [LOG] Statistiques finales
   ├─ Nombre fichiers migrés
   ├─ Taille totale données
   └─ Durée migration
Fonction async_export_storage_backup :


backup_data = await async_export_storage_backup(
    hass,
    output_file="/config/backups/hse_backup_2025-11-11.json"
)
Format export backup :

json
{
  "version": "1.0.0",
  "export_date": "2025-11-11T19:30:00Z",
  "source": "storage_api",
  "data": {
    "selection": {
      "sensors": [...],
      "metadata": {...}
    },
    "user_config": {
      "preferences": {...},
      "options": {...}
    },
    "ignored_entities": [...],
    "storage_info": {
      "files": {...},
      "sizes": {...}
    }
  }
}
Fonction async_rollback_to_legacy :


await async_rollback_to_legacy(
    hass,
    restore_from_backup=True,  # Utilise fichiers .bak
    cleanup_storage=False  # Supprime fichiers Storage après rollback
)
Workflow rollback :


1. [DETECTION] Backups .bak disponibles ?
   ├─ Oui → Restauration depuis .bak
   └─ Non → Erreur : backups requis

2. [RESTORATION] Copie .bak → fichiers legacy
   ├─ capteurs_selection.json ← .bak
   ├─ user_config.json ← .bak
   └─ ignored_entities.json ← .bak

3. [CLEANUP] Optionnel Storage
   ├─ Si cleanup_storage=True
   └─ Suppression fichiers .storage/

4. [VERIFICATION] Validation restauration
   ├─ Fichiers legacy lisibles ?
   └─ Données cohérentes ?

5. [LOG] Confirmation rollback
Services HA exposés :

Service	Description	Paramètres
export_storage_backup	Export JSON complet	output_file (optionnel)
rollback_to_legacy	Restauration fichiers legacy	cleanup_storage (bool)
get_storage_stats	Diagnostic complet Storage	Aucun
🔗 Interactions et dépendances

Appelé par :

init.py (async_setup_entry - migration auto au boot)

Services HA (migration/export/rollback manuels)

Dépend de :

storage_manager.py (StorageManager pour I/O Storage API)

Fichiers legacy custom_components/home_suivi_elec/data/*.json

Produit :

Fichiers Storage .storage/home_suivi_elec_*.json

Backups legacy data/*.json.bak

Exports JSON backup /config/backups/hse_backup_*.json

Expose services :

home_suivi_elec.export_storage_backup

home_suivi_elec.rollback_to_legacy

home_suivi_elec.get_storage_stats

🔄 Cycle de vie

Phase	Action
Setup initial	Migration auto si legacy détecté
Post-update HACS	Re-migration si Storage manquant
Avant modif majeure	Export backup préventif
Problème Storage	Rollback d'urgence
Maintenance	Export backup régulier
🧪 Exemple(s)

Exemple 1 - Migration automatique au boot :


# Dans __init__.py async_setup_entry
from .migration_storage import async_migrate_storage

# Détection + migration automatique
migration_result = await async_migrate_storage(
    hass,
    force=False,  # Migration uniquement si nécessaire
    backup_legacy=True  # Backup .bak obligatoire
)

# Logs migration :
# ✅ [MIGRATION] Fichiers legacy détectés : 3 fichiers
# 🔄 [MIGRATION] Backup legacy : capteurs_selection.json.bak
# ✅ [MIGRATION] Migration Storage : capteurs_selection.json → .storage/
# ✅ [MIGRATION] Migration complète : 3/3 fichiers (1.2 KB, 0.15s)
Exemple 2 - Export backup avant migration manuelle :


# Service HA depuis UI ou automation
service: home_suivi_elec.export_storage_backup
data:
  output_file: "/config/backups/hse_backup_pre_migration.json"

# Résultat :
# ✅ [BACKUP] Export Storage : /config/backups/hse_backup_pre_migration.json
# 💾 [BACKUP] Données exportées : 3 fichiers, 1.5 KB
Exemple 3 - Rollback d'urgence :


# Service HA en cas de problème Storage
service: home_suivi_elec.rollback_to_legacy
data:
  cleanup_storage: false  # Conserver Storage pour debug

# Logs rollback :
# 🔄 [ROLLBACK] Restauration depuis backups .bak
# ✅ [ROLLBACK] capteurs_selection.json restauré
# ✅ [ROLLBACK] user_config.json restauré
# ✅ [ROLLBACK] Rollback terminé : 3/3 fichiers
# ⚠️ [ROLLBACK] Redémarrage HA requis pour prise en compte
Exemple 4 - Diagnostic complet :


# Service HA diagnostic
service: home_suivi_elec.get_storage_stats

# Réponse :
# {
#   "storage_available": true,
#   "migration_status": "completed",
#   "last_migration": "2025-11-11T18:00:00Z",
#   "files": {
#     "selection": {
#       "storage_size": 2048,
#       "legacy_backup_size": 1980,
#       "last_update": "2025-11-11T19:30:00Z"
#     },
#     "user_config": {...},
#     "ignored_entities": {...}
#   },
#   "backup_available": true,
#   "rollback_possible": true
# }
Exemple 5 - Migration forcée (re-migration) :


# Force migration même si déjà faite
await async_migrate_storage(
    hass,
    force=True,  # Force re-migration
    backup_legacy=True  # Nouveau backup .bak
)

# Use case : 
# - Corruption fichier Storage détectée
# - Restauration depuis backup legacy
# - Test migration après modification code
Debug & Repérage rapide (IA) :

Fonctions principales :

async_migrate_storage(hass, force, backup_legacy) : Orchestrateur migration

async_export_storage_backup(hass, output_file) : Export backup JSON

async_rollback_to_legacy(hass, cleanup_storage) : Rollback urgence

Services HA :

home_suivi_elec.export_storage_backup : Export manuel backup

home_suivi_elec.rollback_to_legacy : Rollback manuel

home_suivi_elec.get_storage_stats : Diagnostic Storage

Fichiers impliqués :

Legacy (avant migration) :

custom_components/home_suivi_elec/data/capteurs_selection.json

custom_components/home_suivi_elec/data/user_config.json

custom_components/home_suivi_elec/data/ignored_entities.json

Backups (.bak) :

custom_components/home_suivi_elec/data/capteurs_selection.json.bak

custom_components/home_suivi_elec/data/user_config.json.bak

custom_components/home_suivi_elec/data/ignored_entities.json.bak

Storage API :

.storage/home_suivi_elec_selection.json

.storage/home_suivi_elec_user_config.json

.storage/home_suivi_elec_ignored.json

Exports backup :

/config/backups/hse_backup_*.json

Logs caractéristiques :

✅ [MIGRATION] Fichiers legacy détectés : N fichiers

🔄 [MIGRATION] Backup legacy : fichier.json.bak

✅ [MIGRATION] Migration Storage : fichier.json → .storage/

✅ [MIGRATION] Migration complète : N/N fichiers (X KB, Y s)

⚠️ [MIGRATION] Échec migration : {error}

💾 [BACKUP] Export Storage : /path/to/backup.json

🔄 [ROLLBACK] Restauration depuis backups .bak

✅ [ROLLBACK] Rollback terminé : N/N fichiers

❌ [ROLLBACK] Échec rollback : backups .bak introuvables

Pour debuguer :

Vérifier détection migration : Logs [MIGRATION] Fichiers legacy détectés ?

Contrôler backups .bak : Fichiers créés dans data/ ?

Analyser erreurs migration : Logs [MIGRATION] Échec avec détails error ?

Valider Storage créé : Fichiers .storage/home_suivi_elec_*.json existent ?

Tester export backup : Service export_storage_backup fonctionne ?

Vérifier rollback possible : get_storage_stats → rollback_possible: true ?

Simuler rollback : Test sur instance de dev avant production

Permissions fichiers : Dossiers .storage/ et data/ accessibles ?

Intégrité données : Comparaison legacy vs Storage après migration

Logs détaillés : Activer debug logging pour traçabilité complète

⚠️ Précautions :

Toujours backup avant rollback : Export JSON de sécurité

Test sur instance dev : Valider migration/rollback avant production

Redémarrage HA requis : Après rollback pour prise en compte

Permissions .storage/ : Vérifier accès écriture avant migration

Cleanup prudent : Ne supprimer legacy qu'après validation Storage OK

⸻

## 4. Flows et interactions

🔄 Cycle de vie des données

```

flowchart TD
INIT[__init__.py 🎛️ Orchestration]
DETECT[detect_local.py 🔎 Détection]
SELECTION[manage_selection.py 🎯 Sélection / Mapping]
SCORER[sensor_quality_scorer.py 🏅 Scoring / Diagnostic]
TRACKING[energy_tracking.py 📈 Cycles Énergie]
POWER[power_monitoring.py ⚡ Power Live]
SYNC[sensor_sync_manager.py 🔄 Synchronisation]
ANALYTICS[energy_analytics.py 🧮 Analyse / Prédictions]
EXPORT[energy_export.py 🚚 Export / Backup]
SENSOR[sensor.py 🪪 Entités HSE]
GENERATOR[generator.py 🖼️ Dashboards]
VALIDATION[helpers/validation.py ✅ Validation]
REGISTRY[entity_name_registry.py 📇 Registry noms]
VIEWS[manage_selection_views.py 🌐 API REST Legacy]
API_UNIFIED[api/unified_api.py 🔗 API Unifiée GET]
API_CONFIG[api/unified_api_extensions.py ⚙️ API Config POST]
PANEL[panel_selection.py 🎨 Panel UI]

    INIT --> DETECT
    INIT --> PANEL
    INIT --> API_UNIFIED
    INIT --> API_CONFIG
    INIT --> VIEWS
    
    DETECT --> SELECTION
    DETECT --> VALIDATION
    
    SELECTION --> SCORER
    SCORER --> SELECTION
    SELECTION --> VALIDATION
    
    SELECTION --> TRACKING
    SELECTION --> POWER
    
    TRACKING --> REGISTRY
    TRACKING --> SENSOR
    TRACKING --> VALIDATION
    
    POWER --> REGISTRY
    POWER --> SENSOR
    
    REGISTRY --> TRACKING
    REGISTRY --> POWER
    
    SENSOR --> SYNC
    SYNC --> DETECT
    
    TRACKING --> GENERATOR
    TRACKING --> ANALYTICS
    TRACKING --> EXPORT
    
    GENERATOR --> EXPORT
    ANALYTICS --> GENERATOR
    
    VIEWS --> SELECTION
    VIEWS --> SCORER
    VIEWS --> SYNC
    
    API_UNIFIED --> SELECTION
    API_UNIFIED --> TRACKING
    API_UNIFIED --> SENSOR
    
    API_CONFIG --> SELECTION
    API_CONFIG --> INIT
    
    PANEL --> VIEWS
    PANEL --> API_UNIFIED
    
    style INIT fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    style API_UNIFIED fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style API_CONFIG fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style TRACKING fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style POWER fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style REGISTRY fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    style SYNC fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    ```

🖼️ Illustration :
![Schéma global Backend](diagram-backend.svg)

⸻

## 5. Autres scripts backend

| Fichier | Rôle |
|----------|------|
| `migration_cleanup.py` | Gère la migration des anciennes entités et le nettoyage des entités obsolètes lors d'une mise à jour. |
| `detect_local_debug_standalone.py` / `detect_energy.py` | Outils utilitaires de test et de débogage : permettent d'exécuter la détection locale hors du contexte Home Assistant. |
| `manage_selection_views_diagnostic_groups.py` | Vue REST pour diagnostic associations parent↔enfant (NO-SHORTENING validation). |

⸻

## 6. API et endpoints

📡 Liste complète des endpoints REST exposés

**API Unifiée (Architecture moderne) :**

| Endpoint | Méthode | Section | Description |
|----------|---------|---------|-------------|
| `/api/home_suivi_elec/sensors` | GET | 3.21 | Capteurs détectés + sélection + état HA |
| `/api/home_suivi_elec/data` | GET | 3.21 | Consommations sensors energy |
| `/api/home_suivi_elec/diagnostics` | GET | 3.21 | Santé système backend |
| `/api/home_suivi_elec/config` | GET | 3.21 | Configuration actuelle |
| `/api/home_suivi_elec/ui` | GET | 3.21 | Infos panel UI |
| `/api/home_suivi_elec/config/save_selection` | POST | 3.22 | Sauvegarde sélection capteurs |
| `/api/home_suivi_elec/config/update_options` | POST | 3.22 | MAJ options intégration |
| `/api/home_suivi_elec/config/toggle_sensor` | POST | 3.22 | Active/désactive capteur |
| `/api/home_suivi_elec/config/reset_config` | POST | 3.22 | Reset config/sélection |

**API Legacy (Endpoints dédiés) :**

| Endpoint | Méthode | Section | Description |
|----------|---------|---------|-------------|
| `/api/home_suivi_elec/get_sensors` | GET | 3.23 | Capteurs + alternatives + référence |
| `/api/home_suivi_elec/save_selection` | POST | 3.23 | Sauvegarde avec validation doublons |
| `/api/home_suivi_elec/get_selection` | GET | 3.23 | Récup sélection JSON |
| `/api/home_suivi_elec/get_consumptions` | GET | 3.23 | Valeurs HSE energy par cycle |
| `/api/home_suivi_elec/get_instant_puissance` | GET | 3.23 | Valeurs power temps réel |
| `/api/home_suivi_elec/get_user_config` | GET | 3.23 | Config utilisateur |
| `/api/home_suivi_elec/save_user_config` | POST | 3.23 | Sauvegarde config user |
| `/api/home_suivi_elec/get_user_options` | GET | 3.23 | Options intégration |
| `/api/home_suivi_elec/save_user_options` | POST | 3.23 | Sauvegarde options |
| `/api/home_suivi_elec/get_summary` | GET | 3.23 | Stats résumé capteurs |
| `/api/home_suivi_elec/sync/status` | GET | 3.23 | Statut sync manager |
| `/api/home_suivi_elec/sync/force` | POST | 3.23 | Force synchronisation |
| `/api/home_suivi_elec/auto_select_best_sensors` | POST | 3.23 | Sélection auto physiques |
| `/api/home_suivi_elec/get_sensor_quality_scores` | GET | 3.23 | Scores qualité capteurs |
| `/api/home_suivi_elec/lovelace_sensors` | GET | 3.23 | Liste complète sensors HSE |
| `/api/home_suivi_elec/ping` | GET | 3.25 | Test santé API |
| `/api/home_suivi_elec/entity_name_registry` | GET | 3.24 | Registry noms |
| `/api/home_suivi_elec/diagnostic_groups` | GET | 3.1/3.25 | Diagnostic parent↔enfant |
| `/api/home_suivi_elec/set_ignored_entity` | POST | 3.1 | Ignorer/activer entité |
| `/api/home_suivi_elec/choose_best_for_device` | POST | 3.1 | Choix auto best sensor device |
| `/api/home_suivi_elec/get_diagnostics` | GET | 3.1 | Diagnostic complet HSE |
| `/api/home_suivi_elec/proxy` | POST | 3.19 | Proxy sécurisé frontend→backend |

⸻

## 7. Erreurs, logs et diagnostic

🧾 Politique de gestion d'erreurs et exceptions

Tous les modules suivent une politique de logging standardisée :
- `[MODULE]` : Préfixe identifiant le module source
- Niveaux : DEBUG, INFO, WARNING, ERROR, EXCEPTION
- Format : `[PREFIX] Message détaillé avec contexte`

📁 Emplacement des logs backend

Les logs sont accessibles via les logs Home Assistant :
- CLI : `ha core logs`
- UI : Settings → System → Logs
- Fichier : `/config/home-assistant.log`

Filtres utiles :
- `grep "home_suivi_elec"` - Tous les logs HSE
- `grep "\[PHASE 2\]"` - Logs energy tracking
- `grep "\[CREATE-SENSOR\]"` - Création sensors
- `grep "\[API\]"` - Enregistrement/appels API
- `grep "ERROR\|WARNING"` - Erreurs uniquement

🧰 Outils de diagnostic et audit

**APIs de diagnostic :**
- `/api/home_suivi_elec/diagnostic_groups` - Associations parent↔enfant (0 orphelins)
- `/api/home_suivi_elec/diagnostics` - Health check système (API unifiée)
- `/api/home_suivi_elec/get_diagnostics` - Diagnostic complet HSE (legacy)
- `/api/home_suivi_elec/entity_name_registry` - Registry noms
- `/api/home_suivi_elec/get_sensor_quality_scores` - Scores qualité tous capteurs
- `/api/home_suivi_elec/sync/status` - État sync manager

**Services de maintenance :**
- `fix_sensor_names` - Correction automatique noms
- `migrate_cleanup` - Nettoyage capteurs aberrants
- `reset_integration_sensor` - Reset sensor spécifique
- `generate_local_data
- `Re-détection complète

**Event de synchronisation :**
- `hse_energy_sensors_ready` - Signal fin création sensors

⸻

## 8. Exemples d'usage

**Scénario 1 - Détection et scoring :**
1. Service `generate_local_data` → Détection capteurs
2. Fichier `capteurs_power.json` généré
3. Scoring automatique via `sensor_quality_scorer`
4. Résultats dans `/api/home_suivi_elec/selection`

**Scénario 2 - Energy tracking Phase 2 :**
1. Fusion `capteurs_selection.json` + `capteurs_power.json`
2. Détection auto type (energy vs power)
3. Création 5 cycles par capteur (hourly→yearly)
4. Event `hse_energy_sensors_ready` émis
5. Sensors disponibles dans HA

**Scénario 3 - Diagnostic orphelins NO-SHORTENING :**
1. API `GET /api/home_suivi_elec/diagnostic_groups`
2. Réponse : `{"orphans": [], "stats": {"orphans": 0}}`
3. ✅ 0 orphelins = Solution NO-SHORTENING fonctionnelle

**Scénario 4 - Auto-sélection capteurs physiques :**
1. POST `/api/home_suivi_elec/auto_select_best_sensors`
2. Filtrage helpers (exclusion min_max, template, etc.)
3. Scoring qualité capteurs physiques
4. Sélection best par device
5. Sauvegarde automatique `capteurs_selection.json`

**Scénario 5 - Utilisation API unifiée :**
1. GET `/api/home_suivi_elec/sensors` → Liste capteurs fusionnés
2. POST `/api/home_suivi_elec/config/save_selection` → Sauvegarde sélection
3. GET `/api/home_suivi_elec/data` → Consommations temps réel
4. GET `/api/home_suivi_elec/diagnostics` → Health check

⸻

## 9. Extension et maintenance

📚 Guidelines pour étendre le backend

**Ajout d'un nouveau module :**
1. Créer le fichier dans `custom_components/home_suivi_elec/`
2. Documenter dans backend.md (section 3.X avec format standard)
3. Ajouter import dans `__init__.py`
4. Enregistrer services/API si nécessaire
5. Mettre à jour index recherche rapide (section après intro)
6. Mettre à jour flowchart si interactions majeures
7. Ajouter au changelog (section 11)

**Ajout d'un endpoint API :**

**Option 1 - API Unifiée (recommandé) :**
1. Ajouter resource dans `api/unified_api.py` (GET)
2. Ou ajouter action dans `api/unified_api_extensions.py` (POST)
3. Documenter dans section 6 (tableau endpoints)
4. Tester via curl/Postman

**Option 2 - Endpoint dédié (legacy) :**
1. Créer classe View dans module approprié
2. Enregistrer dans `__init__.py` ou `api_extra_views.py`
3. Documenter dans section module + section 6
4. Ajouter logs [API]

**Ajout d'un service HA :**
1. Enregistrer dans `async_setup_entry` (__init__.py)
2. Ajouter fonction handler correspondante
3. Documenter dans `services.yaml`
4. Mettre à jour section 3.1 (tableau services)
5. Ajouter logs avec préfixe [SERVICE]

**Ajout nouvelle classe sensor :**
1. Hériter de `SensorEntity` et `RestoreEntity` si nécessaire
2. Implémenter méthodes requises (name, state, unique_id, etc.)
3. Enregistrer dans liste appropriée (`energy_sensors` ou `live_power_sensors`)
4. S'assurer ajout via `sensor.py` (async_setup_entry)
5. Utiliser EntityNameRegistry pour noms lisibles
6. Logger création avec préfixe dédié

🔧 Points d'entrée modifiables

**Configuration utilisateur :**
- `config_flow.py` - Setup initial (section 3.17)
- `options_flow.py` - Modifications post-install (section 3.18)
- `const.py` - Valeurs par défaut (section 3.16)

**Logique métier :**
- `sensor_quality_scorer.py` - Algorithme scoring (section 3.4)
- `detect_local.py` - Critères détection (section 3.2)
- `energy_tracking.py` - Cycles et calculs (section 3.6)
- `power_monitoring.py` - Monitoring temps réel (section 3.14)

**UI et exports :**
- `generator.py` - Dashboards Lovelace (section 3.7)
- `energy_export.py` - Formats export (section 3.10)
- `panel_selection.py` - Panel sidebar (section 3.11)

**APIs et vues :**
- `api/unified_api.py` - API GET moderne (section 3.21)
- `api/unified_api_extensions.py` - API POST config (section 3.22)
- `manage_selection_views.py` - Endpoints legacy (section 3.23)

♻️ Compatibilité ascendante garantie

**Migrations automatiques :**
- `migration_cleanup.py` - Gestion versions
- Backup automatique avant modifications (sensor_sync_manager)
- Rollback possible via backups (`data/backups/`)

**Versioning :**
- Version dans `manifest.json`
- Changelog dans backend.md (section 11)
- Tags Git pour releases

**Principes compatibilité :**
- Ne jamais supprimer endpoint sans deprecation notice
- Maintenir format JSON rétrocompatible
- Nouveaux champs toujours optionnels
- Tests régression sur chaque release

⸻

## 10. Ressources associées

**Documentation :**
- [README.md](../README.md) - Vue d'ensemble projet
- [frontend.md](frontend.md) - Documentation UI
- [CHANGELOG.md](../CHANGELOG.md) - Historique versions
- [Diagrammes](.) - Schémas architecture (SVG)

**Code source :**
- [Repository GitHub](https://github.com/silentiss-jean/home_suivi_elec)
- [Dossier backend](../custom_components/home_suivi_elec/)
- [API modules](../custom_components/home_suivi_elec/api/)
- [Helpers](../custom_components/home_suivi_elec/helpers/)

**Outils :**
- Script navigation IA : `docs/scripts/cli_backend_nav.py`
- Tests : `custom_components/home_suivi_elec/tests/`
- Debug standalone : `detect_local_debug_standalone.py`, `detect_energy.py`

**Communauté & Support :**
- [Issues GitHub](https://github.com/silentiss-jean/home_suivi_elec/issues)
- [Discussions](https://github.com/silentiss-jean/home_suivi_elec/discussions)
- [Wiki](https://github.com/silentiss-jean/home_suivi_elec/wiki)

⸻

## 11. 🗓️ Changelog backend.md

- **2025-11-09** — Documentation complète + API Unifiée + Phase 2
  - ✅ **Section 3.1 (__init__.py)** : Mise à jour majeure complète
    - API Unifiée documentée (unified_api.py, unified_api_extensions.py)
    - Service `fix_sensor_names` ajouté
    - Phase 2 energy tracking détaillée (event hse_energy_sensors_ready)
    - Architecture hybride API (Legacy + Unifiée)
    - Tableau services HA mis à jour
  - ✅ **Section 3.6 (energy_tracking.py)** : Nouvelle section complète
    - CumulativeEnergyCycleSensor et PowerEnergyCycleSensor
    - Support energy vs power avec auto-détection
    - Métadonnées Phase 2 (is_virtual, reliability_score, tags)
    - NO-SHORTENING : noms complets préservés
    - Cycles automatiques (hourly→yearly)
    - Bugs résolus documentés (return manquant, API deprecated)
  - ✅ **Section 3.20 (entity_name_registry.py)** : Nouvelle section
    - Registry universel noms courts↔complets
    - API async I/O non-blocking
    - Génération automatique friendly_names
    - Endpoint `/api/home_suivi_elec/entity_name_registry`
  - ✅ **Section 3.21 (api/unified_api.py)** : Nouvelle section
    - API REST unifiée GET (nouvelle génération)
    - Endpoints : sensors, data, diagnostics, config, ui
    - Fusion capteurs détection + sélection + état HA
    - Health monitoring système
  - ✅ **Section 3.22 (api/unified_api_extensions.py)** : Nouvelle section
    - API REST POST/PUT pour configuration
    - Actions : save_selection, update_options, toggle_sensor, reset_config
    - Validation stricte payload
  - ✅ **Section 3.23 (manage_selection_views.py)** : Nouvelle section
    - 13+ endpoints REST legacy complets
    - Auto-sélection capteurs physiques (exclusion helpers)
    - Correction chirurgicale _build_hse_energy_sensor_id (NO-SHORTENING)
    - Validation doublons/conflits device
  - ✅ **Section 3.24 (manage_selection_views_entity_registry.py)** : Nouvelle section
    - Vue REST exposition registry noms
  - ✅ **Section 3.25 (api_extra_views.py)** : Nouvelle section
    - Registration centralisée vues additionnelles
    - PingView pour test santé API
  - 📋 **Index recherche rapide** : Enrichi avec tous nouveaux modules (3.21-3.25)
  - 📋 **Flowchart** : Actualisé avec toutes interactions (INIT, API, POWER, SYNC, REGISTRY)
  - 📋 **Sections 6-10** : Nouvelles sections complètes
    - Section 6 : Tableau complet API et endpoints (Unifiée + Legacy)
    - Section 7 : Erreurs, logs et diagnostic
    - Section 8 : Exemples d'usage (5 scénarios détaillés)
    - Section 9 : Extension et maintenance (guidelines complètes)
    - Section 10 : Ressources associées
  - 🔄 **Changelog** : Cette section créée avec historique complet

- **2025-10-31** — Solution NO-SHORTENING
  - Ajout du bloc « Succès NO-SHORTENING » dans l'introduction (0 orphelins, correspondance directe, API de validation)
  - Ajout de l'endpoint REST `/api/home_suivi_elec/diagnostic_groups` en section 3.1 avec description
  - Réécriture de la section 3.12 (sensor_name_fixer.py) pour refléter NO-SHORTENING (suppression hash/troncature)
  - Ajout d'un encadré Debug en section 3.5 (sensor.py) sur le problème résiduel d'enregistrement et le plan d'investigation
  - Mise à jour de l'index de recherche rapide avec « Diagnostic orphelins API »

- **2025-10-30** — Réorganisation documentation backend
  - Ajout des schémas et de la table hass.data
  - Enrichissement des sections scoring, sélection, sync
  - Flowchart initial cycle de vie données

- **2025-10-27** — Version initiale
  - Première version de la documentation backend
  - Sections principales modules métiers (3.1 à 3.19)
  - Index recherche rapide initial
  - Introduction objectifs et architecture

⸻

## 📝 Notes de maintenance

**Dernière révision complète :** 2025-11-09  
**Prochaine révision prévue :** À chaque release majeure  
**Mainteneur principal :** @silentiss-jean

**Pour contribuer à cette documentation :**
1. Suivre le format standard des sections (voir sections 3.X comme modèle)
2. Mettre à jour l'index recherche rapide
3. Ajouter entry au changelog (section 11)
4. Mettre à jour flowchart si nécessaire
5. Tester tous les exemples fournis
6. Pull request avec description détaillée

**Conventions de nommage dans la doc :**
- `🧠 Rôle métier` : Toujours en premier
- `⚙️ Fonctionnement technique` : Détails implémentation
- `🔗 Interactions et dépendances` : Liens avec autres modules
- `🔄 Cycle de vie` : États et transitions
- `🧪 Exemple(s)` : Cas d'usage concrets
- `Debug & Repérage rapide (IA)` : Pour navigation automatisée

---

**🎉 Documentation backend complète et à jour !**

*Cette documentation est maintenue par la communauté. N'hésitez pas à contribuer pour l'améliorer.*

---

**Légende emojis :**
- 🧠 Rôle métier
- ⚙️ Technique
- 🔗 Interactions
- 🔄 Cycle de vie
- 🧪 Exemples
- 📋 Organisation
- ✅ Succès/validation
- ❌ Erreur/problème
- 🔧 Maintenance
- 📊 Stats/données
- 🎯 Objectif
- 🚀 Performance
- 🔍 Debug
- 📡 API
- 🎨 UI
- 💾 Stockage
- 🔐 Sécurité
- 📝 Documentation
```

