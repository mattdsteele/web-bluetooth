import fromEvent from 'xstream/extra/fromEvent';
import pairwise from 'xstream/extra/pairwise';
import debounce from 'xstream/extra/debounce';
import xs from 'xstream';

export default class SpeedCadence {
  async request() {
    let options = {
      filters: [
        {
          services: ['cycling_speed_and_cadence']
        }
      ]
    };
    try {
      this.device = await navigator.bluetooth.requestDevice(options);
    } catch (e) {
      console.error(e);
    }
    if (!this.device) {
      throw 'No device selected';
    }
  }

  async connect() {
    console.log('connecting', this.device);
    if (!this.device) {
      await this.request();
    }
    try {
      const server = await this.device.gatt.connect();
      const service = await server.getPrimaryService(
        'cycling_speed_and_cadence'
      );
      this.char = await service.getCharacteristic('csc_measurement');
      this.device.addEventListener('gattserverdisconnected', () => {
        this.onDisconnected();
      });
      this.isReady = true;
      return await this.char.startNotifications();
    } catch (e) {
      console.error(e);
    }
  }

  async onDisconnected() {
    this.isReady = false;
    console.log('Device is disconnected.');
    console.debug('Reconnecting...');
    delete this.device;
    await this.reconnect();
  }

  async reconnect() {
    this.exponentialBackoff(
      3 /* max retries */,
      2 /* seconds delay */,
      async () => {
        this.time('Connecting to Bluetooth Device... ');
        await this.connect();
      },
      () => {
        console.log('> Bluetooth Device connected. Try disconnect it now.');
      },
      () => {
        this.time('Failed to reconnect.');
      }
    );
    console.log('Reconnected.');
  }

  parsedMeasurement$() {
    return fromEvent(this.char, 'characteristicvaluechanged')
      .map(({ target: { value } }) => value)
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
        return { totalCrankRevolutions, lastCrankTime };
      })
      .compose(pairwise)
      .map(([prev, curr]) => {
        const revDelta =
          curr.totalCrankRevolutions - prev.totalCrankRevolutions;
        let timeDelta = curr.lastCrankTime - prev.lastCrankTime;
        if (timeDelta < 0) {
          console.log(
            'NEGATIVE TIME',
            curr.lastCrankTime,
            prev.lastCrankTime,
            revDelta
          );
          timeDelta = curr.lastCrankTime + 64 - prev.lastCrankTime;
        }
        console.log(revDelta, timeDelta);
        return { revDelta, timeDelta };
      })
      .filter(i => i.revDelta > 0)
      .map(({ revDelta, timeDelta }) => {
        const minuteRatio = 60 / timeDelta;
        return revDelta * minuteRatio;
      });

    const silence$ = cadence$.compose(debounce(2000)).map(i => 0);

    return xs.merge(cadence$, silence$);
  }

  parsedSpeed$() {
    const speed$ = this.parsedMeasurement$()
      .map(({ totalRevolutions, lastWheelTime }) => {
        return { totalRevolutions, lastWheelTime };
      })
      .compose(pairwise)
      .map(([prev, curr]) => {
        const revDelta = curr.totalRevolutions - prev.totalRevolutions;
        let timeDelta = curr.lastWheelTime - prev.lastWheelTime;
        if (timeDelta < 0) {
          console.log('NEGATIVE TIME', curr.lastWheelTime, prev.lastWheelTime);
          timeDelta = curr.lastWheelTime + 64 - prev.lastWheelTime;
        }
        return { revDelta, timeDelta };
      })
      .filter(i => i.revDelta > 0)
      .map(({ revDelta, timeDelta }) => {
        const wheelSize = 622; // mm; 700C
        const wheelCircumference = Math.PI * wheelSize;

        const rpm = revDelta * (60 / timeDelta);
        const rph = rpm * 60;
        const mmph = rph * wheelCircumference;
        const kph = mmph / 1e6;
        return kph;
      });

    const silence$ = speed$.compose(debounce(2000)).map(i => 0);

    return xs.merge(speed$, silence$);
  }

  rawMeasurement$() {
    return fromEvent(this.char, 'characteristicvaluechanged').map(
      ({ target: { value } }) => {
        return value;
      }
    );
  }

  /* Utils */
  // This function keeps calling "toTry" until promise resolves or has
  // retried "max" number of times. First retry has a delay of "delay" seconds.
  // "success" is called upon success.
  async exponentialBackoff(max, delay, toTry, success, fail) {
    try {
      const result = await toTry();
      success(result);
    } catch (error) {
      if (max === 0) {
        return fail();
      }
      this.time('Retrying in ' + delay + 's... (' + max + ' tries left)');
      setTimeout(() => {
        this.exponentialBackoff(--max, delay * 2, toTry, success, fail);
      }, delay * 1000);
    }
  }

  time(text) {
    console.log('[' + new Date().toJSON().substr(11, 8) + '] ' + text);
  }
}
