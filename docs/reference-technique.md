# 🔗 Référence technique — Home Suivi Élec

## 📑 Endpoints REST API exposés

- **GET `/api/home_suivi_elec/get_sensors`**
  - Retour : liste groupée des capteurs détectés (`integration`, `entity_id`, `friendly_name`, `area`, `unit`, `value`)
- **POST `/api/home_suivi_elec/save_selection`**
  - Sauvegarde la sélection utilisateur (`capteurs_selection.json`)
- **GET `/api/home_suivi_elec/get_selection`**
  - Retourne la sélection courante des capteurs
- **GET `/api/home_suivi_elec/get_user_config`**
  - Config utilisateur globale (abonnement, tarifs, capteur externe…)
- **POST `/api/home_suivi_elec/save_user_config`**
  - Sauvegarde la config utilisateur (abonnement, capteur externe…)
- **GET `/api/home_suivi_elec/get_user_options`**
  - Options courantes/configurations utilisateur (fusion data/options ConfigEntry)
- **POST `/api/home_suivi_elec/save_user_options`**
  - Sauvegarde des options utilisateur
- **GET `/api/home_suivi_elec/get_summary`**
  - Résumé rapide : nombre total de capteurs, actifs, etc.
- **GET `/api/home_suivi_elec/get_consumptions`**
  - Donne les cumuls/kWh par capteur/sélectionné pour chaque cycle (hourly, daily, …)
- **GET `/api/home_suivi_elec/get_instant_puissance`**
  - Puissance instantanée par capteur/entity_id

---

## 🗃️ Structure JSON / Data

- **capteurs_power.json** :

[
{
"entity_id": "sensor.tapo_prise_chambre_power",
"friendly_name": "Prise Chambre",
"integration": "Tapo",
"area": "Chambre",
"unit": "W",
"value": 16.5
},
...
]
- **capteurs_selection.json** :

{
"Tapo": [
{ "entity_id": "sensor.tapo_prise_chambre_power", "enabled": true },
...
]
}

---

## 🛠️ Debug, logs et messages

- Les logs Home Assistant sont dans : `/config/home-assistant.log`
- Principaux messages : `[SETUP_ENTRY]`, `[REST]`, `[DEBUG SEL]`
- En cas d’erreur : vérifier JSON, API ou état du backend (`capteurs_power.json`, sélection, options)

---

## 🧩 Utilisation et intégration développeur

- **Packages Utility Meter** :
- Généré automatiquement dans `/config/packages/home_suivi_elec_utility_meter.yaml` via le service REST
- Pour contribuer : réfléchir à la modularisation des endpoints et au typage des data

---

## 🔗 Liens utiles

- Code principal : `custom_components/home_suivi_elec/`
- UI frontend : `custom_components/home_suivi_elec/web_static/`
- Données backend : `custom_components/home_suivi_elec/data/`

