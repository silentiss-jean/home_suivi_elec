"""
Gestionnaire universel des noms d'entités HSE.
- Maintient un mapping portable short_name ↔ display_name
- Se remplit automatiquement à la création de capteurs
- Expose des helpers pour UI/Backend
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

_LOGGER = logging.getLogger(__name__)

class EntityNameRegistry:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = Path(data_dir)
        self.registry_file = self.data_dir / "entity_name_registry.json"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._registry = self._load()

    def _load(self) -> Dict[str, Any]:
        if not self.registry_file.exists():
            return {"version": "1.0", "created": datetime.now().isoformat(), "entries": {}}
        try:
            with open(self.registry_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            _LOGGER.warning("[ENTITY-NAME-REGISTRY] Erreur lecture: %s", e)
            return {"version": "1.0", "created": datetime.now().isoformat(), "entries": {}}

    def _save(self) -> None:
        try:
            with open(self.registry_file, "w", encoding="utf-8") as f:
                json.dump(self._registry, f, indent=2, ensure_ascii=False)
        except Exception as e:
            _LOGGER.error("[ENTITY-NAME-REGISTRY] Erreur sauvegarde: %s", e)

    def _humanize(self, name: str) -> str:
        txt = name.replace("sensor.", "").replace("_today_energy", "").replace("_current_power", "")
        repl = {
            "prise connectee": "prise connectée",
            "televiseur": "téléviseur",
            "canape": "canapé",
            "energie": "énergie",
        }
        low = txt.replace("_", " ").lower()
        for k, v in repl.items():
            low = low.replace(k, v)
        return " ".join(w.capitalize() for w in low.split())

    def register(self, source_entity_id: str, short_name: str, *, display_hint: Optional[str] = None, meta: Optional[Dict[str, Any]] = None) -> str:
        display = display_hint or self._humanize(source_entity_id)
        self._registry.setdefault("entries", {})[short_name] = {
            "source_entity_id": source_entity_id,
            "display_name": display,
            "meta": meta or {},
            "created_at": datetime.now().isoformat(),
        }
        self._save()
        _LOGGER.debug("[ENTITY-NAME-REGISTRY] %s → %s", short_name, display)
        return display

    def get_display(self, short_name: str, fallback: Optional[str] = None) -> str:
        entry = self._registry.get("entries", {}).get(short_name)
        if entry:
            return entry.get("display_name") or fallback or short_name
        return fallback or short_name

    def mappings(self) -> Dict[str, str]:
        return {k: v.get("display_name", k) for k, v in self._registry.get("entries", {}).items()}

    def stats(self) -> Dict[str, Any]:
        return {
            "total": len(self._registry.get("entries", {})),
            "version": self._registry.get("version"),
            "created": self._registry.get("created"),
        }
