🧠 Documentation du Backend – home_suivi_elec

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

🔗 Autres fonctionnalités
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

3.1 __init__.py — Orchestrateur principal

🧠 Rôle central
	•	Point d’entrée du composant Home Assistant : orchestre tout le cycle de vie backend.
	•	Initialise et configure tous les modules à chaque démarrage ou reload.
	•	Déclenche et connecte :
	•	detect_local.py, manage_selection.py, sensor_quality_scorer.py
	•	energy_tracking.py, generator.py, proxy_api.py
	•	Déclare services, endpoints REST, hooks d’événements, UI et options (config_flow.py, options_flow.py).
	•	Écrit la configuration et l’état backend dans hass.data.
	•	Inscrit automatiquement le panel UI (sidebar Lovelace).
	•	Lance les flows : détection → sélection → tagging → synchronisation → tracking → backup/migration.

⚙️ Fonctionnement détaillé
	•	Enregistre les services Home Assistant (diagnostics, maintenance, migration…).
	•	Implémente des callbacks asynchrones (setup différé après démarrage).
	•	Installe les endpoints API (diagnostics, scoring, archivage, reporting).
	•	Gère le cycle de vie complet des entités (“birth” → update → “death” → backup).
	•	Fournit un mode fallback en cas d’échec partiel.
	•	Forward setup vers la sous-plateforme sensor.

🔗 Interactions et dépendances
Modules importés :
detect_local.py, manage_selection.py, energy_tracking.py, sensor_quality_scorer.py, sensor.py, generator.py, energy_export.py, proxy_api.py, etc.
Active aussi config_flow.py et options_flow.py.

🔄 Cycle de vie
	1.	Boot Home Assistant → orchestration complète (setup)
	2.	Reload → mise à jour, sauvegarde et migration
	3.	Unload → nettoyage complet (désactivation, suppression contrôlée)

🧪 Exemple
Lors d’une installation, __init__.py :
	•	détecte les capteurs,
	•	calcule les scores,
	•	crée les entités HSE,
	•	expose les dashboards et API,
	•	effectue diagnostics et synchronisation.

⸻

3.2 detect_local.py — Détection automatique

🛠️ Responsabilité principale
Détection automatique des intégrations et capteurs énergétiques.

⚙️ Fonctionnement
	•	Scan dynamique des plateformes installées (tapo, tplink, enedis, powercalc…)
	•	Application de critères d’éligibilité (capteurs de puissance/énergie uniquement)
	•	Attribution de scores initiaux + métadonnées enrichies
	•	Création d’entrées “candidates” dans le registre backend

🔄 Cycle de vie
	•	Ajout automatique au démarrage
	•	Mise à jour périodique / à la demande
	•	Marquage des capteurs obsolètes
	•	Passage des “candidats” à la sélection (manage_selection.py)

📥 Entrées / 📤 Sorties
	•	Entrée : liste des entités Home Assistant
	•	Sortie : dictionnaire des capteurs candidats enrichis

🔗 Intégrations
	•	Appelle sensor_quality_scorer.py
	•	Transmet à manage_selection.py

🤖 Fonctions clés
scan_integrations(), detect_power_sensors(), enrich_candidate()

🛡️ Cas particuliers
	•	Capteurs non conformes ou virtuels
	•	Doublons et entités supprimées

🧪 Exemple
Au redémarrage, tous les capteurs énergétiques sont détectés, enrichis et taggués.

⸻

3.3 manage_selection.py — Sélection & Filtrage

🛠️ Responsabilité
Assure la sélection et le mapping des capteurs énergétiques détectés.

⚙️ Fonctionnement
	•	Récupère les capteurs candidats
	•	Applique des critères : qualité, unicité, fiabilité
	•	Filtre doublons et capteurs non pertinents
	•	Réalise le mapping Home Assistant → HSE
	•	Génère la liste finale des sensors suivis

🔄 Cycle de vie
	•	Recalcul à chaque scan
	•	File d’attente pour les capteurs à surveiller
	•	Transmission au scoring/tracking

📥 / 📤
	•	Entrée : liste enrichie des capteurs
	•	Sortie : liste filtrée et mappée des sensors HSE

🤖 Fonctions clés
select_valid_sensors(), filter_duplicates(), map_entity_to_sensor()

🛡️ Cas particuliers
	•	Distinction virtuels/officiels
	•	Gestion des doublons ou orphelins

🧪 Exemple
Un nouvel onduleur crée trois capteurs → seul le meilleur est retenu.

⸻

3.4 energy_tracking.py — Suivi énergétique

🛠️ Responsabilité
Gère l’agrégation et la synchronisation des mesures énergétiques (heures, jours, mois, années).

⚙️ Fonctionnement
	•	Agrège les mesures selon la périodicité
	•	Synchronise avec utility_meter
	•	Stocke pour visualisation/export

🔄 Cycle de vie
	•	Création à l’ajout de capteur
	•	Mise à jour continue
	•	Suppression / archivage si inactif

📥 / 📤
	•	Entrée : sensors HSE + métadonnées
	•	Sortie : séries historiques

🤖 Fonctions clés
track_entity(), aggregate_energy_data(), sync_with_utility_meter()

🧪 Exemple
Les historiques sont automatiquement suivis et visualisés dans Lovelace.

⸻

3.5 sensor.py — Gestion des entités HSE

🛠️ Responsabilité
Crée, met à jour et maintient les entités “sensor” HSE dans Home Assistant.

⚙️ Fonctionnement
	•	Génère les entités à partir des capteurs sélectionnés
	•	Gère les attributs enrichis et tags HSE
	•	Assure la cohérence avec le registre Home Assistant

🤖 Fonctions clés
create_sensor_entity(), update_sensor_entity(), delete_sensor_entity()

🧪 Exemple
Un capteur validé crée automatiquement une entité sensor.hse_* enrichie et tagguée.

⸻

3.6 sensor_quality_scorer.py — Scoring et diagnostic

🏅 Responsabilité
Calcule les scores qualité des capteurs et entités.

⚙️ Fonctionnement
	•	Analyse type, fréquence, fiabilité
	•	Classe les capteurs (officiel, virtuel, orphelin…)
	•	Identifie les doublons et incohérences

🤖 Fonctions clés
score_sensor(), detect_duplicates(), tag_orphan()

🧪 Exemple
Les capteurs à faible score sont archivés ou mis en attente.

⸻

3.7 generator.py — Dashboards & exports

🖼️ Responsabilité
Génère automatiquement :
	•	Dashboards Lovelace
	•	Exports YAML/CSV
	•	Vues de suivi énergétique

🤖 Fonctions clés
generate_lovelace_dashboard(), export_data(), generate_template()

🧪 Exemple
Un dashboard est généré automatiquement après chaque modification de sélection.

⸻

3.8 helpers/validation.py — Validation et cohérence

✅ Responsabilité
Assure la validation et le contrôle d’intégrité des données.

⚙️ Fonctionnement
	•	Vérifie les attributs, typages, cohérences métier
	•	Génère logs et diagnostics

🤖 Fonctions clés
validate_sensor_data(), check_attributes(), validate_mapping()

🧪 Exemple
Lors d’un export CSV, toutes les données sont validées avant génération.

⸻

3.9 energy_analytics.py — Analyse avancée

📊 Responsabilité
Analyse et prédiction énergétique :
	•	Détection d’anomalies
	•	Comparaison de profils
	•	Synthèses mensuelles/annuelles

⚙️ Fonctions clés
Détection de surconsommation, analyse comparative, reporting.

⸻

3.10 energy_export.py — Export & sauvegarde

🚚 Responsabilité
Sauvegarde et export des données énergétiques :
	•	CSV, JSON, InfluxDB
	•	Backup planifié ou à la demande

4. Flows et interactions

🔄 Cycle de vie des données

flowchart TD
    DETECT[detect_local.py 🔎 Détection]
    SELECTION[manage_selection.py 🎯 Sélection / Mapping]
    SCORER[sensor_quality_scorer.py 🏅 Scoring / Diagnostic]
    TRACKING[energy_tracking.py 📈 Suivi / Historique]
    ANALYTICS[energy_analytics.py 🧮 Analyse / Prédictions]
    EXPORT[energy_export.py 🚚 Export / Backup]
    SENSOR[sensor.py 🪪 Entités HSE]
    GENERATOR[generator.py 🖼️ Dashboards]
    VALIDATION[helpers/validation.py ✅ Validation]

    DETECT --> SELECTION
    SELECTION --> SCORER
    SCORER --> SELECTION
    SELECTION --> TRACKING
    TRACKING --> GENERATOR
    TRACKING --> ANALYTICS
    TRACKING --> EXPORT
    GENERATOR --> SENSOR
    GENERATOR --> EXPORT
    ANALYTICS --> GENERATOR
    SENSOR --> VALIDATION
    DETECT --> VALIDATION
    SCORER --> VALIDATION
    TRACKING --> VALIDATION

🖼️ Illustration :
![Schéma global Backend](diagram-backend.svg)

## **5. Autres scripts backend**

| Fichier | Rôle |
|----------|------|
| `const.py` | Définit toutes les constantes, chemins, clés et conventions globales utilisées par le composant. |
| `config_flow.py` / `options_flow.py` | Gèrent les flux de configuration et d’options dans l’UI Home Assistant (intégration, authentification, sélection des entités). |
| `debug_json_sets.py` | Script de diagnostic : exporte et compare les jeux de données JSON pour audit et vérification des capteurs détectés. |
| `migration_cleanup.py` | Gère la migration des anciennes entités et le nettoyage des entités obsolètes lors d’une mise à jour. |
| `panel_selection.py` | Définit la logique et les interactions du panneau de sélection dans l’UI (vue des capteurs, filtres, validation). |
| `sensor_name_fixer.py` | Corrige automatiquement les noms et attributs des entités `sensor` selon les conventions HSE. |
| `sensor_sync_manager.py` | Assure la synchronisation complète entre les capteurs Home Assistant et les entités HSE (ajout, mise à jour, suppression). |
| `proxy_api.py` | Fournit un proxy sécurisé pour les endpoints REST backend (authentification, journalisation, filtrage des appels). |
| `power_monitoring.py` | Module de suivi temps réel : mesure instantanée de la puissance, alertes et analyse rapide. |
| `detect_local_debug_standalone.py` / `detect_energy.py` | Outils utilitaires de test et de débogage : permettent d’exécuter la détection locale hors du contexte Home Assistant. |

6. API et endpoints
	•	📡 Liste complète des endpoints REST exposés
	•	⚙️ Paramètres, payloads et exemples d’usage
	•	🔐 Sécurité et authentification (proxy API, HASS tokens)

⸻

7. Erreurs, logs et diagnostic
	•	🧾 Politique de gestion d’erreurs et exceptions
	•	📁 Emplacement des logs backend
	•	🧰 Outils de diagnostic et audit

⸻

8. Exemples d’usage
	•	Scénarios typiques : détection, scoring, administration
	•	Exemples d’appels API et extraits de code

⸻

9. Extension et maintenance
	•	📚 Guidelines pour étendre le backend
	•	🔧 Points d’entrée modifiables
	•	♻️ Compatibilité ascendante garantie

⸻

10. Ressources associées
	•	Liens vers chaque fichier source
	•	Diagrammes techniques et documentation complémentaire

