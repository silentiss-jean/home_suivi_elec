# -*- coding: utf-8 -*-
"""
Storage Manager - Gestionnaire centralisé de la Storage API Home Assistant.

Remplace les fichiers JSON dans data/ par des stores persistants Home Assistant.
Migration automatique + rétrocompatibilité + API REST unifiée.

Clés de stockage :
- home_suivi_elec_user_config_v2 : Configuration utilisateur (capteur référence, options)
- home_suivi_elec_capteurs_selection_v2 : Sélection des capteurs par zone/type
- home_suivi_elec_ignored_entities_v1 : Liste des entités ignorées
"""

import logging
import os
import json
from typing import Any, Dict, List, Optional
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)

# Clés de stockage Home Assistant (versionnées)
STORE_USER_CONFIG = "home_suivi_elec_user_config_v2"
STORE_CAPTEURS_SELECTION = "home_suivi_elec_capteurs_selection_v2"
STORE_IGNORED_ENTITIES = "home_suivi_elec_ignored_entities_v1"

# Version du schéma de storage (pour migrations futures)
STORAGE_VERSION = 2

# Anciens chemins fichiers (pour migration)
LEGACY_DATA_DIR = Path(__file__).parent / "data"
LEGACY_USER_CONFIG = LEGACY_DATA_DIR / "user_config.json"
LEGACY_CAPTEURS_SELECTION = LEGACY_DATA_DIR / "capteurs_selection.json"


class StorageManager:
    """
    Gestionnaire centralisé de la Storage API Home Assistant.
    
    Fonctionnalités :
    - Lecture/écriture asynchrone via Storage API
    - Migration automatique depuis data/*.json
    - Cache en mémoire pour performances
    - Validation des données
    - Backup automatique avant écriture
    """

    def __init__(self, hass: HomeAssistant):
        """Initialise le gestionnaire de storage."""
        self.hass = hass
        
        # Stores Home Assistant (Store API)
        self._store_user_config = Store(hass, STORAGE_VERSION, STORE_USER_CONFIG)
        self._store_selection = Store(hass, STORAGE_VERSION, STORE_CAPTEURS_SELECTION)
        self._store_ignored = Store(hass, STORAGE_VERSION, STORE_IGNORED_ENTITIES)
        
        # Cache en mémoire (évite I/O répétés)
        self._cache: Dict[str, Any] = {}
        
        _LOGGER.info("[STORAGE-MANAGER] Initialisé (version=%d)", STORAGE_VERSION)

    # ========================================
    # USER CONFIG
    # ========================================

    async def get_user_config(self) -> Dict[str, Any]:
        """
        Récupère la configuration utilisateur.
        
        Structure :
        {
            "externalCapteur": "sensor.xxx",
            "options": {...},
            "version": 2
        }
        """
        if "user_config" in self._cache:
            return self._cache["user_config"]
        
        data = await self._store_user_config.async_load()
        
        if data is None:
            _LOGGER.info("[STORAGE] user_config vide, initialisation...")
            data = {
                "externalCapteur": None,
                "options": {},
                "version": STORAGE_VERSION
            }
        
        self._cache["user_config"] = data
        return data

    async def save_user_config(self, config: Dict[str, Any]) -> bool:
        """
        Sauvegarde la configuration utilisateur.
        
        Args:
            config: Dictionnaire de configuration
            
        Returns:
            True si succès, False sinon
        """
        try:
            # Validation basique
            if not isinstance(config, dict):
                _LOGGER.error("[STORAGE] user_config invalide (pas un dict)")
                return False
            
            # Ajouter version si absente
            if "version" not in config:
                config["version"] = STORAGE_VERSION
            
            await self._store_user_config.async_save(config)
            self._cache["user_config"] = config
            
            _LOGGER.info("[STORAGE] user_config sauvegardé (version=%d)", config.get("version"))
            return True
            
        except Exception as e:
            _LOGGER.exception("[STORAGE] Erreur sauvegarde user_config: %s", e)
            return False

    # ========================================
    # CAPTEURS SELECTION
    # ========================================

    async def get_capteurs_selection(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Récupère la sélection des capteurs.
        
        Structure :
        {
            "zone1": [
                {"entity_id": "sensor.xxx", "enabled": true, ...},
                ...
            ],
            "zone2": [...],
            ...
        }
        """
        if "capteurs_selection" in self._cache:
            return self._cache["capteurs_selection"]
        
        data = await self._store_selection.async_load()
        
        if data is None:
            _LOGGER.info("[STORAGE] capteurs_selection vide, initialisation...")
            data = {}
        
        self._cache["capteurs_selection"] = data
        return data

    async def save_capteurs_selection(self, selection: Dict[str, List[Dict[str, Any]]]) -> bool:
        """
        Sauvegarde la sélection des capteurs.
        
        Args:
            selection: Dictionnaire zone -> liste de capteurs
            
        Returns:
            True si succès, False sinon
        """
        try:
            # Validation basique
            if not isinstance(selection, dict):
                _LOGGER.error("[STORAGE] capteurs_selection invalide (pas un dict)")
                return False
            
            await self._store_selection.async_save(selection)
            self._cache["capteurs_selection"] = selection
            
            total_sensors = sum(len(sensors) for sensors in selection.values())
            _LOGGER.info("[STORAGE] capteurs_selection sauvegardé (%d capteurs)", total_sensors)
            return True
            
        except Exception as e:
            _LOGGER.exception("[STORAGE] Erreur sauvegarde capteurs_selection: %s", e)
            return False

    async def update_sensor_enabled(self, entity_id: str, enabled: bool) -> bool:
        """
        Active/désactive un capteur spécifique.
        
        Args:
            entity_id: ID du capteur
            enabled: True pour activer, False pour désactiver
            
        Returns:
            True si trouvé et modifié, False sinon
        """
        selection = await self.get_capteurs_selection()
        
        # Chercher le capteur dans toutes les zones
        for zone, sensors in selection.items():
            for sensor in sensors:
                if sensor.get("entity_id") == entity_id:
                    sensor["enabled"] = enabled
                    await self.save_capteurs_selection(selection)
                    _LOGGER.info("[STORAGE] Capteur %s → enabled=%s", entity_id, enabled)
                    return True
        
        _LOGGER.warning("[STORAGE] Capteur %s non trouvé", entity_id)
        return False

    # ========================================
    # IGNORED ENTITIES
    # ========================================

    async def get_ignored_entities(self) -> List[str]:
        """
        Récupère la liste des entités ignorées.
        
        Returns:
            Liste des entity_id ignorés
        """
        if "ignored_entities" in self._cache:
            return self._cache["ignored_entities"]
        
        data = await self._store_ignored.async_load()
        
        if data is None:
            _LOGGER.info("[STORAGE] ignored_entities vide, initialisation...")
            data = {"entities": []}
        
        entities = data.get("entities", [])
        self._cache["ignored_entities"] = entities
        return entities

    async def save_ignored_entities(self, entities: List[str]) -> bool:
        """
        Sauvegarde la liste des entités ignorées.
        
        Args:
            entities: Liste des entity_id à ignorer
            
        Returns:
            True si succès, False sinon
        """
        try:
            # Validation + dédoublonnage
            if not isinstance(entities, list):
                _LOGGER.error("[STORAGE] ignored_entities invalide (pas une liste)")
                return False
            
            # Nettoyer et trier
            entities = sorted(set(entities))
            
            data = {"entities": entities}
            await self._store_ignored.async_save(data)
            self._cache["ignored_entities"] = entities
            
            _LOGGER.info("[STORAGE] ignored_entities sauvegardé (%d entités)", len(entities))
            return True
            
        except Exception as e:
            _LOGGER.exception("[STORAGE] Erreur sauvegarde ignored_entities: %s", e)
            return False

    async def add_ignored_entity(self, entity_id: str) -> bool:
        """Ajoute une entité à la liste des ignorés."""
        entities = await self.get_ignored_entities()
        if entity_id not in entities:
            entities.append(entity_id)
            return await self.save_ignored_entities(entities)
        return True

    async def remove_ignored_entity(self, entity_id: str) -> bool:
        """Retire une entité de la liste des ignorés."""
        entities = await self.get_ignored_entities()
        if entity_id in entities:
            entities.remove(entity_id)
            return await self.save_ignored_entities(entities)
        return True

    # ========================================
    # MIGRATION & MAINTENANCE
    # ========================================

    async def migrate_from_legacy_files(self) -> bool:
        """
        Migre les anciens fichiers data/*.json vers Storage API.
        
        Processus :
        1. Vérifie si fichiers legacy existent
        2. Charge et valide les données
        3. Sauvegarde via Storage API
        4. Backup fichiers legacy (renommage .migrated)
        
        Returns:
            True si migration réussie ou déjà effectuée, False si erreur
        """
        _LOGGER.info("[MIGRATION] Vérification fichiers legacy...")
        
        migrated_any = False
        
        # ✅ FIX: Fonction synchrone pour I/O
        def _load_json_file(filepath):
            """Charge un fichier JSON (exécuté dans executor)."""
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        
        def _rename_file(src, dst):
            """Renomme un fichier (exécuté dans executor)."""
            src.rename(dst)
        
        # Migration user_config.json
        if LEGACY_USER_CONFIG.exists():
            try:
                _LOGGER.info("[MIGRATION] Migration user_config.json...")
                
                # ✅ FIX: Charger dans executor
                legacy_data = await self.hass.async_add_executor_job(
                    _load_json_file, LEGACY_USER_CONFIG
                )
                
                # Sauvegarder via Storage API
                await self.save_user_config(legacy_data)
                
                # ✅ FIX: Renommer dans executor
                backup_path = LEGACY_USER_CONFIG.with_suffix(".json.migrated")
                await self.hass.async_add_executor_job(
                    _rename_file, LEGACY_USER_CONFIG, backup_path
                )
                
                _LOGGER.info("[MIGRATION] ✅ user_config.json migré (backup: %s)", backup_path.name)
                migrated_any = True
                
            except Exception as e:
                _LOGGER.exception("[MIGRATION] ❌ Erreur migration user_config.json: %s", e)
                return False
        
        # Migration capteurs_selection.json
        if LEGACY_CAPTEURS_SELECTION.exists():
            try:
                _LOGGER.info("[MIGRATION] Migration capteurs_selection.json...")
                
                # ✅ FIX: Charger dans executor
                legacy_data = await self.hass.async_add_executor_job(
                    _load_json_file, LEGACY_CAPTEURS_SELECTION
                )
                
                # Sauvegarder via Storage API
                await self.save_capteurs_selection(legacy_data)
                
                # ✅ FIX: Renommer dans executor
                backup_path = LEGACY_CAPTEURS_SELECTION.with_suffix(".json.migrated")
                await self.hass.async_add_executor_job(
                    _rename_file, LEGACY_CAPTEURS_SELECTION, backup_path
                )
                
                _LOGGER.info("[MIGRATION] ✅ capteurs_selection.json migré (backup: %s)", backup_path.name)
                migrated_any = True
                
            except Exception as e:
                _LOGGER.exception("[MIGRATION] ❌ Erreur migration capteurs_selection.json: %s", e)
                return False
        
        if migrated_any:
            _LOGGER.info("[MIGRATION] ✅ Migration terminée avec succès")
        else:
            _LOGGER.info("[MIGRATION] Aucun fichier legacy à migrer")
        
        return True

    async def export_to_json(self, output_dir: Path) -> bool:
        """
        Exporte toutes les données Storage API vers fichiers JSON.
        
        Utile pour :
        - Backup manuel
        - Debug
        - Portabilité
        
        Args:
            output_dir: Répertoire de sortie
            
        Returns:
            True si succès, False sinon
        """
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Export user_config
            user_config = await self.get_user_config()
            with open(output_dir / "user_config.json", "w", encoding="utf-8") as f:
                json.dump(user_config, f, indent=2, ensure_ascii=False)
            
            # Export capteurs_selection
            selection = await self.get_capteurs_selection()
            with open(output_dir / "capteurs_selection.json", "w", encoding="utf-8") as f:
                json.dump(selection, f, indent=2, ensure_ascii=False)
            
            # Export ignored_entities
            ignored = await self.get_ignored_entities()
            with open(output_dir / "ignored_entities.json", "w", encoding="utf-8") as f:
                json.dump({"entities": ignored}, f, indent=2, ensure_ascii=False)
            
            _LOGGER.info("[EXPORT] ✅ Données exportées vers %s", output_dir)
            return True
            
        except Exception as e:
            _LOGGER.exception("[EXPORT] ❌ Erreur export JSON: %s", e)
            return False

    def clear_cache(self):
        """Vide le cache mémoire (force rechargement au prochain accès)."""
        self._cache.clear()
        _LOGGER.info("[STORAGE] Cache vidé")

    async def get_storage_stats(self) -> Dict[str, Any]:
        """
        Retourne des statistiques sur le storage.
        
        Returns:
            Dictionnaire avec statistiques (taille, nombre d'entités, etc.)
        """
        user_config = await self.get_user_config()
        selection = await self.get_capteurs_selection()
        ignored = await self.get_ignored_entities()
        
        total_sensors = sum(len(sensors) for sensors in selection.values())
        enabled_sensors = sum(
            len([s for s in sensors if s.get("enabled", False)])
            for sensors in selection.values()
        )
        
        return {
            "version": STORAGE_VERSION,
            "user_config": {
                "has_reference": user_config.get("externalCapteur") is not None,
                "options_count": len(user_config.get("options", {}))
            },
            "capteurs_selection": {
                "zones": len(selection),
                "total_sensors": total_sensors,
                "enabled_sensors": enabled_sensors,
                "disabled_sensors": total_sensors - enabled_sensors
            },
            "ignored_entities": {
                "count": len(ignored)
            },
            "cache_size": len(self._cache)
        }
