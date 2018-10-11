import Bbq from './bt/bbq';
import Elfy from './bt/elfy';
import SpeedCadence from './bt/cycling';
import { AngleFinder } from './bt/angle-finder';
import keyboard from 'keyboardjs';
import { defineCustomElements } from 'turn-touch-element/dist/loader';
defineCustomElements(window);

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
    this.keyboardHandler();
    keyboard.on('ctrl + /', this.keyboardHandler);
    this.innerHTML = `
      <bt-connector type="Remote"></bt-connector>
      <bt-connector type="BBQ"></bt-connector>
      <bt-connector type="Elfy"></bt-connector>
      <bt-connector type="Bike"></bt-connector>
      <bt-connector type="Angle"></bt-connector>
    `;
  }

  disconnectedCallback() {
    keyboard.unbind('ctrl + /', this.keyboardHandler);
  }
}

customElements.define('bt-controls', BluetoothControls);

window.btDevices = {};
const handlers = {
  async remote() {
    const turnTouch = document.querySelector('turn-touch');
    await turnTouch.connect();
    const slideshow = window._slideshow;
    turnTouch.onLeft = () => {
      slideshow.gotoPreviousSlide();
    };
    turnTouch.onRight = () => {
      slideshow.gotoNextSlide();
    };
  },
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
  },
  async angle() {
    const angle = new AngleFinder();
    await angle.start();
    window.btDevices.angle = angle;
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
    this.querySelector('input').addEventListener(
      'click',
      async ({ target: { checked } }) => {
        if (checked) {
          return await this.connect(attr.toLowerCase());
        }
      }
    );
  }
}

customElements.define('bt-connector', BluetoothConnector);
export default BluetoothControls;
