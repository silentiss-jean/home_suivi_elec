# home_suivi_elec

Intégration avancée Home Assistant pour le suivi, l’analyse et l’optimisation de la consommation électrique.

Fonctionnalités principales :
- Détection intelligente et scoring des capteurs énergétiques (prises, Linky, Tapo, TP-Link...)
- Tracking multi-capteurs en temps réel, calculs et historique des consommations et coûts
- Interface graphique web embarquée
- Export des données, gestion des contrats/abonnements, optimisation énergétique

-----

Structure du projet :

custom_components/home_suivi_elec/
├── __init__.py
├── config_flow.py
├── const.py
├── data/
│   ├── capteurs_power.json
│   ├── capteurs_selection.json
│   ├── reference_integrations.json
│   ├── user_config.json
│   └── backups/
├── debug_json_sets.py
├── detect_energy.py
├── detect_local.py
├── detect_local_debug_standalone.py
├── energy_analytics.py
├── energy_export.py
├── energy_tracking.py
├── generator.py
├── helpers/
│   ├── integration_quality_fetch.py
│   ├── validation.py
│   └── __init__.py
├── manage_selection.py
├── manage_selection_views.py
├── manifest.json
├── migration_cleanup.py
├── options_flow.py
├── panel_selection.py
├── panel_static/
├── power_monitoring.py
├── proxy_api.py
├── sensor.py
├── sensor_name_fixer.py
├── sensor_quality_scorer.py
├── sensor_sync_manager.py
├── services.yaml
├── utility_meter_manager.py
├── web_static/
├── web_static_backup_YYYYMMDD/
└── __pycache__/

Légende :
__init__.py                  : Initialisation du composant, gestion du setup
config_flow.py               : Flow de configuration Home Assistant (UI)
const.py                     : Constantes globales de l’intégration
data/                        : Données utilisateurs, références, backups
  capteurs_power.json        : État et config des capteurs détectés
  capteurs_selection.json    : Configuration de sélection utilisateur
  reference_integrations.json: Références d'intégrations supportées
  user_config.json           : Config persistante utilisateur
  backups/                   : Sauvegardes automatiques/historiques de configs
debug_json_sets.py           : Jeux de données de debug (format JSON)
detect_energy.py             : Détection générique de capteurs d’énergie
detect_local.py              : Détection avancée locale des capteurs
detect_local_debug_standalone.py : Script debug hors HA (standalone)
energy_analytics.py          : Analyses détaillées des mesures d’énergie
energy_export.py             : Export de données énergétiques
energy_tracking.py           : Suivi intelligent multi-capteurs & gestion temps réel
generator.py                 : Génération d’artefacts internes (entités, tests…)
helpers/                     : Scripts/fonctions utilitaires spécifiques
  integration_quality_fetch.py: Analyse qualité intégrations
  validation.py              : Validation de données ou de config
manage_selection.py          : Logique de gestion et sauvegarde des sélections
manage_selection_views.py    : Gestion des vues et UI de sélection
manifest.json                : Déclaration Home Assistant (version/info)
migration_cleanup.py         : Migrations, cleanup et upgrade de config
options_flow.py              : Gestion UI des options utilisateurs
panel_selection.py           : Panel spécifique à la sélection des capteurs
panel_static/                : Ressources frontend statiques (html/js)
power_monitoring.py          : Suivi et mesures de puissance instantanée
proxy_api.py                 : Proxy et interface avec APIs externes
sensor.py                    : Définition des entités Sensor Home Assistant
sensor_name_fixer.py         : Normalisation/correction des noms de capteurs
sensor_quality_scorer.py     : Algorithmes de scoring de qualité pour les capteurs
sensor_sync_manager.py       : Synchronisation et MAJ des capteurs avec HA
services.yaml                : Déclaration des services personnalisés pour HA
utility_meter_manager.py     : Gestionnaire des UtilityMeters (compteurs virtuels HA)
web_static/                  : Frontend complet (HTML/JS/CSS) + panneaux custom
web_static_backup_YYYYMMDD/  : Backups automatiques de l’UI web
__pycache__/                 : Cache python (généré autom.)

-----

Installation :
- Ajouter le dépôt dans HACS : https://github.com/silentiss-jean/home_suivi_elec.git
- Installer l’intégration via HACS
- Configurer via le panneau Home Assistant

Documentation technique et scripts détaillés dans le dossier /docs/

-----

Contribuer :
Pour toute proposition, bug ou idée, ouvrez une issue ou envoyez une PR sur le dépôt GitHub.

