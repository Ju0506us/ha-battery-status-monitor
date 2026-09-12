from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, STATUS_CRITICAL, STATUS_NORMAL, STATUS_UNAVAILABLE, STATUS_WEAK
from .coordinator import BatteryMonitorCoordinator


@dataclass(frozen=True, slots=True)
class BatterySensorDescription(SensorEntityDescription):
    status: str | None = None


DESCRIPTIONS = (
    BatterySensorDescription(key="total", name="Gesamt", icon="mdi:battery-medium"),
    BatterySensorDescription(
        key="normal",
        name="Normal",
        icon="mdi:battery-check",
        status=STATUS_NORMAL,
    ),
    BatterySensorDescription(
        key="weak",
        name="Schwach",
        icon="mdi:battery-low",
        status=STATUS_WEAK,
    ),
    BatterySensorDescription(
        key="critical",
        name="Kritisch",
        icon="mdi:battery-alert",
        status=STATUS_CRITICAL,
    ),
    BatterySensorDescription(
        key="unavailable",
        name="Nicht erreichbar",
        icon="mdi:battery-off",
        status=STATUS_UNAVAILABLE,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: Callable
) -> None:
    coordinator: BatteryMonitorCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        BatteryCountSensor(coordinator, entry, description)
        for description in DESCRIPTIONS
    )


class BatteryCountSensor(CoordinatorEntity[BatteryMonitorCoordinator], SensorEntity):
    _attr_native_unit_of_measurement = "Geräte"
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BatteryMonitorCoordinator,
        entry: ConfigEntry,
        description: BatterySensorDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="HA Battery Monitor",
            model="Battery Monitor",
        )

    @property
    def native_value(self) -> int:
        if self.entity_description.status is None:
            return int(self.coordinator.data.get("total", 0))
        return int(self.coordinator.data.get("counts", {}).get(self.entity_description.status, 0))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.coordinator.data
        items = data.get("items", [])
        if self.entity_description.status is not None:
            items = [
                item
                for item in items
                if item["status"] == self.entity_description.status
            ]
        return {
            "devices": items,
            "counts": data.get("counts", {}),
            "total": data.get("total", 0),
            "warning_threshold": data.get("warning_threshold"),
            "critical_threshold": data.get("critical_threshold"),
        }
