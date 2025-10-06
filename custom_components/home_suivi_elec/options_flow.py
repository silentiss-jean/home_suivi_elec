from homeassistant import config_entries
import voluptuous as vol
from .const import DOMAIN, CONTRATS, DEFAULTS, CONF_TYPE_CONTRAT, CONF_AUTO_GENERATE
from .helpers.validation import validate_time

class HomeSuiviElecOptionsFlow(config_entries.OptionsFlow):
    """Options flow pour Home Suivi Élec."""

    def __init__(self, config_entry):
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        data = self.config_entry.options or {}
        schema = vol.Schema({
            vol.Optional(CONF_TYPE_CONTRAT, default=data.get(CONF_TYPE_CONTRAT, "prix_unique")): vol.In(CONTRATS.keys()),
            vol.Optional(CONF_AUTO_GENERATE, default=data.get(CONF_AUTO_GENERATE, True)): bool,
        })
        return self.async_show_form(step_id="init", data_schema=schema)
