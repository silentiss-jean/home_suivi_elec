# 🌐 API REST de Home Suivi Élec

L’intégration expose plusieurs endpoints REST pour communiquer entre le backend (Python) et le frontend (JavaScript).

---

## 🔐 Authentification

Tous les endpoints nécessitent une **authentification Home Assistant** (via `hass` ou `access_token`).

---

## 🔗 Liste des endpoints

### `GET /api/home_suivi_elec/get_sensors`

**Rôle** : Récupère la liste des capteurs de puissance détectés.

**Réponse** :

[
{
"entity_id": "sensor.prise_micro_onde_power",
"friendly_name": "Prise micro-ondes",
"unit": "W",
"value": 0,
"area": "Cuisine",
"integration": "tplink"
},
...
]
**Utilisé par** : `detection.js`, `configuration.js`, `summary.js`.

---

### `GET /api/home_suivi_elec/get_user_options`

**Rôle** : Récupère les options utilisateur (tarifs, abonnement, capteur externe).

**Réponse** :
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
"consommationExterne": 0,
"selection": { ... }
}
**Utilisé par** : `summary.js`, `configuration.js`.

---

### `POST /api/home_suivi_elec/save_user_options`

**Rôle** : Sauvegarde les options utilisateur.

**Corps** : Même structure que la réponse de `get_user_options`.

**Utilisé par** : `configuration.js` (onglet **Configuration**).

---

### `POST /api/home_suivi_elec/save_selection`

**Rôle** : Sauvegarde la sélection des capteurs.

**Corps** :
{
"shelly": [
{ "entity_id": "sensor.shelly_XXXXX_power", "enabled": true }
],
"tplink": [
{ "entity_id": "sensor.plug_micro_onde_power", "enabled": false }
]
}

**Utilisé par** : `configuration.js`.

---

### `POST /api/home_suivi_elec/regenerate_yaml`

**Rôle** : Déclenche la régénération du fichier `home_suivi_elec.yaml`.

**Corps** : Vide.

**Utilisé par** : Bouton "Régénérer YAML" dans l’interface, ou via service.

---

## 🔄 Flux d’appel typique

Lors de l’ouverture de l’interface :
1. `app.js` initialise.
2. `configuration.js` appelle `get_sensors` et `get_user_options`.
3. Affichage des capteurs et pré-remplissage des formulaires.
4. L’utilisateur modifie et sauvegarde.
5. `save_user_options` et `save_selection` sont appelés.
6. `regenerate_yaml` peut être déclenché manuellement.

---

## 🔧 Dépannage

- **Erreur 401** : Token invalide ou manquant.
- **Erreur 404** : Intégration non installée ou endpoints non enregistrés.
- **Vérifier les logs** de Home Assistant pour les détails.

