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

class Elfy {

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
        "namePrefix": "b+EMIE"
      }],
      "optionalServices": ['6e402001-b5a3-f393-e0a9-e50e24dcca9e']
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
    const green = new Uint8Array([0xaa, 0x16, 0x00, 0xff, 0x00]);
    await this.writeData(green);
  }

  async writePink() {
    const color = new Uint8Array([0xaa, 0x16, 0x0a, 0x00, 0x09]);
    await this.writeData(color);
  }

  // aa 15 0r gb 0000 0fff 0fff 0fff etc
  async defaultWhiteOnly() {
    const color = new Uint8Array([0xaa, 0x15, 0x0a, 0xaa, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    await this.writeData(color);
    console.log('white');
  }

  async defaultRGB() {
    const color = new Uint8Array([0xaa, 0x15, 0x0a, 0xaa, 0x0a, 0x00, 0x00, 0xa0, 0x00, 0x0a, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    await this.writeData(color);
    console.log('rgb');
  }
  
  async writeData(data) {
    if (this.isReady) {
      const service = await this.device.gatt.getPrimaryService('6e402001-b5a3-f393-e0a9-e50e24dcca9e');
      const characteristic = await service.getCharacteristic(  '6e402002-b5a3-f393-e0a9-e50e24dcca9e');
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
        .map(e => e / 16)
        .map(e => Math.floor(e));

      const command = new Uint8Array([0xaa, 0x16].concat(colors));
      if (this.isReady) {
        return await this.writeData(command);
      }
    } catch(error) {
      console.error(error);
    }
  }
}
export default Elfy;
