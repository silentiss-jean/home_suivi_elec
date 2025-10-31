# Register new backend views
from .manage_selection_views_entity_registry import GetEntityNameRegistryView
from .manage_selection_views_diagnostic_groups import DiagnosticGroupsView

async def async_register_extra_views(hass):
    hass.http.register_view(GetEntityNameRegistryView(hass))
    hass.http.register_view(DiagnosticGroupsView(hass))
