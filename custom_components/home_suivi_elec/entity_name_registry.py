"""
Registry universel des noms d'entités : mapping short_name ↔ display_name
Évite les répétitions de logique de nommage entre modules.
"""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Optional

_LOGGER = logging.getLogger(__name__)


class EntityNameRegistry:
    """
    Registry persistent pour mapper :
    - short_name (pour entity_id courts) ↔ display_name (pour friendly_name lisibles)
    
    Évite duplication calculs de noms entre energy_tracking, power_monitoring, etc.
    """
    
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.registry_file = data_dir / "entity_name_registry.json"
        self._mappings: Dict[str, str] = {}  # short_name → display_name
        # ✅ NE PAS charger ici - sera fait via async_load() ou register()
    
    async def async_load(self):
        """Charge le registry de manière asynchrone (OBLIGATOIRE en contexte async)."""
        loop = asyncio.get_running_loop()
        
        def _load():
            try:
                if self.registry_file.exists():
                    with open(self.registry_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                return {}
            except Exception as e:
                _LOGGER.warning(f"⚠️ Erreur chargement registry : {e}")
                return {}
        
        self._mappings = await loop.run_in_executor(None, _load)
        _LOGGER.debug(f"📖 Registry chargé (async) : {len(self._mappings)} mappings")
    
    async def async_save(self):
        """Sauvegarde le registry de manière asynchrone."""
        loop = asyncio.get_running_loop()
        
        def _save():
            try:
                self.data_dir.mkdir(parents=True, exist_ok=True)
                with open(self.registry_file, "w", encoding="utf-8") as f:
                    json.dump(self._mappings, f, ensure_ascii=False, indent=2)
                _LOGGER.debug(f"💾 Registry sauvé : {len(self._mappings)} mappings")
            except Exception as e:
                _LOGGER.error(f"❌ Erreur sauvegarde registry : {e}")
        
        await loop.run_in_executor(None, _save)
    
    async def async_register(self, entity_id: str, short_name: str) -> str:
        """
        Enregistre un mapping et retourne le display_name (version async).
        
        Args:
            entity_id: ID complet (ex: sensor.chambre_ordinateur_prise_connectee_puissance)
            short_name: Nom court calculé (ex: chambre_ordi_plug_pwr)
        
        Returns:
            display_name: Nom d'affichage lisible (ex: "Chambre Ordinateur Prise Connectée Puissance")
        """
        # Générer display_name depuis entity_id original (plus lisible)
        display_name = self._generate_display_name(entity_id)
        
        # Enregistrer le mapping
        if short_name not in self._mappings or self._mappings[short_name] != display_name:
            self._mappings[short_name] = display_name
            await self.async_save()
            _LOGGER.debug(f"🔗 Registry: {short_name} → {display_name}")
        
        return display_name
    
    def get_display_name(self, short_name: str) -> Optional[str]:
        """Récupère le display_name depuis short_name."""
        return self._mappings.get(short_name)
    
    def get_all_mappings(self) -> Dict[str, str]:
        """Retourne tous les mappings."""
        return self._mappings.copy()
    
    def _generate_display_name(self, entity_id: str) -> str:
        """
        Génère un nom d'affichage lisible depuis entity_id.
        
        Exemple:
        sensor.chambre_ordinateur_prise_connectee_puissance
        → "Chambre Ordinateur Prise Connectée Puissance"
        """
        # Nettoyer entity_id
        name = entity_id.replace("sensor.", "")
        name = name.replace("_today_energy", "")
        
        # Expansions techniques → français
        expansions = {
            "pwr": "puissance",
            "cur": "consommation actuelle", 
            "plug": "prise connectée",
            "smart": "prise intelligente",
        }
        
        for abbrev, full in expansions.items():
            name = name.replace(f"_{abbrev}", f"_{full}")
        
        # Mots → Title Case
        words = name.split("_")
        title_words = []
        
        for word in words:
            if word:
                # Cas spéciaux
                if word.lower() == "connectee":
                    title_words.append("Connectée")
                elif word.lower() == "intelligente":
                    title_words.append("Intelligente")
                else:
                    title_words.append(word.capitalize())
        
        return " ".join(title_words)
