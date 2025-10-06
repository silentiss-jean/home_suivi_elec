from homeassistant import config_entries
import voluptuous as vol
from homeassistant.helpers import config_validation as cv

from .const import (
    DOMAIN, CONTRATS, DEFAULTS,
    CONF_TYPE_CONTRAT, CONF_AUTO_GENERATE,
    CONF_PRIX_HT, CONF_PRIX_TTC,
    CONF_PRIX_HT_HP, CONF_PRIX_TTC_HP,
    CONF_PRIX_HT_HC, CONF_PRIX_TTC_HC,
    CONF_ABONNEMENT_MENSUEL_HT, CONF_ABONNEMENT_MENSUEL_TTC,
    CONF_HC_START, CONF_HC_END
)
from .helpers.validation import validate_time

class HomeSuiviElecFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow pour Home Suivi Élec."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Formulaire principal pour type de contrat et option auto_generate."""
        if user_input is not None:
            self._user_data = user_input
            return await self.async_step_tarifs()

        schema = vol.Schema({
            vol.Required(CONF_TYPE_CONTRAT, default="prix_unique"): vol.In(CONTRATS.keys()),
            vol.Optional(CONF_AUTO_GENERATE, default=True): bool,
        })
        return self.async_show_form(step_id="user", data_schema=schema)

    async def async_step_tarifs(self, user_input=None):
        """Formulaire des tarifs selon le type de contrat choisi."""
        if user_input is not None:
            # Fusion avec données précédentes
            self._user_data.update(user_input)
            return self.async_create_entry(title="Home Suivi Élec", data=self._user_data)

        # Récupère le type de contrat choisi
        contrat = getattr(self, "_user_data", {}).get(CONF_TYPE_CONTRAT, "prix_unique")

        # Création du formulaire selon type contrat
        if contrat == "prix_unique":
            schema = vol.Schema({
                vol.Required(CONF_PRIX_HT, default=DEFAULTS["prix_unique"][CONF_PRIX_HT]): cv.positive_float,
                vol.Required(CONF_PRIX_TTC, default=DEFAULTS["prix_unique"][CONF_PRIX_TTC]): cv.positive_float,
                vol.Required(CONF_ABONNEMENT_MENSUEL_HT, default=DEFAULTS["prix_unique"][CONF_ABONNEMENT_MENSUEL_HT]): cv.positive_float,
                vol.Required(CONF_ABONNEMENT_MENSUEL_TTC, default=DEFAULTS["prix_unique"][CONF_ABONNEMENT_MENSUEL_TTC]): cv.positive_float,
            })
        else:  # heures_creuses
            schema = vol.Schema({
                vol.Required(CONF_PRIX_HT_HP, default=DEFAULTS["heures_creuses"][CONF_PRIX_HT_HP]): cv.positive_float,
                vol.Required(CONF_PRIX_TTC_HP, default=DEFAULTS["heures_creuses"][CONF_PRIX_TTC_HP]): cv.positive_float,
                vol.Required(CONF_PRIX_HT_HC, default=DEFAULTS["heures_creuses"][CONF_PRIX_HT_HC]): cv.positive_float,
                vol.Required(CONF_PRIX_TTC_HC, default=DEFAULTS["heures_creuses"][CONF_PRIX_TTC_HC]): cv.positive_float,
                vol.Required(CONF_HC_START, default=DEFAULTS["heures_creuses"][CONF_HC_START]): validate_time,
                vol.Required(CONF_HC_END, default=DEFAULTS["heures_creuses"][CONF_HC_END]): validate_time,
                vol.Required(CONF_ABONNEMENT_MENSUEL_HT, default=DEFAULTS["heures_creuses"][CONF_ABONNEMENT_MENSUEL_HT]): cv.positive_float,
                vol.Required(CONF_ABONNEMENT_MENSUEL_TTC, default=DEFAULTS["heures_creuses"][CONF_ABONNEMENT_MENSUEL_TTC]): cv.positive_float,
            })
        return self.async_show_form(step_id="tarifs", data_schema=schema)
