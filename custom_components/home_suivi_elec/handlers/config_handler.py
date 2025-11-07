"""Handler pour gestion configuration et sélection capteurs"""

import logging
import json
from pathlib import Path

from .base_handler import BaseHandler

_LOGGER = logging.getLogger(__name__)

class Config_handler(BaseHandler):
    """Handler pour config et sélection capteurs"""

    async def handle(self, method, resource, request):
        """Router des requêtes configuration"""
        
        if method == "POST":
            if resource == "ignore":
                return await self._set_ignored(request)
            elif resource == "choose_best":
                return await self._choose_best(request)
            elif resource == "save_selection":
                return await self._save_selection(request)
        
        elif method == "GET":
            if resource == "selection":
                return await self._get_selection()
        
        return self.error(405, f"Method {method} not allowed for {resource}")

    async def _set_ignored(self, request):
        """Marquer/démarquer un sensor comme ignoré"""
        try:
            data = await request.json()
            entity_id = data.get("entity_id")
            ignored = data.get("ignored", True)
            
            if not entity_id:
                return self.error(400, "entity_id requis")
            
            # Charger capteurs_selection.json
            data_dir = Path(self.hass.config.path("custom_components/home_suivi_elec/data"))
            selection_file = data_dir / "capteurs_selection.json"
            
            if not selection_file.exists():
                return self.error(404, "Fichier sélection introuvable")
            
            with open(selection_file, "r", encoding="utf-8") as f:
                selection = json.load(f)
            
            # Trouver et modifier le sensor
            found = False
            for category in selection.values():
                if isinstance(category, list):
                    for sensor in category:
                        if sensor.get("entity_id") == entity_id:
                            sensor["ignored"] = ignored
                            sensor["enabled"] = not ignored
                            found = True
                            break
            
            if not found:
                return self.error(404, f"Sensor {entity_id} non trouvé")
            
            # Sauvegarder
            with open(selection_file, "w", encoding="utf-8") as f:
                json.dump(selection, f, ensure_ascii=False, indent=2)
            
            _LOGGER.info(f"✅ Sensor {entity_id} → {'ignoré' if ignored else 'activé'}")
            
            return self.success({
                "message": f"Sensor {'ignoré' if ignored else 'activé'}",
                "entity_id": entity_id,
                "ignored": ignored
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur set_ignored: {e}")
            return self.error(500, str(e))

    async def _choose_best(self, request):
        """Choisir automatiquement le meilleur sensor pour un device"""
        try:
            data = await request.json()
            device_id = data.get("device_id")
            
            if not device_id:
                return self.error(400, "device_id requis")
            
            # Charger capteurs_power.json
            data_dir = Path(self.hass.config.path("custom_components/home_suivi_elec/data"))
            power_file = data_dir / "capteurs_power.json"
            selection_file = data_dir / "capteurs_selection.json"
            
            if not power_file.exists():
                return self.error(404, "Fichier capteurs_power.json introuvable")
            
            with open(power_file, "r", encoding="utf-8") as f:
                capteurs = json.load(f)
            
            # Trouver tous les sensors du device
            device_sensors = [c for c in capteurs if c.get("device_id") == device_id]
            
            if not device_sensors:
                return self.error(404, f"Aucun sensor trouvé pour device {device_id}")
            
            # Trier par priorité (meilleur en premier)
            device_sensors.sort(key=lambda x: x.get("priority", 0), reverse=True)
            best = device_sensors[0]
            
            # Charger sélection
            with open(selection_file, "r", encoding="utf-8") as f:
                selection = json.load(f)
            
            # Activer le meilleur, ignorer les autres
            for category in selection.values():
                if isinstance(category, list):
                    for sensor in category:
                        if sensor.get("device_id") == device_id:
                            is_best = sensor.get("entity_id") == best["entity_id"]
                            sensor["enabled"] = is_best
                            sensor["ignored"] = not is_best
            
            # Sauvegarder
            with open(selection_file, "w", encoding="utf-8") as f:
                json.dump(selection, f, ensure_ascii=False, indent=2)
            
            _LOGGER.info(f"✅ Meilleur sensor choisi: {best['entity_id']} pour {device_id}")
            
            return self.success({
                "message": "Meilleur sensor sélectionné",
                "device_id": device_id,
                "best_sensor": best["entity_id"]
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur choose_best: {e}")
            return self.error(500, str(e))

    async def _get_selection(self):
        """Récupérer la sélection actuelle"""
        try:
            data_dir = Path(self.hass.config.path("custom_components/home_suivi_elec/data"))
            selection_file = data_dir / "capteurs_selection.json"
            
            if not selection_file.exists():
                return self.success({"selection": {}})
            
            with open(selection_file, "r", encoding="utf-8") as f:
                selection = json.load(f)
            
            return self.success({"selection": selection})
            
        except Exception as e:
            _LOGGER.exception(f"Erreur get_selection: {e}")
            return self.error(500, str(e))

    async def _save_selection(self, request):
        """Sauvegarder la sélection complète"""
        try:
            data = await request.json()
            selection = data.get("selection", {})
            
            data_dir = Path(self.hass.config.path("custom_components/home_suivi_elec/data"))
            selection_file = data_dir / "capteurs_selection.json"
            
            with open(selection_file, "w", encoding="utf-8") as f:
                json.dump(selection, f, ensure_ascii=False, indent=2)
            
            _LOGGER.info("✅ Sélection sauvegardée")
            
            return self.success({"message": "Sélection sauvegardée"})
            
        except Exception as e:
            _LOGGER.exception(f"Erreur save_selection: {e}")
            return self.error(500, str(e))
