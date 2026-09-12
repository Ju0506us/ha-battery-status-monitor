from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.config_entries import OptionsFlowWithReload
from homeassistant.helpers import selector

from .const import (
    CONF_CRITICAL_THRESHOLD,
    CONF_DEVICE_IDS,
    CONF_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_THRESHOLD,
    DEFAULT_WARNING_THRESHOLD,
    DOMAIN,
)


def _device_schema(default: list[str] | None = None) -> vol.Schema:
    if default is None:
        key = vol.Required(CONF_DEVICE_IDS)
    else:
        key = vol.Required(CONF_DEVICE_IDS, default=default)

    return vol.Schema(
        {
            key: selector.DeviceSelector(
                selector.DeviceSelectorConfig(multiple=True)
            )
        }
    )


def _threshold_schema(
    warning_default: int,
    critical_default: int,
) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(
                CONF_WARNING_THRESHOLD,
                default=warning_default,
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=1,
                    max=100,
                    step=1,
                    mode=selector.NumberSelectorMode.SLIDER,
                    unit_of_measurement="%",
                )
            ),
            vol.Required(
                CONF_CRITICAL_THRESHOLD,
                default=critical_default,
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(
                    min=0,
                    max=99,
                    step=1,
                    mode=selector.NumberSelectorMode.SLIDER,
                    unit_of_measurement="%",
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
            return await self.async_step_thresholds()

        return self.async_show_form(
            step_id="user",
            data_schema=_device_schema(),
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
        if user_input is not None:
            self._device_ids = list(user_input[CONF_DEVICE_IDS])
            return await self.async_step_thresholds()

        default_devices = list(
            self.config_entry.options.get(
                CONF_DEVICE_IDS,
                self.config_entry.data.get(CONF_DEVICE_IDS, []),
            )
        )

        return self.async_show_form(
            step_id="init",
            data_schema=_device_schema(default_devices),
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
