from homeassistant import config_entries
import voluptuous as vol
from homeassistant.helpers import config_validation as cv
import logging
from .const import (
    DOMAIN, CONTRATS, DEFAULTS,
    CONF_NAME, CONF_TYPE_CONTRAT, CONF_AUTO_GENERATE,
    CONF_PRIX_HT, CONF_PRIX_TTC,
    CONF_PRIX_HT_HP, CONF_PRIX_TTC_HP,
    CONF_PRIX_HT_HC, CONF_PRIX_TTC_HC,
    CONF_HC_START, CONF_HC_END,
    CONF_ABONNEMENT_MENSUEL_HT, CONF_ABONNEMENT_MENSUEL_TTC
)

_LOGGER = logging.getLogger(__name__)

class HomeSuiviElecOptionsFlow(config_entries.OptionsFlow):
    """Options flow pour Home Suivi Élec."""

    def __init__(self, config_entry):
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Afficher tous les champs avec valeurs par défaut neutres selon type de contrat."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        data = self.config_entry.options or {}

        # Type de contrat courant
        type_contrat = data.get(CONF_TYPE_CONTRAT, "prix_unique")

        # Valeurs par défaut
        defaults_unique = DEFAULTS.get("prix_unique", {})
        defaults_hc = DEFAULTS.get("heures_creuses", {})

        # Fusionner tout en gardant des valeurs neutres
        schema = vol.Schema({
            vol.Optional(CONF_NAME, default=data.get(CONF_NAME, self.config_entry.title)): str,
            vol.Optional(CONF_TYPE_CONTRAT, default=data.get(CONF_TYPE_CONTRAT, type_contrat)): vol.In(CONTRATS.keys()),
            vol.Optional(CONF_AUTO_GENERATE, default=data.get(CONF_AUTO_GENERATE, True)): bool,

            # Tarif unique
            vol.Optional(CONF_PRIX_HT, default=data.get(CONF_PRIX_HT, defaults_unique.get(CONF_PRIX_HT, 0.0))): cv.positive_float,
            vol.Optional(CONF_PRIX_TTC, default=data.get(CONF_PRIX_TTC, defaults_unique.get(CONF_PRIX_TTC, 0.0))): cv.positive_float,
            vol.Optional(CONF_ABONNEMENT_MENSUEL_HT, default=data.get(CONF_ABONNEMENT_MENSUEL_HT, defaults_unique.get(CONF_ABONNEMENT_MENSUEL_HT, 0.0))): cv.positive_float,
            vol.Optional(CONF_ABONNEMENT_MENSUEL_TTC, default=data.get(CONF_ABONNEMENT_MENSUEL_TTC, defaults_unique.get(CONF_ABONNEMENT_MENSUEL_TTC, 0.0))): cv.positive_float,

            # Heures Pleines / Creuses
            vol.Optional(CONF_PRIX_HT_HP, default=data.get(CONF_PRIX_HT_HP, defaults_hc.get(CONF_PRIX_HT_HP, 0.0))): cv.positive_float,
            vol.Optional(CONF_PRIX_TTC_HP, default=data.get(CONF_PRIX_TTC_HP, defaults_hc.get(CONF_PRIX_TTC_HP, 0.0))): cv.positive_float,
            vol.Optional(CONF_PRIX_HT_HC, default=data.get(CONF_PRIX_HT_HC, defaults_hc.get(CONF_PRIX_HT_HC, 0.0))): cv.positive_float,
            vol.Optional(CONF_PRIX_TTC_HC, default=data.get(CONF_PRIX_TTC_HC, defaults_hc.get(CONF_PRIX_TTC_HC, 0.0))): cv.positive_float,
            vol.Optional(CONF_HC_START, default=data.get(CONF_HC_START, defaults_hc.get(CONF_HC_START, ""))): cv.string,
            vol.Optional(CONF_HC_END, default=data.get(CONF_HC_END, defaults_hc.get(CONF_HC_END, ""))): cv.string,
        })

        return self.async_show_form(step_id="init", data_schema=schema)