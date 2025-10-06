# -*- coding: utf-8 -*-
"""Configuration et enregistrement du panneau statique Home Suivi Élec."""
import logging
import os
from homeassistant.core import HomeAssistant
from homeassistant.components import frontend

_LOGGER = logging.getLogger(__name__)

async def async_setup_panel(hass: HomeAssistant, panel_dir: str):
    """Setup du panneau /home_suivi_elec."""
    # Crée le dossier panel_static si inexistant
    os.makedirs(panel_dir, exist_ok=True)
    panel_path = os.path.join(panel_dir, "panel.js")

    if not os.path.exists(panel_path):
        _LOGGER.warning("[PANEL] Fichier panel.js introuvable : %s", panel_path)
        return

    # Enregistre le répertoire comme ressource statique
    hass.http.async_register_static_paths(
        [frontend.StaticPathConfig("/home_suivi_elec", panel_dir)]
    )

    # Ajoute le panneau à la barre latérale si pas déjà fait
    if not hass.data.get("home_suivi_elec_panel_registered"):
        frontend.async_register_built_in_panel(
            hass,
            component_name="iframe",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            config={"url": "/home_suivi_elec/panel.js"},
            require_admin=True
        )
        hass.data["home_suivi_elec_panel_registered"] = True
        _LOGGER.info("[PANEL] ✅ Panneau Home Suivi Élec ajouté à la barre latérale")
    else:
        _LOGGER.debug("[PANEL] ⚙️ Panneau déjà enregistré, aucune action")