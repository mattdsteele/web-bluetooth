class BBQ {
  constructor() {
    this.customService = '2899fe00-c277-48a8-91cb-b29ab0f01ac4';
    this.main = '28998e03-c277-48a8-91cb-b29ab0f01ac4'; 
    this.sensor1 = '28998e10-c277-48a8-91cb-b29ab0f01ac4';
    this.sensor2 = '28998e11-c277-48a8-91cb-b29ab0f01ac4';
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
      chars = await service.getCharacteristics();
      const m = this.getSensor(chars, this.main);
      await m.startNotifications();
      this.char1 = await this.getSensor(chars, this.sensor1).startNotifications();
      this.setupEventListener(this.char1);
      return await this.getSensor(chars, this.sensor2).startNotifications();
      console.log('notifications started');
    } catch(e) {
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
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.customService] }]
      });
      this.device.addEventListener('gattserverdisconnected', () => { this.onDisconnected() });
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

export default BBQ;
