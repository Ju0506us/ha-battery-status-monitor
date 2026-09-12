from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.config_entries import OptionsFlowWithReload
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

from .const import (
    CONF_CRITICAL_THRESHOLD,
    CONF_DEVICE_IDS,
    CONF_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_THRESHOLD,
    DEFAULT_WARNING_THRESHOLD,
    DOMAIN,
)


def _get_battery_devices(hass) -> list[dict[str, str]]:
    """Return only devices that have at least one battery entity."""
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    device_ids: set[str] = set()

    for entry in entity_registry.entities.values():
        if entry.disabled_by or entry.device_id is None:
            continue
        if entry.domain not in ("sensor", "binary_sensor"):
            continue
        if entry.device_class == "battery" or entry.original_device_class == "battery":
            device_ids.add(entry.device_id)

    options: list[dict[str, str]] = []
    for device_id in device_ids:
        device = device_registry.async_get(device_id)
        if device is None:
            continue
        options.append(
            {
                "value": device_id,
                "label": device.name_by_user or device.name or device_id,
            }
        )

    return sorted(options, key=lambda item: item["label"].lower())


def _device_schema(hass, default: list[str] | None = None) -> vol.Schema:
    """Build a checkbox list containing only battery-capable devices."""
    options = _get_battery_devices(hass)
    valid_ids = {option["value"] for option in options}
    current = [device_id for device_id in (default or []) if device_id in valid_ids]

    return vol.Schema(
        {
            vol.Required(CONF_DEVICE_IDS, default=current): SelectSelector(
                SelectSelectorConfig(
                    options=options,
                    multiple=True,
                    mode=SelectSelectorMode.LIST,
                )
            )
        }
    )


def _threshold_schema(warning_default: int, critical_default: int) -> vol.Schema:
    """Build threshold selectors with a visible numeric value and percent unit."""
    return vol.Schema(
        {
            vol.Required(
                CONF_WARNING_THRESHOLD,
                default=warning_default,
            ): NumberSelector(
                NumberSelectorConfig(
                    min=1,
                    max=100,
                    step=1,
                    unit_of_measurement="%",
                    mode=NumberSelectorMode.SLIDER,
                )
            ),
            vol.Required(
                CONF_CRITICAL_THRESHOLD,
                default=critical_default,
            ): NumberSelector(
                NumberSelectorConfig(
                    min=0,
                    max=99,
                    step=1,
                    unit_of_measurement="%",
                    mode=NumberSelectorMode.SLIDER,
                )
            ),
        }
    )


class BatteryMonitorConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        self._device_ids: list[str] = []

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            self._device_ids = list(user_input[CONF_DEVICE_IDS])
            if not self._device_ids:
                return self.async_show_form(
                    step_id="user",
                    data_schema=_device_schema(self.hass),
                    errors={"base": "no_devices"},
                )
            return await self.async_step_thresholds()

        return self.async_show_form(
            step_id="user",
            data_schema=_device_schema(self.hass),
        )

    async def async_step_thresholds(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            warning = int(user_input[CONF_WARNING_THRESHOLD])
            critical = int(user_input[CONF_CRITICAL_THRESHOLD])

            if critical >= warning:
                return self.async_show_form(
                    step_id="thresholds",
                    data_schema=_threshold_schema(warning, critical),
                    errors={"base": "invalid_thresholds"},
                )

            return self.async_create_entry(
                title="Battery Monitor",
                data={
                    CONF_DEVICE_IDS: self._device_ids,
                    CONF_WARNING_THRESHOLD: warning,
                    CONF_CRITICAL_THRESHOLD: critical,
                },
            )

        return self.async_show_form(
            step_id="thresholds",
            data_schema=_threshold_schema(
                DEFAULT_WARNING_THRESHOLD,
                DEFAULT_CRITICAL_THRESHOLD,
            ),
        )

    @staticmethod
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        return BatteryMonitorOptionsFlow()


class BatteryMonitorOptionsFlow(OptionsFlowWithReload):
    def __init__(self) -> None:
        self._device_ids: list[str] = []

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        default_devices = list(
            self.config_entry.options.get(
                CONF_DEVICE_IDS,
                self.config_entry.data.get(CONF_DEVICE_IDS, []),
            )
        )

        if user_input is not None:
            self._device_ids = list(user_input[CONF_DEVICE_IDS])
            if not self._device_ids:
                return self.async_show_form(
                    step_id="init",
                    data_schema=_device_schema(self.hass, default_devices),
                    errors={"base": "no_devices"},
                )
            return await self.async_step_thresholds()

        return self.async_show_form(
            step_id="init",
            data_schema=_device_schema(self.hass, default_devices),
        )

    async def async_step_thresholds(self, user_input: dict[str, Any] | None = None):
        warning_default = int(
            self.config_entry.options.get(
                CONF_WARNING_THRESHOLD,
                self.config_entry.data.get(
                    CONF_WARNING_THRESHOLD,
                    DEFAULT_WARNING_THRESHOLD,
                ),
            )
        )
        critical_default = int(
            self.config_entry.options.get(
                CONF_CRITICAL_THRESHOLD,
                self.config_entry.data.get(
                    CONF_CRITICAL_THRESHOLD,
                    DEFAULT_CRITICAL_THRESHOLD,
                ),
            )
        )

        if user_input is not None:
            warning = int(user_input[CONF_WARNING_THRESHOLD])
            critical = int(user_input[CONF_CRITICAL_THRESHOLD])

            if critical >= warning:
                return self.async_show_form(
                    step_id="thresholds",
                    data_schema=_threshold_schema(warning, critical),
                    errors={"base": "invalid_thresholds"},
                )

            return self.async_create_entry(
                title="",
                data={
                    CONF_DEVICE_IDS: self._device_ids,
                    CONF_WARNING_THRESHOLD: warning,
                    CONF_CRITICAL_THRESHOLD: critical,
                },
            )

        return self.async_show_form(
            step_id="thresholds",
            data_schema=_threshold_schema(warning_default, critical_default),
        )
