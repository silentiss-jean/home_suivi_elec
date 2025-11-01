"""API REST Unifiée Home Suivi Élec - Fix Définitif"""
import logging
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

class HomeElecUnifiedAPIView(HomeAssistantView):
    """API REST unifiée - Fix définitif signature"""
    
    url = "/api/home_suivi_elec/{resource}"
    name = "api:home_suivi_elec:unified"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass
        _LOGGER.info("🏗️ API Unifiée - Fix définitif signature")
        
    async def get(self, request, resource=None):
        """GET unifié - signature avec resource accepté"""
        try:
            # Récupérer resource depuis paramètre OU match_info
            if resource is None:
                resource = request.match_info.get("resource", "unknown")
            
            _LOGGER.info(f"🧪 API Unifiée GET: /{resource}")
            
            # Router selon resource
            if resource == "sensors":
                return self._success({
                    "message": "Sensors endpoint",
                    "count": 42,
                    "type": "sensors"
                })
            elif resource == "data":
                return self._success({
                    "message": "Data endpoint",
                    "consumptions": [],
                    "type": "data"
                })
            elif resource == "diagnostics":
                return self._success({
                    "system_status": "operational",
                    "api_version": "unified-v1.0.42-final",
                    "message": "Diagnostics endpoint"
                })
            elif resource == "config":
                return self._success({
                    "message": "Config endpoint",
                    "type": "config"
                })
            elif resource == "ui":
                return self._success({
                    "message": "UI endpoint",
                    "type": "ui"
                })
            else:
                return self._success({
                    "message": f"API Unifiée fonctionnelle - resource: {resource}",
                    "available_endpoints": ["sensors", "data", "diagnostics", "config", "ui"],
                    "version": "v1.0.42-final"
                })
                
        except Exception as e:
            _LOGGER.exception(f"Erreur API GET: {e}")
            return self._error(500, str(e))
    
    def _success(self, data):
        """Réponse succès"""
        return web.json_response({"error": False, "data": data})
    
    def _error(self, status, message):
        """Réponse erreur"""
        return web.json_response({"error": True, "message": message}, status=status)
