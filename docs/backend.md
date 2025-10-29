Documentation du Backend – home_suivi_elec
1. Introduction générale

🎯 Objectif
Le backend de home_suivi_elec vise à :

Détecter dynamiquement toutes les intégrations installées dans l’instance Home Assistant.

Identifier les intégrations gérant de l’énergie (TP-Link, Tapo, Enedis, PowerCalc, utility_meter…).

Récupérer et filtrer les capteurs qui mesurent la puissance ou l’énergie électrique.

Enrichir ces capteurs : scoring qualité, ajout de métadonnées, normalisation et diagnostics.

Créer et maintenir des entités sensors “tagguées HSE” dans Home Assistant pour un suivi optimal et centralisé.

Gérer le cycle de vie complet des capteurs :
  - Ajout automatique lors de la détection
  - Suppression lors de la désactivation ou orphelinisation
  - Mise en attente, archivage ou purge selon les cas (maintenance, diagnostics)

Superviser la qualité et la fiabilité :
  - Calcul de scores qualité
  - Détection et gestion des doublons, capteurs orphelins, anomalies

Synchroniser avec les entités natifs Home Assistant (ex : utility_meter) pour une vue cohérente et multi-période.

Exposer des API backend pour piloter toutes les actions (détection, sélection, scoring, archivage…).

Automatiser la génération de dashboards et exports pour faciliter la visualisation et l’usage des données.

Assurer la sécurité et la traçabilité de toutes les manipulations via un proxy backend contrôlé.



Vue d’ensemble de l’architecture

Principes de conception (modularité, extensibilité, robustesse)

2. Schéma global
Diagramme du flux (schema_flux_hse.svg)

Explication synthétique des interactions entre modules

3. Modules principaux
3.1 detect_local.py
detect_local.py
🛠️ Responsabilité principale
Ce module gère la détection automatique des intégrations et des capteurs disponibles dans l’instance Home Assistant.
Son objectif est d’identifier tous les devices et entities liés à la consommation ou la mesure d’énergie/power.

⚙️ Fonctionnement général
Scan dynamique des plateformes installées (tapo, tp-link, enedis, powercalc, etc.) et extraction de leurs capteurs

Définition de critères d’éligibilité : seuls les capteurs mesurant la puissance ou l’énergie sont retenus

Attribution d’un score initial à chaque capteur détecté

Association de métadonnées enrichies (origine, type de mesure, version, etc.)

Création d’une entrée “candidate” dans le registre backend pour chaque capteur détecté

🔄 Cycle de vie
Ajout automatique à chaque démarrage ou refresh (scan périodique/à la demande)

Mise à jour du registre backend si de nouveaux capteurs apparaissent ou disparaissent

Marquage des capteurs obsolètes ou supprimés pour traitement ultérieur (archivage/purge)

Passage des “candidats” à l’étape suivante : sélection/filtrage (géré par manage_selection.py)

📥 Entrées / 📤 Sorties
Entrée : liste des entities Home Assistant, plateformes installées

Sortie : dictionnaire des capteurs candidats enrichis, prêt pour scoring/filtrage

🔗 Points d’intégration
Appel de modules de scoring (sensor_quality_scorer.py)

Transmission des résultats à la sélection (manage_selection.py)

Utilisation de helpers et validators pour fiabilité des données

🤖 Fonctions clés
scan_integrations()

detect_power_sensors()

enrich_candidate(entity)

Toutes documentées et typées dans le code source

🛡️ Cas particuliers gérés
Capteurs intégrés non conformes (hors périmètre énergie)

Capteurs virtuels ou hérités (type “powercalc”)

Gestion des doublons potentiels dès la détection

Gestion des entités en fin de vie ou supprimées

📝 Exemple d’usage typique
Au redémarrage de Home Assistant, le backend déclenche detect_local.py

Tous les nouveaux capteurs énergétiques sont détectés, enrichis et taggués pour traitement

Si un capteur disparaît (suppression plateforme), il est mis en attente pour archivage/purge



3.2 manage_selection.py
🛠️ Responsabilité principale
Ce module assure la sélection, le filtrage et le mapping des capteurs énergétiques détectés par le backend.
Il décide quels capteurs seront retenus pour le suivi, la visualisation et le scoring dans Home Assistant.

⚙️ Fonctionnement général
Récupère la liste des capteurs “candidats” depuis detect_local.py

Applique des critères de sélection : qualité du capteur, fiabilité, compatibilité, unicité

Filtre les doublons, capteurs non pertinents ou non compatibles (“officiels”, “virtuels”, “orphelins”)

Réalise le mapping entre capteurs physiques et entités Home Assistant

Génère la liste finale des sensors HSE à suivre

🔄 Cycle de vie
Sélection à chaque scan/découverte

Mise à jour lors d’ajout/suppression de capteurs : la sélection est alors recalculée

Maintient une file d’attente pour les capteurs “à surveiller” (ex : capteurs jugés orphelins ou en doute)

Envoie les capteurs retenus au module de scoring et au tracking (energy_tracking.py)

📥 Entrées / 📤 Sorties
Entrée : liste enrichie des capteurs détectés, scoring initial

Sortie : liste filtrée, mappée et annotée des capteurs HSE

Peut exposer l’état de la sélection via une API/backend

🔗 Points d’intégration
Consomme les sorties de detect_local.py

Dialogue avec sensor_quality_scorer.py pour obtenir/évaluer les scores

Transmet à energy_tracking.py les capteurs sélectionnés pour suivi

Interaction avec le registre Home Assistant pour tagging et traçabilité

🤖 Fonctions clés
select_valid_sensors()

filter_duplicates()

map_entity_to_sensor()

Fonction de file d’attente, tagging HSE

🛡️ Cas particuliers gérés
Capteurs virtuels (PowerCalc etc.) et officiels sont distingués et documentés

Doublons et conflits de mapping (un capteur réel → plusieurs sensors HA)

Capteurs “orphelins” mis en attente ou archivés suivant le paramétrage

📝 Exemple d’usage typique
Un nouvel onduleur est installé, trois capteurs sont détectés sur la même source

manage_selection.py filtre les doublons, retient le meilleur capteur (score, qualité)

Les capteurs non conformes sont mis en liste “à revoir” ou “orphelins”

La liste finale est envoyée au module de tracking et au dashboard



3.3 energy_tracking.py
🛠️ Responsabilité principale
Ce module gère le suivi dynamique des entités d’énergie (sensors, utility meters, etc.) sélectionnées dans Home Assistant.
Il assure l’agrégation, la synchronisation et le reporting des mesures énergétiques et historiques sur différentes périodes : heure, jour, mois, année.

⚙️ Fonctionnement général
Reçoit la liste des capteurs sélectionnés depuis manage_selection.py

Agrège et historise les mesures de puissance/énergie sur plusieurs périodicités (hourly, daily, monthly…)

Synchronise les sensors HSE avec les utility_meters natifs Home Assistant pour garantir la cohérence des données et leur périmètre

Organise les mesures dans des structures exploitables pour la visualisation et l’export (backend pour Lovelace, UI, CSV…)

🔄 Cycle de vie
Création de nouveaux suivis à chaque ajout ou activation de capteur sélectionné

Mise à jour automatique des séries historiques lors de réception de nouvelles données

Suppression ou archivage des suivis si un capteur devient inactif/obsolète

Gestion du recalcul ou de la purge des historiques selon les actions backend (API, admin, diagnostic)

📥 Entrées / 📤 Sorties
Entrée : liste filtrée/validée des sensors HSE et de leurs métadonnées

Sortie : objets de tracking (DataFrames, dictionnaires) segmentés par périodicité, ready pour visualisation/export

🔗 Points d’intégration
Appelle les APIs Home Assistant pour la récupération de données “utility_meter” et “sensor”

Dialogue avec manage_selection.py pour suivre l’état des capteurs

Transmet les résultats agrégés à generator.py pour création de dashboards ou exports

Interaction possible avec sensor_quality_scorer.py pour estimer la cohérence/qualité des historiques

🤖 Fonctions clés
track_entity(sensor_id)

aggregate_energy_data(sensor, period)

sync_with_utility_meter(sensor)

Outils de purge, archivage, recalcul historique

🛡️ Cas particuliers gérés
Capteurs “orphelins” ou hors service : suppression, archivage, signalement

Recalage automatique de données sur changements de périodicité ou d’intégration

Croisement de sources multiples (ex : PowerCalc vs. utility_meter natif)

📝 Exemple d’usage typique
Après sélection d’un nouveau capteur, le module commence à suivre les mesures “hourly” et “daily”

Les historiques sont automatiquement synchronisés et visualisés dans l’UI backend et dans Lovelace

Si un capteur devient “orphelin”, le tracking bascule en attente ou est archivé



3.4 sensor.py
🛠️ Responsabilité principale
Ce module gère la création, la gestion et la mise à jour des entités “sensor” utilisées pour le suivi énergétique dans Home Assistant.
Il est responsable de la structuration, de l’enregistrement et du maintien des entités tagguées “hse” pour garantir leur traçabilité et leur pertinence.

⚙️ Fonctionnement général
Génère et initialise les entités “sensor” HSE à partir des capteurs sélectionnés/mappés par manage_selection.py

Ajoute et met à jour les attributs enrichis (source, périodicité, qualité, tag “hse”, etc.)

Assure l’interfaçage avec le registre d’entités Home Assistant (création, suppression, modification)

Maintient la cohérence des données lors des opérations sur le cycle de vie des capteurs : activation, désactivation, suppression

🔄 Cycle de vie
Création d’une nouvelle entité à chaque ajout de capteur sélectionné

Mise à jour continue dès réception de nouvelles données ou modification des attributs

Suppression ou archivage des sensors en cas d’obsolescence ou de désactivation du capteur source

Synchronisation automatique du tag “hse” et des attributs complémentaires

📥 Entrées / 📤 Sorties
Entrée : capteur sélectionné + métadonnées

Sortie : instance d’entité sensor Home Assistant, enrichie et tagguée HSE

🔗 Points d’intégration
Reçoit les capteurs filtrés/manipulés par manage_selection.py

Interagit avec energy_tracking.py pour le reporting de mesures

Utilise les scores/vérifications issus de sensor_quality_scorer.py pour mise à jour de la qualité

🤖 Fonctions clés
create_sensor_entity(sensor_data)

update_sensor_entity(sensor_id, attrs)

delete_sensor_entity(sensor_id)

Tagging et attributs personnalisés

🛡️ Cas particuliers gérés
Capteurs avec attributs manquants/erronés : enrichissement ou signalement via diagnostic

Maintien du tag “hse” sur toutes les entités issues du flux principal

Gestion des suppressions en cascade si le capteur source disparaît

📝 Exemple d’usage typique
Un capteur validé par la sélection backend déclenche la création d’une entité “sensor” HSE, tagguée et enrichie, disponible dans Home Assistant

Si le capteur source change de qualité ou de type, les attributs et tags du sensor sont mis à jour automatiquement

En cas de suppression d’un capteur d’origine, l’entité sensor correspondante est retirée et son historique peut être archivé



3.5 sensor_quality_scorer.py
🛠️ Responsabilité principale
Ce module réalise le calcul, l’attribution et la gestion des scores qualité pour les capteurs et entités énergétiques.
Il permet de classifier, prioriser et diagnostiquer les sensors selon leur fiabilité, pertinence et conformité métier/technique.

⚙️ Fonctionnement général
Analyse chaque capteur (données, historique, source, type, fréquence) pour lui attribuer un score qualité global

Détermine la “recommandation” (sensor optimal, sensor alternatif, sensor à risque, sensor orphelin)

Identifie les doublons et conflits de mapping pour éviter les erreurs de reporting

Documente et expose les anomalies : capteur orphelin, données incohérentes, qualité dégradée

🔄 Cycle de vie
Calcul du score lors de la détection initiale, puis à chaque mise à jour ou événement critique

Réévaluation des scores en cas d’évolution du contexte (paramètres, état, qualité de mesure)

Classement en catégories (officiel, virtuel, orphelin, recommandation, etc.)

📥 Entrées / 📤 Sorties
Entrée : liste de capteurs détectés ou sélectionnés, leurs attributs et historiques

Sortie : score qualité, tag de diagnostic, recommandations associées (mapping ou exclusion)

🔗 Points d’intégration
Alimente manage_selection.py pour la sélection prioritaire selon qualité

Dialogue avec sensor.py pour maintenir les tags et attributs

Sert de base à generator.py pour les dashboards et visual reporting

🤖 Fonctions clés
score_sensor(sensor_data)

detect_duplicates(sensors)

tag_orphan(sensor)

Génération de rapport ou diagnostic

🛡️ Cas particuliers gérés
Doublons récurrents : signalement, exclusion ou fusion sur le backend

Capteurs “orphelins” : tagging, signalement, mise en attente ou archivage

Scoring dynamique : réévaluation en continu selon évolution des mesures

📝 Exemple d’usage typique
Lors de la sélection, tous les capteurs reçoivent un score qualité

Les capteurs de faible score sont archivés, ignorés ou placés en attente (orphelins)

Un sensor officiel, fiable et sans conflit de mapping est mis en avant dans le dashboard

Les diagnostics de doublons ou d’anomalies sont transmis au panel admin ou à la file d’audit



3.6 generator.py
🛠️ Responsabilité principale
Ce module assure la génération automatique des dashboards Lovelace, des fichiers d’export (YAML, CSV) et des vues pour le suivi énergétique.
Il automatise la présentation des capteurs sélectionnés, leur visualisation, et la configuration rapide des interfaces utilisateur dans Home Assistant.

⚙️ Fonctionnement général
Reçoit la liste finale des capteurs/sensors HSE à mettre en dashboard et rapport

Génère dynamiquement des configurations Lovelace prêtes à l’emploi (cards, panels, graphiques, historiques, badges, etc.)

Propose des exports de données sous différents formats : YAML pour configuration, CSV pour reporting/analyse

Permet une personnalisation avancée via des templates ou des options frontend

🔄 Cycle de vie
Génération automatique à chaque modification de la sélection ou du tracking (ajout/suppression de capteur, évolution des attributs)

Mise à jour des dashboards à chaque nouvelle donnée ou reconfiguration utilisateur

Suppression ou archivage des vues/dashboard si les sources deviennent obsolètes

📥 Entrées / 📤 Sorties
Entrée : liste des sensors, tracking historique, options de configuration demandées (période, affichage, format…)

Sortie : fichiers de configuration Lovelace, exports YAML/CSV, objets visualisables dans l’UI

🔗 Points d’intégration
Récupère les capteurs, scores et tracking depuis manage_selection.py, sensor_quality_scorer.py et energy_tracking.py

Transfère les dashboards et exports vers l’UI ou les API

Peut intégrer l’état qualité/scoring dans la présentation Lovelace (badges, couleurs, alertes)

🤖 Fonctions clés
generate_lovelace_dashboard(sensors)

export_data(format, sensors, history)

generate_template(options)

Options de personnalisation intégrées

🛡️ Cas particuliers gérés
Capteurs multiples ou doublonnés : fusion ou affichage comparatif dans le dashboard

Changement de format ou de template selon la période ou le type de données sélectionné

Alertes et warnings pour capteurs en erreur, orphelins ou à faible score

📝 Exemple d’usage typique
Après modification d’une sélection, generator.py produit un dashboard Lovelace prêt à intégrer dans Home Assistant

Chaque capteur actif et validé est présenté avec ses mesures, son score qualité et ses alertes visuelles

Un export CSV personnalisé est généré pour analyse externe ou archivage


3.7 helpers/validation.py

🛠️ Responsabilité principale
Ce module fournit les routines de validation et de contrôle d'intégrité pour les données, objets et flows internes du backend.
Il garantit la conformité des entrées/sorties, des attributs enrichis, et aide à la prévention des erreurs métier/technique.

⚙️ Fonctionnement général
Vérifie l’intégrité des données et structures manipulées par les modules principaux : capteurs, entities, historiques, mappings

Valide les formats, typages et cohérences métier des objets avant leur exploitation ou export

Joue un rôle de garde-fou avant la création, la modification ou la suppression de ressources

Permet de générer des messages d’alerte ou de diagnostic en cas d’incohérence ou d’erreur

🔄 Cycle de vie
Appel systématique lors de la création/mise à jour/suppression d'objets backend (sensor, tracking, entity…)

Validation des flows entrants/existants lors des scans ou refresh

Production de logs ou signaux d’erreur pour correction et diagnostic

📥 Entrées / 📤 Sorties
Entrée : objets métiers backend (sensors, entities, mappings, historiques, exports…)

Sortie : statut de validation (valide/invalide), messages d’erreur, exceptions ou logs détaillés

🔗 Points d’intégration
Utilisé par tous les modules métiers (detect_local.py, manage_selection.py, sensor.py…)

Génère des diagnostics pour energy_tracking.py et generator.py

Peut exposer ses résultats à l’UI ou aux endpoints d’audit pour correction utilisateur/admin

🤖 Fonctions clés
validate_sensor_data(sensor)

check_attributes(entity)

validate_mapping(mapping_obj)

Fonctions de diagnostic et vérification de format

🛡️ Cas particuliers gérés
Données ou attributs manquants/erronés : correction, signalement ou exclusion du flow

Validation des doublons, orphelins et entités en bout de cycle de vie

Routines personnalisées pour les exports et dashboards

📝 Exemple d’usage typique
Un sensor nouvellement créé est validé : ses attributs, sa source et ses métadonnées sont vérifiés

Lors d’un export CSV, les données sont validées pour absence de valeurs corrompues ou incohérentes

3.8 energy_analytics.py
Responsabilité :
Analyse, diagnostic et prédiction avancée sur les données énergétiques : détection d’anomalies, comparaison de profils, estimation/prévision.

Cycle de vie :
Exploite les historiques fournis par energy_tracking.py. Génère alertes, recommandations, synthèses mensuelles ou annuelles.

Fonctions clés :
Détection de surconsommation, analyse comparative, reporting personnalisé, synthèses statistiques.

3.9 energy_export.py
Responsabilité :
Export et sauvegarde des données énergétiques : backup JSON, export CSV, synchronisation vers bases externes (InfluxDB, autres).

Cycle de vie :
Sauvegarde régulière, export sur demande ou événement, archivage historique pour audit/exploitation externe.

Fonctions clés :
Export CSV/JSON, intégration InfluxDB, backup planning.

Formats enrichis

4. Flows et interactions
Cycle de vie des données

Diagramme de séquence/flow principal
flowchart TD
    DETECT[detect_local.py\n🔎Détection]
    SELECTION[manage_selection.py\n🎯Sélection / Mapping]
    SCORER[sensor_quality_scorer.py\n🏅Scoring / Diagnostic]
    TRACKING[energy_tracking.py\n📈Suivi / Historique]
    ANALYTICS[energy_analytics.py\n🧮Analyse / Prédictions]
    EXPORT[energy_export.py\n🚚Export / Backup]
    SENSOR[sensor.py\n🪪Gestion entités HSE]
    GENERATOR[generator.py\n🖼️Génération dashboards]
    VALIDATION[helpers/validation.py\n✅Validation]
    
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

Cas particuliers (orphelins, purge, archivage)

5. API et endpoints
Liste des API exposées (principaux endpoints)

Paramètres, payloads, exemples

Sécurité/authentification

6. Erreurs, logs & diagnostic
Politique d’erreur

Emplacements des logs

Outils de diagnostic/audit

7. Exemples d’usage
Scénarios typiques (détection, scoring, administration)

Extraits de code/API

8. Extension et maintenance
Guidelines pour l’extension

Points d’entrée modifiables

9. Ressources associées
Liens vers chaque fichier source

Diagrammes, documentation complémentaire


