from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector

from .const import (
    CONF_CRITICAL_THRESHOLD,
    CONF_DEVICE_IDS,
    CONF_WARNING_THRESHOLD,
    DEFAULT_CRITICAL_THRESHOLD,
    DEFAULT_WARNING_THRESHOLD,
    DOMAIN,
)


class BatteryMonitorConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            title = "Battery Monitor"
            return self.async_create_entry(
                title=title,
                data={
                    CONF_DEVICE_IDS: user_input[CONF_DEVICE_IDS],
                    CONF_WARNING_THRESHOLD: user_input[CONF_WARNING_THRESHOLD],
                    CONF_CRITICAL_THRESHOLD: user_input[CONF_CRITICAL_THRESHOLD],
                },
            )

        schema = vol.Schema(
            {
                vol.Required(CONF_DEVICE_IDS): selector.DeviceSelector(
                    selector.DeviceSelectorConfig(multiple=True)
                ),
                vol.Required(
                    CONF_WARNING_THRESHOLD, default=DEFAULT_WARNING_THRESHOLD
                ): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
                vol.Required(
                    CONF_CRITICAL_THRESHOLD, default=DEFAULT_CRITICAL_THRESHOLD
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=99)),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema)

    @staticmethod
    def async_get_options_flow(config_entry: config_entries.ConfigEntry):
        return BatteryMonitorOptionsFlow(config_entry)


class BatteryMonitorOptionsFlow(config_entries.OptionsFlow):
    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self.config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_DEVICE_IDS,
                    default=self.config_entry.data.get(CONF_DEVICE_IDS, []),
                ): selector.DeviceSelector(
                    selector.DeviceSelectorConfig(multiple=True)
                ),
                vol.Required(
                    CONF_WARNING_THRESHOLD,
                    default=self.config_entry.options.get(
                        CONF_WARNING_THRESHOLD,
                        self.config_entry.data.get(
                            CONF_WARNING_THRESHOLD, DEFAULT_WARNING_THRESHOLD
                        ),
                    ),
                ): vol.All(vol.Coerce(int), vol.Range(min=1, max=100)),
                vol.Required(
                    CONF_CRITICAL_THRESHOLD,
                    default=self.config_entry.options.get(
                        CONF_CRITICAL_THRESHOLD,
                        self.config_entry.data.get(
                            CONF_CRITICAL_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD
                        ),
                    ),
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=99)),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
