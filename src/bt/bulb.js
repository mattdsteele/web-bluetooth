async function exponentialBackoff(max, delay, toTry, success, fail) {
  try {
    const result = await toTry();
    console.log('result', result);
    success(result);
  } catch(error) {
    if (max === 0) {
      return fail();
    }
    time('Retrying in ' + delay + 's... (' + max + ' tries left)');
    setTimeout(function() {
      exponentialBackoff(--max, delay * 2, toTry, success, fail);
    }, delay * 1000);
  }
}

class Bulb {

  constructor() {
    this.device = null;
    this.isReady = false;
    this.onDisconnected = this.onDisconnected.bind(this);
  }

  isReady() {
    return this.isReady;
  }
  
  async request() {
    let options = {
      "filters": [{
        "namePrefix": "SAMSUNG"
      }],
      "optionalServices": ['0000ffe5-0000-1000-8000-00805f9b34fb']
    };
    this.device = await navigator.bluetooth.requestDevice(options);
    if (!this.device) {
      throw "No device selected";
    }
    this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
  }
  
  async connect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    await exponentialBackoff(3, 2,
      async () => await this.device.gatt.connect(),
      () => console.log('Connected.'),
      () => console.log('Failed to connect')
    );
  }

  async writeGreen() {
    const green = new Uint8Array([0x56, 0x00, 0xff, 0x00, 0x00, 0xf0, 0xaa]);
    await this.writeData(green);
  }

  async writePurple() {
    const purple = new Uint8Array([0x56, 0xff, 0xff, 0x00, 0x00, 0xf0, 0xaa]);
    await this.writeData(purple);
  }
  
  async writeData(data) {
    if (this.isReady) {
      const service = await this.device.gatt.getPrimaryService('0000ffe5-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic(  '0000ffe9-0000-1000-8000-00805f9b34fb');
      await characteristic.writeValue(data);
    } else {
      console.debug('Device is not ready');
    }
  }

  disconnect() {
    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }
    return this.device.gatt.disconnect();
  }

  onDisconnected() {
    console.log('Device is disconnected.');
    this.isReady = false;
    console.debug('Reconnecting...');
    this.reconnect();
  }

  async reconnect() {
    await this.connect();
    this.isReady = true;
    console.log('Reconnected');
  }

  async start() {
    try {
      await this.request();
      await this.connect();
      this.isReady = true;
      console.log('ready');
    } catch(error) {
      console.log(error);
    }
  }

  async writeColors(r, g, b) {
    try {
      const colors = [r, g, b]
        .map(e => Math.floor(e));

      const command = new Uint8Array([0x56].concat(colors).concat([0x00, 0xf0, 0xaa]));
      if (this.isReady) {
        return await this.writeData(command);
      }
    } catch(error) {
      console.error(error);
    }
  }
}
export default Bulb;
