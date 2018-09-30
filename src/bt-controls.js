import Bbq from './bt/bbq';
import Elfy from './bt/elfy';
import SpeedCadence from './bt/cycling';
import keyboard from 'keyboardjs';

class BluetoothControls extends HTMLElement {

  constructor() {
    super();
    this.visible = false;
  }

  keyboardHandler() {
    this.visible = !this.visible;
    this.classList = this.visible ? ['visible'] : [];
  }

  connectedCallback() {
    this.keyboardHandler = this.keyboardHandler.bind(this);
    keyboard.on('ctrl + /', this.keyboardHandler);
    this.innerHTML = `
      <bt-connector type="BBQ"></bt-connector>
      <bt-connector type="Elfy"></bt-connector>
      <bt-connector type="Bike"></bt-connector>
    `;
  }

  disconnectedCallback() {
    keyboard.unbind('ctrl + /', this.keyboardHandler);
  }
}

customElements.define('bt-controls', BluetoothControls);

window.btDevices = {};
const handlers = {
  async bbq() {
    const bbq = new Bbq();
    await bbq.start();
    window.btDevices.bbq = bbq;
  },
  async elfy() {
    const elfy = new Elfy();
    await elfy.start();
    window.btDevices.elfy = elfy;
  },
  async bike() {
    const bike = new SpeedCadence();
    await bike.connect();
    window.btDevices.bike = bike;
  }
};

class BluetoothConnector extends HTMLElement {
  async connect(type) {
    return await handlers[type]();
  }
  connectedCallback() {
    const attr = this.getAttribute('type');
    this.innerHTML = `
      <label><input type="checkbox"></input> ${attr}</label>
    `;
    this.querySelector('input').addEventListener('click', async ({ target: { checked } }) => {
      if (checked) {
        return await this.connect(attr.toLowerCase());
      }
    });
  }
}

customElements.define('bt-connector', BluetoothConnector);
export default BluetoothControls;
