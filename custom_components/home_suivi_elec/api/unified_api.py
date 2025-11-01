"""API REST Unifiée Home Suivi Élec"""
import logging
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

class HomeElecUnifiedAPIView(HomeAssistantView):
    """API REST unifiée consolidant 18 endpoints → 6 endpoints"""
    
    url = "/api/home_suivi_elec/{resource}"
    name = "api:home_suivi_elec:unified"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass
        
    async def get(self, request):
        """Gestionnaire GET unifié"""
        return await self._handle_request("GET", request)
    
    async def post(self, request):
        """Gestionnaire POST unifié"""  
        return await self._handle_request("POST", request)
    
    async def _handle_request(self, method: str, request) -> web.Response:
        """Router principal des requêtes"""
        try:
            resource = request.match_info.get("resource", "")
            _LOGGER.info(f"API Unifiée: {method} {resource}")
            
            if resource.startswith("sensors"):
                from ..handlers.sensors_handler import SensorsHandler
                handler = SensorsHandler(self.hass)
                return await handler.handle(method, resource, request)
                
            elif resource.startswith("data"):
                from ..handlers.data_handler import DataHandler
                handler = DataHandler(self.hass)
                return await handler.handle(method, resource, request)
                
            elif resource.startswith("config"):
                from ..handlers.config_handler import ConfigHandler
                handler = ConfigHandler(self.hass)
                return await handler.handle(method, resource, request)
                
            elif resource.startswith("diagnostics"):
                from ..handlers.diagnostics_handler import DiagnosticsHandler
                handler = DiagnosticsHandler(self.hass)
                return await handler.handle(method, resource, request)
                
            elif resource.startswith("ui"):
                from ..handlers.ui_handler import UIHandler
                handler = UIHandler(self.hass)
                return await handler.handle(method, resource, request)
            
            else:
                return self._error_response(404, f"Resource '{resource}' not found")
                
        except Exception as e:
            _LOGGER.exception(f"API Error: {e}")
            return self._error_response(500, f"Internal server error: {e}")
    
    def _error_response(self, status: int, message: str) -> web.Response:
        """Réponse d'erreur standardisée"""
        return web.json_response({
            "error": True,
            "status": status,
            "message": message
        }, status=status)
