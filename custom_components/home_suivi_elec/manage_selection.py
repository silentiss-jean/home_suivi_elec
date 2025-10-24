# -*- coding: utf-8 -*-
"""
Gestion métier + index capteurs pour Home Suivi Élec.
- Index entity_id -> infos enrichies (device, qualité, référence)
- Exposition utilitaire async_get_capteurs_index pour __init__.py
- Enregistrement des vues REST depuis manage_selection_views.py
"""

import os
import json
import logging
import asyncio
import yaml
from functools import partial
from typing import Any, Dict, List, Optional

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er, device_registry as dr, area_registry as ar

_LOGGER = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")

CAPTEURS_POWER_PATH = os.path.join(DATA_DIR, "capteurs_power.json")
CAPTEURS_SELECTION_PATH = os.path.join(DATA_DIR, "capteurs_selection.json")
USER_CONFIG_PATH = os.path.join(DATA_DIR, "user_config.json")
QUALITY_MAP_PATH = os.path.join(DATA_DIR, "integration_quality.yaml")

__all__ = [
  "CAPTEURS_POWER_PATH", "CAPTEURS_SELECTION_PATH", "USER_CONFIG_PATH", "QUALITY_MAP_PATH",
  "async_get_capteurs_index", "async_setup_selection_api",
]

# Mémoire process: index rapide entity_id -> infos enrichies
_CAPTEURS_INDEX: Dict[str, Dict[str, Any]] = {}


def _load_json(path: str) -> Any:
  with open(path, "r", encoding="utf-8") as f:
    return json.load(f)

def _load_quality_map_sync() -> Dict[str, str]:
  if not os.path.exists(QUALITY_MAP_PATH):
    return {}               
  with open(QUALITY_MAP_PATH, "r", encoding="utf-8") as f:
    data = yaml.safe_load(f) or {}
    return {str(k): str(v) for k, v in data.items()}

def _normalize(v: Optional[str]) -> str:
  return (v or "").strip().lower()

def _is_premium(scale: str) -> bool:
  return scale in ("platinum", "gold")

def _enrich_base(c: Dict[str, Any], quality_map: Dict[str, str], reference_id: Optional[str]) -> Dict[str, Any]:
  c = dict(c)
  integ = c.get("integration")
  if "quality_scale" not in c:
    q = quality_map.get(integ, "custom")
    c["quality_scale"] = q
    c["is_premium"] = _is_premium(q)
  c["is_reference"] = (c.get("entity_id") == reference_id)
  return c

def _enrich_device_info(hass: HomeAssistant, caps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  ent_reg = er.async_get(hass)
  dev_reg = dr.async_get(hass)
  area_reg = ar.async_get(hass)

  for c in caps:
    eid = c.get("entity_id")
    if not eid:
      continue
    entry = ent_reg.async_get(eid)
    if not entry:
      continue

    c["device_id"] = entry.device_id
    c["area_id"] = entry.area_id

    dev = dev_reg.async_get(entry.device_id) if entry.device_id else None
    if dev:
      if not c.get("area_id"):
        c["area_id"] = dev.area_id
      c["device_identifiers"] = list(dev.identifiers) if dev.identifiers else []
      c["device_connections"] = list(dev.connections) if dev.connections else []
      c["device_name"] = dev.name_by_user or dev.name or ""
      c["manufacturer"] = dev.manufacturer or ""
      c["model"] = dev.model or ""

      if c.get("area_id"):
        area = area_reg.async_get_area(c["area_id"])
        if area:
          c["area_name"] = area.name
  return caps


async def async_get_capteurs_index(hass: HomeAssistant) -> Dict[str, Dict[str, Any]]:
  """Construit/retourne un index enrichi des capteurs de puissance."""
  global _CAPTEURS_INDEX

  if _CAPTEURS_INDEX:
    return _CAPTEURS_INDEX

  loop = asyncio.get_running_loop()
  detected = []
  if os.path.exists(CAPTEURS_POWER_PATH):
    detected = await loop.run_in_executor(None, lambda: _load_json(CAPTEURS_POWER_PATH))

  reference_id = None
  if os.path.exists(USER_CONFIG_PATH):
    try:
      user_config = await loop.run_in_executor(None, lambda: _load_json(USER_CONFIG_PATH))
      reference_id = (user_config or {}).get("externalCapteur")
    except Exception:
      reference_id = None

  quality_map = await loop.run_in_executor(None, _load_quality_map_sync)

  detected = _enrich_device_info(hass, detected or [])

  idx: Dict[str, Dict[str, Any]] = {}
  for c in detected or []:
    eid = c.get("entity_id")
    if not eid:
      continue
    idx[eid] = _enrich_base(c, quality_map, reference_id)

  _CAPTEURS_INDEX = idx
  hass.data.setdefault("home_suivi_elec", {})
  hass.data["home_suivi_elec"]["capteurs_index"] = idx
  return idx                


async def async_setup_selection_api(hass: HomeAssistant, sync_manager=None):
  """Enregistre les vues REST depuis le module dédié."""
  from .manage_selection_views import (
    GetSensorsView, SaveSelectionView, GetSelectionView,
    GetConsumptionsView, GetInstantPowerView,
    GetUserConfigView, SaveUserConfigView,
    GetUserOptionsView, SaveUserOptionsView,
    GetSummaryView,
  )

  hass.http.register_view(GetSensorsView(hass))
  hass.http.register_view(SaveSelectionView(hass))
  hass.http.register_view(GetSelectionView(hass))
  hass.http.register_view(GetConsumptionsView(hass))
  hass.http.register_view(GetInstantPowerView(hass))
  hass.http.register_view(GetUserConfigView(hass))
  hass.http.register_view(SaveUserOptionsView(hass))
  hass.http.register_view(GetUserOptionsView(hass))
  hass.http.register_view(GetSummaryView(hass))
  
  # ✅ PHASE 2.6: APIs de synchronisation
  if sync_manager:
    from .manage_selection_views import GetSyncStatusView, ForceSyncView
    hass.http.register_view(GetSyncStatusView(hass, sync_manager))
    hass.http.register_view(ForceSyncView(hass, sync_manager))
    _LOGGER.info("[REST] API capteurs + sync enregistrée")
  else:
    _LOGGER.info("[REST] API capteurs enregistrée (sync non disponible)")
