# home_suivi_elec_backend_navigation.py

BACKEND_NAVIGATION = {
    "orchestration backend": {
        "section": "3.1",
        "file": "custom_components/home_suivi_elec/__init__.py",
        "functions": ["async_setup", "setup_sensors_after_detection", "async_setup_entry"],
        "services": ["generate_local_data", "generate_selection", "fix_sensor_names", "copy_ui_files", "migrate_cleanup"],
        "rest_endpoints": ["/api/home_suivi_elec/set_ignored_entity", "/api/home_suivi_elec/get_diagnostics", "/api/home_suivi_elec/choose_best_for_device"],
        "hass_data": ["DOMAIN", "energy_sensors", "sync_manager", "options"],
        "tips": "Debug orchestration setup/services/endpoints ; analyse hass.data, logs setup global."
    },
    "détection capteurs": {
        "section": "3.2",
        "file": "custom_components/home_suivi_elec/detect_local.py",
        "functions": ["run_detect_local", "__detect_from_hass", "__annotate_and_deduplicate"],
        "services": ["run_detect_local"],
        "hass_data": ["energy_sensors"],
        "tips": "Diagnostic détection auto, mapping JSON, logs [DETECT], analyse du contenu _CAPTEURS_FILE."
    },
    "sélection/mapping": {
        "section": "3.3",
        "file": "custom_components/home_suivi_elec/manage_selection.py",
        "functions": ["async_get_capteurs_index", "_enrich_base", "async_setup_selection_api"],
        "services": ["generate_selection"],
        "rest_endpoints": ["/api/home_suivi_elec/selection", "/api/home_suivi_elec/selection_view"],
        "hass_data": ["capteurs_index"],
        "tips": "Mapping métier, index capteurs, analyse JSON/YAML sélection/qualité, logs mapping et enrichissement."
    },
    "scoring qualité": {
        "section": "3.4",
        "file": "custom_components/home_suivi_elec/sensor_quality_scorer.py",
        "functions": ["compute_sensor_score", "is_physical_sensor", "get_sensor_recommendation_label", "auto_select_best_sensors", "enrich_sensors_with_quality"],
        "tips": "Debug scoring, auto-selection best sensors, analyse exclusion helpers, logs [SCORE]/[HELPER]."
    },
    "création sensors HSE": {
        "section": "3.5",
        "file": "custom_components/home_suivi_elec/sensor.py",
        "functions": ["async_setup_entry"],
        "hass_data": ["energy_sensors", "live_power_sensors"],
        "tips": "Analyse fusion et enregistrement sensors backend, logs sensor.py, vérification dashboard Lovelace."
    },
    "génération Lovelace/YAML": {
        "section": "3.7",
        "file": "custom_components/home_suivi_elec/generator.py",
        "functions": ["run_all", "generate_complete_dashboard", "write_yaml_file", "generate_overview_card"],
        "tips": "Export YAML, génération dashboard, analyse sensors HSE côté visuel, logs dashboard/yaml."
    },
    "analytics énergétique": {
        "section": "3.9",
        "file": "custom_components/home_suivi_elec/energy_analytics.py",
        "functions": ["detect_consumption_anomaly", "predict_monthly_consumption", "compare_yearly_consumption"],
        "tips": "Analyse historique, prédiction, comparaisons annuelles, logs [ANOMALIE]/[COMPARAISON]."
    },
    "export/backup énergie": {
        "section": "3.10",
        "file": "custom_components/home_suivi_elec/energy_export.py",
        "functions": ["setup_json_backup", "setup_influxdb_export", "export_to_csv"],
        "tips": "Gestion backup auto JSON, export CSV, logs backup/export, diagnostic fichiers de données."
    },
    "panel UI (sidebar)": {
        "section": "3.11",
        "file": "custom_components/home_suivi_elec/panel_selection.py",
        "functions": ["async_setup_panel"],
        "hass_data": ["home_suivi_elec_panel_registered"],
        "tips": "Debug UI sidebar, création fichiers statiques, logs panel static/registration/repair."
    },
    "correction noms sensors": {
        "section": "3.12",
        "file": "custom_components/home_suivi_elec/sensor_name_fixer.py",
        "functions": ["async_setup_sensor_name_fixer", "async_fix_all_long_sensors", "_shorten_entity_name"],
        "tips": "Debug correction noms longs/duplicates, logs correction/hashing, registry entity_id."
    },
    "synchronisation sensors": {
        "section": "3.13",
        "file": "custom_components/home_suivi_elec/sensor_sync_manager.py",
        "functions": ["SensorSyncManager.get_status", "force_sync", "_on_entity_registry_changed"],
        "hass_data": ["sync_manager"],
        "tips": "Analyse sync auto, backup JSON, logs ajout/supp/latest sensors, handling unavailable."
    },
    "monitoring puissance live": {
        "section": "3.14",
        "file": "custom_components/home_suivi_elec/power_monitoring.py",
        "functions": ["async_setup_power_monitoring", "create_live_power_sensors"],
        "hass_data": ["live_power_sensors"],
        "tips": "Debug mise à jour temps réel, logs creation/update/live sensor."
    },
    "debug JSON backend": {
        "section": "3.15",
        "file": "custom_components/home_suivi_elec/debug_json_sets.py",
        "functions": ["scan_sets"],
        "tips": "Vérification structure JSON, logs sets/dict non sérialisables."
    },
    "constantes globales": {
        "section": "3.16",
        "file": "custom_components/home_suivi_elec/const.py",
        "tips": "Valeurs clés backend, conventions/tarifs/périodes, DOMAIN, chemins métiers."
    },
    "config UI initiale": {
        "section": "3.17",
        "file": "custom_components/home_suivi_elec/config_flow.py",
        "functions": ["HomeSuiviElecFlow.async_step_user", "async_step_tarifs"],
        "tips": "Debug formulaire config initiale, mapping contrat/tarif, gestion doublon entry."
    },
    "options UI avancées": {
        "section": "3.18",
        "file": "custom_components/home_suivi_elec/options_flow.py",
        "functions": ["HomeSuiviElecOptionsFlow.async_step_init"],
        "tips": "Modification dynamique contrat/tarif/options, logs entry/options."
    },
    "proxy API frontend": {
        "section": "3.19",
        "file": "custom_components/home_suivi_elec/proxy_api.py",
        "functions": ["SuiviElecProxyView.post"],
        "rest_endpoints": ["/api/home_suivi_elec/proxy"],
        "tips": "Proxy endpoint sécurisé UI→backend, log erreurs proxy/status."
    }
}

