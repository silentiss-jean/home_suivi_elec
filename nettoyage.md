bash
cat << 'BASH' > /config/scripts/clean_hse_integration.sh
#!/bin/bash
# Script de nettoyage complet de l'intégration Home Suivi Élec
# Usage: bash /config/scripts/clean_hse_integration.sh

echo "🧹 NETTOYAGE INTÉGRATION HOME SUIVI ÉLEC"
echo "========================================"

# 1. Arrêter Home Assistant
echo "1. Arrêt de Home Assistant..."
ha core stop

# 2. Backup des fichiers
BACKUP_DIR="/config/backup_hse_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "2. Backup dans $BACKUP_DIR"
cp /config/.storage/core.entity_registry "$BACKUP_DIR/"
cp /config/.storage/core.restore_state "$BACKUP_DIR/"
cp /config/.storage/core.config_entries "$BACKUP_DIR/"

# 3. Nettoyer entity_registry
echo "3. Nettoyage entity_registry..."
python3 << 'PYTHON'
import json

with open('/config/.storage/core.entity_registry', 'r') as f:
    registry = json.load(f)

# Supprimer sensors HSE actifs et deleted
before = len(registry['data']['entities']) + len(registry['data'].get('deleted_entities', []))
registry['data']['entities'] = [e for e in registry['data']['entities'] if not e['entity_id'].startswith('sensor.hse')]
if 'deleted_entities' in registry['data']:
    registry['data']['deleted_entities'] = [e for e in registry['data']['deleted_entities'] if not e['entity_id'].startswith('sensor.hse')]

after = len(registry['data']['entities']) + len(registry['data'].get('deleted_entities', []))

with open('/config/.storage/core.entity_registry', 'w') as f:
    json.dump(registry, f, indent=2)

print(f"   Supprimés: {before - after} sensors HSE")
PYTHON

# 4. Nettoyer restore_state
echo "4. Nettoyage restore_state..."
python3 << 'PYTHON'
import json

with open('/config/.storage/core.restore_state', 'r') as f:
    restore = json.load(f)

before = len(restore.get('data', []))
restore['data'] = [s for s in restore.get('data', []) if not s.get('state', {}).get('entity_id', '').startswith('sensor.hse')]
after = len(restore['data'])

with open('/config/.storage/core.entity_registry', 'w') as f:
    json.dump(restore, f, indent=2)

print(f"   Supprimés: {before - after} states HSE")
PYTHON

# 5. Supprimer caches Python
echo "5. Suppression des caches Python..."
find /config/custom_components/home_suivi_elec -name "*.pyc" -delete 2>/dev/null || true
find /config/custom_components/home_suivi_elec -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find /config -name "*.pyc" -delete 2>/dev/null || true

# 6. Supprimer données intégration (optionnel)
read -p "Supprimer aussi les données de configuration ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "6. Suppression des données..."
    rm -rf /config/custom_components/home_suivi_elec/data/
    # Supprimer l'entrée dans config_entries si nécessaire
fi

echo ""
echo "✅ Nettoyage terminé !"
echo "   Backup: $BACKUP_DIR"
echo ""
echo "Redémarrez HA avec: ha core start"

BASH

chmod +x /config/scripts/clean_hse_integration.sh
Pour utiliser le script plus tard :

bash
bash /config/scripts/clean_hse_integration.sh
