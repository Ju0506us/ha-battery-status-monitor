# HA Battery Status Monitor

A local Home Assistant integration for monitoring the battery status of selected devices, including a responsive, theme-aware Lovelace card.

> **Development status:** private / early V1. The project is currently being tested on a real Home Assistant installation and is not yet ready for public HACS distribution.

## Features

### Integration

- Configuration through the Home Assistant Config Flow
- Two-step setup:
  1. Select the devices to monitor
  2. Configure warning and critical thresholds
- Only devices with supported battery entities are shown in the device selection
- Multiple devices can be selected
- Battery entities are discovered automatically from the selected devices
- Numeric battery percentage sensors are supported
- Binary low-battery sensors are supported (`off` = normal, `on` = critical)
- `unknown` / `unavailable` battery states are reported as not reachable
- Multiple battery entities belonging to one device are combined into one device entry
- A usable percentage value is preferred over a binary battery state
- Five sensors are created for each HA Battery Status Monitor configuration:
  - Total
  - Normal
  - Weak
  - Critical
  - Not reachable
- Device names are used instead of cryptic entity IDs
- Configuration changes can be made through the integration options
- Default warning threshold: **20%**
- Default critical threshold: **10%**
- Local-only operation; no external service is required

### Battery status rules

| Input | Result |
|---|---|
| `> warning threshold` | Normal |
| `critical threshold + 1` to `warning threshold` | Weak |
| `1` to `critical threshold` | Critical |
| `unknown` / `unavailable` | Not reachable |
| binary `off` | Normal |
| binary `on` | Critical |

With the default thresholds this means:

- `> 20%` → Normal
- `11–20%` → Weak
- `1–10%` → Critical
- `unknown` / `unavailable` → Not reachable

## Lovelace card

The project includes the HA Battery Status Monitor Lovelace card in `www/battery-monitor-card.js`.

The card is designed to use Home Assistant theme variables instead of hard-coded colors. It therefore adapts to light mode, dark mode and custom Home Assistant themes and is designed for desktop, mobile and the Home Assistant Companion App.

### Interaction

The four status summaries are shown at the top:

- Normal
- Weak
- Critical
- Not reachable

Each status summary is clickable. Clicking a category shows the complete device list for that status directly below the summaries. Clicking the active category again, or using **Summary**, returns to the summary view.

### Summary mode

The default view can be set to **Summary**. In this mode the card shows the first **2 or 3 devices per selected category** below the status summaries.

The graphical card editor allows you to configure:

- the default view on startup: Summary, Normal, Weak, Critical or Not reachable
- whether 2 or 3 devices per category are shown in Summary mode
- which categories appear in Summary mode: all or only selected categories

Example:

```yaml
type: custom:battery-monitor-card
entity: sensor.ha_battery_status_monitor_gesamt
show_header: true
show_summary: true
default_view: summary
summary_limit: 2
summary_categories:
  - normal
  - weak
  - critical
  - unavailable
```

### Lovelace resource

```text
/local/battery-monitor-card.js
```

Register the resource as a JavaScript module (`module`).

## Installation during development

The repository is private while V1 is being tested.

### Integration

Copy the following directory to your Home Assistant configuration directory:

```text
/config/custom_components/ha_battery_status_monitor/
```

The directory must contain the integration files from:

```text
custom_components/ha_battery_status_monitor/
```

Restart Home Assistant afterwards and add **HA Battery Status Monitor** through:

**Settings → Devices & services → Add integration → HA Battery Status Monitor**

### Lovelace card

Copy:

```text
www/battery-monitor-card.js
```

to:

```text
/config/www/battery-monitor-card.js
```

Then add the JavaScript module as a Lovelace resource:

```text
/local/battery-monitor-card.js
```

The final HACS distribution layout will be defined before the first public release.

## Repository structure

```text
custom_components/ha_battery_status_monitor/
├── __init__.py
├── config_flow.py
├── const.py
├── coordinator.py
├── manifest.json
├── sensor.py
├── strings.json
└── translations/
    └── de.json

www/
└── battery-monitor-card.js
```

## Development

The project is intentionally being developed and tested incrementally against a real Home Assistant installation.

The current V1 foundation focuses on:

- reliable device selection
- correct battery-state classification
- device de-duplication
- configuration editing
- count sensors
- a theme-aware Lovelace card

Future versions may add notifications, recovery/status-change events, history, battery age, last-update information and more advanced automation features.

## Testing

Real-device testing is required before a stable release. Test cases include:

- normal battery levels
- weak battery levels
- critical battery levels
- unavailable entities
- binary low-battery sensors
- devices with multiple battery entities
- configuration changes
- Home Assistant restart/reload behavior
- light and dark themes
- mobile and desktop layouts
- interaction with the status summaries
- summary mode with 2 and 3 devices per category
- different default views

## AI-assisted development disclosure

Parts of this project were created with the assistance of AI. The code has been reviewed by humans and tested on real hardware and in a real Home Assistant environment.

## License

The license for the project will be defined before the first public release.
