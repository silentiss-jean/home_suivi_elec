# -*- coding: utf-8 -*-
"""
Gestion dynamique Utility Meter pour Home Assistant.
Écrit le package YAML complet dans /config/packages/home_suivi_elec_utility_meter.yaml
DEBUG : logs détaillés ajoutés pour tout le process !
"""

import os
import yaml
import shutil
import logging
import asyncio

_LOGGER = logging.getLogger(__name__)

# Dossier packages par défaut
PACKAGES_DIR = "/config/packages"
PACKAGE_PATH = os.path.join(PACKAGES_DIR, "home_suivi_elec_utility_meter.yaml")
BACKUP_PATH = os.path.join(PACKAGES_DIR, "home_suivi_elec_utility_meter.yaml.bak")

UTILITY_METER_CYCLES = ["hourly", "daily", "weekly", "monthly", "yearly"]

def get_meter_name(entity_id: str, cycle: str) -> str:
    return f"hse_{entity_id.replace('.', '_')}_{cycle}"

def build_utility_meter_yaml(selected_entity_ids):
    utility_meter = {}
    for entity_id in selected_entity_ids:
        if not entity_id:
            _LOGGER.warning(f"[DEBUG] Capteur ignoré: entity_id manquant ou vide: {entity_id!r}")
            continue
        for cycle in UTILITY_METER_CYCLES:
            name = get_meter_name(entity_id, cycle)
            utility_meter[name] = {
                "source": entity_id,
                "cycle": cycle
            }
    _LOGGER.info(f"[DEBUG] YAML généré : {utility_meter.keys()}")
    return {"utility_meter": utility_meter}

def _backup_package_file():
    if os.path.exists(PACKAGE_PATH):
        shutil.copyfile(PACKAGE_PATH, BACKUP_PATH)
        _LOGGER.info(f"[Backup] Copie avant modification : {BACKUP_PATH}")

def _write_yaml_sync(data):
    os.makedirs(PACKAGES_DIR, exist_ok=True)
    with open(PACKAGE_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False)
    _LOGGER.info(f"[YAML] Fichier écrit : {PACKAGE_PATH}")

async def write_yaml_package(data):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _write_yaml_sync, data)

async def sync_utility_meters(selected_entity_ids):
    # LOG INPUT
    _LOGGER.info(f"[DEBUG] Appel sync_utility_meters avec sélection : {selected_entity_ids} (type : {type(selected_entity_ids)})")
    _backup_package_file()
    yaml_data = build_utility_meter_yaml(selected_entity_ids)
    _LOGGER.info(f"[DEBUG] YAML prêt à écrire ({len(yaml_data['utility_meter'])} meters générés)...")
    await write_yaml_package(yaml_data)
    _LOGGER.info(f"[UtilityMeter] {len(selected_entity_ids)} capteurs pris en compte. Fichier mis à jour.")
    if not selected_entity_ids:
        _LOGGER.warning("[WARN] Aucun capteur sélectionné/valide à gérer ! Vérifier la logique ou la sélection utilisateur.")
    # Afficher un message/remonter à l'UI qu'un restart HA est nécessaire

def restore_backup():
    if os.path.exists(BACKUP_PATH):
        shutil.move(BACKUP_PATH, PACKAGE_PATH)
        _LOGGER.info("[Restore] Package restauré depuis le backup.")
