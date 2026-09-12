# HA Battery Monitor

Eine lokale Home-Assistant-Integration zur Überwachung des Batteriestatus ausgewählter Geräte inklusive einer responsiven, theme-kompatiblen Lovelace-Karte.

> **Entwicklungsstatus:** privat / frühe V1. Das Projekt wird aktuell auf einer realen Home-Assistant-Installation getestet und ist noch nicht für eine öffentliche HACS-Veröffentlichung bereit.

## Funktionen

### Integration

- Konfiguration über den Home-Assistant-Config-Flow
- Zweistufige Einrichtung:
  1. Geräte zur Überwachung auswählen
  2. Warn- und kritische Schwelle konfigurieren
- Mehrere Geräte können ausgewählt werden
- Batterie-Entitäten der ausgewählten Geräte werden automatisch erkannt
- Numerische Batterie-Prozent-Sensoren werden unterstützt
- Binäre Batterie-Warnsensoren werden unterstützt (`off` = normal, `on` = kritisch)
- `unknown` / `unavailable` werden als nicht erreichbar gemeldet
- Mehrere Batterie-Entitäten eines Geräts werden zu einem Gerät zusammengefasst
- Ein verfügbarer Prozentwert wird gegenüber einem binären Batteriestatus bevorzugt
- Pro Battery-Monitor-Konfiguration werden fünf Sensoren erstellt:
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

Das Projekt enthält eine eigene Lovelace-Karte unter `www/battery-monitor-card.js`.

Die Karte verwendet Home-Assistant-Theme-Variablen anstelle fest definierter Farben. Dadurch passt sie sich an Light Mode, Dark Mode und eigene Home-Assistant-Themes an und ist für Desktop, Smartphone und die Home-Assistant-Companion-App ausgelegt.

Beispiel:

```yaml
type: custom:battery-monitor-card
entity: sensor.battery_monitor_gesamt
show_normal: false
show_weak: true
show_critical: true
show_unavailable: true
show_values: true
```

Oben zeigt die Karte die Status-Zähler. Darunter können problematische Geräte aufgelistet werden. Normale Geräte können standardmäßig ausgeblendet werden.

## Installation während der Entwicklung

Das Repository bleibt während der V1-Tests privat.

### Integration

Kopiere folgenden Ordner in dein Home-Assistant-Konfigurationsverzeichnis:

```text
/config/custom_components/battery_monitor/
```

Der Ordner muss die Integrationsdateien aus

```text
custom_components/battery_monitor/
```

enthalten.

Starte Home Assistant anschließend neu und füge **Battery Monitor** hinzu über:

**Einstellungen → Geräte & Dienste → Integration hinzufügen → Battery Monitor**

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
custom_components/battery_monitor/
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

## Hinweis zur KI-Unterstützung

Teile dieses Projekts wurden mit Unterstützung von KI erstellt. Der Code wurde von Menschen überprüft und auf realer Hardware bzw. in einer realen Home-Assistant-Umgebung getestet.

## Lizenz

Die Lizenz des Projekts wird vor der ersten öffentlichen Veröffentlichung festgelegt.
