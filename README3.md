# ⚡️ Home Suivi Élec

<div align="center">
  <img src="https://img.shields.io/badge/home--assistant-integration-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/energy-monitoring-success?style=for-the-badge" />
  <img src="https://img.shields.io/badge/frontend-react%2Bvanilla-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/scoring-qualite%E2%98%85%E2%98%85%E2%98%85-green?style=for-the-badge" />
</div>

---

> **Une intégration Home Assistant avancée pour détecter, scorer, piloter et visualiser toutes vos consommations électriques.**
>
> — Avec UI web moderne, APIs dynamiques et documentation complète.

---

## 🌟 Fonctionnalités clés

- 🛰️ **Détection automatique** de tous les capteurs power/energy (TP-Link, Tapo, Enedis, PowerCalc…)
- 🧬 **Scoring qualité**, gestion des doublons, préconisations
- 🎨 **Interface web moderne** configurable et multi-panneaux (React + vanilla JS, toasts, badges…)
- 🛠️ **Génération automatique de dashboards Lovelace** et exports CSV/YAML
- 🤝 **Aucune config YAML obligatoire** : tout se fait dans l’UI
- 📚 **Documentation modulaire** et maintenable dans [`docs/`](docs/)
- 🔒 **APIs, proxy sécurisé & architecture modulaire**

---

## 🔥 Vue globale du projet

flowchart LR
subgraph HA[Home Assist
nt] DL[detect
local.py] MS[mana
e_selection.py]
T[energy_tra
king.py] S[sensor.py]
QA[sensor_qu
lity_scorer.py] GEN[gen
rator.py]
MM[
tility_meter_manager.py]
V[validation.py]
nd subgraph "�
DL --> MS
MS --> ET
ET --> S
MS --> QA
QA --> WS
WS -->|API, proxy| PAPI
PAPI -->|REST| MS
PAPI -->|REST| QA
GEN --> WS
GEN -->|Exports| PAPI
UMM --> MS
UMM --> ET
V --> MS
V -->|flows| ET
click DL "docs/detect_local.md" "Go to detect_local"
click MS "docs/manage_selection.md"
click ET "docs/energy_tracking.md"
click S "docs/sensor.md"
click QA "docs/sensor_quality_scorer.md"
click GEN "docs/generator.md"
click UMM "docs/utility_meter_manager.md"
click V "docs/validation.md"


---

## 📁 Sommaire documentaire & modules

> Toutes les docs techniques sont [dans /docs/](docs/)

<details>
<summary><b>Backend & Helpers</b></summary>

- [__init__.md](docs/__init__.md) — bootstrap intégration
- [detect_local.md](docs/detect_local.md), [manage_selection.md](docs/manage_selection.md)
- [sensor.md](docs/sensor.md), [energy_tracking.md](docs/energy_tracking.md)
- [energy_analytics.md](docs/energy_analytics.md), [energy_export.md](docs/energy_export.md)
- [sensor_quality_scorer.md](docs/sensor_quality_scorer.md)
- [utility_meter_manager.md](docs/utility_meter_manager.md)
- [validation.md](docs/validation.md), [integration_quality_fetch.md](docs/integration_quality_fetch.md)
</details>

<details>
<summary><b>Frontend/UI</b></summary>

- [web_static.md](docs/web_static.md) — architecture JS/React complète
- [panel_selection.md](docs/panel_selection.md), [configuration_frontend.md](docs/configuration_frontend.md)
</details>

<details>
<summary><b>Flows, Proxies, Générateur</b></summary>

- [config_flow.md](docs/config_flow.md), [options_flow.md](docs/options_flow.md)
- [proxy_api.md](docs/proxy_api.md)
- [generator.md](docs/generator.md)
</details>

<details>
<summary><b>Diagnostics, Debug & Audit</b></summary>

- [audit_energy.md](docs/audit_energy.md)
- [debug_json_sets.md](docs/debug_json_sets.md)
- [detect_local_debug_standalone.md](docs/detect_local_debug_standalone.md)
</details>

---

## 🎬 Quickstart

#### 1. Copiez `custom_components/home_suivi_elec/` dans votre dossier Home Assistant.
#### 2. Redémarrez Home Assistant.
#### 3. Ouvrez l’interface UI (Panel HSE ou `/hse` en iframe si activé).
#### 4. Sélectionnez vos capteurs et laissez HSE proposer les meilleurs.  
_Naviguez tout, exportez, gérez vos utility_meters, pilotez tout depuis l’UI ou via les APIs._

---

## 🧩 Architecture de fichiers

graph TD
A[custom_components/home_suivi_elec]
A --> B[docs/ ---> .md explicatifs]
A --> C[web_static/ ---> UI React/JS]
A --> D[helpers/ ---> utilitaires]
A --> E[core py. ---> backend logic]
B --> F[Chaque .md = 1 module]
C --> G[js/, src/]
E --> H[detect_local.py, manage_selection.py, etc.]


---

## 🔄 Matrice de flux (simplifié)

| Source             | Destination             | Type/ But                        |
|---------------------|------------------------|----------------------------------|
| detect_local.py     | manage_selection.py     | JSON Sensors découverts          |
| manage_selection.py | energy_tracking.py      | Selected sensors & mapping       |
| energy_tracking.py  | sensor.py              | Entités dynamiques HA            |
| sensor_quality_scorer.py| manage_selection   | Attributs/score entity           |
| web_static          | proxy_api/REST backend | Actions utilisateur, maj UI      |
| generator.py        | UI, Lovelace YAML      | Génération auto, download dash   |
| utility_meter_manager.py| tracking/detectors | Synchro avec utility_meter HA    |
| helpers/validation.py| flows, UI             | Validation enrichie              |

---

## 🏅 Points forts de l’intégration

- **Qualité** : scoring automatique visuel, badges, tri optimal
- **Sécurité** : toutes les actions critiques passent via un proxy sécurisé
- **Ergonomie** : une interface web one-click, API REST-compatible, exports dashboard/YAML/CSV
- **Extensibilité** : nouveaux capteurs, intégrations ou panels s’ajoutent via modules/JS
- **Maintenance** : chaque fichier principal possède sa doc, MAJ à chaque PR recommandée

---

## 🤝 Contribution & Bonnes pratiques

- **> Documentation obligatoire** : tout nouveau module doit avoir un .md associé dans /docs/
- **> Extensions :** suivre le modèle modulaire, chaque module = 1 responsabilité
- **> Besoin d’aide ?**  
  Consulte le guide [web_static.md](docs/web_static.md), [sensor_quality_scorer.md](docs/sensor_quality_scorer.md), etc.  
- **> Diagnostic :** voir [audit_energy.md](docs/audit_energy.md) et [debug_json_sets.md](docs/debug_json_sets.md)

---

<div align="center" style="padding: 1em 0;">
🎯 <b>Pour toute question technique lisez la doc, puis remontez votre PR ou issue !</b> 🎯  
</div>

---

_Fait pour la **stabilité**, la **performance**… et le **fun** 🧑‍💻⚡._


