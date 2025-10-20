# 🛠 Bonnes pratiques pour Home Suivi Élec

Conseils pour configurer, utiliser et maintenir l’intégration de manière fiable et efficace.

---

## 🧰 Configuration initiale

- **Utilisez l’interface web** pour la configuration.
- **Définissez toujours un capteur de référence** (ex: Atome) pour valider vos mesures.
- **Sélectionnez uniquement les capteurs pertinents** (pas de doublons).

---

## 🔌 Sources de puissance (W)

- **Évitez les capteurs qui publient des chaînes** (ex: `"0 W"`) : ils bloquent l’intégrateur.
- **Normalisez-les avec un `template` sensor** :

template:
- sensor:
- name: "power_cleaned"
unit_of_measurement: "W"
device_class: power
state: >-
{{ states('sensor.brick_non_numerique') | regex_replace(find='[^0-9\.-]', replace='') | float(0) }}
- Utilisez ce `template` comme source dans `home_suivi_elec`.

---

## 🔄 Génération du YAML

- **Regénérez le YAML** après chaque changement de sélection.
- **Vérifiez `/config/packages/home_suivi_elec.yaml`** après régénération.
- **Redémarrez Home Assistant** si nécessaire (pour les nouveaux capteurs).

---

## 📊 Surveillance

- **Surveillez l’état** des capteurs dans l’interface.
- **Vérifiez le delta** : il ne devrait pas être trop élevé (ex: > 200W).
- **Utilisez les logs** pour détecter les erreurs.

---

## 🔒 Sauvegardes

- **Sauvegardez le répertoire `data/`** dans vos backups.
- **Archivez les versions du `home_suivi_elec.yaml`**.

---

## 🚀 Évolutions recommandées

1. **Génération automatique de templates** :
 - Détecter les sources non numériques.
 - Générer un `template` sensor automatiquement.
 - L’utiliser comme source pour l’intégrateur.

2. **Monitoring de disponibilité** :
 - Créer un `binary_sensor` par capteur généré.
 - Alerte si indisponible.

3. **Amélioration UX** :
 - Couleurs dynamiques (vert/rouge) selon l’état du capteur.
 - Résumé des erreurs dans l’interface.

