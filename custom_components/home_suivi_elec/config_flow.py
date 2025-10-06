# -*- coding: utf-8 -*-
"""Config flow minimal pour Home Suivi Élec."""
import logging
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

class HomeSuiviElecConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Gestion du ConfigFlow pour Home Suivi Élec."""

    VERSION = 1
    CONNECTION_CLASS = config_entries.CONN_CLASS_LOCAL_POLL

    async def async_step_user(self, user_input=None):
        """Premier écran du ConfigFlow (entrée utilisateur)."""
        errors = {}
        if user_input is not None:
            # On sauvegarde les données dans entry.data
            return self.async_create_entry(
                title="Home Suivi Élec",
                data={
                    "auto_generate_lovelace": user_input.get("auto_generate_lovelace", True),
                    "excluded_entities": user_input.get("excluded_entities", []),
                },
            )

        # Formulaire à afficher à l’utilisateur
        data_schema = vol.Schema(
            {
                vol.Optional("auto_generate_lovelace", default=True): bool,
                vol.Optional("excluded_entities", default=[]): list,
            }
        )
        return self.async_show_form(step_id="user", data_schema=data_schema, errors=errors)
