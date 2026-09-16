# 🔋 HA Battery Status Monitor

[![Open your Home Assistant instance and open this repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ju0506us&repository=ha-battery-status-monitor&category=integration)

🇩🇪 **Deutsch**  
Eine lokale Home-Assistant-Integration zur Überwachung der Batteriestände ausgewählter Geräte – inklusive einer modernen, responsiven Lovelace-Karte.

🇬🇧 **English**  
A local Home Assistant integration for monitoring the battery status of selected devices – including a modern, responsive Lovelace card.

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

## Lovelace Card · Lovelace-Karte

🇩🇪 **Deutsch**

Das Projekt enthält eine passende Lovelace-Karte unter `www/battery-monitor-card.js`. Sie verwendet Home-Assistant-Theme-Variablen und passt sich an Light Mode, Dark Mode und eigene Themes an. Die Karte ist für Desktop, Smartphone und die Companion App ausgelegt.

Die vier Statusbereiche sind anklickbar. Ein Klick zeigt die vollständige Liste des jeweiligen Status direkt in der Karte. Ein erneuter Klick oder die Zurück-Schaltfläche führt zur Zusammenfassung zurück.

Der grafische Karten-Editor unterstützt:

- Startansicht: Zusammenfassung, Normal, Schwach, Kritisch oder Nicht erreichbar
- 2 oder 3 Geräte je Kategorie in der Zusammenfassung
- alle oder ausgewählte Kategorien in der Zusammenfassung

🇬🇧 **English**

The project includes a matching Lovelace card at `www/battery-monitor-card.js`. It uses Home Assistant theme variables and adapts to light mode, dark mode and custom themes. The card is designed for desktop, mobile and the Companion App.

The four status categories are clickable. Clicking a status displays the complete list for that category directly in the card. Clicking it again or using the back button returns to the summary.

The graphical card editor supports:

- Default view: Summary, Normal, Weak, Critical or Not reachable
- 2 or 3 devices per category in Summary mode
- All or selected categories in Summary mode

### Example · Beispiel

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

The card is registered as a JavaScript module:

```text
/local/battery-monitor-card.js
```

## Installation · Installation

### HACS

[![Open your Home Assistant instance and open this repository in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Ju0506us&repository=ha-battery-status-monitor&category=integration)

🇩🇪 **Deutsch**

Nach der öffentlichen Veröffentlichung kann die Integration über HACS installiert werden. Der Button oben öffnet das Repository direkt in HACS bzw. in der eigenen Home-Assistant-Instanz.

**Hinweis:** Dieses Repository ist ein HACS-Repository für die Integration. Die Lovelace-Karte ist derzeit als separate Ressource bereitzustellen; sie wird nicht automatisch als Dashboard-Element installiert.

🇬🇧 **English**

After the public release, the integration can be installed through HACS. The button above opens the repository directly in HACS or in your own Home Assistant instance.

**Note:** This repository is a HACS repository for the integration. The Lovelace card currently needs to be added as a separate resource; it is not automatically installed as a dashboard element.

### Manual installation · Manuelle Installation

🇩🇪 **Deutsch**

Kopiere `custom_components/ha_battery_status_monitor/` nach:

```text
/config/custom_components/ha_battery_status_monitor/
```

Kopiere die Karte nach:

```text
/config/www/battery-monitor-card.js
```

Registriere die Karte als JavaScript-Modul unter `/local/battery-monitor-card.js` und starte Home Assistant anschließend neu.

🇬🇧 **English**

Copy `custom_components/ha_battery_status_monitor/` to:

```text
/config/custom_components/ha_battery_status_monitor/
```

Copy the card to:

```text
/config/www/battery-monitor-card.js
```

Register the card as a JavaScript module at `/local/battery-monitor-card.js` and restart Home Assistant afterwards.

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

Die V1 wurde auf einer realen Home-Assistant-Installation getestet. Erfolgreich geprüft wurden unter anderem Statusklassifizierung, Schwellenwerte, binäre Sensoren, Geräteauswahl, Konfigurationsänderungen, Karten-Navigation, Summary-Modus, grafischer Editor, Light/Dark Mode, Desktop, Smartphone, Companion App sowie Reload und Neustart.

Ein reales Gerät mit mehreren Batterie-Entitäten konnte bisher nicht praktisch getestet werden, die Logik ist dafür vorgesehen.

🇬🇧 **English**

V1 has been tested on a real Home Assistant installation. Testing successfully covered status classification, thresholds, binary sensors, device selection, configuration changes, card navigation, Summary mode, graphical editor, light/dark mode, desktop, mobile, Companion App, reload and restart behavior.

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
└── translations/
    └── de.json

www/
└── battery-monitor-card.js
```

## Development · Entwicklung

🇩🇪 **Deutsch**

Das Projekt wird eigenständig entwickelt und schrittweise erweitert. Fehlerberichte, Verbesserungsvorschläge und neue Ideen sind über GitHub Issues willkommen.

Für zukünftige Versionen sind unter anderem Benachrichtigungen, Recovery-/Statuswechsel, Verlauf, Batteriealter, letzte Aktualisierung und weitere Automatisierungsfunktionen geplant bzw. denkbar.

🇬🇧 **English**

The project is developed independently and expanded incrementally. Bug reports, improvement suggestions and new ideas are welcome through GitHub Issues.

Future versions may include notifications, recovery/status changes, history, battery age, last-update information and additional automation features.

## CI and HACS · CI und HACS

The repository uses GitHub Actions to validate the Home Assistant integration with **Hassfest** and **HACS validation** on pushes and pull requests.

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

## Version 1.0.1

- Updated documentation for HACS Default Store submission.
