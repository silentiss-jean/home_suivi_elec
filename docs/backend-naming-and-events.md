# Backend Naming & Event-Driven (Phase 2)

Ce document formalise les conventions et l’ordre d’exécution garantissant la cohérence du backend HSE (Home Suivi Élec) après refactoring Phase 2.

## 1) Conventions de nommage (source de vérité)

Deux familles de sensors HSE energy sont créées par `energy_tracking.py`:

- Sources today_energy (ex: `sensor.xxx_today_energy`)
  - `sensor.hse_{base_name}_{cycle}`
  - Exemple: `sensor.hse_chambre_tv_prise_connectee_today_energy_hourly`

- Autres sources energy (non today_energy)
  - `sensor.hse_energy_{base_name}_{cycle}`

Cycles supportés (complets): `hourly`, `daily`, `weekly`, `monthly`, `yearly`

Notes:
- Plus de shortening/abréviation des noms: on conserve le `base_name` complet
- Le cycle est en clair (pas de `_h/_d/...`)

## 2) Event-Driven: ordre de chargement garanti

Pour éviter de perdre des events lors du setup:

- Charger la plateforme sensor AVANT de lancer les tasks asynchrones qui émettent des events.

Dans `__init__.py`:

```python
await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])  # Listeners actifs
asyncio.create_task(setup_sensors_after_detection())                      # Puis émission des events
```

Les events émis par `energy_tracking.py`:
- `hse_energy_sensors_ready` (liste de SensorEntity) → consommé par `sensor.py`

## 3) API Unifiée: santé et données

- Fichier: `custom_components/home_suivi_elec/api/unified_api.py`
- Fonction de comptage (source de vérité):

```python
def _get_hse_energy_sensors(self):
    all_states = self.hass.states.async_all("sensor")
    cycles = ("_hourly", "_daily", "_weekly", "_monthly", "_yearly")
    return [s for s in all_states if s.entity_id.startswith("sensor.hse_") and s.entity_id.endswith(cycles)]
```

Ainsi, le health check inclut `sensor.hse_*_{cycle}` et `sensor.hse_energy_*_{cycle}`.

## 4) API de consommation (GetConsumptions)

- Fichier: `manage_selection_views.py`
- Construction d’IDs HSE energy alignée:

```python
def _build_hse_energy_sensor_id(source_entity_id: str, cycle: str) -> str:
    base_name = source_entity_id.replace("sensor.", "")
    if "today_energy" in source_entity_id:
        return f"sensor.hse_{base_name}_{cycle}"
    else:
        return f"sensor.hse_energy_{base_name}_{cycle}"
```

## 5) Validation rapide (bash)

```bash
# Diagnostics (attendu: status operational, hse>0)
curl -s http://HA_HOST:8123/api/home_suivi_elec/diagnostics | jq '{status: .data.system_status, hse: .data.health_check.hse_energy_sensors}'

# Données (attendu: count>0)
curl -s http://HA_HOST:8123/api/home_suivi_elec/data | jq '.data.count'

# Échantillon sensors HSE
auth=''
curl -s http://HA_HOST:8123/api/home_suivi_elec/lovelace_sensors | jq -r '.[0:5][] | .entity_id + " = " + (.state // "unknown")'
```

## 6) Check-list refactoring

- [ ] Platforme sensor chargée avant tasks (voir §2)
- [ ] `_build_hse_energy_sensor_id` aligné (voir §4)
- [ ] `_get_hse_energy_sensors` inclut tous les patterns HSE (voir §3)
- [ ] Plus aucun raccourcissement de noms
- [ ] Tests diagnostics/data passent (voir §5)

---
Dernière mise à jour: Phase 2 — alignement noms complets et cycles explicites.
