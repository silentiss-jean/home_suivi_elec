# 🏗 Architecture de Home Suivi Élec

Ce document décrit l'architecture interne de l'intégration, les rôles des composants et leurs interactions.

---

## 📂 Structure du code

L'intégration est un **composant personnalisé Home Assistant** (`custom_components/home_suivi_elec/`), combinant :
- Un **backend Python** pour la logique métier.
- Un **frontend JavaScript** pour l'interface web.
- Un **système de données JSON** pour la persistance.


home_suivi_elec/
├── init.py # Initialisation, DataUpdateCoordinator, services
├── config_flow.py # Configuration initiale
├── options_flow.py # Reconfiguration
├── const.py # Constantes
├── manifest.json # Déclaration
├── services.yaml # Services
│
├── data/ # Données persistantes
│ ├── capteurs_selection.json
│ ├── capteurs_power.json
│ ├── user_config.json
│ └── reference_integrations.json
│
├── helpers/ # Utilitaires
│ ├── integration_quality_fetch.py
│ └── validation.py
│
├── manage_selection.py # Gestion de la sélection
├── manage_selection_views.py # Génération des vues (doublons, etc.)
├── utility_meter_manager.py # Génération YAML (W→kWh + utility_meter)
├── generator.py # Coordination de la génération
├── detect_local.py # Détection des capteurs
│
├── web_static/ # Frontend
│ ├── index.html
│ ├── style.css
│ └── js/
│ ├── app.js
│ ├── summary.js
│ ├── detection.js
│ ├── configuration.js
│ ├── configuration.api.js
│ ├── configuration.view.js
│ ├── duplicatesPanel.js
│ ├── referencePanel.js
│ └── ...
│
└── panel_static/ # Panneaux statiques
├── panel.html
└── suivi_elec.js

---

## 🔗 Interactions clés

1. **Détection** :
   - `detect_local.py` interroge l’API HA pour lister les capteurs.
   - Résultats stockés dans `data/capteurs_power.json`.

2. **Configuration** :
   - `config_flow.py` et `options_flow.py` gèrent la configuration initiale.
   - `manage_selection.py` gère la sélection utilisateur.
   - Données sauvegardées dans `data/user_config.json` et `data/capteurs_selection.json`.

3. **Génération YAML** :
   - `utility_meter_manager.py` lit les données.
   - Pour chaque capteur de puissance, génère un `sensor` d’intégration (W→kWh).
   - Génère les `utility_meter` sur ce kWh.
   - Écrit le YAML dans `/config/packages/home_suivi_elec.yaml`.

4. **Interface web** :
   - `web_static/index.html` est servi via un endpoint REST.
   - `app.js` initialise l’interface.
   - `configuration.api.js` communique avec le backend.
   - `summary.js` calcule et affiche les données.

---

## 🧩 Modules principaux

| Module | Rôle |
|--------|------|
| `__init__.py` | Point d’entrée, coordination, services |
| `DataUpdateCoordinator` | Récupère et met à jour les données capteurs |
| `utility_meter_manager.py` | Cœur de la génération YAML, conversion W→kWh |
| `manage_selection_views.py` | Génère les vues de sélection (doublons, alternatives) |
| `web_static/js/*.js` | Frontend modulaire, interface interactive |

---

## 🌐 API REST

L’intégration expose plusieurs endpoints :

| Endpoint | Méthode | Rôle |
|---------|--------|------|
| `/api/home_suivi_elec/get_sensors` | GET | Récupère les capteurs détectés |
| `/api/home_suivi_elec/get_user_options` | GET | Récupère les options utilisateur |
| `/api/home_suivi_elec/save_user_options` | POST | Sauvegarde les options utilisateur |
| `/api/home_suivi_elec/save_selection` | POST | Sauvegarde la sélection des capteurs |
| `/api/home_suivi_elec/regenerate_yaml` | POST | Regénère le fichier YAML |

---

## 📦 Persistance des données

Les données sont stockées en JSON dans `data/` pour :
- Survivre aux redémarrages.
- Être facilement inspectables.
- Permettre un debug rapide.

| Fichier | Contenu |
|--------|--------|
| `capteurs_selection.json` | Sélection des capteurs par intégration |
| `capteurs_power.json` | Liste des capteurs de puissance détectés |
| `user_config.json` | Options utilisateur (tarifs, abonnement, capteur externe) |
| `reference_integrations.json` | Intégrations de référence (ex: Atome) |

---

## 🔄 Flux de données


flowchart TD
A[Home Assistant] -->|API| B(detect_local.py)
B --> C[data/capteurs_power.json]
C --> D[Interface web]
D --> E[Utilisateur sélectionne capteurs]
E --> F[manage_selection.py]
F --> G[data/capteurs_selection.json]
G --> H[utility_meter_manager.py]
H --> I[/config/packages/home_suivi_elec.yaml]
I --> J[Home Assistant]
K[Utilisateur options] --> L[options_flow.py]
L --> M[data/user_config.json]
M --> H

---

## 🛠 Bonnes pratiques

- **Ne jamais brancher un capteur de puissance (W) directement sur un `utility_meter`**.
- **Utiliser un `template` sensor** pour normaliser les sources non numériques.
- **Vérifier la disponibilité** des capteurs dans l’interface.
- **Mettre à jour régulièrement** l’intégration pour bénéficier des correctifs.

