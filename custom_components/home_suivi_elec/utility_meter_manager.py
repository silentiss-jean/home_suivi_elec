from homeassistant.core import HomeAssistant

UTILITY_METER_CYCLES = ["hourly", "daily", "weekly", "monthly", "yearly"]

def get_meter_name(entity_id: str, cycle: str) -> str:
    # Donne un nom unique et conventionné style: hse_sensor_linky_power_daily
    return f"hse_{entity_id.replace('.', '_')}_{cycle}"

async def async_create_utility_meters(hass: HomeAssistant, entity_id: str):
    for cycle in UTILITY_METER_CYCLES:
        name = get_meter_name(entity_id, cycle)
        await hass.services.async_call(
            "utility_meter",
            "create",
            {
                "source": entity_id,
                "name": name,
                "cycle": cycle,
            },
            blocking=True,
        )

async def async_delete_utility_meters(hass: HomeAssistant, entity_id: str):
    for cycle in UTILITY_METER_CYCLES:
        name = get_meter_name(entity_id, cycle)
        await hass.services.async_call(
            "utility_meter",
            "delete",
            {
                "name": name,
            },
            blocking=True,
        )
