# 🔋 HA Battery Status Monitor

[![Open your Home Assistant instance and open this repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ju0506us&repository=ha-battery-status-monitor&category=integration)

🇩🇪 **Deutsch**  
Eine lokale Home-Assistant-Integration zur Überwachung der Batteriestände ausgewählter Geräte.

🇬🇧 **English**  
A local Home Assistant integration for monitoring the battery status of selected devices.

> **V1:** Die erste V1-Version wurde auf einer realen Home-Assistant-Installation getestet und die vorgesehenen V1-Funktionen wurden erfolgreich geprüft.  
> **V1:** The first V1 version has been tested on a real Home Assistant installation and the intended V1 functionality has passed testing.

---

## Features · Funktionen

🇩🇪 **Deutsch**

- Einrichtung über den Home-Assistant-Config-Flow
- Auswahl von **Geräten** statt einzelner Batterie-Entitäten
- Automatische Erkennung unterstützter Batterie-Entitäten
- Numerische Batterie-Prozentwerte und binäre Batterie-Sensoren
- `unknown` und `unavailable` werden als **Nicht erreichbar** behandelt
- Mehrere Batterie-Entitäten eines Geräts werden zu einem Gerät zusammengefasst
- Ein verfügbarer Prozentwert wird gegenüber einem binären Status bevorzugt
- Konfigurierbare Warn- und kritische Schwellen
- Fünf Zähler-Sensoren: Gesamt, Normal, Schwach, Kritisch und Nicht erreichbar
- Gerätenamen statt kryptischer Entity-IDs
- Rein lokaler Betrieb – keine Cloud und kein externer Dienst erforderlich

🇬🇧 **English**

- Setup through the Home Assistant Config Flow
- Select **devices** instead of individual battery entities
- Automatically discovers supported battery entities
- Supports numeric battery percentages and binary battery sensors
- `unknown` and `unavailable` are reported as **Not reachable**
- Multiple battery entities belonging to one device are combined into one device
- An available percentage value is preferred over a binary status
- Configurable warning and critical thresholds
- Five count sensors: Total, Normal, Weak, Critical and Not reachable
- Uses device names instead of cryptic entity IDs
- Fully local operation – no cloud or external service is required

## Battery status · Batteriestatus

🇩🇪 **Deutsch**

Mit den Standardwerten gilt:

| Batteriestand | Status |
|---:|---|
| **> 20 %** | 🟢 Normal |
| **11–20 %** | 🟡 Schwach |
| **1–10 %** | 🔴 Kritisch |
| `unknown` / `unavailable` | Nicht erreichbar |
| Binär `off` | 🟢 Normal |
| Binär `on` | 🔴 Kritisch |

Warn- und kritische Schwelle können in der Konfiguration angepasst werden.

🇬🇧 **English**

With the default thresholds:

| Battery level | Status |
|---:|---|
| **> 20%** | 🟢 Normal |
| **11–20%** | 🟡 Weak |
| **1–10%** | 🔴 Critical |
| `unknown` / `unavailable` | Not reachable |
| Binary `off` | 🟢 Normal |
| Binary `on` | 🔴 Critical |

The warning and critical thresholds can be adjusted in the configuration.

## Installation · Installation

### HACS

[![Open your Home Assistant instance and open this repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ju0506us&repository=ha-battery-status-monitor&category=integration)

🇩🇪 **Deutsch**

Installiere **HA Battery Status Monitor** über HACS unter **Integrationen**. Der Button oben öffnet das Repository direkt in HACS bzw. in deiner Home-Assistant-Instanz.

Die passende Lovelace Card ist inzwischen ein eigenes HACS-Frontend-Projekt:

**HA Battery Status Monitor Card**  
https://github.com/Ju0506us/ha-battery-status-monitor-card

🇬🇧 **English**

Install **HA Battery Status Monitor** through HACS under **Integrations**. The button above opens the repository directly in HACS or in your Home Assistant instance.

The matching Lovelace card is now maintained as a separate HACS frontend project:

**HA Battery Status Monitor Card**  
https://github.com/Ju0506us/ha-battery-status-monitor-card

### Manual installation · Manuelle Installation

🇩🇪 **Deutsch**

Kopiere `custom_components/ha_battery_status_monitor/` nach:

```text
/config/custom_components/ha_battery_status_monitor/
```

Starte Home Assistant anschließend neu.

🇬🇧 **English**

Copy `custom_components/ha_battery_status_monitor/` to:

```text
/config/custom_components/ha_battery_status_monitor/
```

Restart Home Assistant afterwards.

## Sensors · Sensoren

🇩🇪 **Deutsch**

Jede Konfiguration erstellt fünf Zähler-Sensoren:

| Entity | Bedeutung |
|---|---|
| `sensor.ha_battery_status_monitor_gesamt` | Anzahl aller überwachten Geräte |
| `sensor.ha_battery_status_monitor_normal` | Geräte mit normalem Batteriestatus |
| `sensor.ha_battery_status_monitor_schwach` | Geräte mit schwachem Batteriestatus |
| `sensor.ha_battery_status_monitor_kritisch` | Geräte mit kritischem Batteriestatus |
| `sensor.ha_battery_status_monitor_nicht_erreichbar` | Nicht erreichbare Geräte |

🇬🇧 **English**

Each configuration creates five count sensors:

| Entity | Meaning |
|---|---|
| `sensor.ha_battery_status_monitor_gesamt` | Number of all monitored devices |
| `sensor.ha_battery_status_monitor_normal` | Devices with a normal battery status |
| `sensor.ha_battery_status_monitor_schwach` | Devices with a weak battery status |
| `sensor.ha_battery_status_monitor_kritisch` | Devices with a critical battery status |
| `sensor.ha_battery_status_monitor_nicht_erreichbar` | Devices that are not reachable |

## V1 testing · V1-Tests

🇩🇪 **Deutsch**

Die V1 wurde auf einer realen Home-Assistant-Installation getestet. Erfolgreich geprüft wurden unter anderem Statusklassifizierung, Schwellenwerte, binäre Sensoren, Geräteauswahl, Konfigurationsänderungen sowie Reload und Neustart.

Ein reales Gerät mit mehreren Batterie-Entitäten konnte bisher nicht praktisch getestet werden, die Logik ist dafür vorgesehen.

🇬🇧 **English**

V1 has been tested on a real Home Assistant installation. Testing successfully covered status classification, thresholds, binary sensors, device selection, configuration changes, reload and restart behavior.

A real device with multiple battery entities has not yet been practically tested, although the logic is designed to support it.

## Project structure · Projektstruktur

```text
custom_components/ha_battery_status_monitor/
├── __init__.py
├── config_flow.py
├── const.py
├── coordinator.py
├── manifest.json
├── sensor.py
├── strings.json
├── translations/
│   └── de.json
└── brand/
    ├── icon.png
    └── icon@2x.png
```

## Development · Entwicklung

🇩🇪 **Deutsch**

Das Projekt wird eigenständig entwickelt und schrittweise erweitert. Fehlerberichte, Verbesserungsvorschläge und neue Ideen sind über GitHub Issues willkommen.

🇬🇧 **English**

The project is developed independently and expanded incrementally. Bug reports, improvement suggestions and new ideas are welcome through GitHub Issues.

## CI and HACS · CI und HACS

Das Repository verwendet GitHub Actions zur Validierung mit **Hassfest** und **HACS validation**.

The repository uses GitHub Actions with **Hassfest** and **HACS validation**.

## AI-assisted development · KI-Unterstützung

🇩🇪 **Deutsch**  
Teile dieses Projekts wurden mit Unterstützung von KI erstellt. Der Code wurde von Menschen überprüft und auf realer Hardware bzw. in einer realen Home-Assistant-Umgebung getestet.

🇬🇧 **English**  
Parts of this project were created with the assistance of AI. The code has been reviewed by humans and tested on real hardware and in a real Home Assistant environment.

## License · Lizenz

🇩🇪 **Deutsch**  
Dieses Projekt steht unter der **MIT License**. Siehe `LICENSE`.

🇬🇧 **English**  
This project is released under the **MIT License**. See `LICENSE`.

---

Developed with care for Home Assistant and local smart-home infrastructure.

## Version 1.0.2

- Changed the Home Assistant integration type from `helper` to `service`.
- Moved the Lovelace card into the dedicated `ha-battery-status-monitor-card` repository.
- Updated documentation for the separate HACS frontend project.
