class BatteryMonitorCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("battery-monitor-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.ha_battery_status_monitor_gesamt",
    };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("HA Battery Status Monitor Card benötigt eine entity.");
    }

    this._config = {
      entity: "sensor.ha_battery_status_monitor_gesamt",
      show_header: true,
      show_summary: true,
      show_normal_count: true,
      show_weak_count: true,
      show_critical_count: true,
      show_unavailable_count: true,
      popup_enabled: true,
      show_normal_list: false,
      show_weak_list: true,
      show_critical_list: true,
      show_unavailable_list: true,
      show_values: true,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 5;
  }

  _render() {
    if (!this._hass || !this._config) return;

    const state = this._hass.states[this._config.entity];
    if (!state) {
      this.innerHTML = `
        <ha-card>
          <div class="content">HA Battery Status Monitor Entity nicht gefunden.</div>
        </ha-card>`;
      return;
    }

    const attrs = state.attributes || {};
    const counts = attrs.counts || {};
    const devices = Array.isArray(attrs.devices) ? attrs.devices : [];

    const countDefinitions = [
      ["normal", "Normal", "mdi:battery-check", this._config.show_normal_count],
      ["weak", "Schwach", "mdi:battery-low", this._config.show_weak_count],
      ["critical", "Kritisch", "mdi:battery-alert", this._config.show_critical_count],
      ["unavailable", "Nicht erreichbar", "mdi:battery-off", this._config.show_unavailable_count],
    ];

    const visibleCounts = this._config.show_summary
      ? countDefinitions.filter(([, , , visible]) => visible)
      : [];

    const countsHtml = visibleCounts.length
      ? `<div class="counts">${visibleCounts
          .map(([key, label, icon]) => this._count(key, label, icon, counts[key] || 0))
          .join("")}</div>`
      : "";

    const listDefinitions = [
      ["critical", "Kritisch", "mdi:battery-alert", this._config.show_critical_list],
      ["weak", "Schwach", "mdi:battery-low", this._config.show_weak_list],
      ["unavailable", "Nicht erreichbar", "mdi:battery-off", this._config.show_unavailable_list],
      ["normal", "Normal", "mdi:battery-check", this._config.show_normal_list],
    ];

    const sections = listDefinitions
      .filter(([, , , visible]) => visible)
      .map(([key, title, icon]) => this._section(key, title, icon, devices))
      .filter(Boolean)
      .join("");

    const listHtml = sections
      ? `<div class="device-sections">${sections}</div>`
      : "";

    const okHtml = !sections && devices.every((item) => item.status === "normal") && devices.length
      ? `<div class="ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Alle Batterien sind in Ordnung</span></div>`
      : "";

    this.innerHTML = `
      <ha-card>
        <style>${this._styles()}</style>
        <div class="content">
          ${this._config.show_header ? `
            <div class="header">
              <div class="title">
                <ha-icon icon="mdi:battery-medium"></ha-icon>
                <span>HA Battery Status Monitor</span>
              </div>
            </div>` : ""}
          ${countsHtml}
          ${listHtml}
          ${okHtml}
        </div>
      </ha-card>`;

    this._bindCountCards();
    this._bindRows();
  }

  _count(key, label, icon, value) {
    const clickable = this._config.popup_enabled;
    return `
      <button
        class="count ${key}${clickable ? " clickable" : ""}"
        data-status="${key}"
        type="button"
        ${clickable ? `aria-label="${label} anzeigen"` : "disabled"}
      >
        <ha-icon icon="${icon}"></ha-icon>
        <strong>${value}</strong>
        <span>${label}</span>
      </button>`;
  }

  _section(key, title, icon, devices) {
    const items = devices.filter((item) => item.status === key);
    if (!items.length) return "";

    return `
      <section class="section ${key}">
        <div class="section-title">
          <ha-icon icon="${icon}"></ha-icon>
          <span>${title}</span>
          <span class="section-count">${items.length}</span>
        </div>
        <div class="device-list">
          ${items.map((item) => `
            <div class="device-row" data-entity="${this._escape(item.entity_id)}" tabindex="0" role="button">
              <div class="device-name">${this._escape(item.device_name)}</div>
              ${this._config.show_values ? `<div class="device-value">${this._escape(item.display_value)}</div>` : ""}
            </div>`).join("")}
        </div>
      </section>`;
  }

  _bindCountCards() {
    if (!this._config.popup_enabled) return;

    this.querySelectorAll(".count.clickable").forEach((card) => {
      card.addEventListener("click", () => {
        this._openPopup(card.dataset.status);
      });
    });
  }

  _bindRows() {
    this.querySelectorAll(".device-row[data-entity]").forEach((row) => {
      const openEntity = () => {
        this.dispatchEvent(new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: row.dataset.entity },
        }));
      };

      row.addEventListener("click", openEntity);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEntity();
        }
      });
    });
  }

  _openPopup(status) {
    const state = this._hass?.states[this._config.entity];
    if (!state) return;

    const devices = Array.isArray(state.attributes?.devices)
      ? state.attributes.devices.filter((item) => item.status === status)
      : [];

    const definitions = {
      normal: ["Normal", "mdi:battery-check", "normal"],
      weak: ["Schwach", "mdi:battery-low", "weak"],
      critical: ["Kritisch", "mdi:battery-alert", "critical"],
      unavailable: ["Nicht erreichbar", "mdi:battery-off", "unavailable"],
    };
    const [title, icon, cls] = definitions[status] || ["Batterien", "mdi:battery", "normal"];

    const overlay = document.createElement("div");
    overlay.className = "popup-backdrop";
    overlay.innerHTML = `
      <div class="popup" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="popup-header ${cls}">
          <div class="popup-title">
            <ha-icon icon="${icon}"></ha-icon>
            <span>${title}</span>
            <span class="popup-count">${devices.length}</span>
          </div>
          <button class="popup-close" type="button" aria-label="Schließen">×</button>
        </div>
        <div class="popup-content">
          ${devices.length
            ? devices.map((item) => `
              <div class="popup-row" data-entity="${this._escape(item.entity_id)}" tabindex="0" role="button">
                <div class="device-name">${this._escape(item.device_name)}</div>
                ${this._config.show_values ? `<div class="device-value">${this._escape(item.display_value)}</div>` : ""}
              </div>`).join("")
            : `<div class="popup-empty"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Keine Geräte in diesem Status.</span></div>`}
        </div>
      </div>`;

    this.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector(".popup-close").addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    });

    overlay.querySelectorAll(".popup-row[data-entity]").forEach((row) => {
      const openEntity = () => {
        this.dispatchEvent(new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: row.dataset.entity },
        }));
        close();
      };

      row.addEventListener("click", openEntity);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEntity();
        }
      });
    });

    const keyHandler = (event) => {
      if (event.key === "Escape") {
        close();
        document.removeEventListener("keydown", keyHandler);
      }
    };
    document.addEventListener("keydown", keyHandler);
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
    })[char]);
  }

  _styles() {
    return `
      :host{display:block}
      ha-card{overflow:hidden}
      .content{padding:16px}
      .header{display:flex;align-items:center;margin-bottom:14px}
      .title{display:flex;align-items:center;gap:10px;font-size:1.15rem;font-weight:600}
      .title ha-icon{color:var(--primary-color)}

      .counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:14px}
      .count{appearance:none;border:0;font:inherit;text-align:left;color:var(--primary-text-color);display:grid;grid-template-columns:auto 1fr;column-gap:7px;align-items:center;padding:10px;border-radius:12px;background:var(--secondary-background-color);min-width:0}
      .count.clickable{cursor:pointer;transition:background-color .15s ease,transform .15s ease}
      .count.clickable:hover{background:var(--primary-background-color);transform:translateY(-1px)}
      .count:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .count:disabled{opacity:1;cursor:default}
      .count strong{font-size:1.2rem;line-height:1}
      .count span{grid-column:1/-1;margin-top:4px;font-size:.72rem;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .count ha-icon{--mdc-icon-size:20px}

      .section{margin-top:14px}
      .section-title{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-left:10px;font-weight:600}
      .section-title ha-icon{--mdc-icon-size:20px}
      .section-count{margin-left:auto;color:var(--secondary-text-color);font-size:.85rem;padding-right:2px}
      .device-list{padding-left:10px}
      .device-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:7px 2px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px}
      .device-row:last-child{border-bottom:0}
      .device-row:hover{background:var(--secondary-background-color)}
      .device-row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-1px}
      .device-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .device-value{flex:0 0 auto;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
      .ok{display:flex;align-items:center;justify-content:center;gap:8px;padding:18px 8px 6px;color:var(--secondary-text-color)}

      .critical ha-icon,.critical .device-value{color:var(--error-color)}
      .weak ha-icon,.weak .device-value{color:var(--warning-color)}
      .unavailable ha-icon,.unavailable .device-value{color:var(--secondary-text-color)}

      .popup-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.48);box-sizing:border-box}
      .popup{width:min(560px,100%);max-height:min(720px,90vh);display:flex;flex-direction:column;overflow:hidden;background:var(--card-background-color);color:var(--primary-text-color);border-radius:18px;box-shadow:var(--ha-card-box-shadow,0 10px 40px rgba(0,0,0,.35))}
      .popup-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--divider-color)}
      .popup-title{display:flex;align-items:center;gap:9px;font-size:1.05rem;font-weight:600}
      .popup-count{font-size:.85rem;font-weight:500;color:var(--secondary-text-color)}
      .popup-close{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font-size:28px;line-height:1;width:36px;height:36px;border-radius:50%;cursor:pointer}
      .popup-close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}
      .popup-close:focus-visible{outline:2px solid var(--primary-color);outline-offset:1px}
      .popup-content{overflow:auto;padding:6px 18px 14px}
      .popup-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:46px;padding:8px 4px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px}
      .popup-row:last-child{border-bottom:0}
      .popup-row:hover{background:var(--secondary-background-color)}
      .popup-row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-1px}
      .popup-empty{display:flex;align-items:center;justify-content:center;gap:8px;padding:28px 8px;color:var(--secondary-text-color)}

      @media (max-width:600px){
        .content{padding:14px}
        .counts{grid-template-columns:repeat(2,minmax(0,1fr))}
        .popup-backdrop{padding:10px}
        .popup{max-height:92vh;border-radius:16px}
        .popup-content{padding-left:14px;padding-right:14px}
      }
    `;
  }
}

class BatteryMonitorCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = {
      entity: "sensor.ha_battery_status_monitor_gesamt",
      show_header: true,
      show_summary: true,
      show_normal_count: true,
      show_weak_count: true,
      show_critical_count: true,
      show_unavailable_count: true,
      popup_enabled: true,
      show_normal_list: false,
      show_weak_list: true,
      show_critical_list: true,
      show_unavailable_list: true,
      show_values: true,
      ...config,
    };

    this.innerHTML = `
      <div class="editor">
        <ha-textfield id="entity" label="Gesamt-Sensor"></ha-textfield>

        <div class="group-title">Kopf & Übersicht</div>
        <ha-switch id="show_header">Überschrift anzeigen</ha-switch>
        <ha-switch id="show_summary">Statusübersicht oben anzeigen</ha-switch>

        <div class="group-title">Status oben anzeigen</div>
        <ha-switch id="show_normal_count">Normal</ha-switch>
        <ha-switch id="show_weak_count">Schwach</ha-switch>
        <ha-switch id="show_critical_count">Kritisch</ha-switch>
        <ha-switch id="show_unavailable_count">Nicht erreichbar</ha-switch>

        <div class="group-title">Klickbare Statusübersicht</div>
        <ha-switch id="popup_enabled">Beim Klick Geräteliste öffnen</ha-switch>

        <div class="group-title">Gerätelisten unterhalb der Übersicht</div>
        <ha-switch id="show_normal_list">Normale Geräte auflisten</ha-switch>
        <ha-switch id="show_weak_list">Schwache Geräte auflisten</ha-switch>
        <ha-switch id="show_critical_list">Kritische Geräte auflisten</ha-switch>
        <ha-switch id="show_unavailable_list">Nicht erreichbare Geräte auflisten</ha-switch>
        <ha-switch id="show_values">Batteriewerte anzeigen</ha-switch>
      </div>
    `;

    this._setEditorValues();
    this._bindEditor();
  }

  _setEditorValues() {
    const entity = this.querySelector("#entity");
    entity.value = this._config.entity || "";

    [
      "show_header",
      "show_summary",
      "show_normal_count",
      "show_weak_count",
      "show_critical_count",
      "show_unavailable_count",
      "popup_enabled",
      "show_normal_list",
      "show_weak_list",
      "show_critical_list",
      "show_unavailable_list",
      "show_values",
    ].forEach((key) => {
      this.querySelector(`#${key}`).checked = this._config[key] !== false;
    });

    this._injectStyles();
  }

  _injectStyles() {
    if (this.querySelector("style")) return;
    const style = document.createElement("style");
    style.textContent = `
      .editor{display:flex;flex-direction:column;gap:10px;padding:8px 0}
      .group-title{margin-top:10px;font-weight:600;color:var(--primary-text-color)}
      ha-switch{padding:4px 0}
      ha-textfield{width:100%}
    `;
    this.prepend(style);
  }

  _bindEditor() {
    this.querySelector("#entity").addEventListener("change", (event) => {
      this._update("entity", event.target.value);
    });

    [
      "show_header",
      "show_summary",
      "show_normal_count",
      "show_weak_count",
      "show_critical_count",
      "show_unavailable_count",
      "popup_enabled",
      "show_normal_list",
      "show_weak_list",
      "show_critical_list",
      "show_unavailable_list",
      "show_values",
    ].forEach((key) => {
      this.querySelector(`#${key}`).addEventListener("change", (event) => {
        this._update(key, event.target.checked);
      });
    });
  }

  _update(key, value) {
    this._config[key] = value;
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: this._config },
    }));
  }
}

if (!customElements.get("battery-monitor-card")) {
  customElements.define("battery-monitor-card", BatteryMonitorCard);
}
if (!customElements.get("battery-monitor-card-editor")) {
  customElements.define("battery-monitor-card-editor", BatteryMonitorCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "battery-monitor-card",
  name: "HA Battery Status Monitor Card",
  description: "Theme-aware HA Battery Status Monitor card",
  preview: true,
});
