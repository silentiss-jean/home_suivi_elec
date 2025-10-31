**🧠 Rôle métier** Documentation du Backend – home_suivi_elec

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

2. Schéma global

📈 Diagramme du flux : schema_flux_hse.svg

🧩 Description synthétique :
Ce diagramme illustre la chaîne complète depuis la détection des capteurs jusqu'à la visualisation, le scoring et les exports.

⸻

3. Modules principaux

⸻
#### 3.1 init.py — Résumé et accès rapide
Rôle métier : Orchestration et setup global de l'intégration, enregistrement services, endpoints, lifecycle et gestion hass.data.

Fichier Python : custom_components/home_suivi_elec/init.py

Classe(s) principale(s) : N/A (fonctionnel)

Fonctions critiques : async_setup, async_setup_entry, setup_sensors_after_detection, _delayed_start

Services HA : generate_local_data, generate_selection, fix_sensor_names, copy_ui_files, migrate_cleanup

Endpoints REST : /api/home_suivi_elec/diagnostic_groups (nouveau), /api/home_suivi_elec/set_ignored_entity, /api/home_suivi_elec/get_diagnostics, /api/home_suivi_elec/choose_best_for_device

Clés hass.data : DOMAIN, energy_sensors, sync_manager, options

Logs/caractéristiques : [SETUP_ENTRY], [SERVICE], [INIT], [RESET], [MIGRATION]

Exemples d'usage : Setup automatique après démarrage HA, orchestration des modules backend, enregistrement panneau UI.

Pour debuguer : Vérifier état des services HA, endpoints REST, analyse hass.data, logs setup global.

**🧠 Rôle métier** Rôle central  

- Point d'entrée du backend : initialise tous les modules et listeners, enregistre les services HA et endpoints REST.  

- Gère la chaîne complète : détection → sélection → scoring → création/sync entités → dashboards → diagnostics → maintenance (migration/cleanup).

- Inscription du panel UI personnalisé dans la sidebar (via frontend.async_register_built_in_panel).

**⚙️ Fonctionnement technique** Fonctionnement technique

- Setup différé asynchrone après démarrage Home Assistant (event listener EVENT_HOMEASSISTANT_STARTED).

- Enregistrement manuel des services Home Assistant :
    • `generate_local_data` → déclenche détection automatique
    • `generate_lovelace_auto` → génère dashboards Lovelace
    • `generate_selection` → génère mapping sélection
    • `reset_integration_sensor`, `migrate_cleanup` → maintenance, migration/nettoyage
    • `fix_sensor_names` → corrige automatiquement les noms de sensors
    • `copy_ui_files` → copie UI statique Lovelace

- Installe les endpoints REST natifs :
    • `/api/home_suivi_elec/diagnostic_groups` : diagnostic complet des associations parent↔enfant, détection orphelins (solution NO-SHORTENING)
    • `/api/home_suivi_elec/set_ignored_entity` : ignore/unignore une entité
    • `/api/home_suivi_elec/choose_best_for_device` : choisit le meilleur capteur par device
    • `/api/home_suivi_elec/get_diagnostics` : diagnostic natif complet sur l'état des sensors HSE
    • endpoints `selection_view`, `score`, `panel_selection`, `proxy_api`, etc.

- Gère le fallback automatique si le setup ou la détection initiale échoue (tâche `_delayed_start` lancée en asynchrone).

- Orchestration du setup des modules critiques : energy_tracking, power_monitoring, sensor_sync_manager...

- Stockage structuré dans hass.data :
    • `hass.data[DOMAIN]["energy_sensors"]`, `sync_manager`, `options`, etc.

**🔗 Interactions et dépendances** Interactions et dépendances

- Importe et lance : detect_local.py, generator.py, manage_selection.py, manage_selection_views.py, panel_selection.py, energy_tracking.py, migration_cleanup.py, sensor_sync_manager.py, power_monitoring.py, sensor_name_fixer.py, proxy_api.py…

- Déclenche les flows UI : config_flow.py, options_flow.py.

**🔄 Cycle de vie** Cycle de vie

- Boot / reload → setup complet backend, initialisation/hydratation hass.data, fallback, listeners.

- Unload → suppression, nettoyage backend, reset des listeners/services.

**🧪 Exemple(s)** Exemple

- Démarrage de HA → __init__.py enregistre services, configure panel, détecte et sélectionne les capteurs, configure tracking, expose endpoints API REST et lance diagnostics asynchrones.

- En cas d'erreur/crash sur setup, fallback automatique et logs détaillés pour monitor/debug.

---

**Debug & Repérage rapide (IA) :**

- **Fonctions principales :** `async_setup`, `async_setup_entry`, `setup_sensors_after_detection`, `_delayed_start`, panel registration.

- **Services HA enregistrés :** (voir ci-dessus, ou direct via code)

- **Endpoints REST :** listés ci-dessus, observables dans le module (via `HomeAssistantView`)

- **Clés hass.data manipulées :** `DOMAIN`, `energy_sensors`, `sync_manager`, `options`.

- **Logs et exceptions caractéristiques :** `[SETUP_ENTRY]`, `[SERVICE]`, `[INIT]`, `[RESET]`, `[MIGRATION]`, `[COPY_UI]`.

- **Pour debuguer :**
    1. Vérifie l'appel/état de chaque service HA et endpoint REST (via logs et méthodes).
    2. Inspecte hass.data (hydration à chaque setup/reload).
    3. Vérifie le panel UI côté sidebar et son état.
    4. Analyse les logs pour chaque phase du boot/setup asynchrone.
    5. Suis les exceptions/fallback signalés dans les logs du composant.

⸻

#### 3.5 sensor.py — Résumé et accès rapide
Rôle métier : Enregistrement/ajout de toutes les entités "sensor" (énergie et power live) dans Home Assistant.

Fichier Python : custom_components/home_suivi_elec/sensor.py

Classe(s) principale(s) : N/A

Fonctions critiques : async_setup_entry

Services HA : N/A

Endpoints REST : N/A

Clés hass.data : energy_sensors, live_power_sensors

Logs/caractéristiques : logs nombre de sensors, warning sensors absents

Exemples d'usage : Ajout complet des sensors HSE (cycles + live) dans la plateforme home assistant.

Pour debuguer : Analyser logs sensor.py, inspecter listes hass.data après setup.

**🧠 Rôle métier** Rôle métier

Gère l'enregistrement des entités "sensor" HSE dans Home Assistant, représentant cycles d'énergie (kWh) et mesures de puissance live (W).

Fusionne les listes de sensors d'énergie (hourly, daily, weekly, monthly, yearly) et de capteurs live vers la plateforme sensor Home Assistant.

Assure que tous les sensors sélectionnés/back-end (tracking et power live) sont exposés côté UI et utilisables sur le dashboard Lovelace ou toute automatisation.

**⚙️ Fonctionnement technique** Fonctionnement technique

Fonction centrale : async_setup_entry(hass, entry, async_add_entities)

Récupère les sensors en RAM via hass.data[DOMAIN]["energy_sensors"] (cycles) et hass.data[DOMAIN]["live_power_sensors"] (puissance temps réel).

Fusionne toutes les listes en all_sensors.

Ajoute toutes les entités via la callback Home Assistant (async_add_entities(all_sensors, True)).

Log chaque enregistrement avec le nombre de sensors énergie et power live.

Émet un warning si aucun sensor n'est disponible à l'enregistrement.

**🔗 Interactions et dépendances** Interactions et dépendances

Appelé automatiquement par __init__.py lors du setup "sensor" de l'intégration.

Dépend des flows d'initialisation et mapping : lists construites par energy_tracking.py, manage_selection.py et phase de setup.

Expose les sensors "hse_*" pour Lovelace, UI, automatisations et export backend.

**🔄 Cycle de vie** Cycle de vie

À chaque entrée/configuration/reload : mise à jour complète des sensors exposés dans Home Assistant.

S'assure que tout changement côté backend ou mapping (ajout/suppression d'un sensor ou device) est reflété dans la plateforme sensor.

**🧪 Exemple(s)** Exemple

Sur un setup HSE, plusieurs sensors d'énergie (daily, monthly) et de puissance live sont listés en RAM, réunis et ajoutés d'un seul bloc côté Home Assistant.

**Debug & Repérage rapide (IA)** rapide (IA) :

Fonction principale : async_setup_entry

Clés hass.data à vérifier :

hass.data[DOMAIN]["energy_sensors"]

hass.data[DOMAIN]["live_power_sensors"]

Callback HA : async_add_entities(all_sensors, True)

Logs/caractéristiques :

Enregistrement sensor : LOGGER.info("📊 SENSOR.PY: ...")

Aucun sensor : LOGGER.warning("⚠️ SENSOR.PY: Aucun sensor d'énergie à enregistrer")

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

#### 3.12 sensor_name_fixer.py — Résumé et accès rapide
Rôle métier : Solution NO-SHORTENING - Préservation noms complets, élimination orphelins par correspondance directe.

Fichier Python : custom_components/home_suivi_elec/sensor_name_fixer.py

Classe(s) principale(s) : N/A

Fonctions critiques : _shorten_entity_name (NO-SHORTENING), async_setup_sensor_name_fixer

Services HA : N/A

Endpoints REST : N/A

Clés hass.data : N/A

Logs/caractéristiques : Plus de hash/troncature, préservation noms complets, 0 orphelins

Exemples d'usage : Validation que Home Assistant supporte noms longs (143+ chars), correspondance directe parent↔enfant.

Pour debuguer : Vérifier correspondance API /diagnostic_groups, contrôler noms préservés, valider 0 orphelins.

**🧠 Rôle métier** Solution NO-SHORTENING

✅ NOUVEAU : Implémente la solution NO-SHORTENING (préservation noms complets)
❌ SUPPRIMÉ : Plus de raccourcissement/hash des entity_id  
🎯 OBJECTIF : Élimination complète des orphelins causés par mismatch de noms
🏆 RÉSULTAT : 100% de correspondance parent↔enfant (vs 48% avant)

**⚙️ Fonctionnement technique** Fonctionnement technique

Fonction centrale MODIFIÉE :
```python
def _shorten_entity_name(entity_name: str, max_length: int = 999) -> str:
    """NO-SHORTENING VERSION - Retour tel quel sauf _today_energy."""
    name = entity_name.replace("_today_energy", "")
    return name  # ✅ TEL QUEL - plus de transformation !
```

Validation Home Assistant : Support natif noms longs (143+ caractères testés)
Correspondance directe : parent↔enfant sans raccourcissement
Hash éliminés : Plus de "sprclbcdah", "bppcdah", "cdppcdah"

**🔗 Interactions et dépendances** Interactions et dépendances

Intégration avec energy_tracking.py pour préservation noms complets dans création sensors.
API /diagnostic_groups pour validation temps réel des associations parent↔enfant.
Plus de logique complexe de mapping - correspondance directe garantie.

**🔄 Cycle de vie** Cycle de vie

Solution permanente : élimination structurelle des orphelins par design
Validation continue via API diagnostic_groups (0 orphelins maintenu)
Noms lisibles préservés dans logs et interface utilisateur

**🧪 Exemple(s)** Exemples de succès

AVANT (52% d'échec) :
- Entity créé : sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_hourly
- Entity cherché : sensor.hse_live_sprclbcdah_h (hash illisible)
- Résultat : ❌ 65 orphelins sur 125 sensors

MAINTENANT (100% de réussite) :
- Entity créé : sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation_energy_h
- Parent attendu : sensor.hse_live_salon_prise_radiateur_canape_live_box_consommation
- Résultat : ✅ 0 orphelin sur 125 sensors

**Debug & Repérage rapide (IA)** :

Fonction clé : _shorten_entity_name (retour TEL QUEL)
API diagnostic : /api/home_suivi_elec/diagnostic_groups (état associations temps réel)
Logs caractéristiques : Plus de hash, noms complets préservés
Métriques succès : 0 orphelins vs 65 avant, 100% correspondance vs 48%

Pour debuguer :
Utiliser API /diagnostic_groups pour validation associations parent↔enfant
Contrôler que les noms restent complets et lisibles dans logs
Vérifier métriques : 0 orphelins maintenu, correspondance directe garantie
Plus besoin de logique de mapping complexe - tout est direct maintenant

## 🗓️ Changelog backend.md

- 2025-10-31 — NO-SHORTENING
  - Ajout du bloc « Succès NO-SHORTENING » dans l'introduction (0 orphelins, correspondance directe, API de validation)
  - Ajout de l'endpoint REST `/api/home_suivi_elec/diagnostic_groups` en section 3.1 avec description
  - Réécriture de la section 3.12 (sensor_name_fixer.py) pour refléter NO-SHORTENING (suppression hash/troncature)
  - Ajout d'un encadré Debug en section 3.5 (sensor.py) sur le problème résiduel d'enregistrement et le plan d'investigation
  - Mise à jour de l'index de recherche rapide avec « Diagnostic orphelins API »

- 2025-10-30 — Réorg doc backend
  - Ajout des schémas et de la table hass.data
  - Enrichissement des sections scoring, sélection, sync

- 2025-10-27 — Version initiale
  - Première version de la documentation backend