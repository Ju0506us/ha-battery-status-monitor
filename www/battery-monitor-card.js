class BatteryMonitorCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("battery-monitor-card-editor");
  }

  static getStubConfig() {
    return { entity: "sensor.battery_monitor_gesamt" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Battery Monitor Card benötigt eine entity.");
    this._config = {
      show_normal: false,
      show_weak: true,
      show_critical: true,
      show_unavailable: true,
      show_values: true,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 5; }

  _render() {
    if (!this._hass || !this._config) return;
    const state = this._hass.states[this._config.entity];
    if (!state) {
      this.innerHTML = `<ha-card><div class="content">Battery Monitor Entity nicht gefunden.</div></ha-card>`;
      return;
    }

    const attrs = state.attributes || {};
    const counts = attrs.counts || {};
    const devices = attrs.devices || [];
    const sections = [
      ["critical", "Kritisch", "mdi:battery-alert", "critical", this._config.show_critical],
      ["weak", "Schwach", "mdi:battery-low", "weak", this._config.show_weak],
      ["unavailable", "Nicht erreichbar", "mdi:battery-off", "unavailable", this._config.show_unavailable],
      ["normal", "Normal", "mdi:battery-check", "normal", this._config.show_normal],
    ];

    const sectionHtml = sections.filter(s => s[4]).map(([key, title, icon, cls]) => {
      const items = devices.filter(item => item.status === key);
      if (!items.length) return "";
      return `<section class="section ${cls}">
        <div class="section-title"><ha-icon icon="${icon}"></ha-icon><span>${title}</span><span class="section-count">${items.length}</span></div>
        ${items.map(item => `<div class="device-row" data-entity="${item.entity_id}">
          <div class="device-name">${this._escape(item.device_name)}</div>
          ${this._config.show_values ? `<div class="device-value">${this._escape(item.display_value)}</div>` : ""}
        </div>`).join("")}
      </section>`;
    }).join("");

    this.innerHTML = `<ha-card>
      <div class="content">
        <div class="header"><div class="title"><ha-icon icon="mdi:battery-medium"></ha-icon><span>Batterien</span></div></div>
        <div class="counts">
          ${this._count("normal", "Normal", "mdi:battery-check", counts.normal || 0)}
          ${this._count("weak", "Schwach", "mdi:battery-low", counts.weak || 0)}
          ${this._count("critical", "Kritisch", "mdi:battery-alert", counts.critical || 0)}
          ${this._count("unavailable", "Nicht erreichbar", "mdi:battery-off", counts.unavailable || 0)}
        </div>
        ${sectionHtml || `<div class="ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Alle Batterien sind in Ordnung</span></div>`}
      </div>
    </ha-card>`;

    this._bindRows();
  }

  _count(cls, label, icon, value) {
    return `<div class="count ${cls}"><ha-icon icon="${icon}"></ha-icon><strong>${value}</strong><span>${label}</span></div>`;
  }

  _bindRows() {
    this.querySelectorAll(".device-row[data-entity]").forEach(row => row.addEventListener("click", () => {
      this._hass.callService("browser_mod", "popup", { entity: row.dataset.entity }).catch(() => {});
      this._hass.moreInfo(row.dataset.entity);
    }));
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>\"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  }
}

class BatteryMonitorCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.innerHTML = `
      <div class="editor">
        <ha-textfield label="Gesamt-Sensor" value="${config.entity || ""}"></ha-textfield>
        <ha-switch>Normal anzeigen</ha-switch>
        <ha-switch>Werte anzeigen</ha-switch>
      </div>`;
  }
}

if (!customElements.get("battery-monitor-card")) customElements.define("battery-monitor-card", BatteryMonitorCard);
if (!customElements.get("battery-monitor-card-editor")) customElements.define("battery-monitor-card-editor", BatteryMonitorCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "battery-monitor-card",
  name: "Battery Monitor Card",
  description: "Theme-aware Battery Monitor card",
  preview: true,
});
