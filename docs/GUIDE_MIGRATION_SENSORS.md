# GUIDE D'UTILISATION - Nettoyage des sensors aberrants
# Home Suivi Élec - Migration v2.0

## INSTALLATION

1. Remplace les 3 fichiers dans ton intégration :
   - __init__.py
   - utility_meter_manager.py
   - migration_cleanup.py (nouveau)

2. Redémarre Home Assistant :
   ha core restart

## UTILISATION

### 1. Nettoyage automatique (RECOMMANDÉ)

Nettoie TOUS les sensors aberrants en une seule fois.

Via l'interface Home Assistant :
Outils de développement → Services → home_suivi_elec.migrate_cleanup

Exemple YAML :
service: home_suivi_elec.migrate_cleanup
data:
  threshold_kwh: 1000

Via CLI :
ha-core services home_suivi_elec.migrate_cleanup --data '{"threshold_kwh": 1000}'

### 2. Nettoyage ciblé (UN sensor)

Pour nettoyer un sensor spécifique.

Via l'interface :
service: home_suivi_elec.reset_integration_sensor
data:
  entity_id: sensor.hse_energy_sensor_ballon_buanderie_commutateur_avec_mesure_3_puissance
  threshold_kwh: 1000

Via CLI :
ha-core services home_suivi_elec.reset_integration_sensor --data '{"entity_id": "sensor.hse_energy_sensor_ballon_buanderie_commutateur_avec_mesure_3_puissance", "threshold_kwh": 1000}'

### 3. Automatisation mensuelle (optionnel)

Ajoute dans configuration.yaml ou automations.yaml :

automation:
  - alias: "Nettoyage mensuel sensors d'intégration"
    trigger:
      - platform: time
        at: "00:00:01"
    condition:
      - condition: template
        value_template: "{{ now().day == 1 }}"
    action:
      - service: home_suivi_elec.migrate_cleanup
        data:
          threshold_kwh: 10000

## VÉRIFICATION

Avant nettoyage :
sensor.hse_energy_sensor_ballon_...: 13996.341 kWh (ABERRANT)

Après nettoyage :
sensor.hse_energy_sensor_ballon_...: 0.006 kWh (NORMAL)

## PARAMÈTRES

entity_id (string) : ID du sensor à nettoyer (reset ciblé)
threshold_kwh (float, défaut: 1000.0) : Seuil kWh au-delà duquel = aberrant

## SCÉNARIO COMPLET DE MIGRATION

Étape 1 : Mise à jour du code
cp utility_meter_manager.py /config/custom_components/home_suivi_elec/
cp __init__.py /config/custom_components/home_suivi_elec/
cp migration_cleanup.py /config/custom_components/home_suivi_elec/

Étape 2 : Redémarrer
ha core restart

Étape 3 : Nettoyer
Dans Outils de développement → Services :
service: home_suivi_elec.migrate_cleanup
data:
  threshold_kwh: 1000

Étape 4 : Vérifier les logs
ha core logs | grep -i migration

Logs attendus :
[Migration] Nettoyage de sensor.hse_energy_sensor_ballon_... (valeur aberrante: 13996.34 kWh > 1000.00 kWh)
[Migration] 15 enregistrements supprimés
[Migration] Nettoyage terminé: 12 sensors traités
[RESET] Sensors réinitialisés avec succès

Étape 5 : Vérifier l'UI
Recharge l'onglet Accueil. Tu devrais voir :
Heure : 0.63 kWh
Jour : 16.97 kWh
Mois : 16.97 kWh (au lieu de 221 692 kWh)

## DÉPANNAGE

Problème : "Aucun sensor nettoyé"
Solution : Diminue le seuil (threshold_kwh: 100)

Problème : Valeurs remontent trop vite
Solution : Vérifie le capteur source dans Outils → États

Problème : Statistics non supprimées
Solution : Vérifie les logs (ha core logs | grep -i cleanup)

## NOTES IMPORTANTES

- Les sensors d'intégration accumulent indéfiniment (c'est normal)
- Les utility meters calculent les deltas (pas besoin de reset)
- Le nettoyage ne perd que les valeurs aberrantes
- Après nettoyage, attends 1h pour voir les premières valeurs

## COMMANDES UTILES

Vérifier un sensor :
ha-cli state get sensor.hse_energy_sensor_ballon_buanderie_commutateur_avec_mesure_3_puissance

Vérifier tous les sensors hse_energy :
ha-cli state list | grep hse_energy

Logs en temps réel :
ha core logs --follow | grep -i "migration\|cleanup\|reset"

## SUPPORT

En cas de problème :
1. Vérifie les logs (ha core logs)
2. Vérifie que migration_cleanup.py est bien installé
3. Vérifie que le service est enregistré (Outils → Services)
4. Redémarre si nécessaire (ha core restart)

Version: 2.0
Date: 2025-10-20
Auteur: Home Suivi Élec Team

