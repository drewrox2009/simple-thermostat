import { LitElement, html } from 'lit-element'
import styles from './styles.css'
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
    return styles
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
          <div class="side-by-side">
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

          <ha-formfield label="Show header?">
            <ha-switch
              .checked=${this.config.header !== false}
              @change=${this.toggleHeader}
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

          <div class="side-by-side">
            <ha-select
              label="Theme (optional)"
              .configValue=${'theme'}
              .value=${this.config.theme || 'standard'}
              @selected=${this.valueChanged}
              @closed=${(e) => e.stopPropagation()}
              fixedMenuPosition=${true}
              class="dropdown"
            >
              ${OptionsThemes.map(
                (item) =>
                  html`<mwc-list-item value=${item}>${item}</mwc-list-item>`
              )}
            </ha-select>

            <ha-select
              label="Control Style (optional)"
              .configValue=${'control_style'}
              .value=${this.config.control_style || 'classic'}
              @selected=${this.valueChanged}
              @closed=${(e) => e.stopPropagation()}
              fixedMenuPosition=${true}
              class="dropdown"
            >
              ${OptionsControlStyles.map(
                (item) =>
                  html`<mwc-list-item value=${item}>${item}</mwc-list-item>`
              )}
            </ha-select>
          </div>

          ${this.config.header !== false
            ? html`
                <div class="side-by-side">
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

                <div class="side-by-side">
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

          <div class="side-by-side">
            <ha-textfield
              label="Fallback Text (optional)"
              .value="${this.config.fallback || ''}"
              .configValue="${'fallback'}"
              @input="${this.valueChanged}"
            ></ha-textfield>
          </div>

          <div class="side-by-side">
            <ha-select
              label="Decimals (optional)"
              .configValue=${'decimals'}
              .value=${String(this.config.decimals ?? 1)}
              @selected="${this.valueChanged}"
              @closed=${(e) => e.stopPropagation()}
              fixedMenuPosition=${true}
              class="dropdown"
            >
              ${Object.values(OptionsDecimals).map(
                (item) =>
                  html`<mwc-list-item value=${String(item)}
                    >${item}</mwc-list-item
                  >`
              )}
            </ha-select>

            <ha-textfield
              label="Unit (optional)"
              .value="${this.config.unit || ''}"
              .configValue="${'unit'}"
              @input="${this.valueChanged}"
            ></ha-textfield>
          </div>

          <div class="side-by-side">
            <ha-select
              label="Step Layout (optional)"
              .configValue=${'layout.step'}
              .value=${this.config.layout?.step || 'column'}
              @selected="${this.valueChanged}"
              @closed=${(e) => e.stopPropagation()}
              fixedMenuPosition=${true}
              class="dropdown"
            >
              ${Object.values(OptionsStepLayout).map(
                (item) =>
                  html`<mwc-list-item value=${item}>${item}</mwc-list-item>`
              )}
            </ha-select>

            <ha-select
              label="Step Size (optional)"
              .configValue=${'step_size'}
              .value=${String(this.config.step_size ?? 0.5)}
              @selected="${this.valueChanged}"
              @closed=${(e) => e.stopPropagation()}
              fixedMenuPosition=${true}
              class="dropdown"
            >
              ${Object.values(OptionsStepSize).map(
                (item) =>
                  html`<mwc-list-item value=${String(item)}
                    >${item}</mwc-list-item
                  >`
              )}
            </ha-select>
          </div>

          <div class="side-by-side">
            <mwc-button @click=${this._openLink}>
              Configuration Options
            </mwc-button>

            Settings for label, control, sensors, faults and hiding UI elements
            can only be configured in the code editor
          </div>
        </div>
      </div>
    `
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
}
