# -*- coding: utf-8 -*-
"""Gestion du panneau frontend Home Suivi Élec."""
import os
import logging

from homeassistant.components import frontend

_LOGGER = logging.getLogger(__name__)

async def async_setup_panel(hass):
    """Crée le panneau /home_suivi_elec s’il n’existe pas déjà."""
    panel_dir = os.path.join(os.path.dirname(__file__), "panel_static")
    panel_path = os.path.join(panel_dir, "panel.js")

    if not os.path.exists(panel_path):
        _LOGGER.warning("[PANEL] Fichier panel.js introuvable : %s", panel_path)
        return

    # 🔹 Enregistre le répertoire complet comme ressource statique
    hass.http.async_register_static_paths(
        [frontend.StaticPathConfig("/home_suivi_elec", panel_dir)]
    )

    # 🔹 Ajoute le panneau à la sidebar de Home Assistant
    if not hass.data.get("home_suivi_elec_panel_registered"):
        hass.components.frontend.async_register_built_in_panel(
            component_name="iframe",
            sidebar_title="Suivi Élec",
            sidebar_icon="mdi:flash",
            config={"url": "/home_suivi_elec/panel.js"},
            require_admin=True
        )
        hass.data["home_suivi_elec_panel_registered"] = True
        _LOGGER.info("[PANEL] ✅ Panneau Home Suivi Élec ajouté à la barre latérale")
    else:
        _LOGGER.debug("[PANEL] ⚙️ Panneau déjà enregistré, aucune action.")