from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import device_registry as dr
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
        self.device_ids: set[str] = set(entry.data[CONF_DEVICE_IDS])
        self.warning_threshold = int(
            entry.options.get(
                CONF_WARNING_THRESHOLD,
                entry.data.get(CONF_WARNING_THRESHOLD, DEFAULT_WARNING_THRESHOLD),
            )
        )
        self.critical_threshold = int(
            entry.options.get(
                CONF_CRITICAL_THRESHOLD,
                entry.data.get(CONF_CRITICAL_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD),
            )
        )
        super().__init__(
            hass,
            logger=__import__("logging").getLogger(__name__),
            name="Battery Monitor",
            update_interval=__import__("datetime").timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self._unsub_state_changed = None

    async def async_config_entry_first_refresh(self) -> None:
        await self.async_refresh()
        self._subscribe_to_entities()

    @callback
    def _subscribe_to_entities(self) -> None:
        if self._unsub_state_changed:
            self._unsub_state_changed()

        entity_ids = self._battery_entities()
        if not entity_ids:
            self._unsub_state_changed = None
            return

        from homeassistant.helpers.event import async_track_state_change_event

        self._unsub_state_changed = async_track_state_change_event(
            self.hass, entity_ids, self._async_state_changed
        )

    @callback
    def _async_state_changed(self, _event) -> None:
        self.hass.async_create_task(self.async_refresh())

    @callback
    def _battery_entities(self) -> list[str]:
        entity_registry = er.async_get(self.hass)
        result: list[str] = []
        for entity in entity_registry.entities.values():
            if entity.device_id not in self.device_ids:
                continue
            if entity.domain not in ("sensor", "binary_sensor"):
                continue
            if self._is_battery_entity(entity):
                result.append(entity.entity_id)
        return result

    @staticmethod
    def _is_battery_entity(entity: er.RegistryEntry) -> bool:
        device_class = entity.device_class
        if device_class == "battery":
            return True
        # Some integrations expose a low-battery binary sensor without a
        # device class. Only accept an explicit battery/low_battery entity id.
        if entity.domain == "binary_sensor":
            object_id = entity.entity_id.rsplit(".", 1)[-1]
            return "battery" in object_id or "low_battery" in object_id
        return False

    async def _async_update_data(self) -> dict[str, Any]:
        device_registry = dr.async_get(self.hass)
        entity_registry = er.async_get(self.hass)
        items: list[BatteryItem] = []
        seen_devices: set[str] = set()

        for entity_id in self._battery_entities():
            registry_entry = entity_registry.async_get(entity_id)
            if registry_entry is None or registry_entry.device_id is None:
                continue

            device = device_registry.async_get(registry_entry.device_id)
            if device is None:
                continue

            # One device may expose both a percentage and a low-battery entity.
            # Prefer the percentage entity when available and avoid duplicates.
            state = self.hass.states.get(entity_id)
            if state is None:
                continue

            item = self._build_item(
                registry_entry.device_id,
                device.name_by_user or device.name or entity_id,
                entity_id,
                state.state,
            )
            if item is None:
                continue

            if item.device_id in seen_devices and item.kind == "binary":
                continue
            if item.device_id in seen_devices and item.kind == "percentage":
                items = [
                    existing
                    for existing in items
                    if existing.device_id != item.device_id
                ]
            items.append(item)
            seen_devices.add(item.device_id)

        counts = {status: 0 for status in (STATUS_NORMAL, STATUS_WEAK, STATUS_CRITICAL, STATUS_UNAVAILABLE)}
        for item in items:
            counts[item.status] += 1

        return {
            "items": [item.as_dict() for item in items],
            "counts": counts,
            "total": len(items),
            "warning_threshold": self.warning_threshold,
            "critical_threshold": self.critical_threshold,
        }

    def _build_item(
        self, device_id: str, device_name: str, entity_id: str, state: str
    ) -> BatteryItem | None:
        if state in ("unknown", "unavailable"):
            return BatteryItem(
                device_id, device_name, entity_id, STATUS_UNAVAILABLE, None,
                "Nicht erreichbar", "unavailable"
            )

        try:
            value = float(state)
        except (TypeError, ValueError):
            if state in ("on", "off"):
                status = STATUS_CRITICAL if state == "on" else STATUS_NORMAL
                return BatteryItem(
                    device_id, device_name, entity_id, status, None,
                    "Batterie schwach" if state == "on" else "Normal", "binary"
                )
            return BatteryItem(
                device_id, device_name, entity_id, STATUS_UNAVAILABLE, None,
                "Nicht erreichbar", "unavailable"
            )

        if value <= self.critical_threshold:
            status = STATUS_CRITICAL
        elif value <= self.warning_threshold:
            status = STATUS_WEAK
        else:
            status = STATUS_NORMAL

        return BatteryItem(
            device_id, device_name, entity_id, status, value,
            f"{value:g} %", "percentage"
        )
