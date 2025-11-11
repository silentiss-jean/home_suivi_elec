# -*- coding: utf-8 -*-
"""Constantes globales pour Home Suivi Élec."""

DOMAIN = "home_suivi_elec"
FICHIER_CAPTEURS = "custom_components/home_suivi_elec/data/capteurs_detectes.json"

# Champs ConfigFlow / Options
CONF_NAME = "name"
CONF_MODE = "mode"
CONF_URL = "base_url"
CONF_TYPE_CONTRAT = "type_contrat"
CONF_PRIX_HT = "prix_ht"
CONF_PRIX_TTC = "prix_ttc"
CONF_PRIX_HT_HP = "prix_ht_hp"
CONF_PRIX_TTC_HP = "prix_ttc_hp"
CONF_PRIX_HT_HC = "prix_ht_hc"
CONF_PRIX_TTC_HC = "prix_ttc_hc"
CONF_ABONNEMENT_MENSUEL_HT = "abonnement_ht"
CONF_ABONNEMENT_MENSUEL_TTC = "abonnement_ttc"
CONF_HC_START = "hc_start"
CONF_HC_END = "hc_end"
CONF_AUTO_GENERATE = "auto_generate_lovelace"

CONTRATS = {
    "prix_unique": "Tarif unique",
    "heures_creuses": "Heures Pleines / Creuses"
}

# Valeurs par défaut
DEFAULTS = {
    "prix_unique": {
        CONF_PRIX_HT: 0.1327,
        CONF_PRIX_TTC: 0.1952,
        CONF_ABONNEMENT_MENSUEL_HT: 13.7900,
        CONF_ABONNEMENT_MENSUEL_TTC: 19.7910
    },
    "heures_creuses": {
        CONF_PRIX_HT_HP: 0.1327,
        CONF_PRIX_TTC_HP: 0.1952,
        CONF_PRIX_HT_HC: 0.1327,
        CONF_PRIX_TTC_HC: 0.1952,
        CONF_ABONNEMENT_MENSUEL_HT: 13.7900,
        CONF_ABONNEMENT_MENSUEL_TTC: 19.7910,
        CONF_HC_START: "22:00",
        CONF_HC_END: "06:00"
    }
}

# ===== PHASE 2: PATTERNS HSE CENTRALISÉS =====

# Cycles supportés (noms complets Phase 2)
HSE_CYCLES = ["hourly", "daily", "weekly", "monthly", "yearly"]
HSE_CYCLE_SUFFIXES = [f"_{cycle}" for cycle in HSE_CYCLES]

# Patterns de détection HSE energy sensors  
HSE_SENSOR_PREFIX = "sensor.hse_"
HSE_ENERGY_SENSOR_PREFIX = "sensor.hse_energy_"

# Fonction centralisée : construction ID HSE
def build_hse_sensor_id(base_name: str, cycle: str, source_entity_id: str) -> str:
    """Construit ID HSE selon conventions Phase 2.
    
    Args:
        base_name: Nom de base (ex: chambre_tv_prise_connectee_today_energy)
        cycle: Cycle complet (hourly, daily, weekly, monthly, yearly)
        source_entity_id: ID capteur source pour détecter le type
    
    Returns:
        sensor.hse_{base_name}_{cycle} pour today_energy sources
        sensor.hse_energy_{base_name}_{cycle} pour autres sources energy
    """
    if cycle not in HSE_CYCLES:
        raise ValueError(f"Cycle invalide: {cycle}. Cycles supportés: {HSE_CYCLES}")
    
    if "today_energy" in source_entity_id:
        return f"sensor.hse_{base_name}_{cycle}"
    else:
        return f"sensor.hse_energy_{base_name}_{cycle}"

# Fonction centralisée : extraction cycle depuis ID
def extract_cycle_from_hse_id(entity_id: str) -> str:
    """Extrait cycle depuis ID HSE (Phase 2).
    
    Args:
        entity_id: ID capteur HSE (sensor.hse_*_{cycle})
    
    Returns:
        Nom du cycle (hourly, daily, etc.) ou "unknown" si non trouvé
    """
    for cycle in HSE_CYCLES:
        if entity_id.endswith(f"_{cycle}"):
            return cycle
    return "unknown"

# Fonction centralisée : détection HSE sensors
def is_hse_sensor(entity_id: str) -> bool:
    """Détermine si entity_id est un capteur HSE energy.
    
    Returns:
        True si sensor.hse_*_{cycle} ou sensor.hse_energy_*_{cycle}
    """
    if not entity_id.startswith((HSE_SENSOR_PREFIX, HSE_ENERGY_SENSOR_PREFIX)):
        return False
    return entity_id.endswith(tuple(HSE_CYCLE_SUFFIXES))

# Events HSE
HSE_EVENT_SENSORS_READY = "hse_energy_sensors_ready"

# ===== FIN PATTERNS HSE =====

# ===== STORAGE API - PHASE 2.7 =====

# Clés de stockage Home Assistant Storage API (versionnées)
STORAGE_VERSION = 2
STORE_USER_CONFIG = "home_suivi_elec_user_config_v2"
STORE_CAPTEURS_SELECTION = "home_suivi_elec_capteurs_selection_v2"
STORE_IGNORED_ENTITIES = "home_suivi_elec_ignored_entities_v1"

# Event émis après migration Storage API réussie
HSE_EVENT_STORAGE_MIGRATED = "hse_storage_migrated"

# ===== FIN STORAGE API =====
