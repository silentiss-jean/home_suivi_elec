# -*- coding: utf-8 -*-
"""Outils de debug JSON pour Home Suivi Élec."""

import logging
import json
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

def scan_sets(hass):
    """Vérifie les structures JSON pour détecter des sets non convertibles."""
    data_dir = Path(hass.config.path("custom_components/home_suivi_elec/data"))
    for fichier in data_dir.glob("*.json"):
        try:
            contenu = json.loads(fichier.read_text(encoding="utf-8"))
            if isinstance(contenu, set):
                _LOGGER.warning("⚠️ Set détecté dans %s", fichier)
        except Exception as e:
            _LOGGER.error("❌ Erreur lecture JSON %s : %s", fichier, e)
