# 🧩 Architecture Globale — Home Suivi Élec

**Généré automatiquement le 13/12/2025 à 11:27**

## Vue d'ensemble

- Backend Python (intégration Home Assistant)
- Frontend statique servit via `web_static/`
- Communication via API REST (`/api/home_suivi_elec/...`)
- Stockage via Home Assistant Storage API + JSON legacy

## Diagrammes (Mermaid)

### Flux global Backend ↔ Frontend

```
graph LR
  subgraph Backend
    B1[__init__.py]
    B2[StorageManager]
    B3[Energy Tracking]
    B4[REST API Views]
  end
  subgraph Frontend
    F1[index.html]
    F2[core/app.js]
    F3[features/*]
    F4[shared/*]
  end
  HA[Home Assistant Core]
  HA --> B1
  B1 --> B2
  B2 --> B3
  B1 --> B4
  F1 --> F2 --> F3
  F3 --> F4
  F3 -->|fetch()| B4
```
## Flux principaux

### Démarrage integration
1. Home Assistant appelle `async_setup_entry` dans `__init__.py`.
2. Initialisation du `StorageManager`.
3. Lancement de la détection, sélection, tracking énergie.
4. Exposition des endpoints API REST.

### Chargement UI Frontend
1. L'utilisateur ouvre le panel `⚡ Suivi Élec`.
2. `index.html` charge `core/app.js` et `core/router.js`.
3. Le routeur charge le module `features/*.js` correspondant à l'onglet.
4. Chaque module :
 - appelle ses APIs (`*.api.js`)
 - gère l'état local (`*.state.js`)
 - rend l'UI (`*.view.js` + `shared/components/*`)

## 🧠 État runtime (Home Assistant)

Capture au moment du run (source de vérité Storage HA).

- **HA config** : `/config`
- **Storage dir** : `/config/.storage`
- **Storage dir exists** : `True`
- **core.config_entries / home_suivi_elec entries** : `1`
- **.storage/home_suivi_elec_* files** : `3`
  - `home_suivi_elec_capteurs_selection_v2` size=14963 mtime=2025-12-13T11:01:59.704927
  - `home_suivi_elec_ignored_entities_v1` size=124 mtime=2025-12-11T08:22:51.453621
  - `home_suivi_elec_sensor_groups_v1` size=17567 mtime=2025-12-07T19:38:07.842449

Snapshot complet : `runtime_snapshot.json`

