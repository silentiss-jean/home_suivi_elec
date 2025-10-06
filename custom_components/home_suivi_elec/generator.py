# -*- coding: utf-8 -*-
"""Génération de fichiers YAML et Lovelace pour Home Suivi Élec."""

import logging
import aiofiles
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

async def generate_yaml_config(capteurs):
    """Exemple minimal de génération YAML."""
    lignes = ["# Home Suivi Élec — YAML auto-généré", ""]
    for c in capteurs:
        lignes.append(f"# Capteur : {c['entity_id']}")
    return "\n".join(lignes)

async def write_yaml_file(filename, content):
    """Écrit un fichier YAML de façon asynchrone."""
    path = Path(filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(path, "w", encoding="utf-8") as f:
        await f.write(content)
    _LOGGER.info("📄 Fichier YAML généré : %s", path)

async def run_all(hass, options):
    """Point d’entrée pour la génération complète."""
    _LOGGER.info("🧩 Lancement de la génération complète Home Suivi Élec")
    capteurs = hass.data.get("home_suivi_elec", {}).get("capteurs", [])
    yaml_content = await generate_yaml_config(capteurs)
    await write_yaml_file("/config/suivi_elec_auto.yaml", yaml_content)
    _LOGGER.info("✅ Génération terminée.")