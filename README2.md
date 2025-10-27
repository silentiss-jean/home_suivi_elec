# ⚡ Home Suivi Élec

> **Supervision intelligente de la consommation électrique pour Home Assistant**  
> Détection, scoring et visualisation avancées de tous vos capteurs, avec UI moderne et backend modulaire.

---

## 🔎 Présentation

Home Suivi Élec est une **intégration Home Assistant** qui permet de :
- **Détecter automatiquement** tous les capteurs d’énergie et puissance (Linky, Tapo, TP-Link, PowerCalc, etc.)
- Permettre la **sélection optimisée** avec scoring qualité, gestion de doublons et exclusion des mesures non pertinentes
- Offrir une **interface web moderne** (React + JS vanilla) pour tout configurer sans YAML
- Exporter, agréger, synchroniser et diagnostiquer toute la donnée énergie/power maison
- Générer des dashboards Lovelace ou YAML directement depuis HA

---

## 📁 Structure et organisation du projet

graph TD;
A[custom_components/home_suivi_elec] --> B[docs/ Documentatio
] A --> C[helpers/ Fonctions utilitai
es] A --> D[web_static/ Fronte
d UI] A --> E[core Python
odules] D --> F(js/, src/co
ponents/) B --> G[F
chiers .md] E --> H[detect_local.py, manage_selection.py, energy_tr


---

## 🗃️ Documentation détaillée

Chaque module/fonctionnalité majeure possède un fichier markdown dédié dans [`docs/`](docs/).

### **🧩 Backend**
- [__init__.md](docs/__init__.md) — Orchestration principale
- [detect_local.md](docs/detect_local.md) — Détection auto sur toutes plateformes
- [manage_selection.md](docs/manage_selection.md) — Logique de sélection/doublons
- [energy_tracking.md](docs/energy_tracking.md) — Historisation/suivi énergétiques avancés
- [sensor.md](docs/sensor.md) — Création dynamique des entités HA
- [energy_analytics.md](docs/energy_analytics.md), [energy_export.md](docs/energy_export.md) — Analyse, agrégation, et export

### **🧰 Helpers (services utilitaires)**
- [validation.md](docs/validation.md) — Validation robuste de données utilisateur
- [sensor_quality_scorer.md](docs/sensor_quality_scorer.md) — Score qualité auto pour les capteurs
- [sensor_sync_manager.md](docs/sensor_sync_manager.md) — Synchronisation inter-entities
- [integration_quality_fetch.md](docs/integration_quality_fetch.md) — Index de fiabilité officiel
- [utility_meter_manager.md](docs/utility_meter_manager.md) — Création/surveillance YAML utility_meter

### **🖥️ Frontend / UI**
- [web_static.md](docs/web_static.md) — Architecture du Frontend custom
- [panel_selection.md](docs/panel_selection.md) — Panel web legacy
- [configuration_frontend.md](docs/configuration_frontend.md) — Vue d’ensemble UI, scoring, panels JS/React

### **🗂️ Flows & Configuration**
- [config_flow.md](docs/config_flow.md) — Intégration UI flows HA natif
- [options_flow.md](docs/options_flow.md) — Options utilisateur dynamiques
- [proxy_api.md](docs/proxy_api.md) — Proxy/secure API pour interaction JS⬄Python
- [generator.md](docs/generator.md) — Générateur de dashboard auto Lovelace

### **🔎 Diagnostic & Audit**
- [debug_json_sets.md](docs/debug_json_sets.md) — Jeux de tests
- [audit_energy.md](docs/audit_energy.md) — Outils d’audit conso
- [detect_local_debug_standalone.md](docs/detect_local_debug_standalone.md) — Debug isolé

---

## 🔄 Table de flux principaux (backend / helpers / UI)


| Source/module             | Vers                     | Interactions principales                               |
|--------------------------|--------------------------|--------------------------------------------------------|
| `detect_local.py`        | `manage_selection.py`     | Découverte sensors, IDs, métadonnées                   |
| `manage_selection.py`    | `energy_tracking.py`      | Configuration active, exclusions, mapping              |
| `energy_tracking.py`     | `sensor.py`               | Expose sensors HSE à HA (multi-cycles)                 |
| `sensor_quality_scorer.py`| `manage_selection`/UI    | Score auto, badges, auto-selection                     |
| `web_static` (UI)        | proxy_api, backend        | Panels React/JS, mutations, retours et feedback        |
| `generator.py`           | `/config/`, Lovelace      | Génération YAML auto, cartes                           |
| `utility_meter_manager.py`| détecteurs, tracking     | Synchro/mise à jour utility_meters YAML                |
| `helpers/validation.py`  | flows, UI forms           | Vérification dynamique de tous champs utilisateur      |

---

## 🗺️ Diagramme des flux (Mermaid)

flowchart TD
subgraph BACKEND
DL[detect_local.py]
MS[manage_selection.py]
ET[energy_tracking.py]
S[sensor.py]
QA[sensor_quality_scorer.py]
UMM[utility_meter_manager.py]
GEN[generator.py]
end
subgraph UI
WS[web_static (React+JS UI)]
PAPI[proxy_api.py]
end
DL --> MS
MS --> ET
ET --> S
MS --> QA
QA --> WS
WS -->|API/Proxy| PAPI
PAPI -->|Appels API| MS
GEN --> WS
GEN -->|Exports| PAPI
UMM --> ET
UMM --> MS


---

## 🚀 Usage rapide & Points forts

- **Installation :** copier le dossier `custom_components/home_suivi_elec/`, configurer depuis HA UI ou `/docs/`.
- **Flow principal :**
  1. Les capteurs sont détectés automatiquement.
  2. L’utilisateur choisit (ou laisse faire l’auto-sélection) via l’UI moderne.
  3. Les flux/trackings sont créés, synchronisés, scorés, mises à jour et visualisables sur Lovelace.
  4. Tous les exports docs/exports/dashboards sont générés et à disposition.
- **Chaque partie est indépendante et documentée.**
- **Extensions faciles 🚀:** il suffit d’ajouter un nouveau module .py ou .js, puis de documenter dans `/docs/`.
- **APIs REST, proxy sécurisé, panel UI custom, zéro YAML obligatoire.**

---

## 🤝 Contribution & Bonnes pratiques

- Toute PR modifiant le backend ou le frontend doit proposer la doc associée dans `docs/`.
- **Gardez les modules découplés** : chaque fichier = une responsabilité claire.
- **Mettre à jour ce README** à chaque ajout de module/classe/point d’entrée !

---

## 📝 Ressources utiles

- [Home Assistant docs](https://www.home-assistant.io/docs/)
- [Exemple de dashboard généré](docs/generator.md)
- [Architecture frontend](docs/web_static.md)
- [Guides d’initialisation](docs/__init__.md)  
- [Scoring capteurs](docs/sensor_quality_scorer.md)

---

_Fait pour la stabilité, la performance … et le fun !_


