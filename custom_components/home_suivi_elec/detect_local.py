# -*- coding: utf-8 -*-
import os
import json
import yaml
from typing import Any, Dict, List

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
_QUALITY_MAP_FILE = os.path.join(DATA_DIR, "integration_quality.yaml")
_CAPTEURS_FILE = os.path.join(DATA_DIR, "capteurs_power.json")

def __read_json_sync(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def __write_json_sync(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def __load_quality_map_sync() -> Dict[str, str]:
    if not os.path.exists(_QUALITY_MAP_FILE):
        return {}
    with open(_QUALITY_MAP_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
        return {str(k): str(v) for k, v in data.items()}

def __is_premium(quality_scale: str) -> bool:
    return quality_scale in ("platinum", "gold")

def __device_signature(c: Dict[str, Any]) -> str:
    name = (c.get("friendly_name") or c.get("nom") or "").strip().lower()
    zone = (c.get("zone") or "").strip().lower()
    return f"{name}|{zone}"

def __annotate_and_deduplicate(capteurs_raw: List[Dict[str, Any]], quality_map: Dict[str, str]) -> List[Dict[str, Any]]:
    for c in capteurs_raw:
        integ = c.get("integration")
        q = quality_map.get(integ, "custom")
        c["quality_scale"] = q
        c["is_premium"] = __is_premium(q)
    groups: Dict[str, List[Dict[str, Any]]] = {}
    for c in capteurs_raw:
        groups.setdefault(__device_signature(c), []).append(c)
    for group in groups.values():
        if len(group) > 1:
            ordered = sorted(group, key=lambda x: 0 if x.get("is_premium") else 1)
            main = ordered[0]
            main["is_duplicate"] = False
            main["is_main_duplicate"] = True
            main["disabled"] = False
            for d in ordered[1:]:
                d["is_duplicate"] = True
                d["is_main_duplicate"] = False
                d["duplicate_of"] = main.get("entity_id")
                d["disabled"] = True
        else:
            g0 = group[0]
            g0["is_duplicate"] = False
            g0["is_main_duplicate"] = True
            g0["disabled"] = False
    return capteurs_raw

async def run_detect_local(*args, **kwargs) -> List[Dict[str, Any]]:
    hass = kwargs.get("hass")

    if hass is None:
        quality_map = __load_quality_map_sync()
        capteurs_raw = __read_json_sync(_CAPTEURS_FILE) if os.path.exists(_CAPTEURS_FILE) else []
        capteurs_final = __annotate_and_deduplicate(capteurs_raw, quality_map)
        total = len(capteurs_final)
        duplicates = sum(1 for c in capteurs_final if c.get("is_duplicate"))
        enabled = sum(1 for c in capteurs_final if not c.get("disabled"))
        print(f"[DETECT] capteurs_total={total}, doublons={duplicates}, actifs={enabled}")  # log CLI
        __write_json_sync(_CAPTEURS_FILE, capteurs_final)
        return capteurs_final

    quality_map = await hass.async_add_executor_job(__load_quality_map_sync)
    capteurs_raw: List[Dict[str, Any]] = []
    if os.path.exists(_CAPTEURS_FILE):
        capteurs_raw = await hass.async_add_executor_job(__read_json_sync, _CAPTEURS_FILE)

    capteurs_final = __annotate_and_deduplicate(capteurs_raw, quality_map)

    # Log côté Core (via logger Home Assistant)
    try:
        total = len(capteurs_final)
        duplicates = sum(1 for c in capteurs_final if c.get("is_duplicate"))
        enabled = sum(1 for c in capteurs_final if not c.get("disabled"))
        # Utilise le logger global de l’intégration
        import logging
        _LOGGER = logging.getLogger("custom_components.home_suivi_elec")
        _LOGGER.info("[DETECT] capteurs_total=%s, doublons=%s, actifs=%s", total, duplicates, enabled)
    except Exception:
        pass

    await hass.async_add_executor_job(__write_json_sync, _CAPTEURS_FILE, capteurs_final)
    return capteurs_final

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_detect_local())
