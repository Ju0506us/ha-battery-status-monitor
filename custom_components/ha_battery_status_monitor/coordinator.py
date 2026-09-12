from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import (
    CONF_CRITICAL_THRESHOLD,
    CONF_DEVICE_IDS,
    CONF_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_THRESHOLD,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_WARNING_THRESHOLD,
    STATUS_CRITICAL,
    STATUS_NORMAL,
    STATUS_UNAVAILABLE,
    STATUS_WEAK,
)

_LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class BatteryItem:
    device_id: str
    device_name: str
    entity_id: str
    status: str
    value: float | None
    display_value: str
    kind: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "device_id": self.device_id,
            "device_name": self.device_name,
            "entity_id": self.entity_id,
            "status": self.status,
            "value": self.value,
            "display_value": self.display_value,
            "kind": self.kind,
        }


class BatteryMonitorCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.entry = entry
        self.device_ids: set[str] = set(entry.options.get(CONF_DEVICE_IDS, entry.data[CONF_DEVICE_IDS]))
        self.warning_threshold = int(entry.options.get(CONF_WARNING_THRESHOLD, entry.data.get(CONF_WARNING_THRESHOLD, DEFAULT_WARNING_THRESHOLD)))
        self.critical_threshold = int(entry.options.get(CONF_CRITICAL_THRESHOLD, entry.data.get(CONF_CRITICAL_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD)))
        super().__init__(hass, logger=_LOGGER, name="HA Battery Status Monitor", update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL))
        self._unsub_state_changed = None

    async def async_config_entry_first_refresh(self) -> None:
        await self.async_refresh()
        self._subscribe_to_entities()

    @callback
    def async_unload(self) -> None:
        if self._unsub_state_changed:
            self._unsub_state_changed()
            self._unsub_state_changed = None

    @callback
    def _subscribe_to_entities(self) -> None:
        if self._unsub_state_changed:
            self._unsub_state_changed()
        entity_ids = self._battery_entities()
        if not entity_ids:
            self._unsub_state_changed = None
            return
        from homeassistant.helpers.event import async_track_state_change_event
        self._unsub_state_changed = async_track_state_change_event(self.hass, entity_ids, self._async_state_changed)

    @callback
    def _async_state_changed(self, _event) -> None:
        self.hass.async_create_task(self.async_refresh())

    @callback
    def _battery_entities(self) -> list[str]:
        entity_registry = er.async_get(self.hass)
        return [
            entity.entity_id
            for entity in entity_registry.entities.values()
            if entity.device_id in self.device_ids
            and entity.domain in ("sensor", "binary_sensor")
            and self._is_battery_entity(entity)
        ]

    @staticmethod
    def _is_battery_entity(entity: er.RegistryEntry) -> bool:
        # Use both the current and original device class. Some integrations
        # keep the battery class in original_device_class while the current
        # registry value is unset. The config-flow device selector already
        # uses the same rule, so detection must stay consistent here.
        if entity.device_class == "battery" or entity.original_device_class == "battery":
            return True
        if entity.domain == "binary_sensor":
            object_id = entity.entity_id.rsplit(".", 1)[-1]
            return "battery" in object_id or "low_battery" in object_id
        return False

    async def _async_update_data(self) -> dict[str, Any]:
        device_registry = dr.async_get(self.hass)
        entity_registry = er.async_get(self.hass)
        candidates: dict[str, list[BatteryItem]] = {}

        for entity_id in self._battery_entities():
            registry_entry = entity_registry.async_get(entity_id)
            if registry_entry is None or registry_entry.device_id is None:
                continue
            device = device_registry.async_get(registry_entry.device_id)
            state = self.hass.states.get(entity_id)
            if device is None or state is None:
                continue
            item = self._build_item(
                registry_entry.device_id,
                device.name_by_user or device.name or entity_id,
                entity_id,
                state.state,
            )
            candidates.setdefault(item.device_id, []).append(item)

        items = [self._select_best_item(items) for items in candidates.values()]
        counts = {
            STATUS_NORMAL: sum(item.status == STATUS_NORMAL for item in items),
            STATUS_WEAK: sum(item.status == STATUS_WEAK for item in items),
            STATUS_CRITICAL: sum(item.status == STATUS_CRITICAL for item in items),
            STATUS_UNAVAILABLE: sum(item.status == STATUS_UNAVAILABLE for item in items),
        }
        return {
            "items": [item.as_dict() for item in items],
            "counts": counts,
            "total": len(items),
            "warning_threshold": self.warning_threshold,
            "critical_threshold": self.critical_threshold,
        }

    @staticmethod
    def _select_best_item(items: list[BatteryItem]) -> BatteryItem:
        return sorted(
            items,
            key=lambda item: (
                item.kind == "percentage" and item.status != STATUS_UNAVAILABLE,
                item.kind == "binary" and item.status != STATUS_UNAVAILABLE,
                item.kind == "percentage",
            ),
            reverse=True,
        )[0]

    def _build_item(self, device_id: str, device_name: str, entity_id: str, state: str) -> BatteryItem:
        if state in ("unknown", "unavailable"):
            return BatteryItem(device_id, device_name, entity_id, STATUS_UNAVAILABLE, None, "Nicht erreichbar", "unavailable")

        try:
            value = float(state)
        except (TypeError, ValueError):
            if state in ("on", "off"):
                status = STATUS_CRITICAL if state == "on" else STATUS_NORMAL
                display = "Batterie schwach" if state == "on" else "Normal"
                return BatteryItem(device_id, device_name, entity_id, status, None, display, "binary")
            return BatteryItem(device_id, device_name, entity_id, STATUS_UNAVAILABLE, None, "Nicht erreichbar", "unavailable")

        if value <= self.critical_threshold:
            status = STATUS_CRITICAL
        elif value <= self.warning_threshold:
            status = STATUS_WEAK
        else:
            status = STATUS_NORMAL
        return BatteryItem(device_id, device_name, entity_id, status, value, f"{value:g} %", "percentage")
