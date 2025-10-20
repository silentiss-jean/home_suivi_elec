# ⚡ Home Suivi Élec

**Suivi et gestion intelligente des capteurs électriques pour Home Assistant.**

Permet de détecter automatiquement les capteurs de puissance, de les configurer via une interface web intégrée, de générer des Utility Meters fiables, et d'obtenir un suivi précis de la consommation électrique.

---

## 🎯 Fonctionnalités clés

- ✅ **Détection automatique** des capteurs de puissance (W) et d'énergie (kWh)
- ✅ **Interface web intégrée** dans Home Assistant (panneau latéral)
- ✅ **Conversion automatique W → kWh** via `integration` pour des Utility Meters cohérents
- ✅ **Génération YAML intelligente** : création de `utility_meter` horaires, quotidiens, hebdomadaires, mensuels, annuels
- ✅ **Gestion des doublons** et **capteur de référence** pour comparaison
- ✅ **Calculs de consommation, delta, coûts HT/TTC** selon tarif fixe ou HP/HC
- ✅ **Services de maintenance** : migration, nettoyage, calibration automatique
- ✅ **Documentation et configuration centralisées** dans `/data/`

---

## 📦 Nouveautés v2.0

### Migration et nettoyage automatique

- **Service `migrate_cleanup`** : Détecte et nettoie automatiquement les sensors d'intégration avec valeurs aberrantes
- **Service `reset_all_utility_meters`** : Calibre automatiquement les utility meters mensuels/annuels
- **Méthode d'intégration optimisée** : Passage de `trapezoidal` à `left` pour plus de stabilité
- **State class amélioré** : Utilisation de `total_increasing` pour compatibilité statistiques long terme

### Protection automatique

- **Automation mensuelle** : Vérification automatique le 1er de chaque mois
- **Détection d'anomalies** : Alertes si valeurs > seuil configurable
- **Calibration intelligente** : Utilise `last_valid_state` pour préserver l'historique

---

## 🚀 Installation

### Installation manuelle

1. Copier le dossier `home_suivi_elec` dans `/config/custom_components/` de Home Assistant
2. Redémarrer Home Assistant
3. Aller dans **Configuration → Intégrations → Ajouter une intégration**
4. Chercher **Home Suivi Élec** et l'ajouter
5. Suivre le flux de configuration pour définir vos options (abonnement, tarifs, etc.)

### Installation via HACS (à venir)

L'intégration sera bientôt disponible via HACS pour simplifier les mises à jour.

---

## 🛠 Configuration

### Configuration initiale

L'intégration se configure via l'interface graphique :

- Type de contrat (fixe ou heures creuses/pleines)
- Prix du kWh HT et TTC
- Abonnement mensuel
- Horaires heures creuses (si applicable)
- Capteur de référence externe (optionnel)

### Sélection des capteurs

1. Ouvrir l'interface web : `http://homeassistant.local:8123/local/community/home_suivi_elec_ui/index.html`
2. Sélectionner les capteurs à suivre dans l'onglet Configuration
3. Sauvegarder la configuration
4. Les utility meters sont créés automatiquement

---

## 📂 Structure des fichiers


custom_components/home_suivi_elec/
init.py # Point d'entrée, services
├── const.py # Constantes
├── config_flow.py # Configuration UI
├── options_flow.py # Options flow
├── manifest.json # Déclaration intégration
├── services.yaml # Définition services
│
├── utility_meter_manager.py # Gestion utility meters (v2.0)
├── migration_cleanup.py # Migration et nettoyage (v2.0)
├── manage_selection.py # Gestion sélection capteurs
├── manage_selection_views.py # API REST
├── detect_local.py # Détection capteurs
├── generator.py # Génération UI
├── debug_json_sets.py # Outils debug
│
├── data/ # Données persistantes
│ ├── capteurs_selection.json # Sélection utilisateur
│ ├── capteurs_power.json # Capteurs détectés
│ ├── user_config.json # Options utilisateur
│ └── reference_integrations.json # Intégrations référence
│
├── helpers/ # Utilitaires
│ ├── integration_quality_fetch.py
│ └── validation.py
│
├── web_static/ # Interface web
│ ├── index.html
│ ├── styles.css
│ └── js/
│ ├── app.js
│ ├── summary.js
│ ├── configuration.js
│ └── ...
│
└── docs/ # Documentation
├── GUIDE_MIGRATION_SENSORS.md # Guide migration
2.0 ├── AUTOMATION_UTILITY_METERS.md # Automation m
nsuelle ├── SERVICES.md # Li
te services ├── architecture.md # Archit
cture technique ├── api.md
---

## 🔧 Services disponibles

### home_suivi_elec.migrate_cleanup

Nettoie automatiquement les sensors d'intégration aberrants (v2.0).

service: home_suivi_elec.migrate_cleanup
data:
threshold_kwh: 1000

### home_suivi_elec.reset_all_utility_meters

Calibre tous les utility meters avec des valeurs anormales (v2.0).

service: home_suivi_elec.reset_all_utility_meters
data:
threshold_kwh: 100
### home_suivi_elec.reset_integration_sensor

Réinitialise un sensor d'intégration spécifique (v2.0).

service: home_suivi_elec.reset_integration_sensor
data:
entity_id: sensor.hse_energy_sensor_xxx
threshold_kwh: 1000

### home_suivi_elec.generate_selection

Synchronise les utility meters avec la sélection.

service: home_suivi_elec.generate_selection
---

## 🛠 Fonctionnement clé : Conversion W → kWh

Les **Utility Meters** de Home Assistant **nécessitent une source d'énergie cumulée** (Wh/kWh), **pas une puissance instantanée** (W).

**Problème** : Beaucoup de capteurs fournissent la puissance (W), ce qui conduit à des **surconsommations incohérentes** dans les Utility Meters.

**Solution v2.0** : `home_suivi_elec` détecte automatiquement les capteurs de puissance et génère un **helper d'intégration** optimisé :

Exemple généré automatiquement (v2.0)
sensor:

platform: integration
name: hse_energy_sensor_prise_micro_onde_puissance
source: sensor.prise_micro_onde_power
method: left # ✅ Optimisé (v2.0)
unit_prefix: k
unit_time: h
round: 3
unit_of_measurement: kWh
device_class: energy
state_class: total_increasing # ✅ Statistiques LTS (v2.0)

utility_meter:
hse_sensor_prise_micro_onde_hourly:
source: sensor.hse_energy_sensor_prise_micro_onde_puissance
cycle: hourly
hse_sensor_prise_micro_onde_daily:
source: sensor.hse_energy_sensor_prise_micro_onde_puissance
cycle: daily

... (weekly, monthly, yearly)

---

## 📚 Documentation complète

- **[Guide de migration v2.0](docs/GUIDE_MIGRATION_SENSORS.md)** - Migration v1 vers v2
- **[Automation mensuelle](docs/AUTOMATION_UTILITY_METERS.md)** - Vérification automatique
- **[Services](docs/SERVICES.md)** - Liste complète des services
- **[Architecture](docs/architecture.md)** - Structure technique
- **[API REST](docs/api.md)** - Endpoints disponibles
- **[Bonnes pratiques](docs/bonnes_pratiques.md)** - Conseils d'utilisation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Résolution de problèmes

---

## 🛑 Fragilités connues et solutions

### État `unknown` prolongé

**Problème** : Le `sensor` d'intégration reste à `unknown` jusqu'à réception de **2 valeurs numériques valides**.

**Solution v2.0** : Utilisation de `method: left` au lieu de `trapezoidal` pour réduire les cas d'états unknown.

### Valeurs aberrantes après redémarrage

**Problème** : Les utility meters peuvent conserver des valeurs incohérentes après un bug ou redémarrage.

**Solution v2.0** : 
- Service `reset_all_utility_meters` pour calibration automatique
- Automation mensuelle de vérification
- Détection proactive des anomalies

---

## 🚀 Axes d'évolution

### Prochaines fonctionnalités

1. **Génération automatique de templates** :
   - Détection des sources non numériques
   - Génération automatique de `template` sensors pour normalisation
   
2. **Monitoring de disponibilité** :
   - `binary_sensor` de disponibilité par capteur
   - Alertes sur indisponibilité prolongée

3. **Amélioration UX** :
   - Couleurs dynamiques (vert/rouge) selon état
   - Interface de gestion des doublons améliorée
   - Dashboard de diagnostic intégré

4. **Export et rapports** :
   - Export CSV/Excel des consommations
   - Rapports mensuels automatiques
   - Comparaisons période à période

---

## 🐛 Support et contribution

### Issues et bugs

Signaler les bugs sur : https://github.com/votre-repo/home_suivi_elec/issues

### Contribution

Les contributions sont bienvenues ! Consultez `CONTRIBUTING.md` pour les guidelines.

### Forum

Questions et discussions : https://community.home-assistant.io/

---

## 📜 Licence

MIT License - Voir `LICENSE` pour plus de détails.

---

## 👨‍💻 Auteur

**Jean (Silentiss)**

Projet open-source développé pour la communauté Home Assistant.

---

## 📅 Historique des versions

### v2.0 (2025-10-20)
- ✅ Passage à `method: left` pour stabilité
- ✅ Ajout `state_class: total_increasing`
- ✅ Services de migration et nettoyage
- ✅ Automation de vérification mensuelle
- ✅ Documentation complète migration

### v1.0 (2025-10-14)
- ✅ Version initiale
- ✅ Détection automatique capteurs
- ✅ Interface web intégrée
- ✅ Génération utility meters
- ✅ Calculs coûts HP/HC
