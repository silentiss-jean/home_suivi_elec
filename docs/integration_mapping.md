==============================
INTEGRATION_MAPPING.TXT
==============================

OBJECTIF:
---------
Ce fichier fait la synthèse des liens entre frontend et backend pour home_suivi_elec (Home Assistant).
Il permet une exploitation directe par IA/LLM (parse, mapping, navigation, debug).

=====================================================
1. INDEX RAPIDE: Endpoint API, Panel JS, Module Python
=====================================================
| endpoint                       | panel_js         | module_py           |
|--------------------------------|------------------|---------------------|
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/choose_best_for_device | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/save_selection | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/save_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/set_ignored_entity | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_diagnostics | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/choose_best_for_device | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/set_ignored_entity | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/proxy     | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/save_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/auto_select_best_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_consumptions | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_selection | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/set_ignored_entity | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/choose_best_for_device | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/proxy     | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/save_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/auto_select_best_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_selection | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_consumptions | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/app.js        | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/app.js        | proxy_api.py        |
| /api/home_suivi_elec/choose_best_for_device | js/configuration.api.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/configuration.api.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/configuration.api.js | proxy_api.py        |
| /api/home_suivi_elec/save_selection | js/configuration.api.js | proxy_api.py        |
| /api/home_suivi_elec/save_user_options | js/configuration.api.js | proxy_api.py        |
| /api/home_suivi_elec/set_ignored_entity | js/configuration.api.js | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/configuration.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/configuration.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/configuration.js | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/configuration.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/detection.js  | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/detection.js  | proxy_api.py        |
| /api/home_suivi_elec/get_diagnostics | js/diagnostics.js | proxy_api.py        |
| /api/home_suivi_elec/choose_best_for_device | js/duplicates.api.js | proxy_api.py        |
| /api/home_suivi_elec/set_ignored_entity | js/duplicates.api.js | proxy_api.py        |
| /api/home_suivi_elec/set_ignored_entity | js/duplicates.api.js | proxy_api.py        |
| /api/home_suivi_elec/choose_best_for_device | js/duplicates.api.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/proxy.js      | proxy_api.py        |
| /api/home_suivi_elec/proxy     | js/proxy.js      | proxy_api.py        |
| /api/home_suivi_elec/proxy     | js/proxy.js      | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/referencePanel.js | proxy_api.py        |
| /api/home_suivi_elec/save_user_options | js/referencePanel.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/referencePanel.js | proxy_api.py        |
| /api/home_suivi_elec/save_user_options | js/referencePanel.js | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/savePanel.js  | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/savePanel.js  | proxy_api.py        |
| /api/home_suivi_elec/auto_select_best_sensors | js/selectionPanel.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/selectionPanel.js | proxy_api.py        |
| /api/home_suivi_elec/get_sensor_quality_scores | js/selectionPanel.js | proxy_api.py        |
| /api/home_suivi_elec/auto_select_best_sensors | js/selectionPanel.js | proxy_api.py        |
| /api/home_suivi_elec/get_consumptions | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_selection | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_sensors | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_selection | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_user_options | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_instant_puissance | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/get_consumptions | js/summary.js    | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/diagnosticSensors.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/diagnosticSensors.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/generate.js | proxy_api.py        |
| /api/home_suivi_elec/lovelace_sensors | js/modules/generate.js | proxy_api.py        |

=====================================================
6. SCHÉMA GLOBAL MERMAID (INTÉGRATION)
=====================================================
mermaid_diagram:
-----------------
```
graph TD
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_user_options["/api/home_suivi_elec/get_user_options"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_choose_best_for_device["/api/home_suivi_elec/choose_best_for_device"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_sensors["/api/home_suivi_elec/get_sensors"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_save_selection["/api/home_suivi_elec/save_selection"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_save_user_options["/api/home_suivi_elec/save_user_options"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_set_ignored_entity["/api/home_suivi_elec/set_ignored_entity"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_instant_puissance["/api/home_suivi_elec/get_instant_puissance"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_sensor_quality_scores["/api/home_suivi_elec/get_sensor_quality_scores"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_diagnostics["/api/home_suivi_elec/get_diagnostics"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_proxy["/api/home_suivi_elec/proxy"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_auto_select_best_sensors["/api/home_suivi_elec/auto_select_best_sensors"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_consumptions["/api/home_suivi_elec/get_consumptions"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_get_selection["/api/home_suivi_elec/get_selection"] --> proxy_api_py["proxy_api.py"]
  js_modules_generate_js["js/modules/generate.js"] --> _api_home_suivi_elec_lovelace_sensors["/api/home_suivi_elec/lovelace_sensors"] --> proxy_api_py["proxy_api.py"]
  js_app_js["js/app.js"] --> _api_home_suivi_elec_get_user_options["/api/home_suivi_elec/get_user_options"] --> proxy_api_py["proxy_api.py"]
  js_configuration_api_js["js/configuration.api.js"] --> _api_home_suivi_elec_choose_best_for_device["/api/home_suivi_elec/choose_best_for_device"] --> proxy_api_py["proxy_api.py"]
  js_configuration_api_js["js/configuration.api.js"] --> _api_home_suivi_elec_get_sensors["/api/home_suivi_elec/get_sensors"] --> proxy_api_py["proxy_api.py"]
  js_configuration_api_js["js/configuration.api.js"] --> _api_home_suivi_elec_get_user_options["/api/home_suivi_elec/get_user_options"] --> proxy_api_py["proxy_api.py"]
  js_configuration_api_js["js/configuration.api.js"] --> _api_home_suivi_elec_save_selection["/api/home_suivi_elec/save_selection"] --> proxy_api_py["proxy_api.py"]
  js_configuration_api_js["js/configuration.api.js"] --> _api_home_suivi_elec_save_user_options["/api/home_suivi_elec/save_user_options"] --> proxy_api_py["proxy_api.py"]
  js_configuration_api_js["js/configuration.api.js"] --> _api_home_suivi_elec_set_ignored_entity["/api/home_suivi_elec/set_ignored_entity"] --> proxy_api_py["proxy_api.py"]
  js_configuration_js["js/configuration.js"] --> _api_home_suivi_elec_get_instant_puissance["/api/home_suivi_elec/get_instant_puissance"] --> proxy_api_py["proxy_api.py"]
  js_configuration_js["js/configuration.js"] --> _api_home_suivi_elec_get_sensor_quality_scores["/api/home_suivi_elec/get_sensor_quality_scores"] --> proxy_api_py["proxy_api.py"]
  js_detection_js["js/detection.js"] --> _api_home_suivi_elec_get_sensors["/api/home_suivi_elec/get_sensors"] --> proxy_api_py["proxy_api.py"]
  js_diagnostics_js["js/diagnostics.js"] --> _api_home_suivi_elec_get_diagnostics["/api/home_suivi_elec/get_diagnostics"] --> proxy_api_py["proxy_api.py"]
  js_duplicates_api_js["js/duplicates.api.js"] --> _api_home_suivi_elec_choose_best_for_device["/api/home_suivi_elec/choose_best_for_device"] --> proxy_api_py["proxy_api.py"]
  js_duplicates_api_js["js/duplicates.api.js"] --> _api_home_suivi_elec_set_ignored_entity["/api/home_suivi_elec/set_ignored_entity"] --> proxy_api_py["proxy_api.py"]
  js_proxy_js["js/proxy.js"] --> _api_home_suivi_elec_get_sensors["/api/home_suivi_elec/get_sensors"] --> proxy_api_py["proxy_api.py"]
  js_proxy_js["js/proxy.js"] --> _api_home_suivi_elec_proxy["/api/home_suivi_elec/proxy"] --> proxy_api_py["proxy_api.py"]
  js_referencePanel_js["js/referencePanel.js"] --> _api_home_suivi_elec_get_user_options["/api/home_suivi_elec/get_user_options"] --> proxy_api_py["proxy_api.py"]
  js_referencePanel_js["js/referencePanel.js"] --> _api_home_suivi_elec_save_user_options["/api/home_suivi_elec/save_user_options"] --> proxy_api_py["proxy_api.py"]
  js_savePanel_js["js/savePanel.js"] --> _api_home_suivi_elec_get_user_options["/api/home_suivi_elec/get_user_options"] --> proxy_api_py["proxy_api.py"]
  js_selectionPanel_js["js/selectionPanel.js"] --> _api_home_suivi_elec_auto_select_best_sensors["/api/home_suivi_elec/auto_select_best_sensors"] --> proxy_api_py["proxy_api.py"]
  js_selectionPanel_js["js/selectionPanel.js"] --> _api_home_suivi_elec_get_sensor_quality_scores["/api/home_suivi_elec/get_sensor_quality_scores"] --> proxy_api_py["proxy_api.py"]
  js_summary_js["js/summary.js"] --> _api_home_suivi_elec_get_consumptions["/api/home_suivi_elec/get_consumptions"] --> proxy_api_py["proxy_api.py"]
  js_summary_js["js/summary.js"] --> _api_home_suivi_elec_get_instant_puissance["/api/home_suivi_elec/get_instant_puissance"] --> proxy_api_py["proxy_api.py"]
  js_summary_js["js/summary.js"] --> _api_home_suivi_elec_get_selection["/api/home_suivi_elec/get_selection"] --> proxy_api_py["proxy_api.py"]
  js_summary_js["js/summary.js"] --> _api_home_suivi_elec_get_sensors["/api/home_suivi_elec/get_sensors"] --> proxy_api_py["proxy_api.py"]
  js_summary_js["js/summary.js"] --> _api_home_suivi_elec_get_user_options["/api/home_suivi_elec/get_user_options"] --> proxy_api_py["proxy_api.py"]
  js_modules_diagnosticSensors_js["js/modules/diagnosticSensors.js"] --> _api_home_suivi_elec_lovelace_sensors["/api/home_suivi_elec/lovelace_sensors"] --> proxy_api_py["proxy_api.py"]
```

