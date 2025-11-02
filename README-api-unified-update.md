# API Unifiée - Mise à jour pour connexion backend

## 🔗 État Actuel

### ✅ Complété

1. **API Unifiée connectée aux données réelles** 
   - `/api/home_suivi_elec/sensors` → charge capteurs_power.json + états HA
   - `/api/home_suivi_elec/data` → récupère données HSE energy sensors
   - `/api/home_suivi_elec/diagnostics` → analyse état système complet
   - `/api/home_suivi_elec/config` → configuration hass.data
   - `/api/home_suivi_elec/ui` → informations interface

2. **API Configuration avec méthodes POST**
   - `POST /api/home_suivi_elec/config/save_selection` → sauvegarde capteurs_selection.json
   - `POST /api/home_suivi_elec/config/update_options` → met à jour options intégration
   - `POST /api/home_suivi_elec/config/toggle_sensor` → active/désactive capteur
   - `POST /api/home_suivi_elec/config/reset_config` → réinitialise configuration

### 🔄 Action Requise

**Ajouter l'enregistrement de l'API Configuration dans `__init__.py`:**

```python
# ✅ API CONFIGURATION ÉTENDUE (méthodes POST)
try:
    from .api.unified_api_extensions import HomeElecUnifiedConfigAPIView
    hass.http.register_view(HomeElecUnifiedConfigAPIView(hass))
    _LOGGER.info("✅ [API] API Configuration enregistrée: /api/home_suivi_elec/config/{action}")
except Exception as e:
    _LOGGER.error("❌ [API] Erreur API Configuration: %s", e)
```

**À ajouter après la ligne 187 dans `__init__.py` (après l'enregistrement de l'API Unifiée)**

## 🧪 Tests à Exécuter

### 1. Tests API GET (données réelles)

```bash
# Test sensors avec données réelles
curl -s http://192.168.3.160:8123/api/home_suivi_elec/sensors | jq '.data.sensors[0]'

# Test data avec capteurs HSE energy
curl -s http://192.168.3.160:8123/api/home_suivi_elec/data | jq '.data.consumptions[0]'

# Test diagnostics état système
curl -s http://192.168.3.160:8123/api/home_suivi_elec/diagnostics | jq '.data.health_check'

# Test config actuelle
curl -s http://192.168.3.160:8123/api/home_suivi_elec/config | jq '.data'
```

### 2. Tests API POST (configuration)

```bash
# Test toggle sensor
curl -X POST http://192.168.3.160:8123/api/home_suivi_elec/config/toggle_sensor \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "sensor.tapo_p110_01_current_power", "enabled": true}' | jq .

# Test update options
curl -X POST http://192.168.3.160:8123/api/home_suivi_elec/config/update_options \
  -H "Content-Type: application/json" \
  -d '{"options": {"auto_generate": true, "tariff_type": "base"}}' | jq .
```

## 📊 Améliorations Futures

1. **Authentification** : Passer `requires_auth = True` en production
2. **Validation** : Ajouter schémas JSON pour validation stricte
3. **Cache** : Implémenter cache pour réduire accès fichiers
4. **WebSocket** : Notifications temps réel pour changements config
5. **Métriques** : Ajouter compteurs d'usage API pour monitoring

## 🛠️ Architecture

```
API Unifiée
├── unified_api.py          # GET endpoints (données)
└── unified_api_extensions.py # POST endpoints (config)

Backend Data Sources
├── capteurs_power.json      # Capteurs détectés
├── capteurs_selection.json   # Sélection utilisateur  
├── hass.states              # États Home Assistant
└── hass.data[DOMAIN]        # Configuration intégration
```