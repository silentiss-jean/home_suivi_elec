"""Extensions API Unifiée - Méthodes POST/PUT pour configuration"""
import logging
import json
import os
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

class HomeElecUnifiedConfigAPIView(HomeAssistantView):
    """API Configuration - Méthodes POST/PUT pour gestion config"""
    
    url = "/api/home_suivi_elec/config/{action}"
    name = "api:home_suivi_elec:config"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass
        _LOGGER.info("🛠️ API Configuration - Méthodes POST activées")
    
    async def post(self, request, action=None):
        """POST /config/{action} - Actions de configuration"""
        try:
            if action is None:
                action = request.match_info.get("action", "unknown")
            
            _LOGGER.info(f"🛠️ API Config POST: /{action}")
            
            # Parser le body JSON
            try:
                data = await request.json()
            except Exception as e:
                return self._error(400, f"JSON invalide: {e}")
            
            # Router selon action
            if action == "save_selection":
                return await self._save_sensor_selection(data)
            elif action == "update_options":
                return await self._update_integration_options(data)
            elif action == "toggle_sensor":
                return await self._toggle_sensor_state(data)
            elif action == "reset_config":
                return await self._reset_configuration(data)
            else:
                return self._error(404, f"Action inconnue: {action}")
                
        except Exception as e:
            _LOGGER.exception(f"Erreur API Config POST: {e}")
            return self._error(500, str(e))
    
    async def _save_sensor_selection(self, data):
        """Sauvegarde la sélection de capteurs"""
        try:
            selection = data.get("selection", {})
            if not isinstance(selection, dict):
                return self._error(400, "'selection' doit être un objet")
            
            # Valider la structure
            valid_categories = ["salle_de_bain", "cuisine", "chauffage", "general"]
            for category, sensors in selection.items():
                if category not in valid_categories:
                    _LOGGER.warning(f"Catégorie inconnue: {category}")
                
                if not isinstance(sensors, list):
                    return self._error(400, f"Catégorie '{category}' doit être une liste")
                
                for sensor in sensors:
                    if not isinstance(sensor, dict) or "entity_id" not in sensor:
                        return self._error(400, "Chaque capteur doit avoir un 'entity_id'")
            
            # Sauvegarder dans capteurs_selection.json
            selection_file = self._get_selection_file_path()
            await self._save_json_file(selection_file, selection)
            
            _LOGGER.info(f"✅ Sélection sauvegardée: {len(selection)} catégories")
            
            return self._success({
                "message": "Sélection sauvegardée avec succès",
                "categories_saved": len(selection),
                "total_sensors": sum(len(sensors) for sensors in selection.values())
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur save_sensor_selection: {e}")
            return self._error(500, f"Erreur sauvegarde: {e}")
    
    async def _update_integration_options(self, data):
        """Met à jour les options de l'intégration"""
        try:
            from ..const import DOMAIN
            
            options = data.get("options", {})
            if not isinstance(options, dict):
                return self._error(400, "'options' doit être un objet")
            
            # Valider les options
            valid_options = [
                "auto_generate", "tariff_type", "contract_type", 
                "hp_hc_enabled", "subscription_cost", "external_sensor"
            ]
            
            filtered_options = {}
            for key, value in options.items():
                if key in valid_options:
                    filtered_options[key] = value
                else:
                    _LOGGER.warning(f"Option inconnue ignorée: {key}")
            
            # Mettre à jour hass.data
            if DOMAIN in self.hass.data:
                current_options = self.hass.data[DOMAIN].get("options", {})
                current_options.update(filtered_options)
                self.hass.data[DOMAIN]["options"] = current_options
            
            _LOGGER.info(f"✅ Options mises à jour: {list(filtered_options.keys())}")
            
            return self._success({
                "message": "Options mises à jour avec succès",
                "updated_options": filtered_options
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur update_integration_options: {e}")
            return self._error(500, f"Erreur mise à jour options: {e}")
    
    async def _toggle_sensor_state(self, data):
        """Active/désactive un capteur spécifique"""
        try:
            entity_id = data.get("entity_id")
            enabled = data.get("enabled")
            
            if not entity_id:
                return self._error(400, "'entity_id' requis")
            
            if enabled is None:
                return self._error(400, "'enabled' requis (true/false)")
            
            enabled = bool(enabled)
            
            # Charger sélection actuelle
            selection_file = self._get_selection_file_path()
            selection = await self._load_json_file(selection_file)
            
            # Trouver et modifier le capteur
            sensor_found = False
            for category, sensors in selection.items():
                for sensor in sensors:
                    if sensor.get("entity_id") == entity_id:
                        sensor["enabled"] = enabled
                        sensor_found = True
                        break
                if sensor_found:
                    break
            
            if not sensor_found:
                return self._error(404, f"Capteur {entity_id} introuvable")
            
            # Sauvegarder
            await self._save_json_file(selection_file, selection)
            
            action_text = "activé" if enabled else "désactivé"
            _LOGGER.info(f"✅ Capteur {entity_id} {action_text}")
            
            return self._success({
                "message": f"Capteur {action_text} avec succès",
                "entity_id": entity_id,
                "enabled": enabled
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur toggle_sensor_state: {e}")
            return self._error(500, f"Erreur toggle capteur: {e}")
    
    async def _reset_configuration(self, data):
        """Réinitialise la configuration (selon type)"""
        try:
            reset_type = data.get("type", "selection")
            
            if reset_type == "selection":
                # Réinitialiser capteurs_selection.json
                selection_file = self._get_selection_file_path()
                empty_selection = {
                    "salle_de_bain": [],
                    "cuisine": [],
                    "chauffage": [],
                    "general": []
                }
                await self._save_json_file(selection_file, empty_selection)
                message = "Sélection réinitialisée"
                
            elif reset_type == "options":
                # Réinitialiser options par défaut
                from ..const import DOMAIN
                if DOMAIN in self.hass.data:
                    self.hass.data[DOMAIN]["options"] = {
                        "auto_generate": True,
                        "tariff_type": "base",
                        "contract_type": "particulier"
                    }
                message = "Options réinitialisées"
                
            else:
                return self._error(400, f"Type de reset inconnu: {reset_type}")
            
            _LOGGER.info(f"✅ Configuration réinitialisée: {reset_type}")
            
            return self._success({
                "message": message,
                "reset_type": reset_type
            })
            
        except Exception as e:
            _LOGGER.exception(f"Erreur reset_configuration: {e}")
            return self._error(500, f"Erreur reset: {e}")
    
    # === MÉTHODES UTILITAIRES ===
    
    async def _load_json_file(self, file_path):
        """Charge un fichier JSON de manière asynchrone"""
        import asyncio
        
        def _load():
            if not os.path.exists(file_path):
                return {}
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                _LOGGER.error(f"Erreur lecture {file_path}: {e}")
                return {}
        
        return await asyncio.get_event_loop().run_in_executor(None, _load)
    
    async def _save_json_file(self, file_path, data):
        """Sauvegarde un fichier JSON de manière asynchrone"""
        import asyncio
        
        def _save():
            # Créer le répertoire si nécessaire
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            except Exception as e:
                _LOGGER.error(f"Erreur écriture {file_path}: {e}")
                raise
        
        await asyncio.get_event_loop().run_in_executor(None, _save)
    
    def _get_selection_file_path(self):
        """Chemin vers capteurs_selection.json"""
        return os.path.join(
            os.path.dirname(__file__), "..", "data", "capteurs_selection.json"
        )
    
    def _success(self, data):
        """Réponse succès"""
        return web.json_response({"error": False, "data": data})
    
    def _error(self, status, message):
        """Réponse erreur"""
        return web.json_response({"error": True, "message": message}, status=status)
    
class ValidationActionView(HomeAssistantView):
    """
    POST /api/home_suivi_elec/validation/action
    Actions de correction pour synchronisation
    """
    url = "/api/home_suivi_elec/validation/action"
    name = "api:home_suivi_elec:validation_action"
    requires_auth = False
    cors_allowed = True

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def post(self, request):
        """Applique les actions de correction"""
        try:
            import json
            import os
            import asyncio
            from pathlib import Path
            
            data = await request.json()
            action = data.get("action")
            
            selection_file = Path(__file__).parent.parent / "data" / "capteurs_selection.json"
            power_file = Path(__file__).parent.parent / "data" / "capteurs_power.json"
            
            def _apply_action():
                # Charger les fichiers
                with open(selection_file, "r", encoding="utf-8") as f:
                    selection_data = json.load(f)
                
                with open(power_file, "r", encoding="utf-8") as f:
                    power_data = json.load(f)
                
                power_ids = {s["entity_id"] for s in power_data}
                
                result = {"success": True, "action": action, "changes": [], "errors": []}
                
                if action == "disable_orphans":
                    # Désactiver tous les capteurs orphelins
                    for category, items in selection_data.items():
                        if not isinstance(items, list):
                            continue
                        for item in items:
                            if item.get("enabled") and item["entity_id"] not in power_ids:
                                item["enabled"] = False
                                result["changes"].append({
                                    "entity_id": item["entity_id"],
                                    "action": "disabled",
                                    "reason": "orphan"
                                })
                    
                    result["message"] = f"{len(result['changes'])} capteur(s) orphelin(s) désactivé(s)"
                
                elif action == "enable_available":
                    # Activer tous les capteurs détectés mais non activés
                    for category, items in selection_data.items():
                        if not isinstance(items, list):
                            continue
                        for item in items:
                            if not item.get("enabled") and item["entity_id"] in power_ids:
                                item["enabled"] = True
                                result["changes"].append({
                                    "entity_id": item["entity_id"],
                                    "action": "enabled",
                                    "reason": "available"
                                })
                    
                    result["message"] = f"{len(result['changes'])} capteur(s) activé(s)"
                
                elif action == "full_sync":
                    # Synchronisation complète
                    for category, items in selection_data.items():
                        if not isinstance(items, list):
                            continue
                        for item in items:
                            entity_id = item["entity_id"]
                            should_be_enabled = entity_id in power_ids
                            
                            if item.get("enabled", False) != should_be_enabled:
                                item["enabled"] = should_be_enabled
                                result["changes"].append({
                                    "entity_id": entity_id,
                                    "action": "enabled" if should_be_enabled else "disabled",
                                    "reason": "sync"
                                })
                    
                    result["message"] = f"{len(result['changes'])} capteur(s) synchronisé(s)"
                
                elif action == "disable_specific":
                    # Désactiver des capteurs spécifiques
                    entity_ids = data.get("entity_ids", [])
                    for category, items in selection_data.items():
                        if not isinstance(items, list):
                            continue
                        for item in items:
                            if item["entity_id"] in entity_ids and item.get("enabled"):
                                item["enabled"] = False
                                result["changes"].append({
                                    "entity_id": item["entity_id"],
                                    "action": "disabled",
                                    "reason": "user_request"
                                })
                    
                    result["message"] = f"{len(result['changes'])} capteur(s) désactivé(s)"
                
                else:
                    result["success"] = False
                    result["error"] = f"Action inconnue: {action}"
                    return result
                
                # Sauvegarder
                with open(selection_file, "w", encoding="utf-8") as f:
                    json.dump(selection_data, f, indent=2, ensure_ascii=False)
                
                return result
            
            # Exécuter action
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, _apply_action)
            
            _LOGGER.info(f"[VALIDATION-ACTION] '{action}': {result.get('message')}")
            
            return web.json_response({"error": False, "data": result})
            
        except Exception as e:
            _LOGGER.exception(f"[VALIDATION-ACTION] POST error: {e}")
            return web.json_response({
                "error": True,
                "message": str(e)
            }, status=500)
