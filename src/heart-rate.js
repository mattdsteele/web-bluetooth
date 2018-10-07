import {LitElement, html} from '@polymer/lit-element';
import heartRate from './bt/heart-rate';
import keyboard from 'keyboardjs';

class HrMonitor extends LitElement {
  static get properties() {
    return {
      hr: { type: Number },
      connected: { type: Boolean },
      visible: { type: Boolean }
    }
  }
  constructor() {
    super();
    this.hr = 0;
    this.connected = false;
    this.visible = true;
    keyboard.on('ctrl + /', () => this.toggle());
  }
  toggle() {
    this.visible = !this.visible;
  }
  async connect() {
    await heartRate(event => {
        const value = event.target.value;
        const hrValue = value.getUint8(1);
        this.hr = hrValue;
    })
    this.connected = true;

  }
  render() {
    return html`
      <style>
      :host {
        position: absolute;
        bottom: 0;
        right: 0;
        z-index: 100;
      }
      .wrapper {
        display: none;
        background-color: white;
      }
      .wrapper.visible {
        display: block;
      }
      h1 {
        font-size: 4em;
      }
      </style>
      <div class="wrapper ${this.visible ? 'visible' : ''}">
        ${this.connected ? '' : html`<button @click="${e => this.connect()}">Connect</button>`}
        ${this.connected ? html`<h1>❤️ ${this.hr}</h1>`: ''}
      </div>
    `;
  }
}
customElements.define('heart-rate', HrMonitor);