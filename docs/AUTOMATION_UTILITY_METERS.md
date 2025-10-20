# AUTOMATION DE VERIFICATION MENSUELLE DES UTILITY METERS
# Home Suivi Élec - Protection contre les valeurs aberrantes

## CONTEXTE

Les utility meters de Home Assistant se réinitialisent AUTOMATIQUEMENT à chaque cycle (mensuel/annuel).
Cependant, en cas de bug ou de redémarrage, ils peuvent conserver des valeurs aberrantes.

Cette automation de sécurité détecte et corrige automatiquement ces anomalies.

## PRINCIPE

1. À 00h00 : Les utility meters se reset automatiquement (comportement natif Home Assistant)
2. À 00h05 : L'automation vérifie si des valeurs sont anormalement élevées (> 50 kWh en 5 minutes = impossible)
3. Si détecté : Calibration automatique avec la dernière valeur valide

## CONFIGURATION

Ajoute dans configuration.yaml ou automations.yaml :

automation:
  - alias: "Verification mensuelle utility meters Home Suivi Elec"
    description: "Detecte et corrige automatiquement les valeurs aberrantes dans les utility meters le 1er de chaque mois"
    trigger:
      - platform: time
        at: "00:05:00"
    condition:
      - condition: template
        value_template: "{{ now().day == 1 }}"
    action:
      - service: home_suivi_elec.reset_all_utility_meters
        data:
          threshold_kwh: 50
      - service: notify.persistent_notification
        data:
          title: "Home Suivi Elec - Verification mensuelle"
          message: "Verification des utility meters effectuee. Consultez les logs pour plus de details."

## EXPLICATION DES PARAMETRES

trigger:
  - platform: time
    at: "00:05:00"
  -> Se declenche tous les jours a 00h05

condition:
  - condition: template
    value_template: "{{ now().day == 1 }}"
  -> Mais SEULEMENT si c'est le 1er du mois

action:
  - service: home_suivi_elec.reset_all_utility_meters
    data:
      threshold_kwh: 50
  -> Calibre les utility meters qui ont > 50 kWh
  -> En 5 minutes, c'est physiquement impossible d'atteindre 50 kWh
  -> (faudrait 600 kW de puissance continue !)

## CALENDRIER D EXECUTION

1er novembre 2025 00h05 : EXECUTE
2 novembre 2025 00h05 : IGNORE (jour != 1)
3 novembre 2025 00h05 : IGNORE
...
1er decembre 2025 00h05 : EXECUTE

## LOGS ATTENDUS

Cas 1 : Aucune anomalie detectee
[RESET_UM] Aucun utility meter aberrant detecte

Cas 2 : Anomalie detectee
[RESET_UM] 3 utility meters a calibrer
[RESET_UM] Calibration de sensor.hse_sensor_ballon_..._monthly : 1234.56 kWh -> 0.05 kWh
[RESET_UM] Calibration de sensor.hse_sensor_clim_..._monthly : 890.12 kWh -> 0.02 kWh
[RESET_UM] ✅ 3 utility meters calibres

## CONFIGURATION ALTERNATIVE : SANS AUTOMATION

Si tu ne veux pas d'automation automatique, tu peux lancer manuellement le service chaque mois :

Dans Outils de developpement -> Services :

service: home_suivi_elec.reset_all_utility_meters
data:
  threshold_kwh: 50

## DESACTIVATION

Pour desactiver l'automation :
1. Interface Home Assistant -> Parametres -> Automations et scenes
2. Cherche "Verification mensuelle utility meters"
3. Toggle sur OFF

Ou supprime le bloc automation de configuration.yaml

## PERSONNALISATION DU SEUIL

Ajuste threshold_kwh selon ta consommation :

Petite consommation (< 3000 kWh/an) :
  threshold_kwh: 30

Consommation moyenne (3000-6000 kWh/an) :
  threshold_kwh: 50

Grosse consommation (> 6000 kWh/an) :
  threshold_kwh: 100

Formule : threshold_kwh = (consommation_mensuelle_moyenne / 30 jours / 24h) * 0.1

Exemple pour 500 kWh/mois :
  500 / 30 / 24 = 0.69 kWh/h
  0.69 * 0.1 * 24h * 5min/60min = 1.4 kWh
  -> Utilise threshold_kwh: 30 pour une marge de securite

## FAQ

Q : Pourquoi 00h05 et pas 00h00 ?
R : Les utility meters se reset a 00h00. On attend 5 minutes pour laisser le temps au reset de se faire.

Q : Que se passe-t-il si je redemarre Home Assistant le 1er du mois a 00h03 ?
R : L'automation se declenchera quand meme a 00h05, car la condition (jour == 1) sera toujours vraie.

Q : Est-ce que ca va supprimer mon historique ?
R : Non. Le service calibre les utility meters avec last_valid_state, donc conserve la vraie valeur.

Q : Puis-je changer l'heure de declenchement ?
R : Oui, change "00:05:00" par l'heure voulue (ex: "02:00:00" pour 02h00).

Q : L'automation fonctionne-t-elle aussi pour les utility meters yearly ?
R : Oui, le service reset_all_utility_meters traite aussi les _yearly si leur valeur depasse le seuil.

## HISTORIQUE DES VERSIONS

v1.0 (2025-10-20) : Version initiale avec threshold intelligent
- Detection automatique des anomalies
- Calibration avec last_valid_state
- Notification persistante apres execution

## SUPPORT

En cas de probleme, consulte les logs :
ha core logs | grep -i "RESET_UM"

Pour tester l'automation manuellement :
service: automation.trigger
target:
  entity_id: automation.verification_mensuelle_utility_meters_home_suivi_elec

