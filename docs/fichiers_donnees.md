# 📁 Fichiers de données de Home Suivi Élec

Les données de configuration et de sélection sont stockées en JSON dans `custom_components/home_suivi_elec/data/` pour une persistance fiable et un debug facile.

---

## 🗂 Structure du répertoire `data/`


data/
├── capteurs_selection.json # Sélection des capteurs par intégration
├── capteurs_power.json # Liste des capteurs de puissance détectés
├── user_config.json # Options utilisateur (tarifs, abonnement, capteur externe)
└── reference_integrations.json # Intégrations de référence (ex: Atome)


---

## 📄 `capteurs_selection.json`

Contient la sélection des capteurs activés par l’utilisateur, organisés par intégration.

{
"shelly": [
{ "entity_id": "sensor.shelly_plug_s_XXXXX_power", "enabled": true },
{ "entity_id": "sensor.shelly_plug_s_YYYYY_power", "enabled": false }
],
"tplink": [
{ "entity_id": "sensor.plug_micro_onde_power", "enabled": true }
]
}
- **Rôle** : Source pour la génération des `utility_meter`.
- **Mise à jour** : Lors de chaque sauvegarde dans l’interface.
- **Utilisation** : `utility_meter_manager.py` lit ce fichier pour générer le YAML.

---

## 📄 `capteurs_power.json`

Liste tous les capteurs de puissance détectés par `detect_local.py`.

[
{
"entity_id": "sensor.shelly_plug_s_XXXXX_power",
"friendly_name": "Prise bureau",
"unit": "W",
"value": 42.5,
"area": "Bureau",
"integration": "shelly"
},
{
"entity_id": "sensor.plug_micro_onde_power",
"friendly_name": "Prise micro-ondes",
"unit": "W",
"value": 0,
"area": "Cuisine",
"integration": "tplink"
}
]
- **Rôle** : Source pour l’interface web (détection, sélection).
- **Mise à jour** : À chaque rafraîchissement ou démarrage.
- **Utilisation** : `configuration.js` et `summary.js` pour afficher les données.

---

## 📄 `user_config.json`

Stocke les options utilisateur configurées dans `options_flow.py` et l’interface.

{
"abonnementHT": 15.2,
"abonnementTTC": 18.24,
"typeContrat": "hp-hc",
"tarifHP": 0.22,
"tarifHC": 0.15,
"heuresHPDebut": "08:00",
"heuresHPFin": "22:00",
"useExternal": true,
"externalCapteur": "sensor.atome_power",
"consommationExterne": 0
}
- **Rôle** : Configuration des calculs de coût et du capteur de référence.
- **Mise à jour** : Lors de la sauvegarde dans l’onglet **Configuration**.
- **Utilisation** : `summary.js` pour calculer les coûts et le delta.

---

## 📄 `reference_integrations.json`

Liste les intégrations reconnues comme sources de référence (ex: Atome, EDF).

[
"atome",
"edf",
"enedis"
]



- **Rôle** : Aider l’interface à identifier les capteurs de référence.
- **Mise à jour** : Manuellement ou via script.
- **Utilisation** : `referencePanel.js` pour suggérer des capteurs.

---

## 🔐 Bonnes pratiques

- **Ne pas modifier manuellement** ces fichiers en production.
- **Sauvegarder le répertoire `data/`** dans vos backups.
- **Utiliser l’interface** pour toute modification.

