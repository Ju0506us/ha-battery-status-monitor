class BatteryMonitorCard extends HTMLElement {
  static getStubConfig() {
    return { entity: "sensor.ha_battery_status_monitor_gesamt" };
  }

  static getConfigForm() {
    const boolean = (name, label, visible) => ({
      name,
      selector: { boolean: {} },
      ...(visible ? { visible } : {}),
    });

    return {
      schema: [
        {
          type: "expandable",
          name: "display",
          title: "Kopf & Übersicht",
          flatten: true,
          schema: [
            boolean("show_header", "Überschrift anzeigen"),
            boolean("show_summary", "Statusübersicht oben anzeigen"),
            boolean("popup_enabled", "Status anklickbar / Popup aktiv"),
          ],
        },
        {
          type: "expandable",
          name: "summary",
          title: "Status oben",
          flatten: true,
          schema: [
            boolean("show_normal_count", "Normal anzeigen"),
            boolean("show_weak_count", "Schwach anzeigen"),
            boolean("show_critical_count", "Kritisch anzeigen"),
            boolean("show_unavailable_count", "Nicht erreichbar anzeigen"),
          ],
        },
        {
          type: "expandable",
          name: "device_list",
          title: "Geräteliste unten",
          flatten: true,
          schema: [
            boolean("show_device_list", "Geräteliste insgesamt anzeigen"),
            boolean("show_normal_list", "Normale Geräte", { field: "show_device_list", value: true }),
            boolean("show_weak_list", "Schwache Geräte", { field: "show_device_list", value: true }),
            boolean("show_critical_list", "Kritische Geräte", { field: "show_device_list", value: true }),
            boolean("show_unavailable_list", "Nicht erreichbare Geräte", { field: "show_device_list", value: true }),
            boolean("show_values", "Batteriewerte anzeigen", { field: "show_device_list", value: true }),
          ],
        },
        {
          name: "entity",
          required: true,
          selector: { entity: { domain: "sensor" } },
        },
      ],
      computeLabel: (schema) => ({
        entity: "Gesamt-Sensor",
        show_header: "Überschrift anzeigen",
        show_summary: "Statusübersicht oben anzeigen",
        popup_enabled: "Status anklickbar / Popup aktiv",
        show_normal_count: "Normal anzeigen",
        show_weak_count: "Schwach anzeigen",
        show_critical_count: "Kritisch anzeigen",
        show_unavailable_count: "Nicht erreichbar anzeigen",
        show_device_list: "Geräteliste insgesamt anzeigen",
        show_normal_list: "Normale Geräte",
        show_weak_list: "Schwache Geräte",
        show_critical_list: "Kritische Geräte",
        show_unavailable_list: "Nicht erreichbare Geräte",
        show_values: "Batteriewerte anzeigen",
      })[schema.name],
      computeHelper: (schema) => {
        if (schema.name === "show_device_list") {
          return "Schaltet die komplette Geräteliste unten ein oder aus.";
        }
        if (schema.name === "popup_enabled") {
          return "Wenn aktiv, öffnet ein Klick auf eine Statuszahl die Geräte dieses Status als Popup.";
        }
        return undefined;
      },
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
      show_device_list: true,
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

  connectedCallback() {
    if (this._interactionHandler) return;

    this._interactionHandler = (event) => {
      if (!this._config?.popup_enabled) return;

      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const target = path.find(
        (node) =>
          node instanceof HTMLElement &&
          node.matches?.("button.battery-status-count[data-status]"),
      );

      if (!target || !this.contains(target)) return;

      const status = target.dataset.status;
      if (!status) return;

      event.preventDefault();
      event.stopPropagation();
      this._openPopup(status);
    };

    // Capture on the card itself. No HA dashboard wrapper can swallow this
    // before the custom card sees it.
    this.addEventListener("pointerup", this._interactionHandler, true);
    this.addEventListener("click", this._interactionHandler, true);
  }

  disconnectedCallback() {
    this._closePopup();

    if (this._interactionHandler) {
      this.removeEventListener("pointerup", this._interactionHandler, true);
      this.removeEventListener("click", this._interactionHandler, true);
      this._interactionHandler = null;
    }
  }

  getCardSize() {
    return this._config?.show_device_list ? 5 : 3;
  }

  getGridOptions() {
    return {
      rows: this._config?.show_device_list ? 5 : 3,
      columns: 6,
      min_rows: 3,
      max_rows: 8,
    };
  }

  _defs() {
    return [
      { key: "normal", label: "Normal", icon: "✓", count: "show_normal_count", list: "show_normal_list" },
      { key: "weak", label: "Schwach", icon: "▾", count: "show_weak_count", list: "show_weak_list" },
      { key: "critical", label: "Kritisch", icon: "!", count: "show_critical_count", list: "show_critical_list" },
      { key: "unavailable", label: "Nicht erreichbar", icon: "×", count: "show_unavailable_count", list: "show_unavailable_list" },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;

    const state = this._hass.states[this._config.entity];
    if (!state) {
      this.innerHTML = '<ha-card><div class="content">HA Battery Status Monitor Entity nicht gefunden.</div></ha-card>';
      return;
    }

    const counts = state.attributes?.counts || {};
    const devices = Array.isArray(state.attributes?.devices) ? state.attributes.devices : [];
    const defs = this._defs();

    const visibleCounts = this._config.show_summary
      ? defs.filter((status) => this._config[status.count])
      : [];

    const countsHtml = visibleCounts.length
      ? `<div class="counts">${visibleCounts.map((status) => this._count(status, counts[status.key] || 0)).join("")}</div>`
      : "";

    let listHtml = "";
    if (this._config.show_device_list) {
      listHtml = defs
        .filter((status) => this._config[status.list])
        .map((status) => this._section(status, devices))
        .filter(Boolean)
        .join("");

      if (!listHtml && devices.length && devices.every((item) => item.status === "normal")) {
        listHtml = '<div class="ok"><span class="ok-icon">✓</span><span>Alle Batterien sind in Ordnung</span></div>';
      }
    }

    this.innerHTML = `
      <ha-card>
        <style>${this._styles()}</style>
        <div class="content">
          ${this._config.show_header ? '<div class="header"><div class="title"><span class="title-icon">⌁</span><span>HA Battery Status Monitor</span></div></div>' : ""}
          ${countsHtml}
          ${listHtml}
        </div>
      </ha-card>
    `;

    this._bindDeviceEvents();
  }

  _count(status, value) {
    return `
      <button
        class="battery-status-count ${status.key}"
        data-status="${status.key}"
        type="button"
        aria-label="${status.label}: ${value}"
        ${this._config.popup_enabled ? "" : 'aria-disabled="true"'}
      >
        <span class="count-icon">${status.icon}</span>
        <strong>${value}</strong>
        <span class="count-label">${status.label}</span>
      </button>
    `;
  }

  _section(status, devices) {
    const items = devices.filter((item) => item.status === status.key);
    if (!items.length) return "";

    return `
      <section class="section ${status.key}">
        <div class="section-title">
          <span class="section-icon">${status.icon}</span>
          <span>${status.label}</span>
          <span class="section-count">${items.length}</span>
        </div>
        <div class="device-list">
          ${items.map((item) => this._row(item)).join("")}
        </div>
      </section>
    `;
  }

  _row(item) {
    return `
      <div class="device-row" data-entity="${this._escape(item.entity_id)}" tabindex="0" role="button">
        <span class="device-name">${this._escape(item.device_name)}</span>
        ${this._config.show_values ? `<span class="device-value">${this._escape(item.display_value)}</span>` : ""}
      </div>
    `;
  }

  _bindDeviceEvents() {
    this.querySelectorAll(".device-row[data-entity]").forEach((row) => {
      const open = () => {
        this.dispatchEvent(new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId: row.dataset.entity },
        }));
      };

      row.addEventListener("click", open);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  }

  _openPopup(statusKey) {
    if (!this._config.popup_enabled || this._popup) return;

    const state = this._hass?.states[this._config.entity];
    const status = this._defs().find((item) => item.key === statusKey);
    if (!state || !status) return;

    const devices = (Array.isArray(state.attributes?.devices) ? state.attributes.devices : [])
      .filter((item) => item.status === statusKey);

    const overlay = document.createElement("div");
    overlay.className = "popup-backdrop";
    overlay.innerHTML = `
      <div class="popup" role="dialog" aria-modal="true" aria-label="${status.label}">
        <div class="popup-header ${status.key}">
          <div class="popup-title">
            <span class="section-icon">${status.icon}</span>
            <span>${status.label}</span>
            <span class="popup-count">${devices.length}</span>
          </div>
          <button class="popup-close" type="button" aria-label="Schließen">×</button>
        </div>
        <div class="popup-content">
          ${devices.length
            ? devices.map((item) => this._row(item).replace("device-row", "popup-row")).join("")
            : '<div class="popup-empty">Keine Geräte in diesem Status.</div>'}
        </div>
      </div>
    `;

    this._popup = overlay;
    document.body.appendChild(overlay);

    overlay.querySelector(".popup-close")?.addEventListener("click", () => this._closePopup());
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) this._closePopup();
    });

    overlay.querySelectorAll(".popup-row[data-entity]").forEach((row) => {
      row.addEventListener("click", () => {
        const entityId = row.dataset.entity;
        this._closePopup();
        this.dispatchEvent(new CustomEvent("hass-more-info", {
          bubbles: true,
          composed: true,
          detail: { entityId },
        }));
      });
    });

    this._keyHandler = (event) => {
      if (event.key === "Escape") this._closePopup();
    };
    document.addEventListener("keydown", this._keyHandler);
  }

  _closePopup() {
    if (this._popup) {
      this._popup.remove();
      this._popup = null;
    }
    if (this._keyHandler) {
      document.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  }

  _escape(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    })[character]);
  }

  _styles() {
    return `
      :host{display:block;pointer-events:auto}
      .content{padding:16px}
      .header{display:flex;align-items:center;margin-bottom:14px}
      .title{display:flex;align-items:center;gap:10px;font-size:1.15rem;font-weight:600}
      .title-icon{color:var(--primary-color);font-size:1.25rem}

      .counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:14px}
      .battery-status-count{position:relative;z-index:10;pointer-events:auto;appearance:none;border:0;font:inherit;text-align:left;color:var(--primary-text-color);display:grid;grid-template-columns:auto 1fr;column-gap:7px;align-items:center;padding:10px;border-radius:12px;background:var(--secondary-background-color);min-width:0;box-sizing:border-box;cursor:pointer!important;touch-action:manipulation;user-select:none;-webkit-user-select:none}
      .battery-status-count:hover{background:var(--primary-background-color);transform:translateY(-1px)}
      .battery-status-count:active{transform:translateY(0)}
      .battery-status-count[aria-disabled="true"]{cursor:default!important}
      .battery-status-count:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .battery-status-count strong{font-size:1.2rem;line-height:1}
      .count-label{grid-column:1/-1;margin-top:4px;font-size:.72rem;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .count-icon,.section-icon{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;font-weight:700}
      .critical .count-icon,.critical .device-value,.critical .section-icon{color:var(--error-color)}
      .weak .count-icon,.weak .device-value,.weak .section-icon{color:var(--warning-color)}
      .unavailable .count-icon,.unavailable .device-value,.unavailable .section-icon{color:var(--secondary-text-color)}

      .section{margin-top:14px}
      .section-title{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-left:10px;font-weight:600}
      .section-count{margin-left:auto;color:var(--secondary-text-color);font-size:.85rem}
      .device-list{padding-left:10px}
      .device-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:7px 6px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px}
      .device-row:last-child{border-bottom:0}
      .device-row:hover{background:var(--secondary-background-color)}
      .device-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .device-value{flex:0 0 auto;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
      .ok{display:flex;align-items:center;justify-content:center;gap:8px;padding:18px 8px 6px;color:var(--secondary-text-color)}
      .ok-icon{font-weight:700}

      .popup-backdrop{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.48);box-sizing:border-box;pointer-events:auto}
      .popup{width:min(560px,100%);max-height:min(720px,90vh);display:flex;flex-direction:column;overflow:hidden;background:var(--card-background-color,var(--primary-background-color));color:var(--primary-text-color);border-radius:18px;box-shadow:0 10px 40px rgba(0,0,0,.35)}
      .popup-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--divider-color)}
      .popup-title{display:flex;align-items:center;gap:9px;font-size:1.05rem;font-weight:600}
      .popup-count{font-size:.85rem;color:var(--secondary-text-color)}
      .popup-close{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font-size:28px;line-height:1;width:36px;height:36px;border-radius:50%;cursor:pointer}
      .popup-close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}
      .popup-content{overflow:auto;padding:6px 18px 14px}
      .popup-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:46px;padding:8px 4px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px}
      .popup-row:last-child{border-bottom:0}
      .popup-row:hover{background:var(--secondary-background-color)}
      .popup-empty{display:flex;align-items:center;justify-content:center;padding:28px 8px;color:var(--secondary-text-color)}

      @media(max-width:600px){
        .content{padding:14px}
        .counts{grid-template-columns:repeat(2,minmax(0,1fr))}
        .popup-backdrop{padding:10px;align-items:flex-end}
        .popup{max-height:92vh;border-radius:16px 16px 0 0}
        .popup-content{padding-left:14px;padding-right:14px}
      }
    `;
  }
}

if (!customElements.get("battery-monitor-card")) {
  customElements.define("battery-monitor-card", BatteryMonitorCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "battery-monitor-card")) {
  window.customCards.push({
    type: "battery-monitor-card",
    name: "HA Battery Status Monitor Card",
    description: "Theme-aware HA Battery Status Monitor card",
    preview: true,
    documentationURL: "https://github.com/Ju0506us/ha-battery-monitor",
  });
}
