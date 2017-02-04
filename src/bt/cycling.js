import fromEvent from 'xstream/extra/fromEvent'; 
import pairwise from 'xstream/extra/pairwise';
import debounce from 'xstream/extra/debounce';
import xs from 'xstream';

export default class SpeedCadence {
  async request() {
    let options = {
      filters: [{
        services: ['cycling_speed_and_cadence']
      }]
    };
    this.device = await navigator.bluetooth.requestDevice(options);
    if (!this.device) {
      throw "No device selected";
    }
  }
  
  async connect() {
    if (!this.device) {
      await this.request();
    }
    const server = await this.device.gatt.connect();
    const service = await server.getPrimaryService('cycling_speed_and_cadence');
    this.char = await service.getCharacteristic('csc_measurement');
    this.device.addEventListener('gattserverdisconnected', () => { this.onDisconnected() });
    this.isReady = true;
    return await this.char.startNotifications();
  }

  async onDisconnected() {
    this.isReady = false;
    console.log('Device is disconnected.');
    console.debug('Reconnecting...');
    await this.reconnect();
  }

  async reconnect() {
    await this.connect();
    console.log('Reconnected.');
  }

  parsedMeasurement$() {
    return fromEvent(this.char, 'characteristicvaluechanged')
    .map(({ target: { value } }) => value )
    .map(data => {
      const flags = data.getUint8(0);
      const wheelDataPresent = flags & 0x1;
      const crankDataPresent = flags & 0x2;

      const output = {};
      if (wheelDataPresent) {
        output.totalRevolutions = data.getUint32(1, true);
        output.lastWheelTime = data.getUint16(5, true) / 1024;
      }

      if (crankDataPresent) {
        output.totalCrankRevolutions = data.getUint16(7, true);
        output.lastCrankTime = data.getUint16(9, true) / 1024;
      }

      return output;
    });
  }

  parsedCadence$() {
    const cadence$ = this.parsedMeasurement$()
    .map(({ totalCrankRevolutions, lastCrankTime }) => {
      return { totalCrankRevolutions, lastCrankTime }
    })
    .compose(pairwise)
    .map(([prev, curr]) => {
      const revDelta = curr.totalCrankRevolutions - prev.totalCrankRevolutions;
      const timeDelta = curr.lastCrankTime - prev.lastCrankTime;
      return { revDelta, timeDelta };
    })
    .filter(i => i.revDelta > 0)
    .map(({ revDelta, timeDelta}) => {
      const minuteRatio = 60 / timeDelta;
      return revDelta * minuteRatio;
    });

    const silence$ = cadence$
    .compose(debounce(2000))
    .map(i => 0);

    return xs.merge(cadence$, silence$);
  }

  parsedSpeed$() {
    const speed$ = this.parsedMeasurement$()
    .map(({ totalRevolutions, lastWheelTime }) => {
      return { totalRevolutions, lastWheelTime }
    })
    .compose(pairwise)
    .map(([prev, curr]) => {
      const revDelta = curr.totalRevolutions - prev.totalRevolutions;
      const timeDelta = curr.lastWheelTime - prev.lastWheelTime;
      return { revDelta, timeDelta };
    })
    .filter(i => i.revDelta > 0)
    .map(({ revDelta, timeDelta}) => {
      const wheelSize = 622; // mm; 700C
      const wheelCircumference = Math.PI * wheelSize;

      const rpm = revDelta * (60 / timeDelta);
      const rph = rpm * 60;
      const mmph = rph * wheelCircumference;
      const kph = mmph / 1e6;
      return kph;
    });

    const silence$ = speed$
    .compose(debounce(2000))
    .map(i => 0);

    return xs.merge(speed$, silence$);
  }

  rawMeasurement$() {
    return fromEvent(this.char, 'characteristicvaluechanged')
    .map(({ target: { value } }) => {
      return value;
    });
  }
}
