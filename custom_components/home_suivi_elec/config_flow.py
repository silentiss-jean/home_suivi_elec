# custom_components/home_suivi_elec/config_flow.py
from homeassistant import config_entries
import voluptuous as vol
from .const import DOMAIN

class HomeSuiviElecFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow minimal pour Home Suivi Élec."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="Home Suivi Élec", data=user_input)

        # Schema vide mais valide
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({})  
        )