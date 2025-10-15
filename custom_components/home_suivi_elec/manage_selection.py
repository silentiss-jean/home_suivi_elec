# -*- coding: utf-8 -*-
"""Gestion REST des capteurs et options pour Home Suivi Élec."""

import os
import json
import logging
import asyncio
import yaml
from functools import partial
from homeassistant.core import HomeAssistant
from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry

from .utility_meter_manager import sync_utility_meters

_LOGGER = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")
USER_CONFIG_PATH = os.path.join(DATA_DIR, "user_config.json")

async def async_setup_selection_api(hass: HomeAssistant):
    """Expose les endpoints REST."""

    # === Endpoint capteurs ===
    class GetSensorsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_sensors"
        name = "api:home_suivi_elec:get_sensors"
        requires_auth = False

        async def get(self, request):
            try:
                if not os.path.exists(CAPTEURS_POWER_PATH):
                    _LOGGER.warning("[REST] capteurs_power.json introuvable")
                    return self.json({})
                loop = asyncio.get_running_loop()
                data = await loop.run_in_executor(None, partial(load_json, CAPTEURS_POWER_PATH))
                integrations = {}
                for c in data or []:
                    integ = c.get("integration", "unknown")
                    integrations.setdefault(integ, []).append({
                        "entity_id": c.get("entity_id"),
                        "friendly_name": c.get("friendly_name"),
                        "area": c.get("area"),
                        "unit": c.get("unit"),
                        "value": c.get("value") if c.get("value") is not None else 0,
                        "enabled": True,
                    })
                return self.json(integrations)
            except Exception as e:
                _LOGGER.exception("Erreur get_sensors: %s", e)
                return self.json({})

    # === Endpoint sélection & gestion Utility Meter ===
    class SaveSelectionView(HomeAssistantView):
        url = "/api/home_suivi_elec/save_selection"
        name = "api:home_suivi_elec:save_selection"
        requires_auth = False

        async def post(self, request):
            try:
                body = await request.json()
                _LOGGER.info(f"[DEBUG SEL] Chemin fichier sélection utilisé (pour sauvegarde): {CAPTEURS_SELECTION_PATH}")
                _LOGGER.info(f"[DEBUG SEL] POST /save_selection body reçu :\n{json.dumps(body, indent=2, ensure_ascii=False)}")
                os.makedirs(DATA_DIR, exist_ok=True)
                previous_selection = {}
                if os.path.exists(CAPTEURS_SELECTION_PATH):
                    loop = asyncio.get_running_loop()
                    previous_selection = await loop.run_in_executor(None, partial(load_json, CAPTEURS_SELECTION_PATH))
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, partial(save_json, CAPTEURS_SELECTION_PATH, body))
                _LOGGER.info("[REST] ✅ Sélection sauvegardée.")

                def extract_ids(selection_dict):
                    ids = set()
                    for integ, lst in selection_dict.items():
                        for c in lst:
                            _LOGGER.info(f"[DEBUG SEL] Candidat intégré/filtré : integration={integ}, entity_id={c.get('entity_id')}, enabled={c.get('enabled')}")
                            if c.get("enabled") and c.get("entity_id"):
                                ids.add(c.get("entity_id"))
                    return ids

                selected_ids = extract_ids(body)
                _LOGGER.info(f"[DEBUG SEL] selected_ids transmis à Utility Meter : {selected_ids} (type: {type(selected_ids)})")

                await sync_utility_meters(selected_ids)
                _LOGGER.info("[REST] ⚡️ Utility Meter YAML généré : restart Home Assistant pour prise en compte des capteurs.")

                return self.json({
                    "success": True,
                    "selected": list(selected_ids),
                    "need_restart": True
                })
            except Exception as e:
                _LOGGER.exception("Erreur save_selection: %s", e)
                return self.json({"success": False, "need_restart": False})

    # === Endpoint sélection ===
    class GetSelectionView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_selection"
        name = "api:home_suivi_elec:get_selection"
        requires_auth = False

        async def get(self, request):
            try:
                if not os.path.exists(CAPTEURS_SELECTION_PATH):
                    return self.json({})
                loop = asyncio.get_running_loop()
                data = await loop.run_in_executor(None, partial(load_json, CAPTEURS_SELECTION_PATH))
                return self.json(data)
            except Exception as e:
                _LOGGER.exception("Erreur get_selection: %s", e)
                return self.json({})

    # === Endpoint consommations (cumuls kWh) ===
    class GetConsumptionsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_consumptions"
        name = "api:home_suivi_elec:get_consumptions"
        requires_auth = False

        async def get(self, request):
            try:
                if not os.path.exists(CAPTEURS_SELECTION_PATH):
                    return self.json({})
                loop = asyncio.get_running_loop()
                selections = await loop.run_in_executor(None, partial(load_json, CAPTEURS_SELECTION_PATH))

                cycles = ["hourly", "daily", "weekly", "monthly", "yearly"]
                result = {}
                for integration, capteurs in selections.items():
                    for c in capteurs:
                        if c.get("enabled") and c.get("entity_id"):
                            capteur_id = c["entity_id"]
                            result[capteur_id] = {}
                            for cycle in cycles:
                                meter_name = f"sensor.hse_{capteur_id.replace('.', '_')}_{cycle}"
                                meter_state = hass.states.get(meter_name)
                                if meter_state:
                                    try:
                                        value = float(meter_state.state)
                                    except Exception:
                                        value = meter_state.state
                                else:
                                    value = None
                                result[capteur_id][cycle] = value

                return self.json(result)
            except Exception as e:
                _LOGGER.exception("Erreur get_consumptions: %s", e)
                return self.json({})

    # === Endpoint puissance instantanée (NOUVEAU) ===
    class GetInstantPowerView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_instant_puissance"
        name = "api:home_suivi_elec:get_instant_puissance"
        requires_auth = False

        async def get(self, request):
            try:
                if not os.path.exists(CAPTEURS_SELECTION_PATH):
                    return self.json({})
                loop = asyncio.get_running_loop()
                selection = await loop.run_in_executor(None, partial(load_json, CAPTEURS_SELECTION_PATH))
                entity_ids = []
                for capteurs in selection.values():
                    for c in capteurs:
                        if c.get("enabled") and c.get("entity_id"):
                            entity_ids.append(c["entity_id"])
                ext_id = None
                if os.path.exists(USER_CONFIG_PATH):
                    conf = await loop.run_in_executor(None, partial(load_json, USER_CONFIG_PATH))
                    ext_id = conf.get("externalCapteur")
                    if ext_id and ext_id not in entity_ids:
                        entity_ids.append(ext_id)

                power_states = {}
                for entity_id in entity_ids:
                    state = hass.states.get(entity_id)
                    try:
                        power_states[entity_id] = float(state.state)
                    except Exception:
                        power_states[entity_id] = None
                return self.json(power_states)
            except Exception as e:
                _LOGGER.exception("Erreur get_instant_puissance: %s", e)
                return self.json({})

    # === Configuration utilisateur / options ===
    class GetUserConfigView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_user_config"
        name = "api:home_suivi_elec:get_user_config"
        requires_auth = False

        async def get(self, request):
            try:
                if not os.path.exists(USER_CONFIG_PATH):
                    return self.json({})
                loop = asyncio.get_running_loop()
                data = await loop.run_in_executor(None, partial(load_json, USER_CONFIG_PATH))
                return self.json(data)
            except Exception as e:
                _LOGGER.exception("Erreur get_user_config: %s", e)
                return self.json({})

    class SaveUserConfigView(HomeAssistantView):
        url = "/api/home_suivi_elec/save_user_config"
        name = "api:home_suivi_elec:save_user_config"
        requires_auth = False

        async def post(self, request):
            try:
                body = await request.json()
                os.makedirs(DATA_DIR, exist_ok=True)
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, partial(save_json, USER_CONFIG_PATH, body))
                _LOGGER.info("[REST] 💾 Données utilisateur sauvegardées (JSON).")
                return self.json({"success": True})
            except Exception as e:
                _LOGGER.exception("Erreur save_user_config: %s", e)
                return self.json({"success": False})

    class GetUserOptionsView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_user_options"
        name = "api:home_suivi_elec:get_user_options"
        requires_auth = False

        async def get(self, request):
            try:
                entries = hass.config_entries.async_entries("home_suivi_elec")
                _LOGGER.debug("[REST] 🔍 ConfigEntry trouvée: %s", entries)
                if not entries:
                    return self.json({})

                entry: ConfigEntry = entries[0]

                data = dict(entry.data or {})
                opts = dict(entry.options or {})
                eff = {**data, **opts}

                # LOGGING pour debug
                _LOGGER.info("DEBUG ConfigEntry DATA: %s", data)
                _LOGGER.info("DEBUG ConfigEntry OPTIONS: %s", opts)
                _LOGGER.info("DEBUG EFF (fusion data+options): %s", eff)

                type_contrat = eff.get("type_contrat", "prix_unique")
                is_hc = type_contrat == "heures_creuses"
                type_ui = "hp-hc" if is_hc else "fixe"

                resp = {
                    "typeContrat": type_ui,
                    "abonnementHT": eff.get("abonnement_ht", 0),
                    "abonnementTTC": eff.get("abonnement_ttc", 0),
                    "prix_ht": eff.get("prix_ht", 0),
                    "prix_ttc": eff.get("prix_ttc", 0),
                    "prix_ht_hp": eff.get("prix_ht_hp", 0),
                    "prix_ttc_hp": eff.get("prix_ttc_hp", 0),
                    "prix_ht_hc": eff.get("prix_ht_hc", 0),
                    "prix_ttc_hc": eff.get("prix_ttc_hc", 0),
                    "hc_start": eff.get("hc_start", ""),
                    "hc_end": eff.get("hc_end", ""),
                    "useExternal": eff.get("useExternal", False),
                    "externalCapteur": eff.get("externalCapteur", ""),
                    "consommationExterne": eff.get("consommationExterne", 0),
                    "selection": eff.get("selection", {}),
                }
                return self.json(resp)

            except Exception as e:
                _LOGGER.exception("Erreur get_user_options: %s", e)
                return self.json({})

    class SaveUserOptionsView(HomeAssistantView):
        url = "/api/home_suivi_elec/save_user_options"
        name = "api:home_suivi_elec:save_user_options"
        requires_auth = False

        async def post(self, request):
            try:
                entries = hass.config_entries.async_entries("home_suivi_elec")
                if not entries:
                    return self.json({"success": False})
                entry: ConfigEntry = entries[0]
                body = await request.json()
                hass.config_entries.async_update_entry(entry, options=body)
                _LOGGER.info("[REST] ✅ Options utilisateur sauvegardées (ConfigEntry).")
                return self.json({"success": True})
            except Exception as e:
                _LOGGER.exception("Erreur save_user_options: %s", e)
                return self.json({"success": False})

    class GetSummaryView(HomeAssistantView):
        url = "/api/home_suivi_elec/get_summary"
        name = "api:home_suivi_elec:get_summary"
        requires_auth = False

        async def get(self, request):
            try:
                loop = asyncio.get_running_loop()
                power = await loop.run_in_executor(None, partial(load_json, CAPTEURS_POWER_PATH)) if os.path.exists(CAPTEURS_POWER_PATH) else []
                selection = await loop.run_in_executor(None, partial(load_json, CAPTEURS_SELECTION_PATH)) if os.path.exists(CAPTEURS_SELECTION_PATH) else {}
                total = len(power)
                selected = sum(len([c for c in v if c.get("enabled")]) for v in selection.values())
                return self.json({"total": total, "selected": selected})
            except Exception as e:
                _LOGGER.exception("Erreur get_summary: %s", e)
                return self.json({"total": 0, "selected": 0})

    # === Enregistrement des endpoints ===
    hass.http.register_view(GetSensorsView)
    hass.http.register_view(SaveSelectionView)
    hass.http.register_view(GetSelectionView)
    hass.http.register_view(GetConsumptionsView)
    hass.http.register_view(GetInstantPowerView)
    hass.http.register_view(GetUserConfigView)
    hass.http.register_view(SaveUserConfigView)
    hass.http.register_view(GetUserOptionsView)
    hass.http.register_view(SaveUserOptionsView)
    hass.http.register_view(GetSummaryView)
    _LOGGER.info("[REST] API capteurs et options prête.")

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
