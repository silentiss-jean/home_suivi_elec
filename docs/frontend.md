# Documentation Frontend Home Suivi Élec

## 🗂️ Index rapide modules/panels/tabs/styles/docs
| Section | Rôle technique | Fichier | Panel custom | Backend/API liés |
|---|---|---|:---:|:---:|
| 3.01 configuration_frontend.md — Résumé et accès rapide | Documentation markdown | `configuration_frontend.md` |  |  |
| 3.02 frontend_admin.md — Résumé et accès rapide | Documentation markdown | `frontend_admin.md` |  |  |
| 3.03 index.html — Résumé et accès rapide | Page principale ou composant UI HTML | `index.html` |  |  |
| 3.04 panel_selection.md — Résumé et accès rapide | Documentation markdown | `panel_selection.md` | ✅ |  |
| 3.05 style.css — Résumé et accès rapide | Styles CSS | `style.css` |  |  |
| 3.06 web_static.md — Résumé et accès rapide | Documentation markdown | `web_static.md` |  |  |
| 3.07 app.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/app.js` |  | /api/home_suivi_elec/get_user_options |
| 3.08 auth.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/auth.js` |  |  |
| 3.09 configuration.api.js — Résumé et accès rapide | Module JS d’interfaçage API/backend | `js/configuration.api.js` |  | /api/home_suivi_elec/choose_best_for_device, /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/get_user_options, /api/home_suivi_elec/save_selection, /api/home_suivi_elec/save_user_options, /api/home_suivi_elec/set_ignored_entity |
| 3.10 configuration.js — Résumé et accès rapide | Module JS de configuration UI | `js/configuration.js` |  | /api/home_suivi_elec/get_instant_puissance, /api/home_suivi_elec/get_sensor_quality_scores |
| 3.11 configuration.state.js — Résumé et accès rapide | Module JS de configuration UI | `js/configuration.state.js` |  |  |
| 3.12 configuration.view.js — Résumé et accès rapide | Module JS de configuration UI | `js/configuration.view.js` |  |  |
| 3.13 detection.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/detection.js` |  | /api/home_suivi_elec/get_sensors |
| 3.14 diagnostics.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/diagnostics.js` |  | /api/home_suivi_elec/get_diagnostics |
| 3.15 duplicates.api.js — Résumé et accès rapide | Module JS d’interfaçage API/backend | `js/duplicates.api.js` |  | /api/home_suivi_elec/choose_best_for_device, /api/home_suivi_elec/set_ignored_entity |
| 3.16 duplicatesPanel.js — Résumé et accès rapide | Panel custom JS | `js/duplicatesPanel.js` | ✅ |  |
| 3.17 eventBus.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/eventBus.js` |  |  |
| 3.18 proxy.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/proxy.js` |  | /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/proxy |
| 3.19 referencePanel.js — Résumé et accès rapide | Panel custom JS | `js/referencePanel.js` | ✅ | /api/home_suivi_elec/get_user_options, /api/home_suivi_elec/save_user_options |
| 3.20 savePanel.js — Résumé et accès rapide | Panel custom JS | `js/savePanel.js` | ✅ | /api/home_suivi_elec/get_user_options |
| 3.21 selectionPanel.js — Résumé et accès rapide | Panel custom JS | `js/selectionPanel.js` | ✅ | /api/home_suivi_elec/auto_select_best_sensors, /api/home_suivi_elec/get_sensor_quality_scores |
| 3.22 stateModule.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/stateModule.js` |  |  |
| 3.23 summary.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/summary.js` |  | /api/home_suivi_elec/get_consumptions, /api/home_suivi_elec/get_instant_puissance, /api/home_suivi_elec/get_selection, /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/get_user_options |
| 3.24 uiToast.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/uiToast.js` |  |  |
| 3.25 utils.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/utils.js` |  |  |
| 3.26 diagnosticSensors.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/modules/diagnosticSensors.js` |  | /api/home_suivi_elec/lovelace_sensors |
| 3.27 generate.js — Résumé et accès rapide | Module Javascript (UI, helper, state, etc.) | `js/modules/generate.js` |  | /api/home_suivi_elec/lovelace_sensors |
| 3.28 diagnostic_sensors.html — Résumé et accès rapide | Page principale ou composant UI HTML | `tabs/diagnostic_sensors.html` |  |  |
| 3.29 generate.html — Résumé et accès rapide | Page principale ou composant UI HTML | `tabs/generate.html` |  |  |

---
## 1. Introduction & objectifs
Frontend statique riche pour suivi élec Home Assistant : panels dynamiques, modules JS, styles, backend REST, inter-UI, gestion par eventBus et schéma avancé d’interaction.

## 2. Schéma global UI / Navigation / Panels (Mermaid)
```mermaid
graph TD
    configuration_frontend_md[configuration_frontend.md\nDocumentation markdown]
    frontend_admin_md[frontend_admin.md\nDocumentation markdown]
    index_html[index.html\nPage principale ou composant UI HTML]
    panel_selection_md[panel_selection.md\nDocumentation markdown]
    style_css[style.css\nStyles CSS]
    web_static_md[web_static.md\nDocumentation markdown]
    app_js[app.js\nModule Javascript (UI, helper, state, etc.)]
    auth_js[auth.js\nModule Javascript (UI, helper, state, etc.)]
    configuration_api_js[configuration.api.js\nModule JS d’interfaçage API/backend]
    configuration_js[configuration.js\nModule JS de configuration UI]
    configuration_state_js[configuration.state.js\nModule JS de configuration UI]
    configuration_view_js[configuration.view.js\nModule JS de configuration UI]
    detection_js[detection.js\nModule Javascript (UI, helper, state, etc.)]
    diagnostics_js[diagnostics.js\nModule Javascript (UI, helper, state, etc.)]
    duplicates_api_js[duplicates.api.js\nModule JS d’interfaçage API/backend]
    duplicatesPanel_js[duplicatesPanel.js\nPanel custom JS]
    eventBus_js[eventBus.js\nModule Javascript (UI, helper, state, etc.)]
    proxy_js[proxy.js\nModule Javascript (UI, helper, state, etc.)]
    referencePanel_js[referencePanel.js\nPanel custom JS]
    savePanel_js[savePanel.js\nPanel custom JS]
    selectionPanel_js[selectionPanel.js\nPanel custom JS]
    stateModule_js[stateModule.js\nModule Javascript (UI, helper, state, etc.)]
    summary_js[summary.js\nModule Javascript (UI, helper, state, etc.)]
    uiToast_js[uiToast.js\nModule Javascript (UI, helper, state, etc.)]
    utils_js[utils.js\nModule Javascript (UI, helper, state, etc.)]
    diagnosticSensors_js[diagnosticSensors.js\nModule Javascript (UI, helper, state, etc.)]
    generate_js[generate.js\nModule Javascript (UI, helper, state, etc.)]
    diagnostic_sensors_html[diagnostic_sensors.html\nPage principale ou composant UI HTML]
    generate_html[generate.html\nPage principale ou composant UI HTML]
    app_js -- "import" --> auth_js
    app_js -- "import" --> summary_js
    app_js -- "import" --> detection_js
    app_js -- "import" --> configuration_js
    app_js -- "import" --> diagnostics_js
    app_js -- "import" --> stateModule_js
    app_js -- "import" --> eventBus_js
    app_js -- "import" --> referencePanel_js
    app_js -- "import" --> savePanel_js
    app_js -- "import" --> diagnosticSensors_js
    app_js -- "import" --> generate_js
    app_js -- "/api/home_suivi_elec/get_user_options" --> API
    configuration_api_js -- "import" --> auth_js
    configuration_js -- "import" --> configuration_api_js
    configuration_js -- "import" --> configuration_state_js
    configuration_js -- "import" --> configuration_view_js
    configuration_js -- "import" --> selectionPanel_js
    configuration_js -- "import" --> referencePanel_js
    configuration_js -- "import" --> eventBus_js
    configuration_js -- "import" --> uiToast_js
    configuration_js -- "/api/home_suivi_elec/get_sensor_quality_scores" --> API
    configuration_js -- "/api/home_suivi_elec/get_instant_puissance" --> API
    configuration_view_js -- "import" --> configuration_state_js
    configuration_view_js -- "import" --> duplicatesPanel_js
    detection_js -- "/api/home_suivi_elec/get_sensors" --> API
    diagnostics_js -- "import" --> proxy_js
    duplicates_api_js -- "/api/home_suivi_elec/set_ignored_entity" --> API
    duplicates_api_js -- "/api/home_suivi_elec/choose_best_for_device" --> API
    duplicatesPanel_js -- "import" --> eventBus_js
    duplicatesPanel_js -- "import" --> stateModule_js
    proxy_js -- "/api/home_suivi_elec/proxy" --> API
    referencePanel_js -- "import" --> stateModule_js
    referencePanel_js -- "import" --> eventBus_js
    referencePanel_js -- "import" --> uiToast_js
    referencePanel_js -- "/api/home_suivi_elec/get_user_options" --> API
    referencePanel_js -- "/api/home_suivi_elec/save_user_options" --> API
    savePanel_js -- "import" --> configuration_api_js
    savePanel_js -- "import" --> eventBus_js
    savePanel_js -- "import" --> uiToast_js
    savePanel_js -- "/api/home_suivi_elec/get_user_options" --> API
    selectionPanel_js -- "import" --> eventBus_js
    selectionPanel_js -- "import" --> configuration_js
    selectionPanel_js -- "/api/home_suivi_elec/get_sensor_quality_scores" --> API
    selectionPanel_js -- "/api/home_suivi_elec/auto_select_best_sensors" --> API
    stateModule_js -- "import" --> eventBus_js
    summary_js -- "/api/home_suivi_elec/get_sensors" --> API
    summary_js -- "/api/home_suivi_elec/get_selection" --> API
    summary_js -- "/api/home_suivi_elec/get_user_options" --> API
    summary_js -- "/api/home_suivi_elec/get_instant_puissance" --> API
    summary_js -- "/api/home_suivi_elec/get_consumptions" --> API
    diagnosticSensors_js -- "/api/home_suivi_elec/lovelace_sensors" --> API
    generate_js -- "/api/home_suivi_elec/lovelace_sensors" --> API
```

## 3. Détail technique des ressources UI

### 3.01 configuration_frontend.md — Résumé et accès rapide
- **Type/module** : Documentation markdown
- **Fichier** : `configuration_frontend.md`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 7661 octets
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.02 frontend_admin.md — Résumé et accès rapide
- **Type/module** : Documentation markdown
- **Fichier** : `frontend_admin.md`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 3660 octets
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.03 index.html — Résumé et accès rapide
- **Type/module** : Page principale ou composant UI HTML
- **Fichier** : `index.html`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 15649 octets
- Titre HTML : Home Suivi Élec
- Commentaires HTML : 🏠 Accueil | Tables Résumé | Onglet principal Diagnostic | Barre de sous-onglets | Future extension : <button>Coûts</button>, etc. | Container du tab detailed capteurs | Ancienne partie Diagnostic technique globale | Tu peux soit la laisser pour garder le diagnostic “classique”, soit la migrer/séparer vers des sous-onglets comme fait ici pour les capteurs | 🔍 Détection | ⚙️ Configuration | ✅ BLOC CONFIGURATION TARIFAIRE COMPLET | Abonnement | Type de contrat | ✅ Bloc FIXE | ✅ Bloc HP/HC | Tarifs HP | Tarifs HC | Horaires HP | Bouton sauvegarder | ✅✅✅ NOUVEAU BLOC - SÉLECTION AUTO ✅✅✅ | Panneau Capteur de référence | Zone générée dynamiquement | 🎨 Customisation | 🧩 Génération
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.04 panel_selection.md — Résumé et accès rapide
- **Type/module** : Documentation markdown
- **Fichier** : `panel_selection.md`
- **Panel custom** : ✅
- **Liens backend/API détectés** : Aucun
- **Taille** : 2699 octets
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.05 style.css — Résumé et accès rapide
- **Type/module** : Styles CSS
- **Fichier** : `style.css`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 11293 octets
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.06 web_static.md — Résumé et accès rapide
- **Type/module** : Documentation markdown
- **Fichier** : `web_static.md`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 5049 octets
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.07 app.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/app.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/get_user_options
- **Taille** : 4743 octets
- Imports ES6 : ./auth.js, ./summary.js, ./detection.js, ./configuration.js, ./diagnostics.js, ./stateModule.js, ./eventBus.js, ./referencePanel.js, ./savePanel.js, ./modules/diagnosticSensors.js, ./modules/generate.js
- API calls: /api/home_suivi_elec/get_user_options
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.08 auth.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/auth.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 1171 octets
- Fonctions JS : initAuth, getToken, fetchAuth
- Exports : async, function, async
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.09 configuration.api.js — Résumé et accès rapide
- **Type/module** : Module JS d’interfaçage API/backend
- **Fichier** : `js/configuration.api.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/choose_best_for_device, /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/get_user_options, /api/home_suivi_elec/save_selection, /api/home_suivi_elec/save_user_options, /api/home_suivi_elec/set_ignored_entity
- **Taille** : 1684 octets
- Fonctions JS : fetchJSON, getSensors, getUserOptions, saveSelection, saveUserOptions, setIgnoredEntity, chooseBestForDevice
- Exports : async, async, async, async, async, async
- Imports ES6 : ./auth.js
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.10 configuration.js — Résumé et accès rapide
- **Type/module** : Module JS de configuration UI
- **Fichier** : `js/configuration.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/get_instant_puissance, /api/home_suivi_elec/get_sensor_quality_scores
- **Taille** : 18285 octets
- Fonctions JS : enrichWithQualityScores, computeSensorScore, getRecommendationLabel, getStars, createQualityBadgeHTML, categorizeSensors, deepClone, getInstantPowerMap, indexByDeviceId, indexByDuplicateGroup, annotateSameDevice, applyIgnoredFilter, loadConfiguration, saveSelectionToBackend
- Exports : function, function, async
- Imports ES6 : ./configuration.api.js, ./configuration.state.js, ./configuration.view.js, ./selectionPanel.js, ./referencePanel.js, ./eventBus.js, ./uiToast.js
- API calls: /api/home_suivi_elec/get_sensor_quality_scores, /api/home_suivi_elec/get_instant_puissance
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.11 configuration.state.js — Résumé et accès rapide
- **Type/module** : Module JS de configuration UI
- **Fichier** : `js/configuration.state.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 7247 octets
- Fonctions JS : readStore, writeStore, getFold, setFold, hydrateUserConfig, bindUserOptions, bindSaveUserConfig, bindSaveSelection, bindTypeContratToggle
- Exports : function, function, function, function
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.12 configuration.view.js — Résumé et accès rapide
- **Type/module** : Module JS de configuration UI
- **Fichier** : `js/configuration.view.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 5559 octets
- Fonctions JS : ensureUserConfigAbove, makeToggleHeader, renderIntegrationColumn, renderColumns, renderDuplicatesColumn
- Exports : function, function, function
- Imports ES6 : ./configuration.state.js, ./duplicatesPanel.js
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.13 detection.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/detection.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/get_sensors
- **Taille** : 4797 octets
- Fonctions JS : normalizeSensors, countTotalFromGrouped, loadDetection
- Exports : async
- API calls: /api/home_suivi_elec/get_sensors
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.14 diagnostics.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/diagnostics.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/get_diagnostics
- **Taille** : 1080 octets
- Fonctions JS : loadDiagnostics
- Imports ES6 : ./proxy.js
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.15 duplicates.api.js — Résumé et accès rapide
- **Type/module** : Module JS d’interfaçage API/backend
- **Fichier** : `js/duplicates.api.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/choose_best_for_device, /api/home_suivi_elec/set_ignored_entity
- **Taille** : 1160 octets
- Fonctions JS : apiSetIgnored, apiChooseBestForDevice
- Exports : async, async
- API calls: /api/home_suivi_elec/set_ignored_entity, /api/home_suivi_elec/choose_best_for_device
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.16 duplicatesPanel.js — Résumé et accès rapide
- **Type/module** : Panel custom JS
- **Fichier** : `js/duplicatesPanel.js`
- **Panel custom** : ✅
- **Liens backend/API détectés** : Aucun
- **Taille** : 10700 octets
- Fonctions JS : makeToggleHeader, renderGroups, initDuplicatesPanel, renderDuplicates
- Exports : function, function
- Imports ES6 : ./eventBus.js, ./stateModule.js
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.17 eventBus.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/eventBus.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 1157 octets
- Fonctions JS : on, off, emit, once
- Exports : function, function, function, function, default
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.18 proxy.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/proxy.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/proxy
- **Taille** : 707 octets
- Fonctions JS : fetchViaProxy
- Exports : async
- API calls: /api/home_suivi_elec/proxy
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.19 referencePanel.js — Résumé et accès rapide
- **Type/module** : Panel custom JS
- **Fichier** : `js/referencePanel.js`
- **Panel custom** : ✅
- **Liens backend/API détectés** : /api/home_suivi_elec/get_user_options, /api/home_suivi_elec/save_user_options
- **Taille** : 9114 octets
- Fonctions JS : toCapteursArray, buildPromotedOptions, getAllowedIntegrationsFromRef, fetchReferenceIntegrations, valueOrEmpty, numberOrNull, applyVisibility, render, initReferencePanel, rerenderReferencePanel
- Exports : async, function
- Imports ES6 : ./stateModule.js, ./eventBus.js, ./uiToast.js
- API calls: /api/home_suivi_elec/get_user_options, /api/home_suivi_elec/save_user_options
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.20 savePanel.js — Résumé et accès rapide
- **Type/module** : Panel custom JS
- **Fichier** : `js/savePanel.js`
- **Panel custom** : ✅
- **Liens backend/API détectés** : /api/home_suivi_elec/get_user_options
- **Taille** : 5285 octets
- Fonctions JS : initSavePanel
- Exports : function
- Imports ES6 : ./configuration.api.js, ./eventBus.js, ./uiToast.js
- API calls: /api/home_suivi_elec/get_user_options
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.21 selectionPanel.js — Résumé et accès rapide
- **Type/module** : Panel custom JS
- **Fichier** : `js/selectionPanel.js`
- **Panel custom** : ✅
- **Liens backend/API détectés** : /api/home_suivi_elec/auto_select_best_sensors, /api/home_suivi_elec/get_sensor_quality_scores
- **Taille** : 13800 octets
- Fonctions JS : makeToggleHeader, renderIntegrationColumn, renderSelectionColumns, loadSensorsWithQuality, computeSensorScore, getRecommendationLabel, getStars, displayQualityBadge, autoSelectBestSensors, renderHelpersColumn
- Classes JS : if
- Exports : function, function
- Imports ES6 : ./eventBus.js, ./configuration.js
- API calls: /api/home_suivi_elec/get_sensor_quality_scores, /api/home_suivi_elec/auto_select_best_sensors
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.22 stateModule.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/stateModule.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 1517 octets
- Classes JS : StateModule
- Exports : stateModule
- Imports ES6 : ./eventBus.js
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.23 summary.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/summary.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/get_consumptions, /api/home_suivi_elec/get_instant_puissance, /api/home_suivi_elec/get_selection, /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/get_user_options
- **Taille** : 14265 octets
- Fonctions JS : setText, normalizeToKwh, loadSummary, getAbonnementHT, getAbonnementTTC, sumKwhForPeriod, getKwhForEntity, renderTable
- Exports : async
- API calls: /api/home_suivi_elec/get_sensors, /api/home_suivi_elec/get_selection, /api/home_suivi_elec/get_user_options, /api/home_suivi_elec/get_instant_puissance, /api/home_suivi_elec/get_consumptions
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.24 uiToast.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/uiToast.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 2973 octets
- Fonctions JS : ensureContainer, colorFor, showToast
- Exports : function, const
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.25 utils.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/utils.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 1206 octets
- Fonctions JS : normalizeSensors, countTotalFromGrouped, findSensorValue, findSensorDetails
- Exports : function, function, function, function
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.26 diagnosticSensors.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/modules/diagnosticSensors.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/lovelace_sensors
- **Taille** : 6135 octets
- Fonctions JS : loadDiagnosticSensors, isKO, renderWarning, render
- Exports : async
- API calls: /api/home_suivi_elec/lovelace_sensors
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.27 generate.js — Résumé et accès rapide
- **Type/module** : Module Javascript (UI, helper, state, etc.)
- **Fichier** : `js/modules/generate.js`
- **Panel custom** : Non
- **Liens backend/API détectés** : /api/home_suivi_elec/lovelace_sensors
- **Taille** : 8018 octets
- Fonctions JS : loadGeneration
- Classes JS : LovelaceGenerator
- Exports : class, async
- API calls: /api/home_suivi_elec/lovelace_sensors
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.28 diagnostic_sensors.html — Résumé et accès rapide
- **Type/module** : Page principale ou composant UI HTML
- **Fichier** : `tabs/diagnostic_sensors.html`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 493 octets
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**


### 3.29 generate.html — Résumé et accès rapide
- **Type/module** : Page principale ou composant UI HTML
- **Fichier** : `tabs/generate.html`
- **Panel custom** : Non
- **Liens backend/API détectés** : Aucun
- **Taille** : 1970 octets
- Commentaires HTML : Aperçu généré dynamiquement
- **Rôle métier/UI à compléter :** ...
- **Usages, flux et interactions UI à compléter :** ...
- **Exemples debug, conseils IA à compléter**

## 4. Patterns d’interaction UI/JS
- EventBus global (modules interagissant par eventBus ou CustomEvent)
- Pattern fetch/ajax vers backend /api/
- Imports ES6 pour découplage modules
- Tabs HTML/JS ou panels custom
- Compléter la liste selon usage métier/flux/navigations

## 5. Documentation markdown, fusion automatique
### configuration_frontend.md
- **Titre md/introduction** : 
- **Chemin source** : `configuration_frontend.md`
### frontend_admin.md
- **Titre md/introduction** : 
- **Chemin source** : `frontend_admin.md`
### panel_selection.md
- **Titre md/introduction** : 
- **Chemin source** : `panel_selection.md`
### web_static.md
- **Titre md/introduction** : 
- **Chemin source** : `web_static.md`
