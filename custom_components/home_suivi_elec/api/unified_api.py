"""API REST Unifiée Home Suivi Élec - Version Corrigée"""
import logging
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

class HomeElecUnifiedAPIView(HomeAssistantView):
    """API REST unifiée avec signature corrigée"""
    
    url = "/api/home_suivi_elec/{resource}"
    name = "api:home_suivi_elec:unified"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass
        _LOGGER.info("🏗️ API Unifiée initialisée - signature corrigée")
        
    async def get(self, request):
        """GET unifié - signature corrigée sans paramètre resource"""
        try:
            resource = request.match_info.get("resource", "unknown")
            _LOGGER.info(f"🧪 API Unifiée GET: /{resource}")
            
            # Router selon resource
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
            else:
                return self._success({
                    "message": f"API Unifiée fonctionnelle - resource: {resource}",
                    "available_endpoints": ["sensors", "data", "diagnostics", "config", "ui"],
                    "version": "v1.0.42-fixed"
                })
                
        except Exception as e:
            _LOGGER.exception(f"Erreur API GET: {e}")
            return self._error(500, str(e))
    
    async def _handle_sensors(self):
        """Handler sensors"""
        domain_data = self.hass.data.get("home_suivi_elec", {})
        energy_sensors = len(domain_data.get("energy_sensors", []))
        power_sensors = len(domain_data.get("live_power_sensors", []))
        
        return self._success({
            "energy_sensors": energy_sensors,
            "power_sensors": power_sensors,
            "total": energy_sensors + power_sensors,
            "message": "Sensors endpoint fonctionnel"
        })
    
    async def _handle_data(self):
        """Handler data"""
        return self._success({
            "consumptions": [],
            "instant_power": [],
            "message": "Data endpoint fonctionnel"
        })
    
    async def _handle_diagnostics(self):
        """Handler diagnostics"""
        return self._success({
            "system_status": "operational",
            "api_version": "unified-v1.0.42-fixed",
            "message": "Diagnostics endpoint fonctionnel"
        })
    
    async def _handle_config(self):
        """Handler config"""
        return self._success({
            "message": "Config endpoint fonctionnel"
        })
    
    async def _handle_ui(self):
        """Handler UI"""
        return self._success({
            "message": "UI endpoint fonctionnel"
        })
    
    def _success(self, data):
        return web.json_response({"error": False, "data": data})
    
    def _error(self, status, message):
        return web.json_response({"error": True, "message": message}, status=status)
