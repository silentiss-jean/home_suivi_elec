# -*- coding: utf-8 -*-
"""Constantes globales pour l'intégration Home Suivi Élec."""

DOMAIN = "home_suivi_elec"
FICHIER_CAPTEURS = "custom_components/home_suivi_elec/data/capteurs_detectes.json"

CONF_MODE = "mode"
CONF_URL = "base_url"
CONF_TYPE_CONTRAT = "type_contrat"
CONF_PRIX_HT = "prix_ht"
CONF_PRIX_HT_HP = "prix_ht_hp"
CONF_PRIX_HT_HC = "prix_ht_hc"
CONF_ABONNEMENT_MENSUEL_HT = "abonnement_ht"
CONF_ABONNEMENT_MENSUEL_TTC = "abonnement_ttc"
CONF_AUTO_GENERATE = "auto_generate_lovelace"

CONTRATS = {
    "prix_unique": "Tarif unique",
    "heures_creuses": "Heures Pleines / Creuses"
}
