# HA Battery Monitor

Home Assistant integration for monitoring selected device batteries, with a theme-aware Lovelace card.

> **Development status:** private / early V1. The project is not ready for public HACS distribution yet.

## V1

- Select devices through the Home Assistant Config Flow
- Automatically find battery entities belonging to selected devices
- Percentage battery entities
- `on` / `off` low-battery entities (`off` = normal, `on` = critical)
- `unknown` / `unavailable` = not reachable
- Default warning threshold: **20%**
- Default critical threshold: **10%**
- Five sensors per Battery Monitor configuration:
  - Total
  - Normal
  - Weak
  - Critical
  - Unavailable
- Device-level attributes for dashboards and automations
- Responsive, theme-aware Lovelace card

## Card

The card is currently provided at `www/battery-monitor-card.js` while the project is in private development. The final HACS distribution layout will be decided before the first public release.

Example:

```yaml
type: custom:battery-monitor-card
entity: sensor.battery_monitor_gesamt
show_normal: false
show_weak: true
show_critical: true
show_unavailable: true
show_values: true
```

## Status rules

| Input | Result |
|---|---|
| `> 20%` | Normal |
| `11–20%` | Weak |
| `1–10%` | Critical |
| `unknown` / `unavailable` | Not reachable |
| binary `off` | Normal |
| binary `on` | Critical |

## Development

The repository currently contains the initial V1 foundation. Testing against a real Home Assistant instance is required before treating the integration as stable.
