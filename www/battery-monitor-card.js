class BatteryMonitorCard extends HTMLElement {
  static getConfigElement() { return document.createElement("battery-monitor-card-editor"); }
  static getStubConfig() { return { entity: "sensor.ha_battery_status_monitor_gesamt" }; }
  setConfig(config) {
    if (!config || !config.entity) throw new Error("HA Battery Status Monitor Card benötigt eine entity.");
    this._config = { entity: "sensor.ha_battery_status_monitor_gesamt", show_header: true, show_summary: true, show_normal_count: true, show_weak_count: true, show_critical_count: true, show_unavailable_count: true, popup_enabled: true, show_device_list: true, show_normal_list: false, show_weak_list: true, show_critical_list: true, show_unavailable_list: true, show_values: true, ...config };
    this._render();
  }
  set hass(hass) { this._hass = hass; this._render(); }
  getCardSize() { return this._config?.show_device_list ? 5 : 3; }
  _defs() { return [
    {key:"normal",label:"Normal",icon:"mdi:battery-check",count:"show_normal_count",list:"show_normal_list"},
    {key:"weak",label:"Schwach",icon:"mdi:battery-low",count:"show_weak_count",list:"show_weak_list"},
    {key:"critical",label:"Kritisch",icon:"mdi:battery-alert",count:"show_critical_count",list:"show_critical_list"},
    {key:"unavailable",label:"Nicht erreichbar",icon:"mdi:battery-off",count:"show_unavailable_count",list:"show_unavailable_list"},
  ]; }
  _render() {
    if (!this._hass || !this._config) return;
    const state=this._hass.states[this._config.entity];
    if(!state){this.innerHTML='<ha-card><div class="content">HA Battery Status Monitor Entity nicht gefunden.</div></ha-card>';return;}
    const counts=state.attributes?.counts||{};
    const devices=Array.isArray(state.attributes?.devices)?state.attributes.devices:[];
    const defs=this._defs();
    const visibleCounts=this._config.show_summary?defs.filter(s=>this._config[s.count]):[];
    const countsHtml=visibleCounts.length?`<div class="counts">${visibleCounts.map(s=>this._count(s,counts[s.key]||0)).join("")}</div>`:"";
    let listHtml="";
    if(this._config.show_device_list){
      listHtml=defs.filter(s=>this._config[s.list]).map(s=>this._section(s,devices)).filter(Boolean).join("");
      if(!listHtml&&devices.length&&devices.every(i=>i.status==="normal")) listHtml='<div class="ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon><span>Alle Batterien sind in Ordnung</span></div>';
    }
    this.innerHTML=`<ha-card><style>${this._styles()}</style><div class="content">${this._config.show_header?'<div class="header"><div class="title"><ha-icon icon="mdi:battery-medium"></ha-icon><span>HA Battery Status Monitor</span></div></div>':""}${countsHtml}${listHtml}</div></ha-card>`;
    this._bindEvents();
  }
  _count(status,value){return `<button class="count ${status.key}${this._config.popup_enabled?" clickable":""}" data-status="${status.key}" type="button" ${this._config.popup_enabled?"":"disabled"}><ha-icon icon="${status.icon}"></ha-icon><strong>${value}</strong><span>${status.label}</span></button>`;}
  _section(status,devices){const items=devices.filter(i=>i.status===status.key);if(!items.length)return "";return `<section class="section ${status.key}"><div class="section-title"><ha-icon icon="${status.icon}"></ha-icon><span>${status.label}</span><span class="section-count">${items.length}</span></div><div class="device-list">${items.map(i=>this._row(i)).join("")}</div></section>`;}
  _row(item){return `<div class="device-row" data-entity="${this._escape(item.entity_id)}" tabindex="0" role="button"><div class="device-name">${this._escape(item.device_name)}</div>${this._config.show_values?`<div class="device-value">${this._escape(item.display_value)}</div>`:""}</div>`;}
  _bindEvents(){
    if(this._config.popup_enabled)this.querySelectorAll(".count.clickable").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();this._openPopup(b.dataset.status);}));
    this.querySelectorAll(".device-row[data-entity]").forEach(row=>{const open=()=>this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:true,composed:true,detail:{entityId:row.dataset.entity}}));row.addEventListener("click",open);row.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});});
  }
  _openPopup(statusKey){
    if(!this._config.popup_enabled||this._popup)return;
    const state=this._hass?.states[this._config.entity]; if(!state)return;
    const status=this._defs().find(s=>s.key===statusKey); if(!status)return;
    const devices=(Array.isArray(state.attributes?.devices)?state.attributes.devices:[]).filter(i=>i.status===statusKey);
    const overlay=document.createElement("div"); overlay.className="popup-backdrop";
    overlay.innerHTML=`<div class="popup" role="dialog" aria-modal="true"><div class="popup-header ${status.key}"><div class="popup-title"><ha-icon icon="${status.icon}"></ha-icon><span>${status.label}</span><span class="popup-count">${devices.length}</span></div><button class="popup-close" type="button" aria-label="Schließen">×</button></div><div class="popup-content">${devices.length?devices.map(i=>this._row(i).replace("device-row","popup-row")).join(""):"<div class=\"popup-empty\">Keine Geräte in diesem Status.</div>"}</div></div>`;
    this._popup=overlay; document.body.appendChild(overlay);
    const close=()=>this._closePopup(); overlay.querySelector(".popup-close").addEventListener("click",close); overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
    overlay.querySelectorAll(".popup-row[data-entity]").forEach(row=>row.addEventListener("click",()=>{const entityId=row.dataset.entity;close();this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:true,composed:true,detail:{entityId}}));}));
    this._keyHandler=e=>{if(e.key==="Escape")close();}; document.addEventListener("keydown",this._keyHandler);
  }
  _closePopup(){if(this._popup){this._popup.remove();this._popup=null;}if(this._keyHandler){document.removeEventListener("keydown",this._keyHandler);this._keyHandler=null;}}
  _escape(value){return String(value??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
  _styles(){return `
    :host{display:block}.content{padding:16px}.header{display:flex;align-items:center;margin-bottom:14px}.title{display:flex;align-items:center;gap:10px;font-size:1.15rem;font-weight:600}.title ha-icon{color:var(--primary-color)}
    .counts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:14px}.count{appearance:none;border:0;font:inherit;text-align:left;color:var(--primary-text-color);display:grid;grid-template-columns:auto 1fr;column-gap:7px;align-items:center;padding:10px;border-radius:12px;background:var(--secondary-background-color);min-width:0;box-sizing:border-box}.count.clickable{cursor:pointer;transition:background-color .15s ease,transform .15s ease}.count.clickable:hover{background:var(--primary-background-color);transform:translateY(-1px)}.count:disabled{opacity:1;cursor:default}.count:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}.count strong{font-size:1.2rem;line-height:1}.count span{grid-column:1/-1;margin-top:4px;font-size:.72rem;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.count ha-icon{--mdc-icon-size:20px}
    .section{margin-top:14px}.section-title{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-left:10px;font-weight:600}.section-count{margin-left:auto;color:var(--secondary-text-color);font-size:.85rem}.device-list{padding-left:10px}.device-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:7px 6px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px}.device-row:last-child{border-bottom:0}.device-row:hover{background:var(--secondary-background-color)}.device-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.device-value{flex:0 0 auto;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}.ok{display:flex;align-items:center;justify-content:center;gap:8px;padding:18px 8px 6px;color:var(--secondary-text-color)}.critical ha-icon,.critical .device-value{color:var(--error-color)}.weak ha-icon,.weak .device-value{color:var(--warning-color)}.unavailable ha-icon,.unavailable .device-value{color:var(--secondary-text-color)}
    .popup-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.48);box-sizing:border-box}.popup{width:min(560px,100%);max-height:min(720px,90vh);display:flex;flex-direction:column;overflow:hidden;background:var(--card-background-color,var(--primary-background-color));color:var(--primary-text-color);border-radius:18px;box-shadow:var(--ha-card-box-shadow,0 10px 40px rgba(0,0,0,.35))}.popup-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid var(--divider-color)}.popup-title{display:flex;align-items:center;gap:9px;font-size:1.05rem;font-weight:600}.popup-count{font-size:.85rem;color:var(--secondary-text-color)}.popup-close{appearance:none;border:0;background:transparent;color:var(--secondary-text-color);font-size:28px;line-height:1;width:36px;height:36px;border-radius:50%;cursor:pointer}.popup-close:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}.popup-content{overflow:auto;padding:6px 18px 14px}.popup-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:46px;padding:8px 4px;border-bottom:1px solid var(--divider-color);cursor:pointer;border-radius:6px}.popup-row:last-child{border-bottom:0}.popup-row:hover{background:var(--secondary-background-color)}.popup-empty{display:flex;align-items:center;justify-content:center;padding:28px 8px;color:var(--secondary-text-color)}
    @media(max-width:600px){.content{padding:14px}.counts{grid-template-columns:repeat(2,minmax(0,1fr))}.popup-backdrop{padding:10px;align-items:flex-end}.popup{max-height:92vh;border-radius:16px 16px 0 0}.popup-content{padding-left:14px;padding-right:14px}}
  `;}
}

class BatteryMonitorCardEditor extends HTMLElement {
  setConfig(config){
    this._config={entity:"sensor.ha_battery_status_monitor_gesamt",show_header:true,show_summary:true,show_normal_count:true,show_weak_count:true,show_critical_count:true,show_unavailable_count:true,popup_enabled:true,show_device_list:true,show_normal_list:false,show_weak_list:true,show_critical_list:true,show_unavailable_list:true,show_values:true,...config};
    this.innerHTML=`<div class="editor"><ha-textfield id="entity" label="Gesamt-Sensor"></ha-textfield><h3>Kopf & Übersicht</h3>${this._switch("show_header","Überschrift anzeigen")}${this._switch("show_summary","Statusübersicht oben anzeigen")}<h3>Status oben</h3>${this._switch("show_normal_count","Normal anzeigen")}${this._switch("show_weak_count","Schwach anzeigen")}${this._switch("show_critical_count","Kritisch anzeigen")}${this._switch("show_unavailable_count","Nicht erreichbar anzeigen")}${this._switch("popup_enabled","Status anklickbar / Popup aktiv")}<h3>Geräteliste unten</h3>${this._switch("show_device_list","Geräteliste insgesamt anzeigen")}${this._switch("show_normal_list","Normale Geräte")}${this._switch("show_weak_list","Schwache Geräte")}${this._switch("show_critical_list","Kritische Geräte")}${this._switch("show_unavailable_list","Nicht erreichbare Geräte")}${this._switch("show_values","Batteriewerte anzeigen")}</div>`;
    const entity=this.querySelector("#entity");entity.value=this._config.entity;entity.addEventListener("change",e=>this._update("entity",e.target.value));
    this.querySelectorAll("ha-switch[data-key]").forEach(s=>s.addEventListener("change",e=>this._update(s.dataset.key,e.target.checked)));
  }
  _switch(key,label){return `<ha-switch data-key="${key}" ${this._config[key]?"checked":""}>${label}</ha-switch>`;}
  _update(key,value){this._config[key]=value;this.dispatchEvent(new CustomEvent("config-changed",{bubbles:true,composed:true,detail:{config:this._config}}));}
}
if(!customElements.get("battery-monitor-card"))customElements.define("battery-monitor-card",BatteryMonitorCard);
if(!customElements.get("battery-monitor-card-editor"))customElements.define("battery-monitor-card-editor",BatteryMonitorCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==="battery-monitor-card"))window.customCards.push({type:"battery-monitor-card",name:"HA Battery Status Monitor Card",description:"Theme-aware HA Battery Status Monitor card",preview:true});
