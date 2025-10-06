# -*- coding: utf-8 -*-
"""Constantes globales pour Home Suivi Élec."""

DOMAIN = "home_suivi_elec"
FICHIER_CAPTEURS = "custom_components/home_suivi_elec/data/capteurs_detectes.json"

# Champs ConfigFlow / Options
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
