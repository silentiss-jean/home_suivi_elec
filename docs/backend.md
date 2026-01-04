# 🐍 Documentation Backend — Home Suivi Élec

**Généré automatiquement le 13/12/2025 à 11:27**

## 🎯 Vue d'Ensemble

Intégration Home Assistant pour suivi énergétique avancé.

**Philosophie** :
- ✅ Détection automatique capteurs power/energy
- ✅ Scoring qualité pour sélection optimale
- ✅ Tracking cycles : hourly, daily, weekly, monthly, yearly
- ✅ API REST unifiée
- ✅ Storage persistant via Home Assistant Storage API

## 📋 Table des Matières

1. [Index recherche rapide](#🗂️-index-recherche-rapide)
2. [Arborescence](#🗂️-arborescence)
3. [État runtime (Home Assistant)](#-état-runtime-home-assistant)
4. [Modules principaux](#3-modules-principaux)
5. [Modules détaillés](#📦-modules-détaillés)
6. [API REST](#🌐-api-rest)
7. [Services Home Assistant](#🛠️-services-home-assistant)

---

## 🗂️ Index recherche rapide

| Besoin Métier / Fonction | Section | Fichier (chemin) |
|-------------------------|---------|------------------|
| Orchestration backend | 3.1 | /config/custom_components/home_suivi_elec/__init__.py |
| Détection capteurs | 3.2 | /config/custom_components/home_suivi_elec/detect_local.py |
| Sélection/mapping | 3.3 | /config/custom_components/home_suivi_elec/manage_selection.py |
| Scoring qualité | 3.4 | /config/custom_components/home_suivi_elec/sensor_quality_scorer.py |
| Création sensors HSE | 3.5 | /config/custom_components/home_suivi_elec/sensor.py |
| Energy tracking cycles | 3.6 | /config/custom_components/home_suivi_elec/energy_tracking.py |
| Génération Lovelace/YAML | 3.7 | /config/custom_components/home_suivi_elec/generator.py |
| Validation données | 3.8 | /config/custom_components/home_suivi_elec/helpers/validation.py |
| Analytics énergétique | 3.9 | /config/custom_components/home_suivi_elec/energy_analytics.py |
| Export/backup énergie | 3.10 | /config/custom_components/home_suivi_elec/energy_export.py |
| Panel UI (sidebar) | 3.11 | /config/custom_components/home_suivi_elec/panel_selection.py |
| Correction noms sensors | 3.12 | /config/custom_components/home_suivi_elec/sensor_name_fixer.py |
| Synchronisation sensors | 3.13 | /config/custom_components/home_suivi_elec/sensor_sync_manager.py |
| Monitoring puissance | 3.14 | /config/custom_components/home_suivi_elec/power_monitoring.py |
| Debug JSON backend | 3.15 | /config/custom_components/home_suivi_elec/debug_json_sets.py |
| Constantes globales | 3.16 | /config/custom_components/home_suivi_elec/const.py |
| Config UI initiale | 3.17 | /config/custom_components/home_suivi_elec/config_flow.py |
| Options UI avancées | 3.18 | /config/custom_components/home_suivi_elec/options_flow.py |
| Proxy API frontend | 3.19 | /config/custom_components/home_suivi_elec/proxy_api.py |
| Registry noms universel | 3.20 | /config/custom_components/home_suivi_elec/entity_name_registry.py |
| API Unifiée GET | 3.21 | /config/custom_components/home_suivi_elec/api/unified_api.py |
| API Configuration POST | 3.22 | /config/custom_components/home_suivi_elec/api/unified_api_extensions.py |
| Endpoints REST sélection | 3.23 | /config/custom_components/home_suivi_elec/manage_selection_views.py |
| API Registry noms (vue) | 3.24 | /config/custom_components/home_suivi_elec/manage_selection_views_entity_registry.py |
| Vues additionnelles API | 3.25 | /config/custom_components/home_suivi_elec/api_extra_views.py |
| Diagnostic groupes (vue) | 3.26 | /config/custom_components/home_suivi_elec/manage_selection_views_diagnostic_groups.py |


## 🗂️ Arborescence

```
README.md
__init__.py
api/
 __init__.py
 unified_api.py
 unified_api_extensions.py
api_extra_views.py
audit_selection.py
cache_manager.py
calculation_engine.py
config_flow.py
const.py
data/
  capteurs_power_20251213_091124.json
  capteurs_power_20251213_091520.json
  capteurs_power_20251213_091755.json
  capteurs_power_20251213_092244.json
  capteurs_power_20251213_092520.json
  capteurs_power_20251213_092624.json
  capteurs_power_20251213_094124.json
  capteurs_power_20251213_094829.json
  capteurs_power_20251213_095624.json
  capteurs_power_20251213_101124.json
 capteurs_power.json
 files/
debug_json_sets.py
detect_energy.py
detect_local.py
detect_local_debug_standalone.py
energy_analytics.py
energy_export.py
energy_tracking.py
entity_name_registry.py
export.py
generate_docs.py
generator.py
handlers/
 __init__.py
 base_handler.py
 config_handler.py
 data_handler.py
 diagnostics_handler.py
 sensors_handler.py
 ui_handler.py
helpers/
 __init__.py
 integration_quality_fetch.py
 validation.py
hse_debug_tool.py
manage_selection.py
manage_selection_views.py
manage_selection_views_diagnostic_groups.py
manage_selection_views_entity_registry.py
manifest.json
migration_cleanup.py
migration_storage.py
migration_ultra_mapper.py
options_flow.py
panel_selection.py
power_monitoring.py
proxy_api.py
sensor.py
sensor_grouping.py
sensor_name_fixer.py
sensor_quality_scorer.py
sensor_sync_manager.py
services.yaml
storage_manager.py
web_static/
 core/
  app.js
  auth.js
  router.js
 features/
  configuration/
   configuration.api.js
   configuration.js
   configuration.state.js
   configuration.view.js
   duplicates.api.js
   logic/
    selectionSaver.js
    sensorAnnotation.js
    sensorCategories.js
    sensorEnrichment.js
   panels/
    autoSelectPanel.js
    duplicatesPanel.js
    referencePanel.js
    savePanel.js
    selectionPanel.js
    userConfigPanel.js
  customisation/
   customisation.api.js
   customisation.js
   customisation.state.js
   customisation.view.js
   logic/
    themesRegistry.js
   panels/
    groupsPanel.js
  detection/
   detection.api.js
   detection.js
   detection.state.js
   detection.view.js
   logic/
    accordionBuilder.js
    cardBuilder.js
    dataTransformer.js
  diagnostics/
   diagnostics.api.js
   diagnostics.css
   diagnostics.js
   diagnostics.state.js
   diagnostics.view.js
   logic/
    formatters.js
    healthAnalyzer.js
    integrationExtractor.js
    sensorGrouping.js
   panels/
    capteursPanel.js
    healthPanel.js
    integrationsPanel.js
  generation/
   generation.api.js
   generation.js
   generation.view.js
   logic/
    templates/
     overviewCard.js
    yamlComposer.js
  migration/
   components/
    ExportCard.js
    PreviewModal.js
    ProgressBar.js
   exporters/
    autoHelper.js
    templateSensor.js
    utilityMeter.js
   migration.api.js
   migration.js
   migration.state.js
   migration.view.js
   validators/
    helperValidator.js
    yamlValidator.js
  summary/
   logic/
    priceCalculator.js
    summary.loader.js
    tableRenderer.js
   summary.api.js
   summary.css
   summary.js
   summary.state.js
   summary.view.js
 index.html
 shared/
  api/
   httpClient.js
   sensorsApi.js
  components/
   Badge.js
   Button.js
   Card.js
   DownloadButton.js
   Modal.js
   Spinner.js
   Table.js
   Toast.js
  constants.js
  eventBus.js
  proxy.js
  stateModule.js
  uiToast.js
  utils/
   dom.js
   formatters.js
   panelHelpers.js
   sensorRoles.js
   sensorScoring.js
   validators.js
  views/
   commonViews.js
 style.css
 style.hse.themes.css
```
## 🧠 État runtime (Home Assistant)

Capture au moment du run (source de vérité Storage HA).

- **HA config** : `/config`
- **Storage dir** : `/config/.storage`
- **Storage dir exists** : `True`
- **core.config_entries / home_suivi_elec entries** : `1`
- **.storage/home_suivi_elec_* files** : `3`
  - `home_suivi_elec_capteurs_selection_v2` size=14963 mtime=2025-12-13T11:01:59.704927
  - `home_suivi_elec_ignored_entities_v1` size=124 mtime=2025-12-11T08:22:51.453621
  - `home_suivi_elec_sensor_groups_v1` size=17567 mtime=2025-12-07T19:38:07.842449

Snapshot complet : `runtime_snapshot.json`

## 3. Modules principaux

#### 3.1 __init__.py — Orchestration backend

**Fichier Python :** __init__.py

**Classe(s) principale(s) :** ChooseBestForDeviceView, DiagnosticGroupsView, DiagnosticsView, EntityNameRegistryView, PingView, SetIgnoredEntityView

**Fonctions détectées :** __init__, _copy_ui_fresh_complete, _load_file, _merge_entities_unique, _safe_unique_id, async_get_options_flow, extract_ids, is_parent, on_started, parent_key_from_child, score

**Imports clés :** api.unified_api, api.unified_api_extensions, asyncio, const, datetime, debug_json_sets, detect_local, energy_tracking, generator, homeassistant.components, homeassistant.components.http, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.storage, json, logging, manage_selection_views, migration_cleanup, migration_storage, options_flow, os, pathlib, power_monitoring, proxy_api, sensor_name_fixer, sensor_sync_manager, shutil, storage_manager, typing

**Patterns détectés :** Async/Await, Event Listener, REST API View, Storage API

#### 3.2 detect_local.py — Détection capteurs

**Fichier Python :** detect_local.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** __annotate_and_deduplicate, __calculate_priority, __calculate_reliability_score, __classify_platform, __classify_sensor, __detect_all_platforms_from_device, __detect_from_hass, __detect_integration_complete, __device_signature, __get_energy_platforms_from_registry, __get_excluded_platforms, __get_helper_platforms, __get_name_preference, __get_physical_device_signature, __is_premium, __load_quality_map_sync, __read_json_sync, __should_detect_helpers, __write_json_sync

**Imports clés :** asyncio, datetime, homeassistant.helpers, json, logging, os, typing, yaml

**Patterns détectés :** Async/Await

#### 3.3 manage_selection.py — Sélection/mapping

**Fichier Python :** manage_selection.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** _detect_source_type, _enrich_base, _enrich_device_info, _is_premium, _load_json, _load_quality_map_sync, _normalize

**Imports clés :** asyncio, functools, homeassistant.core, homeassistant.helpers, json, logging, manage_selection_views, os, typing, yaml

**Patterns détectés :** Async/Await, Storage API

#### 3.4 sensor_quality_scorer.py — Scoring qualité

**Fichier Python :** sensor_quality_scorer.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** _compute_base_score, auto_select_best_sensors, compute_sensor_score, enrich_sensors_with_quality, get_sensor_recommendation_label, get_sensor_stars, is_physical_sensor

**Imports clés :** collections, logging, typing

#### 3.5 sensor.py — Création sensors HSE

**Fichier Python :** sensor.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** on_hse_sensors_ready

**Imports clés :** const, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.entity_platform, logging

**Patterns détectés :** Async/Await, Event Listener

#### 3.6 energy_tracking.py — Energy tracking cycles

**Fichier Python :** energy_tracking.py

**Classe(s) principale(s) :** PowerEnergyCycleSensor

**Fonctions détectées :** __init__, _get_cycle_start, _load_capteurs_selection, _on_source_changed, _schedule_cycle_reset, extra_state_attributes, native_unit_of_measurement, native_value

**Imports clés :** asyncio, datetime, homeassistant.components.sensor, homeassistant.const, homeassistant.core, homeassistant.helpers.event, homeassistant.util, json, logging, os, typing

**Patterns détectés :** Async/Await, Event Listener, Home Assistant Entity

#### 3.7 generator.py — Génération Lovelace/YAML

**Fichier Python :** generator.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** generate_complete_dashboard, generate_energy_distribution_card, generate_gauge_card, generate_history_card, generate_overview_card, generate_statistic_cards

**Imports clés :** aiofiles, logging, pathlib, typing, yaml

**Patterns détectés :** Async/Await

#### 3.8 helpers/validation.py — Validation données

**Fichier Python :** helpers/validation.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** validate_time

**Imports clés :** re, voluptuous

#### 3.9 energy_analytics.py — Analytics énergétique

**Fichier Python :** energy_analytics.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** N/A

**Imports clés :** __future__, datetime, homeassistant.components.recorder, homeassistant.core, logging, statistics, typing

**Patterns détectés :** Async/Await

#### 3.10 energy_export.py — Export/backup énergie

**Fichier Python :** energy_export.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** N/A

**Imports clés :** __future__, csv, datetime, homeassistant.core, homeassistant.helpers.event, json, logging, typing

**Patterns détectés :** Async/Await, Event Listener

#### 3.11 panel_selection.py — Panel UI (sidebar)

**Fichier Python :** panel_selection.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** N/A

**Imports clés :** homeassistant.components, homeassistant.core, logging, os

**Patterns détectés :** Async/Await, REST API View

#### 3.12 sensor_name_fixer.py — Correction noms sensors

**Fichier Python :** sensor_name_fixer.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** _compute_short_entity_id, _shorten_entity_name, _sync_callback

**Imports clés :** homeassistant.const, homeassistant.core, homeassistant.helpers, logging, re, typing

**Patterns détectés :** Async/Await, Event Listener

#### 3.13 sensor_sync_manager.py — Synchronisation sensors

**Fichier Python :** sensor_sync_manager.py

**Classe(s) principale(s) :** SensorSyncManager

**Fonctions détectées :** __init__, _get_backup_count, _on_entity_registry_changed, _on_state_changed, get_status, list_and_cleanup, load, save

**Imports clés :** asyncio, datetime, detect_local, homeassistant.core, homeassistant.helpers.event, json, logging, os, shutil, typing

**Patterns détectés :** Async/Await, Event Listener

#### 3.14 power_monitoring.py — Monitoring puissance

**Fichier Python :** power_monitoring.py

**Classe(s) principale(s) :** LivePowerSensor

**Fonctions détectées :** __init__, _load_json, _on_source_changed, create_live_sensors, entity_id, extra_state_attributes

**Imports clés :** const, datetime, hashlib, homeassistant.components.sensor, homeassistant.const, homeassistant.core, homeassistant.helpers, homeassistant.helpers.event, homeassistant.helpers.restore_state, json, logging, os, traceback, typing

**Patterns détectés :** Async/Await, Event Listener, Home Assistant Entity, Storage API

#### 3.15 debug_json_sets.py — Debug JSON backend

**Fichier Python :** debug_json_sets.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** _read_json_file

**Imports clés :** asyncio, json, logging, pathlib

**Patterns détectés :** Async/Await

#### 3.16 const.py — Constantes globales

**Fichier Python :** const.py

**Classe(s) principale(s) :** N/A

**Fonctions détectées :** build_hse_sensor_id, extract_cycle_from_hse_id, is_hse_sensor

#### 3.17 config_flow.py — Config UI initiale

**Fichier Python :** config_flow.py

**Classe(s) principale(s) :** HomeSuiviElecFlow

**Fonctions détectées :** async_get_options_flow

**Imports clés :** const, homeassistant, homeassistant.core, homeassistant.helpers, options_flow, voluptuous

**Patterns détectés :** Async/Await, Event Listener

#### 3.18 options_flow.py — Options UI avancées

**Fichier Python :** options_flow.py

**Classe(s) principale(s) :** HomeSuiviElecOptionsFlow

**Fonctions détectées :** __init__, _as_float

**Imports clés :** const, homeassistant, homeassistant.helpers, logging, voluptuous

**Patterns détectés :** Async/Await

#### 3.19 proxy_api.py — Proxy API frontend

**Fichier Python :** proxy_api.py

**Classe(s) principale(s) :** SuiviElecProxyView

**Fonctions détectées :** N/A

**Imports clés :** aiohttp, homeassistant.components.http, logging

**Patterns détectés :** Async/Await, REST API View

#### 3.20 entity_name_registry.py — Registry noms universel

**Fichier Python :** entity_name_registry.py

**Classe(s) principale(s) :** EntityNameRegistry

**Fonctions détectées :** __init__, _generate_display_name, _load_sync, _save_sync, get_all_mappings, get_display_name, register_sync

**Imports clés :** __future__, json, logging, pathlib, typing

**Patterns détectés :** Async/Await

#### 3.21 api/unified_api.py — API Unifiée GET

**Fichier Python :** api/unified_api.py

**Classe(s) principale(s) :** HomeElecUnifiedAPIView

**Fonctions détectées :** __init__, _error, _extract_cycle_from_entity, _format_log_record, _get_hse_energy_sensors, _get_last_detection_time, _get_selection_file_path, _get_sensors_file_path, _get_timestamp, _load_file, _success

**Imports clés :** aiohttp, asyncio, cache_manager, calculation_engine, const, datetime, export, homeassistant.components.http, homeassistant.core, json, logging, os, storage_manager, time

**Patterns détectés :** Async/Await, REST API View, Storage API

#### 3.22 api/unified_api_extensions.py — API Configuration POST

**Fichier Python :** api/unified_api_extensions.py

**Classe(s) principale(s) :** CacheClearView, CacheInvalidateEntityView, HomeElecMigrationHelpersView, HomeElecUnifiedConfigAPIView, ValidationActionView

**Fonctions détectées :** __init__, _apply_action, _error, _get_selection_file_path, _get_timestamp, _load, _save, _success

**Imports clés :** aiohttp, asyncio, cache_manager, calculation_engine, const, datetime, export, homeassistant.components.http, homeassistant.core, json, logging, os, pathlib, sensor_grouping, storage_manager

**Patterns détectés :** Async/Await, REST API View, Storage API

#### 3.23 manage_selection_views.py — Endpoints REST sélection

**Fichier Python :** manage_selection_views.py

**Classe(s) principale(s) :** AutoSelectBestSensorsView, ForceSyncView, GetConsumptionsView, GetInstantPowerView, GetSelectionView, GetSensorQualityScoresView, GetSensorsView, GetSummaryView, GetSyncStatusView, GetUserConfigView, GetUserOptionsView, HSESensorsPublicView, SaveSelectionView, SaveUserConfigView, SaveUserOptionsView, SensorMappingView

**Fonctions détectées :** __init__, _build_hse_energy_sensor_id, _compute_signature, _load_json, _normalize, _normalize_selection_entry, _normalize_selection_payload, _save_json

**Imports clés :** asyncio, const, homeassistant.components.http, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.storage, json, logging, manage_selection, os, sensor_quality_scorer, typing

**Patterns détectés :** Async/Await, REST API View, Storage API

#### 3.24 manage_selection_views_entity_registry.py — API Registry noms (vue)

**Fichier Python :** manage_selection_views_entity_registry.py

**Classe(s) principale(s) :** GetEntityNameRegistryView

**Fonctions détectées :** __init__

**Imports clés :** __future__, asyncio, entity_name_registry, homeassistant.components.http, homeassistant.core, json, logging, pathlib, typing

**Patterns détectés :** Async/Await, REST API View

#### 3.25 api_extra_views.py — Vues additionnelles API

**Fichier Python :** api_extra_views.py

**Classe(s) principale(s) :** PingView

**Fonctions détectées :** N/A

**Imports clés :** __future__, homeassistant.components.http, homeassistant.core, logging, manage_selection_views_diagnostic_groups, manage_selection_views_entity_registry

**Patterns détectés :** Async/Await, REST API View

#### 3.26 manage_selection_views_diagnostic_groups.py — Diagnostic groupes (vue)

**Fichier Python :** manage_selection_views_diagnostic_groups.py

**Classe(s) principale(s) :** DiagnosticGroupsView

**Fonctions détectées :** __init__, is_parent, parent_key_from_child

**Imports clés :** __future__, homeassistant.components.http, homeassistant.core, logging, pathlib, typing

**Patterns détectés :** Async/Await, REST API View

## 📦 Modules Détaillés

### `__init__.py`

- **Lignes** : 1121
- **Taille** : 45938 bytes
- **Fonctions** : __init__, _copy_ui_fresh_complete, _load_file, _merge_entities_unique, _safe_unique_id, async_get_options_flow, extract_ids, is_parent, on_started, parent_key_from_child, score
- **Classes** : ChooseBestForDeviceView, DiagnosticGroupsView, DiagnosticsView, EntityNameRegistryView, PingView, SetIgnoredEntityView
- **Imports** : api.unified_api, api.unified_api_extensions, asyncio, const, datetime, debug_json_sets, detect_local, energy_tracking, generator, homeassistant.components, homeassistant.components.http, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.storage, json, logging, manage_selection_views, migration_cleanup, migration_storage, options_flow, os, pathlib, power_monitoring, proxy_api, sensor_name_fixer, sensor_sync_manager, shutil, storage_manager, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener, REST API View, Storage API

### `api/__init__.py`

- **Lignes** : 1
- **Taille** : 0 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune

### `api/unified_api.py`

- **Lignes** : 862
- **Taille** : 37532 bytes
- **Fonctions** : __init__, _error, _extract_cycle_from_entity, _format_log_record, _get_hse_energy_sensors, _get_last_detection_time, _get_selection_file_path, _get_sensors_file_path, _get_timestamp, _load_file, _success
- **Classes** : HomeElecUnifiedAPIView
- **Imports** : aiohttp, asyncio, cache_manager, calculation_engine, const, datetime, export, homeassistant.components.http, homeassistant.core, json, logging, os, storage_manager, time
- **Async** : Oui
- **Patterns** : Async/Await, REST API View, Storage API

### `api/unified_api_extensions.py`

- **Lignes** : 819
- **Taille** : 32777 bytes
- **Fonctions** : __init__, _apply_action, _error, _get_selection_file_path, _get_timestamp, _load, _save, _success
- **Classes** : CacheClearView, CacheInvalidateEntityView, HomeElecMigrationHelpersView, HomeElecUnifiedConfigAPIView, ValidationActionView
- **Imports** : aiohttp, asyncio, cache_manager, calculation_engine, const, datetime, export, homeassistant.components.http, homeassistant.core, json, logging, os, pathlib, sensor_grouping, storage_manager
- **Async** : Oui
- **Patterns** : Async/Await, REST API View, Storage API

### `api_extra_views.py`

- **Lignes** : 50
- **Taille** : 1756 bytes
- **Fonctions** : Aucune
- **Classes** : PingView
- **Imports** : __future__, homeassistant.components.http, homeassistant.core, logging, manage_selection_views_diagnostic_groups, manage_selection_views_entity_registry
- **Async** : Oui
- **Patterns** : Async/Await, REST API View

### `audit_selection.py`

- **Lignes** : 175
- **Taille** : 6162 bytes
- **Fonctions** : build_report, extract_all_selection_ids, extract_detected_ids, extract_selected_ids, extract_selection_data, load_json, main
- **Classes** : Aucune
- **Imports** : json, os, pathlib, typing

### `cache_manager.py`

- **Lignes** : 177
- **Taille** : 5529 bytes
- **Fonctions** : __init__, _generate_cache_key, get, get_cache_manager, get_stats, invalidate_all, invalidate_entity, set
- **Classes** : CacheManager
- **Imports** : datetime, hashlib, json, logging, threading, typing

### `calculation_engine.py`

- **Lignes** : 350
- **Taille** : 11331 bytes
- **Fonctions** : __init__, _get_abonnement_prorate, get_tarif_kwh, is_hp
- **Classes** : CalculationEngine, PricingProfile
- **Imports** : cache_manager, datetime, homeassistant.core, logging, typing
- **Async** : Oui
- **Patterns** : Async/Await

### `config_flow.py`

- **Lignes** : 74
- **Taille** : 3860 bytes
- **Fonctions** : async_get_options_flow
- **Classes** : HomeSuiviElecFlow
- **Imports** : const, homeassistant, homeassistant.core, homeassistant.helpers, options_flow, voluptuous
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener

### `const.py`

- **Lignes** : 123
- **Taille** : 3880 bytes
- **Fonctions** : build_hse_sensor_id, extract_cycle_from_hse_id, is_hse_sensor
- **Classes** : Aucune

### `debug_json_sets.py`

- **Lignes** : 29
- **Taille** : 986 bytes
- **Fonctions** : _read_json_file
- **Classes** : Aucune
- **Imports** : asyncio, json, logging, pathlib
- **Async** : Oui
- **Patterns** : Async/Await

### `detect_energy.py`

- **Lignes** : 22
- **Taille** : 777 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune
- **Imports** : homeassistant.helpers

### `detect_local.py`

- **Lignes** : 704
- **Taille** : 28923 bytes
- **Fonctions** : __annotate_and_deduplicate, __calculate_priority, __calculate_reliability_score, __classify_platform, __classify_sensor, __detect_all_platforms_from_device, __detect_from_hass, __detect_integration_complete, __device_signature, __get_energy_platforms_from_registry, __get_excluded_platforms, __get_helper_platforms, __get_name_preference, __get_physical_device_signature, __is_premium, __load_quality_map_sync, __read_json_sync, __should_detect_helpers, __write_json_sync
- **Classes** : Aucune
- **Imports** : asyncio, datetime, homeassistant.helpers, json, logging, os, typing, yaml
- **Async** : Oui
- **Patterns** : Async/Await
- **Issues** : Contains TODO/FIXME

### `detect_local_debug_standalone.py`

- **Lignes** : 84
- **Taille** : 2663 bytes
- **Fonctions** : classify_sensor, detect_integrations
- **Classes** : Aucune
- **Imports** : collections, json, os, sqlite3

### `energy_analytics.py`

- **Lignes** : 240
- **Taille** : 8080 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune
- **Imports** : __future__, datetime, homeassistant.components.recorder, homeassistant.core, logging, statistics, typing
- **Async** : Oui
- **Patterns** : Async/Await

### `energy_export.py`

- **Lignes** : 130
- **Taille** : 4241 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune
- **Imports** : __future__, csv, datetime, homeassistant.core, homeassistant.helpers.event, json, logging, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener

### `energy_tracking.py`

- **Lignes** : 385
- **Taille** : 12998 bytes
- **Fonctions** : __init__, _get_cycle_start, _load_capteurs_selection, _on_source_changed, _schedule_cycle_reset, extra_state_attributes, native_unit_of_measurement, native_value
- **Classes** : PowerEnergyCycleSensor
- **Imports** : asyncio, datetime, homeassistant.components.sensor, homeassistant.const, homeassistant.core, homeassistant.helpers.event, homeassistant.util, json, logging, os, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener, Home Assistant Entity

### `entity_name_registry.py`

- **Lignes** : 112
- **Taille** : 4176 bytes
- **Fonctions** : __init__, _generate_display_name, _load_sync, _save_sync, get_all_mappings, get_display_name, register_sync
- **Classes** : EntityNameRegistry
- **Imports** : __future__, json, logging, pathlib, typing
- **Async** : Oui
- **Patterns** : Async/Await

### `export.py`

- **Lignes** : 373
- **Taille** : 13069 bytes
- **Fonctions** : __init__, _load
- **Classes** : ExportService
- **Imports** : __future__, asyncio, homeassistant.core, homeassistant.helpers, homeassistant.util, json, logging, pathlib, typing, yaml
- **Async** : Oui
- **Patterns** : Async/Await

### `generate_docs.py`

- **Lignes** : 869
- **Taille** : 35215 bytes
- **Fonctions** : __init__, _read_json_safe, _read_text_safe, _stat_info, _write_architecture_diagrams, _write_architecture_flows, _write_architecture_header, _write_architecture_overview, _write_backend_api, _write_backend_files, _write_backend_header, _write_backend_index_metier, _write_backend_main_modules, _write_backend_overview, _write_backend_services, _write_backend_toc, _write_frontend_header, _write_frontend_modules, _write_frontend_overview, _write_frontend_shared, _write_frontend_structure, _write_frontend_toc, _write_runtime_block, analyze, analyze_backend, analyze_frontend, generate_all, generate_architecture_doc, generate_backend_doc, generate_frontend_doc, generate_index, main, parse_args, runtime_summary_lines, should_exclude, snapshot_ha_storage, write_runtime_snapshot
- **Classes** : Config, FileAnalysis, JavaScriptAnalyzer, MarkdownGenerator, ProjectAnalyzer, PythonAnalyzer
- **Imports** : __future__, argparse, ast, collections, dataclasses, datetime, json, pathlib, re, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener, Home Assistant Entity, REST API View, Storage API
- **Issues** : Contains TODO/FIXME

### `generator.py`

- **Lignes** : 334
- **Taille** : 9493 bytes
- **Fonctions** : generate_complete_dashboard, generate_energy_distribution_card, generate_gauge_card, generate_history_card, generate_overview_card, generate_statistic_cards
- **Classes** : Aucune
- **Imports** : aiofiles, logging, pathlib, typing, yaml
- **Async** : Oui
- **Patterns** : Async/Await

### `handlers/__init__.py`

- **Lignes** : 1
- **Taille** : 0 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune

### `handlers/base_handler.py`

- **Lignes** : 43
- **Taille** : 1310 bytes
- **Fonctions** : __init__, error, success
- **Classes** : BaseHandler
- **Imports** : abc, aiohttp, homeassistant.core, logging, typing
- **Async** : Oui
- **Patterns** : Async/Await

### `handlers/config_handler.py`

- **Lignes** : 10
- **Taille** : 344 bytes
- **Fonctions** : Aucune
- **Classes** : Config_handler
- **Imports** : base_handler, logging
- **Async** : Oui
- **Patterns** : Async/Await

### `handlers/data_handler.py`

- **Lignes** : 10
- **Taille** : 338 bytes
- **Fonctions** : Aucune
- **Classes** : Data_handler
- **Imports** : base_handler, logging
- **Async** : Oui
- **Patterns** : Async/Await

### `handlers/diagnostics_handler.py`

- **Lignes** : 10
- **Taille** : 359 bytes
- **Fonctions** : Aucune
- **Classes** : Diagnostics_handler
- **Imports** : base_handler, logging
- **Async** : Oui
- **Patterns** : Async/Await

### `handlers/sensors_handler.py`

- **Lignes** : 40
- **Taille** : 1461 bytes
- **Fonctions** : Aucune
- **Classes** : SensorsHandler
- **Imports** : base_handler, logging
- **Async** : Oui
- **Patterns** : Async/Await

### `handlers/ui_handler.py`

- **Lignes** : 10
- **Taille** : 332 bytes
- **Fonctions** : Aucune
- **Classes** : Ui_handler
- **Imports** : base_handler, logging
- **Async** : Oui
- **Patterns** : Async/Await

### `helpers/__init__.py`

- **Lignes** : 3
- **Taille** : 68 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune

### `helpers/integration_quality_fetch.py`

- **Lignes** : 48
- **Taille** : 1653 bytes
- **Fonctions** : fetch_integrations
- **Classes** : Aucune
- **Imports** : json, os, re, requests, yaml

### `helpers/validation.py`

- **Lignes** : 14
- **Taille** : 399 bytes
- **Fonctions** : validate_time
- **Classes** : Aucune
- **Imports** : re, voluptuous

### `hse_debug_tool.py`

- **Lignes** : 1018
- **Taille** : 35318 bytes
- **Fonctions** : _map_literal_to_storage, _resolve_repo_candidate_paths, analyze_js_file, analyze_python_file, build_backend_invariants, build_export_issue_hypotheses, build_frontend_invariants, build_refactor_plan, debug_print, extract_download_flow, extract_storage_files, main, make_backup, parse_args, read_json_safe, read_text_safe, safe_mkdir, safe_write_json, scan_backend, scan_frontend, should_exclude, snapshot_ha_storage, stat_info, storage_lookup_index
- **Classes** : DebugConfig, JsFileAnalysis, PyFileAnalysis
- **Imports** : __future__, argparse, ast, dataclasses, datetime, json, os, pathlib, re, tarfile, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener, Home Assistant Entity, REST API View, Storage API
- **Issues** : Contains TODO/FIXME

### `manage_selection.py`

- **Lignes** : 266
- **Taille** : 9649 bytes
- **Fonctions** : _detect_source_type, _enrich_base, _enrich_device_info, _is_premium, _load_json, _load_quality_map_sync, _normalize
- **Classes** : Aucune
- **Imports** : asyncio, functools, homeassistant.core, homeassistant.helpers, json, logging, manage_selection_views, os, typing, yaml
- **Async** : Oui
- **Patterns** : Async/Await, Storage API

### `manage_selection_views.py`

- **Lignes** : 1050
- **Taille** : 42754 bytes
- **Fonctions** : __init__, _build_hse_energy_sensor_id, _compute_signature, _load_json, _normalize, _normalize_selection_entry, _normalize_selection_payload, _save_json
- **Classes** : AutoSelectBestSensorsView, ForceSyncView, GetConsumptionsView, GetInstantPowerView, GetSelectionView, GetSensorQualityScoresView, GetSensorsView, GetSummaryView, GetSyncStatusView, GetUserConfigView, GetUserOptionsView, HSESensorsPublicView, SaveSelectionView, SaveUserConfigView, SaveUserOptionsView, SensorMappingView
- **Imports** : asyncio, const, homeassistant.components.http, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.storage, json, logging, manage_selection, os, sensor_quality_scorer, typing
- **Async** : Oui
- **Patterns** : Async/Await, REST API View, Storage API

### `manage_selection_views_diagnostic_groups.py`

- **Lignes** : 102
- **Taille** : 3973 bytes
- **Fonctions** : __init__, is_parent, parent_key_from_child
- **Classes** : DiagnosticGroupsView
- **Imports** : __future__, homeassistant.components.http, homeassistant.core, logging, pathlib, typing
- **Async** : Oui
- **Patterns** : Async/Await, REST API View

### `manage_selection_views_entity_registry.py`

- **Lignes** : 41
- **Taille** : 1265 bytes
- **Fonctions** : __init__
- **Classes** : GetEntityNameRegistryView
- **Imports** : __future__, asyncio, entity_name_registry, homeassistant.components.http, homeassistant.core, json, logging, pathlib, typing
- **Async** : Oui
- **Patterns** : Async/Await, REST API View

### `migration_cleanup.py`

- **Lignes** : 119
- **Taille** : 4618 bytes
- **Fonctions** : _cleanup_sync
- **Classes** : Aucune
- **Imports** : asyncio, homeassistant.components.recorder, homeassistant.components.recorder.models, homeassistant.components.recorder.models.statistics, homeassistant.components.recorder.statistics, homeassistant.components.recorder.util, homeassistant.core, logging
- **Async** : Oui
- **Patterns** : Async/Await

### `migration_storage.py`

- **Lignes** : 159
- **Taille** : 5303 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune
- **Imports** : asyncio, homeassistant.core, logging, pathlib, storage_manager
- **Async** : Oui
- **Patterns** : Async/Await, Storage API

### `migration_ultra_mapper.py`

- **Lignes** : 188
- **Taille** : 7615 bytes
- **Fonctions** : find_all_func_classes, find_component_usages, get_example, main, tree
- **Classes** : Aucune
- **Imports** : json, os, re

### `options_flow.py`

- **Lignes** : 69
- **Taille** : 3440 bytes
- **Fonctions** : __init__, _as_float
- **Classes** : HomeSuiviElecOptionsFlow
- **Imports** : const, homeassistant, homeassistant.helpers, logging, voluptuous
- **Async** : Oui
- **Patterns** : Async/Await

### `panel_selection.py`

- **Lignes** : 61
- **Taille** : 2135 bytes
- **Fonctions** : Aucune
- **Classes** : Aucune
- **Imports** : homeassistant.components, homeassistant.core, logging, os
- **Async** : Oui
- **Patterns** : Async/Await, REST API View

### `power_monitoring.py`

- **Lignes** : 294
- **Taille** : 10421 bytes
- **Fonctions** : __init__, _load_json, _on_source_changed, create_live_sensors, entity_id, extra_state_attributes
- **Classes** : LivePowerSensor
- **Imports** : const, datetime, hashlib, homeassistant.components.sensor, homeassistant.const, homeassistant.core, homeassistant.helpers, homeassistant.helpers.event, homeassistant.helpers.restore_state, json, logging, os, traceback, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener, Home Assistant Entity, Storage API

### `proxy_api.py`

- **Lignes** : 44
- **Taille** : 1675 bytes
- **Fonctions** : Aucune
- **Classes** : SuiviElecProxyView
- **Imports** : aiohttp, homeassistant.components.http, logging
- **Async** : Oui
- **Patterns** : Async/Await, REST API View

### `sensor.py`

- **Lignes** : 88
- **Taille** : 3948 bytes
- **Fonctions** : on_hse_sensors_ready
- **Classes** : Aucune
- **Imports** : const, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.entity_platform, logging
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener

### `sensor_grouping.py`

- **Lignes** : 223
- **Taille** : 6630 bytes
- **Fonctions** : _build_keyword_mapping, _detect_group_name, build_auto_groups, merge_with_existing
- **Classes** : GroupConfig, SensorInfo
- **Imports** : __future__, dataclasses, typing

### `sensor_name_fixer.py`

- **Lignes** : 132
- **Taille** : 4608 bytes
- **Fonctions** : _compute_short_entity_id, _shorten_entity_name, _sync_callback
- **Classes** : Aucune
- **Imports** : homeassistant.const, homeassistant.core, homeassistant.helpers, logging, re, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener

### `sensor_quality_scorer.py`

- **Lignes** : 287
- **Taille** : 9636 bytes
- **Fonctions** : _compute_base_score, auto_select_best_sensors, compute_sensor_score, enrich_sensors_with_quality, get_sensor_recommendation_label, get_sensor_stars, is_physical_sensor
- **Classes** : Aucune
- **Imports** : collections, logging, typing

### `sensor_sync_manager.py`

- **Lignes** : 302
- **Taille** : 12582 bytes
- **Fonctions** : __init__, _get_backup_count, _on_entity_registry_changed, _on_state_changed, get_status, list_and_cleanup, load, save
- **Classes** : SensorSyncManager
- **Imports** : asyncio, datetime, detect_local, homeassistant.core, homeassistant.helpers.event, json, logging, os, shutil, typing
- **Async** : Oui
- **Patterns** : Async/Await, Event Listener

### `storage_manager.py`

- **Lignes** : 518
- **Taille** : 18523 bytes
- **Fonctions** : __init__, _load_json_file, _rename_file, clear_cache
- **Classes** : StorageManager
- **Imports** : homeassistant.core, homeassistant.helpers.storage, json, logging, os, pathlib, typing
- **Async** : Oui
- **Patterns** : Async/Await, Storage API

## 🌐 API REST

Vue synthétique des fichiers liés à l'API (heuristique).

### `api/__init__.py`

- **Fonctions** : Aucune

### `api/unified_api.py`

- **Fonctions** : __init__, _error, _extract_cycle_from_entity, _format_log_record, _get_hse_energy_sensors, _get_last_detection_time, _get_selection_file_path, _get_sensors_file_path, _get_timestamp, _load_file, _success
- **Imports** : aiohttp, asyncio, cache_manager, calculation_engine, const, datetime, export, homeassistant.components.http, homeassistant.core, json, logging, os, storage_manager, time
- **Patterns** : Async/Await, REST API View, Storage API

### `api/unified_api_extensions.py`

- **Fonctions** : __init__, _apply_action, _error, _get_selection_file_path, _get_timestamp, _load, _save, _success
- **Imports** : aiohttp, asyncio, cache_manager, calculation_engine, const, datetime, export, homeassistant.components.http, homeassistant.core, json, logging, os, pathlib, sensor_grouping, storage_manager
- **Patterns** : Async/Await, REST API View, Storage API

### `api_extra_views.py`

- **Fonctions** : Aucune
- **Imports** : __future__, homeassistant.components.http, homeassistant.core, logging, manage_selection_views_diagnostic_groups, manage_selection_views_entity_registry
- **Patterns** : Async/Await, REST API View

### `manage_selection_views.py`

- **Fonctions** : __init__, _build_hse_energy_sensor_id, _compute_signature, _load_json, _normalize, _normalize_selection_entry, _normalize_selection_payload, _save_json
- **Imports** : asyncio, const, homeassistant.components.http, homeassistant.config_entries, homeassistant.core, homeassistant.helpers.storage, json, logging, manage_selection, os, sensor_quality_scorer, typing
- **Patterns** : Async/Await, REST API View, Storage API

## 🛠️ Services Home Assistant

_Aucun module de services détecté automatiquement._

