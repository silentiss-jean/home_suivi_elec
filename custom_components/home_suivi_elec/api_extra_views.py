from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant
from homeassistant.components.http import HomeAssistantView

_LOGGER = logging.getLogger(__name__)

class PingView(HomeAssistantView):
    """
    GET /api/home_suivi_elec/ping
    Test simple pour vérifier que nos vues sont bien enregistrées.
    """
    url = "/api/home_suivi_elec/ping"
    name = "api:home_suivi_elec:ping"
    requires_auth = False
    cors_allowed = True

    async def get(self, request):
        return self.json({
            "success": True,
            "message": "Home Suivi Elec API is working",
            "timestamp": "2025-10-31T09:40:00Z"
        })

# Register new backend views
from .manage_selection_views_entity_registry import GetEntityNameRegistryView
from .manage_selection_views_diagnostic_groups import DiagnosticGroupsView

async def async_register_extra_views(hass):
    _LOGGER.info("🔗 [API] Enregistrement des vues additionnelles...")
    try:
        hass.http.register_view(PingView())
        _LOGGER.info("✅ [API] PingView enregistrée: /api/home_suivi_elec/ping")
    except Exception as e:
        _LOGGER.error("❌ [API] Erreur PingView: %s", e)
    
    try:
        hass.http.register_view(GetEntityNameRegistryView(hass))
        _LOGGER.info("✅ [API] EntityNameRegistryView enregistrée: /api/home_suivi_elec/entity_name_registry")
    except Exception as e:
        _LOGGER.error("❌ [API] Erreur EntityNameRegistryView: %s", e)
    
    try:
        hass.http.register_view(DiagnosticGroupsView(hass))
        _LOGGER.info("✅ [API] DiagnosticGroupsView enregistrée: /api/home_suivi_elec/diagnostic_groups")
    except Exception as e:
        _LOGGER.error("❌ [API] Erreur DiagnosticGroupsView: %s", e)
