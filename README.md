# Home Suivi Élec

Home Suivi Élec est une intégration Home Assistant dédiée au suivi énergétique, avec une interface web intégrée au panneau latéral. [file:4][file:6]
Le projet combine un backend Python (intégration HA) et un frontend statique servi via `web_static/`. [file:6][file:1]

## Fonctionnalités

- Détection automatique de capteurs (power/energy) et aide à la sélection. [file:4]
- Suivi énergétique avec cycles (hourly, daily, weekly, monthly, yearly). [file:4]
- Génération de contenu (ex: YAML/Lovelace) et outils de migration/export depuis l’UI. [file:4][file:1]
- Persistance des données via la Storage API de Home Assistant (avec compatibilité legacy mentionnée). [file:4][file:6]

## Architecture (haut niveau)

- Frontend: `web_static/` chargé par `index.html`, orchestré par `core/app.js` + `core/router.js`, puis modules `features/*` et composants/utilitaires `shared/*`. [file:6][file:1]
- Backend: endpoints REST exposés sous `/api/home_suivi_elec/...` consommés par le frontend via `fetch()`. [file:6]
- Stockage: données d’état/configuration côté HA via `.storage` (ex: sélection capteurs, entités ignorées, groupes). [file:6][file:3]

## Installation (Home Assistant)

1. Copier le dossier `custom_components/home_suivi_elec/` dans le répertoire `config/custom_components/` de Home Assistant. [file:4]
2. Redémarrer Home Assistant, puis ajouter/configurer l’intégration (Config Flow / Options Flow). [file:4]
3. Ouvrir le panneau `⚡ Suivi Élec` dans la barre latérale pour accéder à l’interface. [file:6]

## Documentation du repo

- `architecture.md` : vue d’ensemble + diagrammes. [file:6]
- `backend.md` : documentation backend (modules et index métier). [file:4]
- `frontend.md` : documentation frontend (structure et modules). [file:1]
- `runtime_snapshot.json` : snapshot runtime (extrait `.storage`). [file:3]

## Développement / Contribution

Le frontend est organisé par “features” et s’appuie sur un socle `shared/` (proxy API, composants UI, utilitaires, state/event bus). [file:1]
Le backend centralise la logique métier (détection, sélection, scoring, tracking) et expose des vues REST (API unifiée + vues de sélection/config). [file:4]
