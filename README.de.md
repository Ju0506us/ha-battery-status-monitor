# HA Battery Status Monitor

Eine lokale Home-Assistant-Integration zur Überwachung des Batteriestatus ausgewählter Geräte inklusive einer responsiven, theme-kompatiblen Lovelace-Karte.

> **Entwicklungsstatus:** privat / frühe V1. Das Projekt wird aktuell auf einer realen Home-Assistant-Installation getestet und ist noch nicht für eine öffentliche HACS-Veröffentlichung bereit.

## Funktionen

### Integration

- Konfiguration über den Home-Assistant-Config-Flow
- Zweistufige Einrichtung:
  1. Geräte zur Überwachung auswählen
  2. Warn- und kritische Schwelle konfigurieren
- Bei der Geräteauswahl werden nur Geräte mit unterstützten Batterie-Entitäten angezeigt
- Mehrere Geräte können ausgewählt werden
- Batterie-Entitäten der ausgewählten Geräte werden automatisch erkannt
- Numerische Batterie-Prozent-Sensoren werden unterstützt
- Binäre Batterie-Warnsensoren werden unterstützt (`off` = normal, `on` = kritisch)
- `unknown` / `unavailable` werden als nicht erreichbar gemeldet
- Mehrere Batterie-Entitäten eines Geräts werden zu einem Gerät zusammengefasst
- Ein verfügbarer Prozentwert wird gegenüber einem binären Batteriestatus bevorzugt
- Pro HA Battery Status Monitor-Konfiguration werden fünf Sensoren erstellt:
  - Gesamt
  - Normal
  - Schwach
  - Kritisch
  - Nicht erreichbar
- Es werden Gerätenamen statt kryptischer Entity-IDs verwendet
- Die Konfiguration kann über die Optionen der Integration geändert werden
- Standard-Warnschwelle: **20 %**
- Standard-kritische Schwelle: **10 %**
- Rein lokaler Betrieb; kein externer Dienst ist erforderlich

### Regeln für den Batteriestatus

| Eingabe | Ergebnis |
|---|---|
| `> Warnschwelle` | Normal |
| `Kritische Schwelle + 1` bis `Warnschwelle` | Schwach |
| `1` bis `Kritische Schwelle` | Kritisch |
| `unknown` / `unavailable` | Nicht erreichbar |
| Binär `off` | Normal |
| Binär `on` | Kritisch |

Mit den Standardwerten bedeutet das:

- `> 20 %` → Normal
- `11–20 %` → Schwach
- `1–10 %` → Kritisch
- `unknown` / `unavailable` → Nicht erreichbar

## Lovelace-Karte

Das Projekt enthält die HA Battery Status Monitor Lovelace-Karte unter `www/battery-monitor-card.js`.

Die Karte verwendet Home-Assistant-Theme-Variablen anstelle fest definierter Farben. Dadurch passt sie sich an Light Mode, Dark Mode und eigene Home-Assistant-Themes an und ist für Desktop, Smartphone und die Home-Assistant-Companion-App ausgelegt.

### Bedienung

Oben werden die vier Status-Zusammenfassungen angezeigt:

- Normal
- Schwach
- Kritisch
- Nicht erreichbar

Die vier Zusammenfassungen sind anklickbar. Ein Klick auf eine Kategorie schaltet darunter die vollständige Geräteliste dieses Status ein. Ein erneuter Klick auf die aktive Kategorie oder auf **Zusammenfassung** führt zurück zur Zusammenfassung.

### Zusammenfassungsmodus

Die Startansicht kann auf **Zusammenfassung** gestellt werden. Dann werden unter den vier Status-Zählern die ersten **2 oder 3 Geräte je ausgewählter Kategorie** angezeigt.

Über den grafischen Karten-Editor kann festgelegt werden:

- welche Ansicht beim Start aktiv ist: Zusammenfassung, Normal, Schwach, Kritisch oder Nicht erreichbar
- ob 2 oder 3 Geräte je Kategorie in der Zusammenfassung angezeigt werden
- welche Kategorien in der Zusammenfassung erscheinen: alle oder nur ausgewählte Kategorien

Beispiel:

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

### Lovelace-Ressource

```text
/local/battery-monitor-card.js
```

Die Ressource wird als JavaScript-Modul (`module`) registriert.

## Installation während der Entwicklung

Das Repository bleibt während der V1-Tests privat.

### Integration

Kopiere folgenden Ordner in dein Home-Assistant-Konfigurationsverzeichnis:

```text
/config/custom_components/ha_battery_status_monitor/
```

Der Ordner muss die Integrationsdateien aus

```text
custom_components/ha_battery_status_monitor/
```

enthalten.

Starte Home Assistant anschließend neu und füge **HA Battery Status Monitor** hinzu über:

**Einstellungen → Geräte & Dienste → Integration hinzufügen → HA Battery Status Monitor**

### Lovelace-Karte

Kopiere:

```text
www/battery-monitor-card.js
```

nach:

```text
/config/www/battery-monitor-card.js
```

Füge anschließend die JavaScript-Modul-Ressource als Lovelace-Ressource hinzu:

```text
/local/battery-monitor-card.js
```

Die endgültige HACS-Struktur wird vor der ersten öffentlichen Veröffentlichung festgelegt.

## Repository-Struktur

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

## Entwicklung

Das Projekt wird bewusst schrittweise entwickelt und auf einer realen Home-Assistant-Installation getestet.

Der aktuelle V1-Grundaufbau konzentriert sich auf:

- zuverlässige Geräteauswahl
- korrekte Klassifizierung des Batteriestatus
- Zusammenfassung mehrerer Batterie-Entitäten pro Gerät
- Bearbeitung der Konfiguration
- Zähler-Sensoren
- eine theme-kompatible Lovelace-Karte

In zukünftigen Versionen können Benachrichtigungen, Recovery-/Statuswechsel, Verlauf, Batteriealter, Informationen zur letzten Aktualisierung und weitere Automatisierungsfunktionen ergänzt werden.

## Tests

Vor einer stabilen Veröffentlichung sind Tests mit echten Geräten erforderlich. Dazu gehören:

- normale Batteriestände
- schwache Batteriestände
- kritische Batteriestände
- nicht verfügbare Entitäten
- binäre Batterie-Warnsensoren
- Geräte mit mehreren Batterie-Entitäten
- Änderungen der Konfiguration
- Neustart-/Reload-Verhalten von Home Assistant
- helle und dunkle Themes
- Smartphone- und Desktop-Layout
- Interaktion mit den Status-Zusammenfassungen
- Zusammenfassungsmodus mit 2 und 3 Geräten pro Kategorie
- verschiedene Standardansichten

## Hinweis zur KI-Unterstützung

Teile dieses Projekts wurden mit Unterstützung von KI erstellt. Der Code wurde von Menschen überprüft und auf realer Hardware bzw. in einer realen Home-Assistant-Umgebung getestet.

## Lizenz

Die Lizenz des Projekts wird vor der ersten öffentlichen Veröffentlichung festgelegt.
