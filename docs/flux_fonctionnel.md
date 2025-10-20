# 🌐 Flux fonctionnel de Home Suivi Élec

Ce document décrit le parcours d’un capteur, de sa détection à la génération du YAML et à l’affichage.

---

## 🔄 Étapes principales

### 1. Démarrage de l’intégration

- `__init__.py` est chargé par Home Assistant.
- Le `DataUpdateCoordinator` est initialisé pour rafraîchir les données capteurs.
- Les endpoints REST sont enregistrés.
- Les fichiers statiques (`web_static/`, `panel_static/`) sont copiés si nécessaire.

### 2. Détection des capteurs

- `detect_local.py` interroge l’API HA pour lister toutes les entités.
- Filtre les capteurs de puissance (unité = `W`, `kW` ou `device_class: power`).
- Résultats sauvegardés dans `data/capteurs_power.json`.

### 3. Configuration initiale

- L’utilisateur ajoute l’intégration via l’UI.
- `config_flow.py` guide la configuration : abonnement, tarifs, type de contrat.
- Données sauvegardées dans `data/user_config.json`.

### 4. Sélection des capteurs

- L’utilisateur ouvre l’interface web (panneau latéral).
- `configuration.js` charge les capteurs via `/api/home_suivi_elec/get_sensors`.
- L’utilisateur sélectionne les capteurs à suivre.
- `manage_selection.py` sauvegarde la sélection dans `data/capteurs_selection.json`.

### 5. Génération du YAML

- `utility_meter_manager.py` est déclenché (manuellement ou via service).
- Pour chaque capteur sélectionné :
  - **Si c’est une puissance (W)** :
    - Génère un `sensor` d’intégration (via `integration`) pour convertir W → kWh.
    - Utilise la méthode trapézoïdale pour une intégration précise.
    - Arrondit à 3 décimales.
  - **Si c’est déjà une énergie (Wh/kWh)** :
    - Pas de conversion nécessaire.
    - Utilise directement l’entité comme source.
- Crée ensuite 5 `utility_meter` :
  - `hourly`, `daily`, `weekly`, `monthly`, `yearly`.
- Écrit le tout dans `/config/packages/home_suivi_elec.yaml`.

### 6. Affichage et suivi

- L’utilisateur consulte l’onglet **Accueil**.
- `summary.js` :
  - Récupère les données via `get_sensors` et `get_user_options`.
  - Calcule la consommation interne cumulée.
  - Compare avec un capteur de référence (ex: Atome).
  - Calcule le delta (non mesuré).
  - Estime les coûts HT/TTC par période.
- Les données sont rafraîchies toutes les 30 secondes.

### 7. Régénération automatique

- Lorsqu’un changement est détecté (sélection, options), le YAML peut être régénéré :
  - Via un bouton dans l’interface.
  - Ou via un service (`home_suivi_elec.regenerate_yaml`).
- Un backup du fichier précédent est conservé.

---

## 🔗 Diagramme Mermaid


flowchart TD
A[Déminit.py]
B --> C[Initialisation DataUpdateCoordina
or] C --> D[detect_l
cal.py] D --> E[data/capteurs
power.json] B --> F[Enregistr

G --> H[Configuration initiale]
H --> I[config_flow.py]
I --> J[data/user_config.json]

G --> K[Sélection capteurs]
K --> L[get_sensors API]
L --> M[Interface web]
M --> N[Utilisateur sélectionne]
N --> O[save_selection API]
O --> P[capteurs_selection.json]

G --> Q[Régénération YAML]
Q --> R[utility_meter_manager.py]
R --> S{Capteur en W ?}
S -->|Oui| T[Créer sensor integration W→kWh]
S -->|Non| U[Utiliser source kWh directement]
T --> V[Créer utility_meter hourly/daily/...]
U --> V
V --> W[Écrire /config/packages/home_suivi_elec.yaml]

G --> X[Affichage résumé]
X --> Y[summary.js]
Y --> Z[Calcul consommation, delta, coûts]
Z --> AA[UI web]

AA -->|30s| Y


---

## 🔍 Explications

- **Sécurité** : Toutes les modifications sont sauvegardées dans `/data/` avant d’être appliquées.
- **Fiabilité** : Le `DataUpdateCoordinator` garantit des données cohérentes.
- **Extensibilité** : L’architecture modulaire permet d’ajouter facilement de nouvelles fonctionnalités (ex: templates automatiques).

