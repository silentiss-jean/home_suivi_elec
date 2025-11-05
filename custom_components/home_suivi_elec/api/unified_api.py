"""API REST Unifiée Home Suivi Élec - Connectée aux données réelles"""
import logging
import json
import os
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

class HomeElecUnifiedAPIView(HomeAssistantView):
    """API REST unifiée - Données réelles backend"""
    
    url = "/api/home_suivi_elec/{resource}"
    name = "api:home_suivi_elec:unified"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass
        _LOGGER.info("🏗️ API Unifiée - Connectée aux données backend")
        
    async def get(self, request, resource=None):
        """GET unifié - données réelles depuis backend"""
        try:
            # Récupérer resource depuis paramètre OU match_info
            if resource is None:
                resource = request.match_info.get("resource", "unknown")
            
            _LOGGER.info(f"🧪 API Unifiée GET: /{resource}")
            
            # Router selon resource avec données réelles
            if resource == "sensors":
                return await self._handle_sensors()
            elif resource == "data":
                return await self._handle_data()
            elif resource == "diagnostics":
                return await self._handle_diagnostics()
            elif resource == "config":
                return await self._handle_config()
            elif resource == "ui":
                return await self._handle_ui()
            elif resource == "get_sensors_health":
                return await self.handle_sensors_health()
            elif resource == "get_integrations_status":
                return await self._handle_integrations_status()
            else:
                return self._success({
                    "message": f"API Unifiée opérationnelle - resource: {resource}",
                    "available_endpoints": ["sensors", "data", "diagnostics", "config", "ui"],
                    "version": "unified-v1.0.42-final",
                    "status": "connected_to_backend"
                })
                
        except Exception as e:
            _LOGGER.exception(f"Erreur API GET: {e}")
            return self._error(500, str(e))
    
    async def _handle_sensors(self):
        """Endpoint /sensors - Liste des capteurs détectés avec fusion sélection"""
        try:
            # ✅ 1. Charger capteurs détectés (capteurs_power.json)
            sensors_data = await self._load_sensors_data()
            
            # ✅ 2. Charger sélection utilisateur (capteurs_selection.json) 
            selection_data = await self._load_selection_data()
            
            # ✅ 3. Créer index de sélection pour fusion rapide
            selection_index = {}
            for category, items in selection_data.items():
                if isinstance(items, list):
                    for item in items:
                        entity_id = item.get("entity_id")
                        if entity_id:
                            selection_index[entity_id] = item.get("enabled", False)
            
            _LOGGER.info(f"🔀 Fusion: {len(sensors_data)} capteurs détectés + {len(selection_index)} sélections")
            
            # ✅ 4. Enrichir capteurs avec état HA + sélection
            enriched_sensors = []
            for sensor in sensors_data:
                entity_id = sensor.get("entity_id")
                if entity_id:
                    state_obj = self.hass.states.get(entity_id)
                    sensor_info = sensor.copy()
                    
                    # Fusion avec sélection utilisateur
                    sensor_info["enabled"] = selection_index.get(entity_id, False)
                    
                    # Fusion avec état Home Assistant
                    sensor_info.update({
                        "current_state": state_obj.state if state_obj else "unavailable",
                        "last_changed": state_obj.last_changed.isoformat() if state_obj else None,
                        "attributes": dict(state_obj.attributes) if state_obj else {}
                    })
                    enriched_sensors.append(sensor_info)
            
            # ✅ 5. Statistiques
            enabled_count = len([s for s in enriched_sensors if s.get("enabled", False)])
            _LOGGER.info(f"📊 Fusion résultat: {enabled_count}/{len(enriched_sensors)} capteurs activés")
            
            return self._success({
                "sensors": enriched_sensors,
                "count": len(enriched_sensors),
                "enabled_count": enabled_count,
                "type": "sensors",
                "source": "capteurs_power.json + capteurs_selection.json + live_states"
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur _handle_sensors: {e}")
            return self._error(500, f"Erreur chargement capteurs: {e}")
    
    async def _handle_data(self):
        """Endpoint /data - Données de consommation"""
        try:
            # Charger sélection utilisateur
            selection_data = await self._load_selection_data()
            
            # Récupérer données des capteurs HSE energy
            energy_sensors = self._get_hse_energy_sensors()
            
            consumptions = []
            for sensor_state in energy_sensors:
                entity_id = sensor_state.entity_id
                state = sensor_state.state
                attributes = dict(sensor_state.attributes)
                
                try:
                    value = float(state) if state not in ('unknown', 'unavailable') else 0.0
                except (ValueError, TypeError):
                    value = 0.0
                
                consumptions.append({
                    "entity_id": entity_id,
                    "friendly_name": attributes.get("friendly_name", entity_id),
                    "value": value,
                    "unit": attributes.get("unit_of_measurement", "kWh"),
                    "cycle": self._extract_cycle_from_entity(entity_id),
                    "last_reset": attributes.get("last_reset"),
                    "source_sensor": attributes.get("source_sensor")
                })
            
            return self._success({
                "consumptions": consumptions,
                "count": len(consumptions),
                "type": "data",
                "timestamp": self._get_timestamp()
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur _handle_data: {e}")
            return self._error(500, f"Erreur chargement données: {e}")
    
    async def _handle_diagnostics(self):
        """Endpoint /diagnostics - État système"""
        try:
            # Statistiques générales
            all_sensors = await self._load_sensors_data()
            hse_sensors = self._get_hse_energy_sensors()
            
            # Analyser état des capteurs
            health_check = {
                "total_detected": len(all_sensors),
                "hse_energy_sensors": len(hse_sensors),
                "unavailable_sensors": len([
                    s for s in hse_sensors 
                    if s.state in ('unavailable', 'unknown')
                ]),
                "last_detection": self._get_last_detection_time(),
                "api_endpoints_active": 6
            }
            
            # État global
            system_status = "operational"
            if health_check["unavailable_sensors"] > health_check["hse_energy_sensors"] * 0.3:
                system_status = "degraded"
            if health_check["hse_energy_sensors"] == 0:
                system_status = "critical"
            
            return self._success({
                "system_status": system_status,
                "api_version": "unified-v1.0.42-final",
                "health_check": health_check,
                "backend_connected": True,
                "data_sources": {
                    "capteurs_power": os.path.exists(self._get_sensors_file_path()),
                    "capteurs_selection": os.path.exists(self._get_selection_file_path()),
                    "hass_states": len(self.hass.states.async_all()) > 0
                }
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur _handle_diagnostics: {e}")
            return self._error(500, f"Erreur diagnostics: {e}")
    
    async def _handle_config(self):
        """Endpoint /config - Configuration actuelle"""
        try:
            from ..const import DOMAIN
            
            config_data = self.hass.data.get(DOMAIN, {}).get("config", {})
            options_data = self.hass.data.get(DOMAIN, {}).get("options", {})
            
            return self._success({
                "config": config_data,
                "options": options_data,
                "type": "config",
                "domain": DOMAIN
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur _handle_config: {e}")
            return self._error(500, f"Erreur configuration: {e}")
    
    async def _handle_ui(self):
        """Endpoint /ui - Informations interface"""
        try:
            ui_info = {
                "panel_registered": True,
                "panel_url": "/local/community/home_suivi_elec_ui/index.html",
                "sidebar_title": "⚡ Suivi Élec",
                "api_base_url": "/api/home_suivi_elec",
                "available_views": [
                    "sensors", "data", "diagnostics", "config"
                ]
            }
            
            return self._success({
                "ui_info": ui_info,
                "type": "ui"
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur _handle_ui: {e}")
            return self._error(500, f"Erreur UI: {e}")
    
    # === MÉTHODES UTILITAIRES ===
    
    async def _load_sensors_data(self):
        """Charge capteurs_power.json de manière asynchrone"""
        import asyncio
        
        def _load_file():
            file_path = self._get_sensors_file_path()
            if not os.path.exists(file_path):
                return []
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                _LOGGER.error(f"Erreur lecture {file_path}: {e}")
                return []
        
        return await asyncio.get_event_loop().run_in_executor(None, _load_file)
    
    async def _load_selection_data(self):
        """Charge capteurs_selection.json de manière asynchrone"""
        import asyncio
        
        def _load_file():
            file_path = self._get_selection_file_path()
            if not os.path.exists(file_path):
                return {}
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                _LOGGER.error(f"Erreur lecture {file_path}: {e}")
                return {}
        
        return await asyncio.get_event_loop().run_in_executor(None, _load_file)
    
    def _get_hse_energy_sensors(self):
        """Récupère tous les capteurs HSE energy depuis les états HA (aligné Phase 2)"""
        all_states = self.hass.states.async_all("sensor")
        # Inclure sensor.hse_*_{cycle} (today_energy) ET sensor.hse_energy_*_{cycle}
        cycles = ("_hourly", "_daily", "_weekly", "_monthly", "_yearly")
        return [
            s for s in all_states
            if s.entity_id.startswith("sensor.hse_") and s.entity_id.endswith(cycles)
        ]
    
    def _get_sensors_file_path(self):
        """Chemin vers capteurs_power.json"""
        return os.path.join(
            os.path.dirname(__file__), "..", "data", "capteurs_power.json"
        )
    
    def _get_selection_file_path(self):
        """Chemin vers capteurs_selection.json"""
        return os.path.join(
            os.path.dirname(__file__), "..", "data", "capteurs_selection.json"
        )
    
    def _extract_cycle_from_entity(self, entity_id):
        """Extrait le cycle depuis l'entity_id (Phase 2: cycles complets)"""
        for c in ("hourly", "daily", "weekly", "monthly", "yearly"):
            if entity_id.endswith("_" + c):
                return c
        return "unknown"
    
    def _get_timestamp(self):
        """Timestamp ISO actuel"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _get_last_detection_time(self):
        """Dernière fois que la détection a été exécutée"""
        # Pour l'instant, timestamp actuel - sera amélioré plus tard
        return self._get_timestamp()
    
    def _success(self, data):
        """Réponse succès avec données"""
        return web.json_response({"error": False, "data": data})
    
    def _error(self, status, message):
        """Réponse erreur avec statut"""
        return web.json_response({"error": True, "message": message}, status=status)
    
    async def handle_sensors_health(self):
        """Endpoint get_sensors_health - Diagnostic capteurs pour capteursSensor.js."""
        try:
            # Réutiliser logique sensors existante
            sensors_data = await self._load_sensors_data()
            selection_data = await self._load_selection_data()
            
            # Index de sélection
            selection_index = {}
            for category, items in selection_data.items():
                if isinstance(items, list):
                    for item in items:
                        entity_id = item.get("entity_id")
                        if entity_id:
                            selection_index[entity_id] = item.get("enabled", False)
            
            # Format spécial pour diagnostic capteursSensor.js
            sensors_health = {}
            
            for sensor in sensors_data:
                entity_id = sensor.get("entity_id")
                if entity_id:
                    state_obj = self.hass.states.get(entity_id)
                    
                    # Calcul état santé selon logique capteursSensor.js
                    health_state = "absent"
                    if state_obj:
                        if state_obj.state in ["unavailable", "unknown", "error", "none"]:
                            health_state = "ko"
                        else:
                            health_state = "ok"
                    
                    # Format exact attendu par capteursSensor.js
                    sensors_health[entity_id] = {
                        "friendly_name": state_obj.attributes.get("friendly_name", entity_id) if state_obj else entity_id,
                        "value": state_obj.state if state_obj else "N/A",
                        "state": health_state,
                        "unit_of_measurement": state_obj.attributes.get("unit_of_measurement", "") if state_obj else "",
                        "integration": sensor.get("integration", "unknown"),
                        "quarantine": sensor.get("quarantine", False),
                        "last_seen": state_obj.last_changed.isoformat() if state_obj else None,
                        "device_id": sensor.get("device_id", ""),
                        "area": sensor.get("zone", ""),
                        "duplicate_group": sensor.get("duplicate_group", "")
                    }
            
            _LOGGER.info(f"🩺 Sensors health: {len(sensors_health)} capteurs analysés")
            
            # ✅ Format SUCCESS pour capteursSensor.js (pas self.success !)
            return web.json_response({
                "success": True,
                "sensors": sensors_health,
                "count": len(sensors_health)
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur handle_sensors_health: {e}")
            
    async def _handle_integrations_status(self):
        """Endpoint /get_integrations_status - État des intégrations HA"""
        try:
            _LOGGER.info("🔍 Analyse des intégrations depuis états HA")
            
            # 1. Récupérer toutes les intégrations depuis HA
            integrations_data = []
            
            # Analyse basée sur les domaines d'entités
            all_states = self.hass.states.async_all()
            domain_stats = {}
            
            # Grouper par domaine (intégration)
            for state in all_states:
                domain = state.entity_id.split('.')[0]
                
                if domain not in domain_stats:
                    domain_stats[domain] = {
                        'domain': domain,
                        'entities_total': 0,
                        'entities_ok': 0,
                        'entities_unavailable': 0,
                        'last_updated': None
                    }
                
                domain_stats[domain]['entities_total'] += 1
                
                if state.state in ('unavailable', 'unknown'):
                    domain_stats[domain]['entities_unavailable'] += 1
                else:
                    domain_stats[domain]['entities_ok'] += 1
                
                # Dernière mise à jour
                if not domain_stats[domain]['last_updated'] or state.last_updated > domain_stats[domain]['last_updated']:
                    domain_stats[domain]['last_updated'] = state.last_updated
            
            # 2. Transformer en format pour frontend
            for domain, stats in domain_stats.items():
                # Filtrer les domaines système et peu utiles
                if domain in ('homeassistant', 'persistent_notification', 'updater'):
                    continue
                
                unavailable_ratio = stats['entities_unavailable'] / stats['entities_total'] if stats['entities_total'] > 0 else 0
                
                # Déterminer l'état de santé
                if unavailable_ratio > 0.3:  # >30% indisponible
                    health_state = 'critical'
                    status_text = 'Défaillante'
                elif unavailable_ratio > 0.1:  # 10-30% indisponible  
                    health_state = 'warning'
                    status_text = 'Attention'
                else:
                    health_state = 'ok'
                    status_text = 'Opérationnelle'
                
                integrations_data.append({
                    'domain': domain,
                    'friendly_name': domain.replace('_', ' ').title(),
                    'status': status_text,
                    'health_state': health_state,
                    'entities_count': stats['entities_total'],
                    'entities_ok': stats['entities_ok'],
                    'entities_unavailable': stats['entities_unavailable'],
                    'last_updated': stats['last_updated'].isoformat() if stats['last_updated'] else None,
                    'unavailable_ratio': round(unavailable_ratio * 100, 1)
                })
            
            # 3. Trier par nombre d'entités (plus importantes en premier)
            integrations_data.sort(key=lambda x: x['entities_count'], reverse=True)
            
            _LOGGER.info(f"✅ Analysé {len(integrations_data)} intégrations")
            
            return self._success({
                'integrations': integrations_data,
                'count': len(integrations_data),
                'summary': {
                    'total': len(integrations_data),
                    'ok': len([i for i in integrations_data if i['health_state'] == 'ok']),
                    'warning': len([i for i in integrations_data if i['health_state'] == 'warning']),
                    'critical': len([i for i in integrations_data if i['health_state'] == 'critical'])
                }
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur _handle_integrations_status: {e}")
            return self._error(500, f"Erreur analyse intégrations: {e}")
