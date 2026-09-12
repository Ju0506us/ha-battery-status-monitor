# 🔋 HA Battery Status Monitor

🇩🇪 **Deutsch**  
Eine lokale Home-Assistant-Integration zur übersichtlichen Überwachung der Batteriestände ausgewählter Geräte – inklusive einer modernen, responsiven Lovelace-Karte.

🇬🇧 **English**  
A local Home Assistant integration for monitoring the battery status of selected devices – including a modern, responsive Lovelace card.

> 🇩🇪 **V1-Status:** Die erste V1-Version wurde auf einer realen Home-Assistant-Installation getestet und die vorgesehenen V1-Funktionen sind erfolgreich getestet.  
> 🇬🇧 **V1 status:** The first V1 version has been tested on a real Home Assistant installation and the intended V1 functionality has passed testing.

---

## ✨ Funktionen · Features

### 🔧 Integration

🇩🇪 **Deutsch**

- ⚙️ Einrichtung über den Home-Assistant-Config-Flow
- 🏠 Auswahl der zu überwachenden **Geräte** statt einzelner Entitäten
- 🔎 Automatische Erkennung unterstützter Batterie-Entitäten
- 📊 Unterstützung für numerische Batterie-Prozentwerte
- 🔘 Unterstützung für binäre Batterie-Sensoren (`off` = normal, `on` = kritisch)
- 📦 Mehrere Batterie-Entitäten eines Geräts werden zu **einem Gerät** zusammengefasst
- 🎯 Ein verfügbarer numerischer Prozentwert wird gegenüber einem binären Batteriestatus bevorzugt
- ⚠️ `unknown` und `unavailable` werden als **Nicht erreichbar** behandelt
- 🏷️ Verwendung von Gerätenamen statt kryptischer Entity-IDs
- 🎚️ Individuell konfigurierbare Warn- und kritische Schwellen
- 🔄 Konfiguration kann jederzeit über die Integrationsoptionen geändert werden
- 🧮 Fünf Zähler-Sensoren: Gesamt, Normal, Schwach, Kritisch und Nicht erreichbar
- 🏡 Rein lokaler Betrieb – kein externer Dienst und keine Cloud erforderlich

🇬🇧 **English**

- ⚙️ Setup through the Home Assistant Config Flow
- 🏠 Select **devices** to monitor instead of individual entities
- 🔎 Automatically discovers supported battery entities
- 📊 Supports numeric battery percentage values
- 🔘 Supports binary battery sensors (`off` = normal, `on` = critical)
- 📦 Multiple battery entities belonging to one device are combined into **one device**
- 🎯 An available numeric percentage value is preferred over a binary battery state
- ⚠️ `unknown` and `unavailable` are reported as **Not reachable**
- 🏷️ Uses device names instead of cryptic entity IDs
- 🎚️ Configurable warning and critical thresholds
- 🔄 Configuration can be changed through the integration options
- 🧮 Five count sensors: Total, Normal, Weak, Critical and Not reachable
- 🏡 Fully local operation – no external service or cloud is required

---

## 🔋 Batteriestatus · Battery status

🇩🇪 **Deutsch**

Die Standardwerte sind:

| Batteriestand | Status |
|---:|---|
| **> 20 %** | 🟢 Normal |
| **11–20 %** | 🟡 Schwach |
| **1–10 %** | 🔴 Kritisch |
| `unknown` / `unavailable` | ⚫ Nicht erreichbar |
| Binär `off` | 🟢 Normal |
| Binär `on` | 🔴 Kritisch |

Die Warn- und kritische Schwelle können in der Konfiguration angepasst werden.

🇬🇧 **English**

The default thresholds are:

| Battery level | Status |
|---:|---|
| **> 20%** | 🟢 Normal |
| **11–20%** | 🟡 Weak |
| **1–10%** | 🔴 Critical |
| `unknown` / `unavailable` | ⚫ Not reachable |
| Binary `off` | 🟢 Normal |
| Binary `on` | 🔴 Critical |

The warning and critical thresholds can be adjusted in the configuration.

---

## 🎨 Lovelace-Karte · Lovelace card

🇩🇪 **Deutsch**

Das Projekt enthält die passende Lovelace-Karte:

```text
www/battery-monitor-card.js
```

Die Karte ist auf eine übersichtliche Darstellung ausgelegt und verwendet Home-Assistant-Theme-Variablen. Dadurch passt sie sich an **Light Mode, Dark Mode und eigene Themes** an.

Sie ist für **Desktop, Smartphone und die Home-Assistant-Companion-App** ausgelegt.

🇬🇧 **English**

The project includes a matching Lovelace card:

```text
www/battery-monitor-card.js
```

The card is designed for a clean overview and uses Home Assistant theme variables. It therefore adapts to **light mode, dark mode and custom themes**.

It is designed for **desktop, mobile and the Home Assistant Companion App**.

### 🖱️ Bedienung · Interaction

🇩🇪 **Deutsch**

Oben werden die vier Statusbereiche angezeigt:

- 🟢 Normal
- 🟡 Schwach
- 🔴 Kritisch
- ⚫ Nicht erreichbar

Jeder Status ist anklickbar. Ein Klick zeigt die vollständige Geräteliste dieses Status direkt in der Karte an. Ein erneuter Klick auf den aktiven Status oder die Zurück-Schaltfläche führt wieder zur Zusammenfassung.

🇬🇧 **English**

The four status categories are displayed at the top:

- 🟢 Normal
- 🟡 Weak
- 🔴 Critical
- ⚫ Not reachable

Each status is clickable. Clicking a status displays the complete device list for that category directly in the card. Clicking the active status again or using the back button returns to the summary.

### 📋 Zusammenfassung · Summary mode

🇩🇪 **Deutsch**

Die Startansicht kann als **Zusammenfassung** konfiguriert werden. Dabei werden pro ausgewählter Kategorie die ersten **2 oder 3 Geräte** angezeigt.

Der grafische Karten-Editor ermöglicht die Konfiguration von:

- Startansicht: Zusammenfassung, Normal, Schwach, Kritisch oder Nicht erreichbar
- Anzahl der Geräte in der Zusammenfassung: 2 oder 3
- Kategorien in der Zusammenfassung: alle oder nur ausgewählte Kategorien

🇬🇧 **English**

The default view can be configured as **Summary**. In this mode, the first **2 or 3 devices** are shown for each selected category.

The graphical card editor allows you to configure:

- Default view: Summary, Normal, Weak, Critical or Not reachable
- Number of devices shown in Summary mode: 2 or 3
- Categories shown in Summary mode: all or selected categories

### 🧩 Beispiel · Example

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

### 📌 Lovelace-Ressource · Lovelace resource

🇩🇪 **Deutsch**  
Die Karte wird als JavaScript-Modul (`module`) registriert:

🇬🇧 **English**  
Register the card as a JavaScript module (`module`):

```text
/local/battery-monitor-card.js
```

---

## 📦 Installation · Installation

### 🧩 HACS

🇩🇪 **Deutsch**

Sobald das Repository öffentlich für HACS verfügbar ist, kann die Integration über **HACS → Integrationen** installiert werden.

Anschließend muss die Lovelace-Karte als Ressource eingebunden werden. Die genaue HACS-Struktur und die öffentliche Release-Konfiguration werden vor der ersten öffentlichen Veröffentlichung festgelegt.

🇬🇧 **English**

Once the repository is publicly available through HACS, the integration can be installed via **HACS → Integrations**.

The Lovelace card then needs to be added as a resource. The final HACS structure and public release configuration will be defined before the first public release.

### 🛠️ Manuelle Installation · Manual installation

🇩🇪 **Deutsch**

Kopiere die Integration nach:

```text
/config/custom_components/ha_battery_status_monitor/
```

Der Inhalt stammt aus:

```text
custom_components/ha_battery_status_monitor/
```

Kopiere anschließend die Lovelace-Karte nach:

```text
/config/www/battery-monitor-card.js
```

Registriere sie als JavaScript-Modul unter:

```text
/local/battery-monitor-card.js
```

Danach Home Assistant neu starten und die Integration über:

**Einstellungen → Geräte & Dienste → Integration hinzufügen → HA Battery Status Monitor**

hinzufügen.

🇬🇧 **English**

Copy the integration to:

```text
/config/custom_components/ha_battery_status_monitor/
```

The integration files are located in:

```text
custom_components/ha_battery_status_monitor/
```

Then copy the Lovelace card to:

```text
/config/www/battery-monitor-card.js
```

Register it as a JavaScript module at:

```text
/local/battery-monitor-card.js
```

Restart Home Assistant and add the integration through:

**Settings → Devices & services → Add integration → HA Battery Status Monitor**

---

## 📊 Sensoren · Sensors

🇩🇪 **Deutsch**

Jede Konfiguration erstellt fünf Zähler-Sensoren:

| Sensor | Bedeutung |
|---|---|
| `sensor.ha_battery_status_monitor_gesamt` | Anzahl aller überwachten Geräte |
| `sensor.ha_battery_status_monitor_normal` | Geräte mit normalem Batteriestatus |
| `sensor.ha_battery_status_monitor_schwach` | Geräte mit schwachem Batteriestatus |
| `sensor.ha_battery_status_monitor_kritisch` | Geräte mit kritischem Batteriestatus |
| `sensor.ha_battery_status_monitor_nicht_erreichbar` | Nicht erreichbare Geräte |

🇬🇧 **English**

Each configuration creates five count sensors:

| Sensor | Meaning |
|---|---|
| `sensor.ha_battery_status_monitor_gesamt` | Number of all monitored devices |
| `sensor.ha_battery_status_monitor_normal` | Devices with a normal battery status |
| `sensor.ha_battery_status_monitor_schwach` | Devices with a weak battery status |
| `sensor.ha_battery_status_monitor_kritisch` | Devices with a critical battery status |
| `sensor.ha_battery_status_monitor_nicht_erreichbar` | Devices that are not reachable |

---

## 🏗️ Projektstruktur · Project structure

🇩🇪 **Deutsch**  
Die aktuelle V1-Struktur besteht aus der Home-Assistant-Integration und der Lovelace-Karte.

🇬🇧 **English**  
The current V1 structure consists of the Home Assistant integration and the Lovelace card.

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

---

## 🧪 V1-Testing · V1-Tests

🇩🇪 **Deutsch**

Die V1 wurde auf einer realen Home-Assistant-Installation getestet. Getestet wurden unter anderem:

- ✅ normale, schwache und kritische Batteriestände
- ✅ unterschiedliche Warn- und kritische Schwellen
- ✅ `unknown` und `unavailable`
- ✅ binäre Batterie-Sensoren
- ✅ Geräteauswahl und Konfigurationsänderungen
- ✅ Status-Navigation der Lovelace-Karte
- ✅ Zusammenfassungsmodus mit 2 und 3 Geräten
- ✅ grafischer Karten-Editor
- ✅ Light Mode und Dark Mode
- ✅ Desktop, Smartphone und Companion App
- ✅ Neustart und Reload
- ✅ stabiles Rendering ohne Flackern oder unerwünschte Bewegungen

Ein Szenario mit mehreren Batterie-Entitäten am selben Gerät konnte mangels eines entsprechenden Testgeräts noch nicht praktisch durchgeführt werden.

🇬🇧 **English**

V1 has been tested on a real Home Assistant installation. Testing included:

- ✅ normal, weak and critical battery levels
- ✅ different warning and critical thresholds
- ✅ `unknown` and `unavailable`
- ✅ binary battery sensors
- ✅ device selection and configuration changes
- ✅ Lovelace status navigation
- ✅ Summary mode with 2 and 3 devices
- ✅ graphical card editor
- ✅ light mode and dark mode
- ✅ desktop, mobile and Companion App
- ✅ restart and reload behavior
- ✅ stable rendering without flickering or unwanted movement

A real-world scenario with multiple battery entities on the same device has not yet been practically tested because no suitable test device is currently available.

---

## 🚀 Entwicklung · Development

🇩🇪 **Deutsch**

HA Battery Status Monitor wird eigenständig entwickelt und schrittweise erweitert. Vorschläge, Fehlerberichte und Verbesserungen sind willkommen.

Die Entwicklung konzentriert sich zunächst auf eine stabile und zuverlässige Grundlage. Für zukünftige Versionen sind unter anderem folgende Funktionen denkbar:

- 🔔 Benachrichtigungen bei niedrigem Batteriestand
- ♻️ Recovery- und Statuswechsel-Ereignisse
- 📈 Verlauf und Historie
- 🕒 Batteriealter und letzte Aktualisierung
- 🤖 Erweiterte Automatisierungsfunktionen

Wenn du einen Fehler findest oder eine Idee hast, kannst du dafür gerne ein **GitHub Issue** erstellen.

🇬🇧 **English**

HA Battery Status Monitor is developed independently and expanded incrementally. Suggestions, bug reports and improvements are welcome.

The initial focus is on a stable and reliable foundation. Future versions may include features such as:

- 🔔 Low-battery notifications
- ♻️ Recovery and status-change events
- 📈 History and trends
- 🕒 Battery age and last update information
- 🤖 More advanced automation features

If you find a bug or have an idea, feel free to open a **GitHub Issue**.

---

## 🤖 Hinweis zur KI-Unterstützung · AI-assisted development

🇩🇪 **Deutsch**  
Teile dieses Projekts wurden mit Unterstützung von KI erstellt. Der Code wurde von Menschen überprüft und auf realer Hardware bzw. in einer realen Home-Assistant-Umgebung getestet.

🇬🇧 **English**  
Parts of this project were created with the assistance of AI. The code has been reviewed by humans and tested on real hardware and in a real Home Assistant environment.

---

## 📄 Lizenz · License

🇩🇪 **Deutsch**  
Die Lizenz wird vor der ersten öffentlichen Veröffentlichung festgelegt.

🇬🇧 **English**  
The license will be defined before the first public release.

---

## ❤️ Projekt · Project

🇩🇪 **Deutsch**  
Entwickelt mit ❤️ für Home Assistant und eine übersichtliche lokale Smart-Home-Infrastruktur.

🇬🇧 **English**  
Developed with ❤️ for Home Assistant and a clean, local smart-home infrastructure.
