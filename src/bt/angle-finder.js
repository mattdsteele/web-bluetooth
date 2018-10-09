class AngleFinder {
  constructor() {
    this.customService = '0783b03e-8535-b5a0-7140-a304d2495cb7';
    this.sensorChar = '0783b03e-8535-b5a0-7140-a304d2495cb8';
    this.callbacks = [];
  }

  setupEventListener(char) {
    char.addEventListener('characteristicvaluechanged', ({ target }) => {
      const { value } = target;
      this.callbacks.forEach(cb => cb(value));
    });
  }

  getSensor(chars, uuid) {
    return chars.find(c => c.uuid === uuid);
  }

  async connect() {
    let chars;
    try {
      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService(this.customService);
      console.log('have service');
      chars = await service.getCharacteristics();
      const char = this.getSensor(chars, this.sensorChar);
      await char.startNotifications();
      await this.setupEventListener(char);
    } catch (e) {
      console.error('unable to fail', e);
    }
  }

  async reconnect() {
    await this.connect();
    console.log('Reconnected.');
  }

  async onDisconnected() {
    console.log('Device is disconnected.');
    console.debug('Reconnecting...');
    await this.reconnect();
  }

  async startSensor() {
    try {
      console.log('connecting');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Tool' }],
        optionalServices: [this.customService]
      });
      console.log('connected');
      this.device.addEventListener('gattserverdisconnected', () => {
        this.onDisconnected();
      });
      return await this.connect();
    } catch (e) {
      console.error('failed', e);
    }
  }

  rawChar() {
    return this.char1;
  }

  async start() {
    if (!this.started) {
      this.started = await this.startSensor();
    }
    return this.started;
  }

  onUpdate(cb) {
    this.callbacks.push(cb);
  }
}

export { AngleFinder };
