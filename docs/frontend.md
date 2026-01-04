# 🎨 Documentation Frontend — Home Suivi Élec

**Généré automatiquement le 13/12/2025 à 11:27**

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des dossiers](#structure-des-dossiers)
3. [Modules par fonctionnalité](#modules-par-fonctionnalité)
4. [Composants partagés](#composants-partagés)

---

## Vue d'ensemble

Frontend modulaire basé sur `web_static/` avec :
- `core/` : bootstrap, auth, router
- `features/` : modules fonctionnels (summary, configuration, diagnostics, detection, generation, customisation, migration)
- `shared/` : composants, utilitaires, vues communes

## Structure des dossiers

```
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
## Modules par fonctionnalité

## Composants partagés

### `shared/api/httpClient.js`

- **Lignes** : 93
- **Fonctions** : Aucune
- **Classes** : HttpClient
- **Patterns** : DOM Manipulation, Fetch API

### `shared/api/sensorsApi.js`

- **Lignes** : 35
- **Fonctions** : getSensorsData, getUserOptions
- **Classes** : Aucune
- **Imports** : ../../core/auth.js
- **Patterns** : Async/Await

### `shared/components/Badge.js`

- **Lignes** : 52
- **Fonctions** : Aucune
- **Classes** : Badge
- **Imports** : ../constants.js
- **Patterns** : DOM Manipulation

### `shared/components/Button.js`

- **Lignes** : 47
- **Fonctions** : Aucune
- **Classes** : Button
- **Patterns** : Async/Await, DOM Manipulation, Event Listeners

### `shared/components/Card.js`

- **Lignes** : 55
- **Fonctions** : Aucune
- **Classes** : Card
- **Imports** : ../utils/dom.js
- **Patterns** : DOM Manipulation

### `shared/components/DownloadButton.js`

- **Lignes** : 45
- **Fonctions** : Aucune
- **Classes** : DownloadButton
- **Imports** : ./Button.js, ./Toast.js
- **Patterns** : Async/Await, DOM Manipulation

### `shared/components/Modal.js`

- **Lignes** : 123
- **Fonctions** : Aucune
- **Classes** : Modal
- **Imports** : ../utils/dom.js, ./Button.js
- **Patterns** : DOM Manipulation, Event Listeners

### `shared/components/Spinner.js`

- **Lignes** : 35
- **Fonctions** : Aucune
- **Classes** : Spinner
- **Patterns** : DOM Manipulation

### `shared/components/Table.js`

- **Lignes** : 74
- **Fonctions** : Aucune
- **Classes** : Table
- **Imports** : ../utils/dom.js
- **Patterns** : DOM Manipulation, Event Listeners

### `shared/components/Toast.js`

- **Lignes** : 102
- **Fonctions** : Aucune
- **Classes** : Toast
- **Imports** : ../constants.js, ../utils/dom.js
- **Patterns** : DOM Manipulation

### `shared/constants.js`

- **Lignes** : 48
- **Fonctions** : Aucune
- **Classes** : Aucune

### `shared/eventBus.js`

- **Lignes** : 52
- **Fonctions** : emit, off, on, once
- **Classes** : Aucune

### `shared/proxy.js`

- **Lignes** : 80
- **Fonctions** : fetchConfig, fetchDetection, fetchDiagnostics, fetchDuplicates, fetchViaProxy, saveConfig, startMigration
- **Classes** : Aucune
- **Imports** : ./constants.js
- **Patterns** : Async/Await, Fetch API

### `shared/stateModule.js`

- **Lignes** : 56
- **Fonctions** : Aucune
- **Classes** : StateModule
- **Imports** : ./eventBus.js

### `shared/uiToast.js`

- **Lignes** : 102
- **Fonctions** : colorFor, ensureContainer, showToast
- **Classes** : Aucune
- **Patterns** : DOM Manipulation, Event Listeners

### `shared/utils/dom.js`

- **Lignes** : 88
- **Fonctions** : clearElement, createElement, toggleClass
- **Classes** : element
- **Patterns** : DOM Manipulation, Event Listeners

### `shared/utils/formatters.js`

- **Lignes** : 104
- **Fonctions** : formatDate, formatDuration, formatEnergy, formatEuro, formatKwh, formatPercent, formatPower
- **Classes** : Aucune

### `shared/utils/panelHelpers.js`

- **Lignes** : 53
- **Fonctions** : makeToggleHeader
- **Classes** : Aucune
- **Patterns** : DOM Manipulation

### `shared/utils/sensorRoles.js`

- **Lignes** : 38
- **Fonctions** : createRoleBadgeHTML, getSensorRole
- **Classes** : Aucune

### `shared/utils/sensorScoring.js`

- **Lignes** : 98
- **Fonctions** : computeSensorScore, createQualityBadgeHTML, getRecommendationLabel, getStars
- **Classes** : if

### `shared/utils/validators.js`

- **Lignes** : 55
- **Fonctions** : isValidEmail, isValidEntityId, isValidNumber, isValidYAML
- **Classes** : Aucune

### `shared/views/commonViews.js`

- **Lignes** : 71
- **Fonctions** : renderEmptyState, renderError, renderLoader
- **Classes** : Aucune
- **Imports** : ../components/Card.js, ../components/Spinner.js, ../components/Toast.js, ../utils/dom.js
- **Patterns** : DOM Manipulation

