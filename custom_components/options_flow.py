# -*- coding: utf-8 -*-
"""Options Flow pour Home Suivi Élec — modification post-installation."""

import voluptuous as vol
from homeassistant import config_entries
from .const import (
    DOMAIN,
    CONTRATS,
    CONF_TYPE_CONTRAT,
    CONF_PRIX_HT, CONF_PRIX_TTC,
    CONF_PRIX_HT_HP, CONF_PRIX_TTC_HP,
    CONF_PRIX_HT_HC, CONF_PRIX_TTC_HC,
    CONF_ABONNEMENT_MENSUEL_HT, CONF_ABONNEMENT_MENSUEL_TTC,
    CONF_HC_START, CONF_HC_END,
    CONF_AUTO_GENERATE,
    DEFAULTS,
)

class HomeSuiviElecOptionsFlow(config_entries.OptionsFlow):
    """Permet de modifier les paramètres existants."""

    def __init__(self, config_entry):
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Page d'options principale."""
        data = {**DEFAULTS.get(self.config_entry.data.get(CONF_TYPE_CONTRAT, "prix_unique"), {}), **self.config_entry.options}

        schema = vol.Schema({
            vol.Required(CONF_TYPE_CONTRAT, default=self.config_entry.data.get(CONF_TYPE_CONTRAT, "prix_unique")): vol.In(CONTRATS),
            vol.Optional(CONF_PRIX_HT, default=data.get(CONF_PRIX_HT)): float,
            vol.Optional(CONF_PRIX_TTC, default=data.get(CONF_PRIX_TTC)): float,
            vol.Optional(CONF_PRIX_HT_HP, default=data.get(CONF_PRIX_HT_HP)): float,
            vol.Optional(CONF_PRIX_TTC_HP, default=data.get(CONF_PRIX_TTC_HP)): float,
            vol.Optional(CONF_PRIX_HT_HC, default=data.get(CONF_PRIX_HT_HC)): float,
            vol.Optional(CONF_PRIX_TTC_HC, default=data.get(CONF_PRIX_TTC_HC)): float,
            vol.Optional(CONF_HC_START, default=data.get(CONF_HC_START, "22:00")): str,
            vol.Optional(CONF_HC_END, default=data.get(CONF_HC_END, "06:00")): str,
            vol.Optional(CONF_ABONNEMENT_MENSUEL_HT, default=data.get(CONF_ABONNEMENT_MENSUEL_HT)): float,
            vol.Optional(CONF_ABONNEMENT_MENSUEL_TTC, default=data.get(CONF_ABONNEMENT_MENSUEL_TTC)): float,
            vol.Optional(CONF_AUTO_GENERATE, default=data.get(CONF_AUTO_GENERATE, True)): bool,
        })

        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(step_id="init", data_schema=schema)