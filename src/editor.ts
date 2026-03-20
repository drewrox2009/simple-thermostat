import { LitElement, html, css } from 'lit-element'
import fireEvent from './fireEvent'
import { name } from '../package.json'

import { CardConfig } from './config/card'
import { HASS } from './types'

function setValue(obj, path, value) {
  const pathFragments = path.split('.')
  let o = obj
  while (pathFragments.length - 1) {
    var fragment = pathFragments.shift()
    if (!o.hasOwnProperty(fragment)) o[fragment] = {}
    o = o[fragment]
  }
  o[pathFragments[0]] = value
}

const OptionsDecimals = [0, 1]
const OptionsStepSize = [0.5, 1]
const OptionsStepLayout = ['column', 'row']
const OptionsThemes = ['standard', 'modern']
const OptionsControlStyles = ['classic', 'dial']

const includeDomains = ['climate']

const GithubReadMe =
  'https://github.com/nervetattoo/simple-thermostat/blob/master/README.md'

const stub = {
  header: {},
  control: {},
  layout: {
    mode: {},
  },
}

const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj))

export default class SimpleThermostatEditor extends LitElement {
  config: CardConfig
  hass: HASS

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        padding: 0;
      }
      .overall-config {
        margin-bottom: 20px;
      }
      .row {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        gap: 16px;
        margin-bottom: 16px;
      }
      .row > * {
        flex: 1;
        min-width: 0;
      }
      .toggle-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 8px;
      }
      ha-formfield {
        display: block;
        margin-bottom: 8px;
      }
      .native-select-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
      }
      .native-select-wrapper label {
        font-size: 12px;
        color: var(--secondary-text-color, #999);
        margin-bottom: 4px;
        font-weight: 500;
      }
      .native-select-wrapper select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background-color: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color, #fff);
        font-size: 14px;
        font-family: inherit;
        appearance: auto;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s;
      }
      .native-select-wrapper select:focus {
        border-color: var(--primary-color, #03a9f4);
      }
      .info-text {
        color: var(--secondary-text-color, #999);
        font-size: 12px;
        margin-top: 16px;
        padding: 8px 0;
        border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
      }
    `
  }

  static get properties() {
    return { hass: {}, config: {} }
  }

  static getStubConfig() {
    return { ...stub }
  }

  setConfig(config) {
    this.config = config || { ...stub }
  }

  _openLink() {
    window.open(GithubReadMe)
  }

  render() {
    if (!this.hass) return html``

    return html`
      <div class="card-config">
        <div class="overall-config">
          <!-- Entity Picker -->
          <div class="row">
            <ha-entity-picker
              label="Entity (required)"
              .hass=${this.hass}
              .value="${this.config.entity}"
              .configValue=${'entity'}
              .includeDomains=${includeDomains}
              @change="${this.valueChanged}"
              allow-custom-entity
            ></ha-entity-picker>
          </div>

          <!-- Toggle Switches -->
          <ha-formfield label="Show header?">
            <ha-switch
              .checked=${this.config.header !== false}
              @change=${this.toggleHeader}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show current temperature?">
            <ha-switch
              .checked=${(this.config as any)?.hide?.temperature !== true}
              .configValue="${'hide.temperature'}"
              @change=${this._invertedToggleChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show state?">
            <ha-switch
              .checked=${(this.config as any)?.hide?.state !== true}
              .configValue="${'hide.state'}"
              @change=${this._invertedToggleChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show mode names?">
            <ha-switch
              .checked=${this.config?.layout?.mode?.names !== false}
              .configValue="${'layout.mode.names'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show mode icons?">
            <ha-switch
              .checked=${this.config?.layout?.mode?.icons !== false}
              .configValue="${'layout.mode.icons'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show mode headings?">
            <ha-switch
              .checked=${this.config?.layout?.mode?.headings !== false}
              .configValue="${'layout.mode.headings'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show HVAC modes?">
            <ha-switch
              .checked=${(this.config?.control as any)?.hvac !== false}
              .configValue="${'control.hvac'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>
          <ha-formfield label="Show preset modes?">
            <ha-switch
              .checked=${(this.config?.control as any)?.preset !== false}
              .configValue="${'control.preset'}"
              @change=${this.valueChanged}
            ></ha-switch>
          </ha-formfield>

          <!-- Theme and Control Style -->
          <div class="row">
            <div class="native-select-wrapper">
              <label>Theme</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'theme')}
              >
                ${OptionsThemes.map(
                  (item) => html`
                    <option
                      value=${item}
                      ?selected=${(this.config.theme || 'standard') === item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
            <div class="native-select-wrapper">
              <label>Control Style</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'control_style')}
              >
                ${OptionsControlStyles.map(
                  (item) => html`
                    <option
                      value=${item}
                      ?selected=${(this.config.control_style || 'classic') ===
                      item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
          </div>

          <!-- Header fields -->
          ${this.config.header !== false
            ? html`
                <div class="row">
                  <ha-textfield
                    label="Name (optional)"
                    .value="${this.config.header?.name || ''}"
                    .configValue="${'header.name'}"
                    @input="${this.valueChanged}"
                  ></ha-textfield>

                  <ha-icon-input
                    label="Icon (optional)"
                    .value="${this.config.header?.icon || ''}"
                    .configValue=${'header.icon'}
                    @value-changed=${this.valueChanged}
                  ></ha-icon-input>
                </div>

                <div class="row">
                  <ha-entity-picker
                    label="Toggle Entity (optional)"
                    .hass=${this.hass}
                    .value="${this.config?.header?.toggle?.entity}"
                    .configValue=${'header.toggle.entity'}
                    @change="${this.valueChanged}"
                    allow-custom-entity
                  ></ha-entity-picker>

                  <ha-textfield
                    label="Toggle entity label"
                    .value="${this.config?.header?.toggle?.name || ''}"
                    .configValue="${'header.toggle.name'}"
                    @input="${this.valueChanged}"
                  ></ha-textfield>
                </div>
              `
            : ''}

          <!-- Fallback -->
          <div class="row">
            <ha-textfield
              label="Fallback Text (optional)"
              .value="${this.config.fallback || ''}"
              .configValue="${'fallback'}"
              @input="${this.valueChanged}"
            ></ha-textfield>
          </div>

          <!-- Decimals and Unit -->
          <div class="row">
            <div class="native-select-wrapper">
              <label>Decimals</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'decimals')}
              >
                ${OptionsDecimals.map(
                  (item) => html`
                    <option
                      value=${item}
                      ?selected=${Number(this.config.decimals ?? 1) === item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
            <ha-textfield
              label="Unit (optional)"
              .value="${this.config.unit || ''}"
              .configValue="${'unit'}"
              @input="${this.valueChanged}"
            ></ha-textfield>
          </div>

          <!-- Step Layout and Size -->
          <div class="row">
            <div class="native-select-wrapper">
              <label>Step Layout</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'layout.step')}
              >
                ${OptionsStepLayout.map(
                  (item) => html`
                    <option
                      value=${item}
                      ?selected=${(this.config.layout?.step || 'column') ===
                      item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
            <div class="native-select-wrapper">
              <label>Step Size</label>
              <select
                @change=${(ev) =>
                  this._nativeSelectChanged(ev.target.value, 'step_size')}
              >
                ${OptionsStepSize.map(
                  (item) => html`
                    <option
                      value=${String(item)}
                      ?selected=${Number(this.config.step_size ?? 0.5) === item}
                    >
                      ${item}
                    </option>
                  `
                )}
              </select>
            </div>
          </div>

          <div class="info-text">
            <mwc-button @click=${this._openLink}>
              Configuration Options
            </mwc-button>
            Advanced settings for sensors, faults, and labels can be configured
            in the code editor.
          </div>
        </div>
      </div>
    `
  }

  /**
   * Handler for native <select> dropdowns.
   */
  _nativeSelectChanged(value: string, configPath: string) {
    if (!this.config || !this.hass) return
    if (value === undefined || value === null) return
    const copy = cloneDeep(this.config)
    setValue(copy, configPath, value)
    fireEvent(this, 'config-changed', { config: copy })
  }

  valueChanged(ev) {
    if (!this.config || !this.hass) {
      return
    }
    const target = ev.currentTarget || ev.target
    const copy = cloneDeep(this.config)
    if (target.configValue) {
      if (target.value === '') {
        delete copy[target.configValue]
      } else {
        setValue(
          copy,
          target.configValue,
          target.checked !== undefined ? target.checked : target.value
        )
      }
    }
    fireEvent(this, 'config-changed', { config: copy })
  }

  toggleHeader(ev) {
    this.config.header = ev.target.checked ? {} : false
    fireEvent(this, 'config-changed', { config: this.config })
  }

  /**
   * Inverted toggle for "hide" config paths.
   * Switch ON = don't hide (remove/set false), Switch OFF = hide (set true).
   */
  _invertedToggleChanged(ev) {
    if (!this.config || !this.hass) return
    const target = ev.currentTarget || ev.target
    const copy = cloneDeep(this.config)
    if (target.configValue) {
      // Inverted: checked=true means DON'T hide, so set to false
      // checked=false means DO hide, so set to true
      setValue(copy, target.configValue, !target.checked)
    }
    fireEvent(this, 'config-changed', { config: copy })
  }
}
