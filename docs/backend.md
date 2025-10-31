**🧠 Rôle métier** Documentation du Backend – home_suivi_elec

> **Navigation IA & Debug automatisé**
>
> Un script de navigation Python (`home_suivi_elec_backend_navigation.py`) est disponible dans [docs/scripts/] pour permettre à une IA, un agent CLI, ou à un dev de mapper instantanément chaque besoin métier, bug ou point d’entrée vers la bonne section de la documentation et le bon fichier backend.
>
> Utilisation type :  
> - Recherche rapide de la fonction/fichier à partir d’un bug, d’un log ou d’un besoin métier  
> - Automatisation du crawling debug ou des suggestions d’analyse par un agent AI  
> - Génération d’outils CLI/docs/outils test/maintenance automatique  
> 
> Voir l’index ci-dessous et le script pour usage avancé.

Mention “Un utilitaire CLI/AI de navigation backend est disponible dans docs/scripts/cli_backend_nav.py” 

## 🗂️ Index recherche rapide

| Besoin Métier / Fonction | Section | Fichier (chemin) |
|-------------------------|---------|------------------|
| Orchestration backend   | 3.1     | custom_components/home_suivi_elec/__init__.py |
| Détection capteurs      | 3.2     | custom_components/home_suivi_elec/detect_local.py |
| Sélection/mapping       | 3.3     | custom_components/home_suivi_elec/manage_selection.py |
| Scoring qualité         | 3.4     | custom_components/home_suivi_elec/sensor_quality_scorer.py |
| Création sensors HSE    | 3.5     | custom_components/home_suivi_elec/sensor.py |
| Génération Lovelace/YAML| 3.7     | custom_components/home_suivi_elec/generator.py |
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
| Diagnostic orphelins API | NEW     | custom_components/home_suivi_elec/__init__.py (DiagnosticGroupsView) |

⸻

1. Introduction générale

🎯 Objectif

Le backend de home_suivi_elec vise à :
	•	🔍 Détecter dynamiquement toutes les intégrations installées dans l’instance Home Assistant.
	•	⚡ Identifier les intégrations gérant de l’énergie (TP-Link, Tapo, Enedis, PowerCalc, utility_meter…).
	•	🔢 Récupérer et filtrer les capteurs qui mesurent la puissance ou l’énergie électrique.
	•	🧩 Enrichir ces capteurs : scoring qualité, ajout de métadonnées, normalisation et diagnostics.
	•	🪪 Créer et maintenir des entités sensors “tagguées HSE” dans Home Assistant pour un suivi optimal et centralisé.

🔁 Cycle de vie complet des capteurs
	•	Ajout automatique lors de la détection
	•	Suppression lors de la désactivation ou orphelinisation
	•	Mise en attente, archivage ou purge selon les cas (maintenance, diagnostics)

🔎 Supervision de la qualité et de la fiabilité
	•	Calcul de scores qualité
	•	Détection et gestion des doublons, capteurs orphelins, anomalies

✅ SUCCÈS NO-SHORTENING (Octobre 2025)
	•	Élimination complète des orphelins (0/125 vs 65/125 avant)
	•	Correspondance directe parent↔enfant sans raccourcissement
	•	Préservation noms complets et lisibles (143+ caractères supportés)
	•	API /diagnostic_groups pour validation temps réel des associations
	•	Solution structurelle permanente (plus de logique complexe de mapping)

**🔗 Interactions et dépendances** Autres fonctionnalités
	•	Synchronisation avec les entités natives Home Assistant (utility_meter)
	•	Exposition d’API backend pour piloter toutes les actions
	•	Automatisation de la génération de dashboards et exports
	•	Sécurisation et traçabilité via un proxy backend contrôlé

⸻

🏗️ Vue d’ensemble de l’architecture
	•	Principes clés : modularité, extensibilité, robustesse
	•	Schéma du flux global : voir section 2

⸻

2. Schéma global

📈 Diagramme du flux : schema_flux_hse.svg

🧩 Description synthétique :
Ce diagramme illustre la chaîne complète depuis la détection des capteurs jusqu’à la visualisation, le scoring et les exports.

⸻

3. Modules principaux

⸻
#### 3.1 init.py — Résumé et accès rapide
Rôle métier : Orchestration et setup global de l’intégration, enregistrement services, endpoints, lifecycle et gestion hass.data.

Fichier Python : custom_components/home_suivi_elec/init.py

Classe(s) principale(s) : N/A (fonctionnel)

Fonctions critiques : async_setup, async_setup_entry, setup_sensors_after_detection, _delayed_start

Services HA : generate_local_data, generate_selection, fix_sensor_names, copy_ui_files, migrate_cleanup

Endpoints REST : /api/home_suivi_elec/diagnostic_groups (nouveau), /api/home_suivi_elec/set_ignored_entity, /api/home_suivi_elec/get_diagnostics, /api/home_suivi_elec/choose_best_for_device

Clés hass.data : DOMAIN, energy_sensors, sync_manager, options

Logs/caractéristiques : [SETUP_ENTRY], [SERVICE], [INIT], [RESET], [MIGRATION]

Exemples d’usage : Setup automatique après démarrage HA, orchestration des modules backend, enregistrement panneau UI.

Pour debuguer : Vérifier état des services HA, endpoints REST, analyse hass.data, logs setup global.

**🧠 Rôle métier** Rôle central  

- Point d’entrée du backend : initialise tous les modules et listeners, enregistre les services HA et endpoints REST.  
- Gère la chaîne complète : détection → sélection → scoring → création/sync entités → dashboards → diagnostics → maintenance (migration/cleanup).
- Inscription du panel UI personnalisé dans la sidebar (via frontend.async_register_built_in_panel).

**⚙️ Fonctionnement technique** Fonctionnement technique

- Setup différé asynchrone après démarrage Home Assistant (event listener EVENT_HOMEASSISTANT_STARTED).
- Enregistrement manuel des services Home Assistant :
    • `generate_local_data` → déclenche détection automatique
    • `generate_lovelace_auto` → génère dashboards Lovelace
    • `generate_selection` → génère mapping sélection
    • `reset_integration_sensor`, `migrate_cleanup` → maintenance, migration/nettoyage
    • `fix_sensor_names` → corrige automatiquement les noms de sensors
    • `copy_ui_files` → copie UI statique Lovelace
- Installe les endpoints REST natifs :
    • `/api/home_suivi_elec/diagnostic_groups` : diagnostic parent↔enfant & orphelins (solution NO-SHORTENING)
    • `/api/home_suivi_elec/set_ignored_entity` : ignore/unignore une entité
    • `/api/home_suivi_elec/choose_best_for_device` : choisit le meilleur capteur par device
    • `/api/home_suivi_elec/get_diagnostics` : diagnostic natif complet sur l'état des sensors HSE
    • endpoints `selection_view`, `score`, `panel_selection`, `proxy_api`, etc.
- Gère le fallback automatique si le setup ou la détection initiale échoue (tâche `_delayed_start` lancée en asynchrone).
- Orchestration du setup des modules critiques : energy_tracking, power_monitoring, sensor_sync_manager...
- Stockage structuré dans hass.data :
    • `hass.data[DOMAIN][“energy_sensors”]`, `sync_manager`, `options`, etc.

**🔗 Interactions et dépendances** Interactions et dépendances

- Importe et lance : detect_local.py, generator.py, manage_selection.py, manage_selection_views.py, panel_selection.py, energy_tracking.py, migration_cleanup.py, sensor_sync_manager.py, power_monitoring.py, sensor_name_fixer.py, proxy_api.py…
- Déclenche les flows UI : config_flow.py, options_flow.py.

**🔄 Cycle de vie** Cycle de vie

- Boot / reload → setup complet backend, initialisation/hydratation hass.data, fallback, listeners.
- Unload → suppression, nettoyage backend, reset des listeners/services.

**🧪 Exemple(s)** Exemple

- Démarrage de HA → __init__.py enregistre services, configure panel, détecte et sélectionne les capteurs, configure tracking, expose endpoints API REST et lance diagnostics asynchrones.
- En cas d’erreur/crash sur setup, fallback automatique et logs détaillés pour monitor/debug.

---

**Debug & Repérage rapide (IA) :**

- **Fonctions principales :** `async_setup`, `async_setup_entry`, `setup_sensors_after_detection`, `_delayed_start`, panel registration.
- **Services HA enregistrés :** (voir ci-dessus, ou direct via code)
- **Endpoints REST :** listés ci-dessus, observables dans le module (via `HomeAssistantView`)
- **Clés hass.data manipulées :** `DOMAIN`, `energy_sensors`, `sync_manager`, `options`.
- **Logs et exceptions caractéristiques :** `[SETUP_ENTRY]`, `[SERVICE]`, `[INIT]`, `[RESET]`, `[MIGRATION]`, `[COPY_UI]`.
- **Pour debuguer :**
    1. Vérifie l’appel/état de chaque service HA et endpoint REST (via logs et méthodes).
    2. Inspecte hass.data (hydration à chaque setup/reload).
    3. Vérifie le panel UI côté sidebar et son état.
    4. Analyse les logs pour chaque phase du boot/setup asynchrone.
    5. Suis les exceptions/fallback signalés dans les logs du composant.

⸻
#### 3.2 detect_local.py — Résumé et accès rapide
Rôle métier : Détection automatique, annotation et classification des capteurs power/energy physiques/virtuels/helpers.

Fichier Python : custom_components/home_suivi_elec/detect_local.py

Classe(s) principale(s) : N/A

Fonctions critiques : run_detect_local, __detect_from_hass, __annotate_and_deduplicate

Services HA : run_detect_local

Endpoints REST : N/A

Clés hass.data : energy_sensors

Logs/caractéristiques : [DETECT], logs exclusion, doublons, multi-intégration

Exemples d’usage : Scan complet des capteurs lors du boot, enrichissement et priorisation, update du fichier JSON liste sensors.

Pour debuguer : Vérifier mapping JSON, logs détection, état hass.data et exclusions.

**🧠 Rôle métier** Rôle métier

Détecte automatiquement tous les capteurs “energy” et “power” présents dans l’instance Home Assistant, via analyse du registre d’entités, du registre de devices et des plateformes d’intégration.

Classe les capteurs selon leur type (physique, virtuel, helper), leur plateforme d’origine et leur fiabilité métier.

Enrichit chaque capteur avec des métadonnées détaillées : plateforme déclarée/détectée, signature physique, multi-intégration, type de référence, etc.

Annote et gère la déduplication par signature physique pour éviter les doublons.

**⚙️ Fonctionnement technique** Fonctionnement technique

Fichier central pour la collecte et classification des sensors energy/power, exécute des groupements multi-intégration, et propose un mapping optimisé pour la suite du backend (sélection, scoring, tracking).

Filtrage intelligent selon la config, gestion des helpers, exclusions de plateformes non pertinentes.

Utilisation de priorités métier (energy physique > power physique > virtuel > helper etc.) et scoring “reliability”.

Exporte tous les résultats dans un fichier JSON (_CAPTEURS_FILE) utilisé par les modules de selection/scoring/tracking.

Version 2.10+ : détection multi-intégration complète, tagging enrichi pour UI/groupement, détection approfondie des plateformes pour chaque device physique.

**🔗 Interactions et dépendances** Interactions et dépendances

Exécuté et appelé via le service HA run_detect_local depuis init.py.

Donne ses résultats à manage_selection.py, sensor_quality_scorer.py pour mapping/scoring.

Utilise les helpers/validation pour le contrôle de fiabilité et exclusion métiers.

Écrit les capteurs détectés dans hass.data et sur disque pour diagnostic/audit.

**🔄 Cycle de vie** Cycle de vie

À chaque scan/démarrage ou sur demande (service HA/API), relance la détection et l’annotation de tous les capteurs.

Gère l’ajout/suppression/mise à jour des capteurs selon leur disponibilité, fiabilité ou changement d’intégration.

Maintient la cohérence du mapping sur le backend (mise à jour du fichier JSON et état hass.data).

**🧪 Exemple(s)** Exemple

Démarrage ou service HA run_detect_local : détecte physiquement tous les capteurs energy/power, enrichit leurs métadonnées, annote les doublons, priorise et stocke pour la suite des flows backend.

**Debug & Repérage rapide (IA)** rapide (IA) :

Principales fonctions métier :

__detect_from_hass(hass, config_entry), __classify_sensor(state), __classify_platform(...), __annotate_and_deduplicate(...), __get_energy_platforms_from_registry(...)

Principal point d’entrée asynchrone : async def run_detect_local(*args, **kwargs)

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

Vérifier l’effet des exclusions (platforms detectés/exclus, helpers activés/désactivés)

Toujours passer par les routines principales (__detect_from_hass, __annotate_and_deduplicate) pour analyse des cycles métier

⸻
#### 3.3 manage_selection.py — Résumé et accès rapide
Rôle métier : Indexation métier, mapping et enrichissement des capteurs, export sélection et accès panel.

Fichier Python : custom_components/home_suivi_elec/manage_selection.py

Classe(s) principale(s) : N/A

Fonctions critiques : async_get_capteurs_index, _enrich_base, async_setup_selection_api

Services HA : generate_selection

Endpoints REST : /api/home_suivi_elec/selection, /api/home_suivi_elec/selection_view

Clés hass.data : capteurs_index

Logs/caractéristiques : logs enrichissement, mapping, warnings fichiers absents

Exemples d’usage : Génération index métier pour sélection et panel, mapping enrichi, export JSON/YAML sélection.

Pour debuguer : Utiliser async_get_capteurs_index, analyser index, logs mapping, fichiers JSON.

**🧠 Rôle métier** Rôle métier

Gère l’index métier enrichi des capteurs power (entity_id → infos détaillées : device, qualité, intégration, mapping, flags métier).

Applique critères métier, scoring qualité, mapping entre capteurs physiques, virtuels, helpers pour constituer la sélection backend optimale.

Permet l’enrichissement (tags, scoring, qualité intégration via fichier YAML, référence, premium…).

Exporte la sélection finale et tous les mappings vers le backend, la UI, et les autres modules métiers.

**⚙️ Fonctionnement technique** Fonctionnement technique

Stocke l’index _CAPTEURS_INDEX (entity_id → dict enrichi) en RAM + hass.data.

Charge et sauvegarde les différents jeux de données : capteurs power JSON, sélection JSON, user_config JSON, intégration_quality YAML.

Enrichit via device_registry, entity_registry, area_registry tout capteur de l’index (zone, nom device, manufacturer, etc.).

Expose des fonctions utilitaires (async_get_capteurs_index) pour la récup et diagnostic capteurs côté init.py ou diag/REST.

Gère la classification premium/référence, tags d’exclusion ou d’alternative, flags mapping optimal.

**🔗 Interactions et dépendances** Interactions et dépendances

Récupère en entrée le mapping capteurs depuis detect_local.py (via JSON/RAM).

Passage vers sensor_quality_scorer.py pour scoring métier et classification/doublons.

Enregistrement des vues REST et APIs (via manage_selection_views.py, async_setup_selection_api).

Échange avec user_config, options, qualité intégration.

**🔄 Cycle de vie** Cycle de vie

Chargé à chaque scan/démarrage ou reload, met à jour l’index et la sélection active.

Structure en RAM et sur disque, exposée via API et diagnostic.

**🧪 Exemple(s)** Exemple

Un device power, plusieurs capteurs (physiques/virtuels/helpers), manage_selection.py en fait l’index, tague le capteur optimal/référence, enrichit les métadonnées, expose la sélection pour la UI et le backend.

**Debug & Repérage rapide (IA)** rapide (IA) :

Classe principale : (organisation fonctionnelle, index RAM : _CAPTEURS_INDEX)

Fonctions critiques :

_enrich_base, _enrich_device_info (pour enrichissement de l’index)

async_get_capteurs_index(hass) (point d’entrée principal pour l’index et diagnostic)

_load_json, _load_quality_map_sync (chargement datas métier, scoring)

Enregistrement API via async_setup_selection_api(hass, sync_manager)

Fichiers métier côté data :

capteurs_power.json, capteurs_selection.json, user_config.json, integration_quality.yaml

Services/API :

Index exposé par le service generate_selection (setup/init), API via manage_selection_views.py

Voir les vues REST : /api/home_suivi_elec/selection, /api/home_suivi_elec/selection_view, /api/home_suivi_elec/sync_status...

Clés hass.data manipulées :

hass.data["home_suivi_elec"]["capteurs_index"]

Logs/exceptions typiques :

Logs enrichissement device, zone, detection premium, mapping alternative/référence

Warnings sur fichiers JSON absents/corrompus, mapping impossible, zone/device missing

Pour debuguer :

Appeler async_get_capteurs_index(hass) pour obtenir l’état complet

Inspecter les JSON métiers pour index, sélection, qualité

Utiliser les endpoints REST pour diagnostic et visualisation

Vérifier les logs d’enrichissement et mapping sur panel selection/backend

⸻
#### 3.4 sensor_quality_scorer.py — Résumé et accès rapide
Rôle métier : Scoring qualité, diagnostic sensors, exclusion helpers/statistics pour auto-mapping backend.

Fichier Python : custom_components/home_suivi_elec/sensor_quality_scorer.py

Classe(s) principale(s) : N/A

Fonctions critiques : compute_sensor_score, is_physical_sensor, auto_select_best_sensors, enrich_sensors_with_quality

Services HA : N/A

Endpoints REST : relayé via selection_view

Clés hass.data : N/A direct (index via manage_selection)

Logs/caractéristiques : [SCORE], [HELPER], logs exclusion/doublon

Exemples d’usage : Attribuer score métier, labelliser sensors, choisir automatiquement best mapping.

Pour debuguer : Tester enrich_sensors_with_quality, logs scoring/tags/exclusion helpers.

**🧠 Rôle métier** Rôle métier

Calcule et attribue un score de qualité (quantitatif et qualitatif) à chaque capteur énergétique détecté.

Différencie capteurs physiques, virtuels et helpers pour éviter la sélection automatisée de helpers/agrégateurs.

Permet de classifier et diagnostiquer la pertinence métier de chaque sensor (EXCELLENT, BON, ACCEPTABLE, HELPER, FAIBLE).

Alimente la logique auto-sélection pour les flows backend (sélection, mapping, diagnostics).

**⚙️ Fonctionnement technique** Fonctionnement technique

Exclusion stricte des helpers/aggrégateurs (min_max, statistics, template, utility_meter, integration, etc.) pour les calculs de coût et scoring automatique.

Fonction centrale : compute_sensor_score(sensor) : applique pondération sur l’unité de mesure, state_class, qualité intégration, type physique/virtuel, disponibilité.

Méthodes de diagnostic et enrichissement : get_sensor_recommendation_label(score), get_sensor_stars(score), enrich_sensors_with_quality(sensors).

Logique de sélection automatisée : auto_select_best_sensors(sensors) — par device_id, sépare orphelins et helpers exclus.

**🔗 Interactions et dépendances** Interactions et dépendances

Invocable via manage_selection.py, panel_selection.py, flows backend (auto-mapping et export diagnostics).

Exposé via API backend, diagnostics, panel Lovelace.

Interagit avec les JSON/YAML métier pour l’intégration et scoring (“integration_quality”, “user_config”).

**🔄 Cycle de vie** Cycle de vie

À chaque scan/reload/demande, enrichit l’ensemble des capteurs détectés ou sélectionnés avec scores, recommandations, diagnostics.

Structure enrichie exposée côté panel et diagnostic.

**🧪 Exemple(s)** Exemple

Un capteur TP-Link energy physique reçoit score maximal, labellisé EXCELLENT. Un helper min_max ou template reçoit score réduit (<50), labellisé “Pour statistiques uniquement”.

La sélection backend privilégie les capteurs physiques et tague les autres comme non-recommandés/statistiques.

**Debug & Repérage rapide (IA)** rapide (IA) :

Fonctions critiques :

is_physical_sensor(sensor), compute_sensor_score(sensor), get_sensor_recommendation_label(score), get_sensor_stars(score)

auto_select_best_sensors(sensors), enrich_sensors_with_quality(sensors)

Exclusions intégrations : helpers/aggrégateurs listés dans EXCLUDED_FROM_COST_CALCULATION

Logs/exceptions typiques :

Logs : [AUTO_SELECT], [HELPER], [SCORE], diagnostics par device, stats sur helpers exclus.

Warn sur intégration inconnue, capteur non physique, score faible.

Pour debuguer :

Vérifier le score attribué à chaque sensor via compute_sensor_score et logs correspondants.

Utiliser la fonction auto_select_best_sensors pour voir la sélection auto/mapping backend.

Contrôler la labellisation (get_sensor_recommendation_label) pour dashboard/diagnostics.

Confirmer l’exclusion appropriée des helpers/stats via les logs et structuration JSON/YAML métier.

Passer la liste des sensors “bruts” dans enrich_sensors_with_quality pour obtenir structure complète côté panel/API.

Vérifier toute divergence métier en croisant avec integration_quality.yaml.

⸻
#### 3.5 sensor.py — Résumé et accès rapide
Rôle métier : Enregistrement/ajout de toutes les entités “sensor” (énergie et power live) dans Home Assistant.

Fichier Python : custom_components/home_suivi_elec/sensor.py

Classe(s) principale(s) : N/A

Fonctions critiques : async_setup_entry

Services HA : N/A

Endpoints REST : N/A

Clés hass.data : energy_sensors, live_power_sensors

Logs/caractéristiques : logs nombre de sensors, warning sensors absents

Exemples d’usage : Ajout complet des sensors HSE (cycles + live) dans la plateforme home assistant.

Pour debuguer : Analyser logs sensor.py, inspecter listes hass.data après setup.

**🧠 Rôle métier** Rôle métier

Gère l’enregistrement des entités “sensor” HSE dans Home Assistant, représentant cycles d’énergie (kWh) et mesures de puissance live (W).

Fusionne les listes de sensors d’énergie (hourly, daily, weekly, monthly, yearly) et de capteurs live vers la plateforme sensor Home Assistant.

Assure que tous les sensors sélectionnés/back-end (tracking et power live) sont exposés côté UI et utilisables sur le dashboard Lovelace ou toute automatisation.

**⚙️ Fonctionnement technique** Fonctionnement technique

Fonction centrale : async_setup_entry(hass, entry, async_add_entities)

Récupère les sensors en RAM via hass.data[DOMAIN]["energy_sensors"] (cycles) et hass.data[DOMAIN]["live_power_sensors"] (puissance temps réel).

Fusionne toutes les listes en all_sensors.

Ajoute toutes les entités via la callback Home Assistant (async_add_entities(all_sensors, True)).

Log chaque enregistrement avec le nombre de sensors énergie et power live.

Émet un warning si aucun sensor n’est disponible à l’enregistrement.

**🔗 Interactions et dépendances** Interactions et dépendances

Appelé automatiquement par __init__.py lors du setup “sensor” de l’intégration.

Dépend des flows d’initialisation et mapping : lists construites par energy_tracking.py, manage_selection.py et phase de setup.

Expose les sensors “hse_*” pour Lovelace, UI, automatisations et export backend.

**🔄 Cycle de vie** Cycle de vie

À chaque entrée/configuration/reload : mise à jour complète des sensors exposés dans Home Assistant.

S’assure que tout changement côté backend ou mapping (ajout/suppression d’un sensor ou device) est reflété dans la plateforme sensor.

**🧪 Exemple(s)** Exemple

Sur un setup HSE, plusieurs sensors d’énergie (daily, monthly) et de puissance live sont listés en RAM, réunis et ajoutés d’un seul bloc côté Home Assistant.

**Debug & Repérage rapide (IA)** rapide (IA) :

Fonction principale : async_setup_entry

Clés hass.data à vérifier :

hass.data[DOMAIN]["energy_sensors"]

hass.data[DOMAIN]["live_power_sensors"]

Callback HA : async_add_entities(all_sensors, True)

Logs/caractéristiques :

Enregistrement sensor : LOGGER.info("📊 SENSOR.PY: ...")

Aucun sensor : LOGGER.warning("⚠️ SENSOR.PY: Aucun sensor d'énergie à enregistrer")

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
#### 3.6 sensor_quality_scorer.py — Résumé et accès rapide
Rôle métier : Analyse, scoring et diagnostic métier des capteurs énergétiques ; automatisation de la sélection “best sensor”, exclusion helpers/stats.
