# 🧱 Architecture technique — Home Suivi Élec

## 🌐 Vue globale

Architecture en trois couches :
- **Backend Python (`custom_components/home_suivi_elec/`)** :
  - Détection capteurs, services, génération JSON/YAML, API REST
- **Data (`custom_components/home_suivi_elec/data/`)** :
  - Données persistées (détection, sélection, config utilisateur)
- **Frontend (`custom_components/home_suivi_elec/web_static/`)** :
  - UI web multi-onglets, JS, appels REST

---

## 🏗️ Schéma fonctionnel minimal


[ Capteurs HA ]
|
v
detect_local.py
|
v
[ data/capteurs_power.json ]
|
v
manage_selection.py (API REST)
|
v
[ data/capteurs_selection.json ]
|
v
UI Web (web_static/)
|
v
Summary/Configuration/Detection (JS)

---

## 🧬 Modules backend clés

- **__init__.py** : setup, services, API, copie UI
- **detect_local.py** : scan capteurs, création JSON
- **manage_selection.py** : endpoints REST, gestion sélection
- **generator.py** : génération Lovelace YAML (partiellement implémenté)
- **utility_meter_manager.py** : gestion/vérification Utility Meter YAML/HA

---

## 🔄 Flux principal

1. Détection → Création/rafraîchissement `capteurs_power.json`
2. Sélection → Mise à jour `capteurs_selection.json` via l’UI
3. Exposition → Endpoints REST consommés par le frontend
4. Résumé/configuration/alertes UI → Affichage dynamique en JS

---

## ⚠️ Points d’évolution

- Module génération Lovelace/Panel static : à compléter/finir
- Modularisation/contribution des endpoints & helpers à prévoir

---

