class BatteryMonitorCard extends HTMLElement {
  static getStubConfig() {
    return {
      entity: "sensor.ha_battery_status_monitor_gesamt",
      default_view: "summary",
      summary_limit: 2,
      summary_categories: ["normal", "weak", "critical", "unavailable"],
    };
  }

  static getConfigForm() {
    const boolean = (name, label, visible) => ({
      name,
      selector: { boolean: {} },
      ...(visible ? { visible } : {}),
    });

    const viewOptions = [
      { value: "summary", label: "Zusammenfassung" },
      { value: "normal", label: "Normal" },
      { value: "weak", label: "Schwach" },
      { value: "critical", label: "Kritisch" },
      { value: "unavailable", label: "Nicht erreichbar" },
    ];

    const statusOptions = [
      { value: "normal", label: "Normal" },
      { value: "weak", label: "Schwach" },
      { value: "critical", label: "Kritisch" },
      { value: "unavailable", label: "Nicht erreichbar" },
    ];

    return {
      schema: [
        {
          type: "expandable",
          name: "display",
          title: "Anzeige",
          flatten: true,
          schema: [
            boolean("show_header", "Überschrift anzeigen"),
            boolean("show_summary", "Statusübersicht oben anzeigen"),
            {
              name: "entity",
              required: true,
              selector: { entity: { domain: "sensor" } },
            },
          ],
        },
        {
          type: "expandable",
          name: "startup",
          title: "Startansicht",
          flatten: true,
          schema: [
            {
              name: "default_view",
              selector: { select: { options: viewOptions, mode: "dropdown" } },
            },
            {
              name: "summary_limit",
              selector: {
                select: {
                  options: [
                    { value: 2, label: "2 Geräte je Kategorie" },
                    { value: 3, label: "3 Geräte je Kategorie" },
                  ],
                  mode: "dropdown",
                },
              },
              visible: { field: "default_view", value: "summary" },
            },
          ],
        },
        {
          type: "expandable",
          name: "summary_categories",
          title: "Kategorien in der Zusammenfassung",
          flatten: true,
          schema: [
            {
              name: "summary_categories",
              selector: {
                select: {
                  options: statusOptions,
                  multiple: true,
                  mode: "list",
                },
              },
            },
          ],
        },
      ],
      computeLabel: (schema) => ({
        entity: "Gesamt-Sensor",
        show_header: "Überschrift anzeigen",
        show_summary: "Statusübersicht oben anzeigen",
        default_view: "Standardansicht beim Start",
        summary_limit: "Geräte pro Kategorie",
        summary_categories: "Angezeigte Kategorien",
      })[schema.name],
      computeHelper: (schema) => {
        if (schema.name === "default_view") {
          return "Legt fest, welche Ansicht direkt unter den Statuszahlen geöffnet ist.";
        }
        if (schema.name === "summary_limit") {
          return "In der Zusammenfassung werden pro ausgewählter Kategorie nur die ersten 2 oder 3 Geräte angezeigt.";
        }
        if (schema.name === "summary_categories") {
          return "Wähle alle Kategorien oder nur die Kategorien, die in der Zusammenfassung erscheinen sollen.";
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
      default_view: "summary",
      summary_limit: 2,
      summary_categories: ["normal", "weak", "critical", "unavailable"],
      ...config,
    };

    this._activeView = this._config.default_view;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    const view = this._activeView || this._config?.default_view || "summary";
    return view === "summary" ? 5 : 4;
  }

  getGridOptions() {
    const view = this._activeView || this._config?.default_view || "summary";
    return {
      rows: view === "summary" ? 5 : 4,
      columns: 6,
      min_rows: 3,
      max_rows: 10,
    };
  }

  _defs() {
    return [
      {
        key: "normal",
        label: "Normal",
        icon: "✓",
      },
      {
        key: "weak",
        label: "Schwach",
        icon: "▾",
      },
      {
        key: "critical",
        label: "Kritisch",
        icon: "!",
      },
      {
        key: "unavailable",
        label: "Nicht erreichbar",
        icon: "×",
      },
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
    const devices = Array.isArray(state.attributes?.devices)
      ? state.attributes.devices
      : [];
    const defs = this._defs();

    const visibleCounts = this._config.show_summary ? defs : [];
    const activeView = this._activeView || this._config.default_view || "summary";

    const countsHtml = visibleCounts.length
      ? `<div class="counts">${visibleCounts
          .map((status) => this._count(status, counts[status.key] || 0, activeView))
          .join("")}</div>`
      : "";

    const contentHtml = this._renderContent(activeView, devices, defs);

    this.innerHTML = `
      <ha-card>
        <style>${this._styles()}</style>
        <div class="content">
          ${this._config.show_header
            ? '<div class="header"><div class="title"><span class="title-icon">⌁</span><span>HA Battery Status Monitor</span></div></div>'
            : ""}
          ${countsHtml}
          ${contentHtml}
        </div>
      </ha-card>
    `;

    this._bindEvents();
  }

  _count(status, value, activeView) {
    const active = activeView === status.key ? " active" : "";

    return `
      <button
        class="battery-status-count ${status.key}${active}"
        data-status="${status.key}"
        type="button"
        aria-label="${status.label}: ${value}"
        aria-pressed="${activeView === status.key}"
      >
        <span class="count-icon">${status.icon}</span>
        <strong>${value}</strong>
        <span class="count-label">${status.label}</span>
      </button>
    `;
  }

  _renderContent(activeView, devices, defs) {
    if (activeView === "summary") {
      const selected = Array.isArray(this._config.summary_categories)
        ? this._config.summary_categories
        : defs.map((status) => status.key);
      const limit = Number(this._config.summary_limit) === 3 ? 3 : 2;

      const sections = defs
        .filter((status) => selected.includes(status.key))
        .map((status) => this._section(status, devices, limit))
        .filter(Boolean)
        .join("");

      if (!sections) {
        return '<div class="empty">Keine Geräte für die ausgewählten Kategorien vorhanden.</div>';
      }

      return `
        <div class="view-label">
          <span class="view-label-title">Zusammenfassung</span>
          <span class="view-label-hint">${limit} Geräte je Kategorie</span>
        </div>
        <div class="sections">${sections}</div>
      `;
    }

    const status = defs.find((item) => item.key === activeView);
    if (!status) return "";

    const section = this._section(status, devices, null);
    return `
      <div class="detail-toolbar">
        <button class="back-button" type="button" data-summary="true">
          <span>←</span>
          <span>Zusammenfassung</span>
        </button>
      </div>
      ${section || '<div class="empty">Keine Geräte in diesem Status.</div>'}
    `;
  }

  _section(status, devices, limit) {
    let items = devices.filter((item) => item.status === status.key);
    if (limit) items = items.slice(0, limit);
    if (!items.length) return "";

    const total = devices.filter((item) => item.status === status.key).length;
    const limited = limit && total > items.length;

    return `
      <section class="section ${status.key}">
        <div class="section-title">
          <span class="section-icon">${status.icon}</span>
          <span>${status.label}</span>
          <span class="section-count">${total}</span>
        </div>
        <div class="device-list">
          ${items.map((item) => this._row(item)).join("")}
        </div>
        ${limited
          ? `<div class="more-hint">Weitere ${total - items.length} Geräte – ${status.label} oben auswählen.</div>`
          : ""}
      </section>
    `;
  }

  _row(item) {
    return `
      <div
        class="device-row"
        data-entity="${this._escape(item.entity_id)}"
        tabindex="0"
        role="button"
        aria-label="${this._escape(item.device_name)}"
      >
        <span class="device-name">${this._escape(item.device_name)}</span>
        <span class="device-value">${this._escape(item.display_value)}</span>
      </div>
    `;
  }

  _bindEvents() {
    this.querySelectorAll(".battery-status-count[data-status]").forEach((button) => {
      button.addEventListener("click", () => {
        const status = button.dataset.status;
        this._activeView = this._activeView === status ? "summary" : status;
        this._render();
      });
    });

    this.querySelectorAll(".back-button[data-summary]").forEach((button) => {
      button.addEventListener("click", () => {
        this._activeView = "summary";
        this._render();
      });
    });

    this.querySelectorAll(".device-row[data-entity]").forEach((row) => {
      const open = () => {
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            bubbles: true,
            composed: true,
            detail: { entityId: row.dataset.entity },
          }),
        );
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
      .battery-status-count{position:relative;appearance:none;border:0;font:inherit;text-align:left;color:var(--primary-text-color);display:grid;grid-template-columns:auto 1fr;column-gap:7px;align-items:center;padding:10px;border-radius:12px;background:var(--secondary-background-color);min-width:0;box-sizing:border-box;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;transition:background .15s ease,transform .15s ease,box-shadow .15s ease}
      .battery-status-count:hover{background:var(--primary-background-color);transform:translateY(-1px)}
      .battery-status-count:active{transform:translateY(0)}
      .battery-status-count.active{box-shadow:inset 0 0 0 2px var(--primary-color);background:var(--primary-background-color)}
      .battery-status-count:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
      .battery-status-count strong{font-size:1.2rem;line-height:1}
      .count-label{grid-column:1/-1;margin-top:4px;font-size:.72rem;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .count-icon,.section-icon{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;font-weight:700}
      .critical .count-icon,.critical .device-value,.critical .section-icon{color:var(--error-color)}
      .weak .count-icon,.weak .device-value,.weak .section-icon{color:var(--warning-color)}
      .unavailable .count-icon,.unavailable .device-value,.unavailable .section-icon{color:var(--secondary-text-color)}

      .view-label{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:4px 0 8px;padding:0 10px}
      .view-label-title{font-weight:600}
      .view-label-hint{font-size:.78rem;color:var(--secondary-text-color)}
      .detail-toolbar{display:flex;justify-content:flex-start;margin:2px 0 10px}
      .back-button{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:8px;padding:6px 9px;background:transparent;color:var(--primary-color);font:inherit;font-size:.86rem;cursor:pointer}
      .back-button:hover{background:var(--secondary-background-color)}

      .sections{display:flex;flex-direction:column;gap:4px}
      .section{margin-top:8px}
      .section-title{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-left:10px;font-weight:600}
      .section-count{margin-left:auto;color:var(--secondary-text-color);font-size:.85rem;padding-right:2px}
      .device-list{padding-left:10px}
      .device-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:7px 6px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px;outline:none}
      .device-row:hover{background:var(--secondary-background-color)}
      .device-row:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}
      .device-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .device-value{flex:0 0 auto;color:var(--secondary-text-color);font-size:.86rem}
      .more-hint{padding:7px 16px 4px;color:var(--secondary-text-color);font-size:.76rem}
      .empty{padding:20px 10px;text-align:center;color:var(--secondary-text-color)}

      @media(max-width:600px){
        .content{padding:12px}
        .counts{gap:6px}
        .battery-status-count{padding:8px 7px;border-radius:10px}
        .count-label{font-size:.66rem}
        .view-label{padding:0 6px}
        .device-list{padding-left:6px}
        .section-title{padding-left:6px}
      }

      @media(max-width:430px){
        .counts{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
    `;
  }
}

customElements.define("battery-monitor-card", BatteryMonitorCard);

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "battery-monitor-card")) {
  window.customCards.push({
    type: "battery-monitor-card",
    name: "HA Battery Status Monitor",
    description: "Battery status overview and device list for HA Battery Status Monitor.",
    preview: true,
  });
}
