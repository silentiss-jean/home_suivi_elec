#!/bin/bash

echo "🚀 Mise à jour documentation Home Suivi Élec v2.0..."

# Créer dossier docs
mkdir -p docs

echo "📝 Création README.md..."
cat > README.md << 'EOF'
# ⚡ Home Suivi Élec v2.0

Suivi et gestion intelligente capteurs électriques pour Home Assistant.

## Fonctionnalités

- Détection automatique capteurs puissance/énergie
- Interface web intégrée
- Conversion W→kWh optimisée
- Génération YAML intelligente
- Services maintenance v2.0

## Installation

1. Copier home_suivi_elec/ dans /config/custom_components/
2. Redémarrer Home Assistant
3. Configuration → Intégrations → Ajouter
4. Interface web : http://homeassistant.local:8123/local/community/home_suivi_elec_ui/

## Services v2.0

Nettoyage sensors :
  service: home_suivi_elec.migrate_cleanup
  data:
    threshold_kwh: 1000

Calibration utility meters :
  service: home_suivi_elec.reset_all_utility_meters
  data:
    threshold_kwh: 100

## Documentation

- docs/GUIDE_MIGRATION_SENSORS.md
- docs/AUTOMATION_UTILITY_METERS.md
- docs/SERVICES.md
- docs/architecture.md

Auteur: Jean (Silentiss) - Licence MIT
EOF

echo "📝 Création GUIDE_MIGRATION_SENSORS.md..."
cat > docs/GUIDE_MIGRATION_SENSORS.md << 'EOF'
# GUIDE MIGRATION v2.0

## SYMPTÔMES
- Factures > 10 000 euros
- Consommation mensuelle > 10 000 kWh

## SOLUTION

Étape 1 - Nettoyage sensors :
service: home_suivi_elec.migrate_cleanup
data:
  threshold_kwh: 1000

Étape 2 - Calibration utility meters :
service: home_suivi_elec.reset_all_utility_meters
data:
  threshold_kwh: 100

Étape 3 - Vérifier :
Recharger interface web, valeurs attendues :
- Jour : 10-50 kWh
- Mois : proportionnel jours

## LOGS
ha core logs | grep -i migration
ha core logs | grep -i RESET_UM

Version: 2.0
Date: 2025-10-20
EOF

echo "📝 Création AUTOMATION_UTILITY_METERS.md..."
cat > docs/AUTOMATION_UTILITY_METERS.md << 'EOF'
# AUTOMATION VERIFICATION MENSUELLE

Ajouter dans configuration.yaml ou automations.yaml :

automation:
  - alias: "Verification mensuelle utility meters"
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

Se lance le 1er de chaque mois à 00h05
Détecte et corrige valeurs > 50 kWh
EOF

echo "📝 Création SERVICES.md..."
cat > docs/SERVICES.md << 'EOF'
# SERVICES HOME SUIVI ELEC

## migrate_cleanup
Nettoie sensors intégration aberrants

service: home_suivi_elec.migrate_cleanup
data:
  threshold_kwh: 1000

## reset_all_utility_meters
Calibre utility meters aberrants

service: home_suivi_elec.reset_all_utility_meters
data:
  threshold_kwh: 100

## reset_integration_sensor
Reset sensor spécifique

service: home_suivi_elec.reset_integration_sensor
data:
  entity_id: sensor.hse_energy_sensor_xxx
  threshold_kwh: 1000
EOF

echo "✅ Documentation mise à jour avec succès !"
echo ""
echo "Fichiers créés :"
echo "  - README.md"
echo "  - docs/GUIDE_MIGRATION_SENSORS.md"
echo "  - docs/AUTOMATION_UTILITY_METERS.md"
echo "  - docs/SERVICES.md"
