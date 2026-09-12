(() => {
  const install = () => {
    const Card = customElements.get("battery-monitor-card");
    if (!Card) {
      setTimeout(install, 50);
      return;
    }

    Card.prototype._openPopup = function (statusKey) {
      if (!this._config?.popup_enabled || this._popup) return;

      const state = this._hass?.states?.[this._config.entity];
      const status = this._defs?.().find((item) => item.key === statusKey);
      if (!state || !status) return;

      const devices = (Array.isArray(state.attributes?.devices) ? state.attributes.devices : [])
        .filter((item) => item.status === statusKey);

      const dialog = document.createElement("dialog");
      dialog.className = "battery-monitor-dialog";
      dialog.innerHTML = `
        <div class="battery-monitor-dialog-inner">
          <div class="battery-monitor-dialog-header ${status.key}">
            <div class="battery-monitor-dialog-title">
              <span>${status.icon}</span>
              <strong>${status.label}</strong>
              <span>${devices.length}</span>
            </div>
            <button type="button" class="battery-monitor-dialog-close" aria-label="Schließen">×</button>
          </div>
          <div class="battery-monitor-dialog-content">
            ${devices.length ? devices.map((item) => `
              <button type="button" class="battery-monitor-dialog-row" data-entity="${this._escape(item.entity_id)}">
                <span>${this._escape(item.device_name)}</span>
                ${this._config.show_values ? `<span>${this._escape(item.display_value)}</span>` : ""}
              </button>
            `).join("") : '<div class="battery-monitor-dialog-empty">Keine Geräte in diesem Status.</div>'}
          </div>
        </div>
      `;

      if (!document.getElementById("battery-monitor-dialog-styles")) {
        const style = document.createElement("style");
        style.id = "battery-monitor-dialog-styles";
        style.textContent = `
          dialog.battery-monitor-dialog {
            width: min(560px, calc(100vw - 32px));
            max-width: 560px;
            max-height: min(720px, calc(100vh - 32px));
            margin: auto;
            padding: 0;
            border: 0;
            border-radius: 18px;
            overflow: hidden;
            background: var(--card-background-color, var(--primary-background-color));
            color: var(--primary-text-color);
            box-shadow: 0 20px 60px rgba(0,0,0,.45);
          }
          dialog.battery-monitor-dialog::backdrop { background: rgba(0,0,0,.55); }
          .battery-monitor-dialog-inner { display:flex; flex-direction:column; max-height:inherit; }
          .battery-monitor-dialog-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 18px; border-bottom:1px solid var(--divider-color); }
          .battery-monitor-dialog-title { display:flex; align-items:center; gap:10px; font-size:1.05rem; }
          .battery-monitor-dialog-title span:last-child { color:var(--secondary-text-color); font-size:.85rem; }
          .battery-monitor-dialog-close { width:36px; height:36px; border:0; border-radius:50%; background:transparent; color:var(--secondary-text-color); font-size:28px; cursor:pointer; }
          .battery-monitor-dialog-close:hover { background:var(--secondary-background-color); color:var(--primary-text-color); }
          .battery-monitor-dialog-content { overflow:auto; padding:6px 18px 14px; }
          .battery-monitor-dialog-row { width:100%; min-height:46px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 4px; border:0; border-bottom:1px solid var(--divider-color); border-radius:6px; background:transparent; color:var(--primary-text-color); text-align:left; cursor:pointer; font:inherit; }
          .battery-monitor-dialog-row:hover { background:var(--secondary-background-color); }
          .battery-monitor-dialog-row span:last-child { color:var(--secondary-text-color); }
          .battery-monitor-dialog-empty { padding:28px 8px; text-align:center; color:var(--secondary-text-color); }
          @media(max-width:600px) { dialog.battery-monitor-dialog { width:calc(100vw - 20px); max-height:92vh; border-radius:16px; } .battery-monitor-dialog-content { padding-left:14px; padding-right:14px; } }
        `;
        document.head.appendChild(style);
      }

      this._popup = dialog;
      document.body.appendChild(dialog);

      const close = () => this._closePopup();
      dialog.querySelector(".battery-monitor-dialog-close")?.addEventListener("click", close);
      dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
      dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });

      dialog.querySelectorAll(".battery-monitor-dialog-row[data-entity]").forEach((row) => {
        row.addEventListener("click", () => {
          const entityId = row.dataset.entity;
          close();
          this.dispatchEvent(new CustomEvent("hass-more-info", {
            bubbles: true,
            composed: true,
            detail: { entityId },
          }));
        });
      });

      dialog.addEventListener("close", () => {
        if (this._popup === dialog) this._popup = null;
      }, { once: true });

      dialog.showModal();
    };

    Card.prototype._closePopup = function () {
      if (this._popup) {
        const dialog = this._popup;
        this._popup = null;
        if (dialog.open) dialog.close();
        dialog.remove();
      }
      if (this._keyHandler) {
        document.removeEventListener("keydown", this._keyHandler);
        this._keyHandler = null;
      }
    };

    // The card itself already has pointer/click handlers. HA dashboard wrappers
    // can still interfere with those events. Catch the status button at the
    // document capture phase and stop the event before it reaches the card.
    if (!window.__batteryMonitorPopupEventFixInstalled) {
      window.__batteryMonitorPopupEventFixInstalled = true;

      const handleStatusInteraction = (event) => {
        const path = typeof event.composedPath === "function" ? event.composedPath() : [];
        const button = path.find(
          (node) =>
            node instanceof HTMLElement &&
            node.matches?.("button.battery-status-count[data-status]"),
        );

        if (!button) return;

        const card = path.find(
          (node) => node instanceof HTMLElement && node.localName === "battery-monitor-card",
        );

        if (!card?._config?.popup_enabled) return;

        const status = button.dataset.status;
        if (!status) return;

        // Open once on pointerdown. Suppress pointerup/click so the dashboard
        // cannot immediately re-handle the same interaction and cause flicker.
        if (event.type === "pointerdown") {
          event.preventDefault();
          event.stopImmediatePropagation();
          card._openPopup(status);
        } else {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      };

      document.addEventListener("pointerdown", handleStatusInteraction, true);
      document.addEventListener("pointerup", handleStatusInteraction, true);
      document.addEventListener("click", handleStatusInteraction, true);
    }
  };

  install();
})();
