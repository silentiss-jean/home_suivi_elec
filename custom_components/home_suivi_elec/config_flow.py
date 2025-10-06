from homeassistant import config_entries
from .const import DOMAIN

class HomeSuiviElecFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow minimal pour Home Suivi Élec."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="Home Suivi Élec", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema={}  # On pourra ajouter des champs plus tard (token, options, etc.)
        )