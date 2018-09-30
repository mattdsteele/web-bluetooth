import deviceInfo from './bt/device-info';
import heartRate from './bt/heart-rate';

import padStart from 'string.prototype.padstart';

import fromEvent from 'xstream/extra/fromEvent';
import dropRepeats from 'xstream/extra/dropRepeats';

import makeGame from './flappy';
let game;
let mainState;

const bt = device => window.btDevices[device];

const printRawBbq = selector => {
  const q = window.btDevices.bbq;
  q.onUpdate(value => {
    const arr = new Uint8Array(value.buffer);
    const items = [];
    for (let i = 0; i < value.byteLength; i++) {
      items.push(padStart(arr[i].toString(16), 2, '0'));
    }
    update(selector, items.join(' '));
  }); 
};

const update = (selector, data) => {
  document.querySelector(selector).innerHTML = data;
};
const click = (selector, cb) => {
  document.querySelector(selector).addEventListener('click', (e) => cb(e));
}

let thermometerDriven = false;

class Callbacks {
  deviceInfo(slide) {
    const status = document.querySelector('.device-info');
    const append = (text) => {
      status.innerHTML += `${JSON.stringify(text)}\n`;
    };

    document.querySelector('.device').addEventListener('click', async () => {
      append(await deviceInfo());
    });
  }

  hrDemo(slide) {
    const status = document.querySelector('.hr-status');
    const hr = document.querySelector('.heart-rate');
    const update = (text) => {
      hr.innerHTML = text;
    };
    const append = (text) => {
      status.innerHTML += `${text}\n`;
    };
    document.querySelector('.hr-button').addEventListener('click', () => { heartRate((event) => {
        const value = event.target.value;
        const hrValue = value.getUint8(1);
        append(`Received: ${value.byteLength} bytes of data: ${value.getUint8(1)}`);
        update(hrValue);
      });
    });
  }

  bbqRaw() {
    printRawBbq('.thermometer-1');
  }

  bbqReactive() {
    printRawBbq('.bbq-reactive');
  }

  bbqParsed({slideshow}) {
    const q = window.btDevices.bbq;
    q.onUpdate(value => {
      console.log('data length', value.byteLength);
      const arr = new Uint8Array(value.buffer);
      const items = [];
      for (let i = 0; i < value.byteLength; i++) {
        items.push(padStart(arr[i].toString(16), 2, '0'));
      }
      update('.bbq-parsed-raw', items.join(' '));
      const realValue = value.getUint16(12, true);
      update('.bbq-parsed-parsed', realValue / 10);

    }); 
  }

  startTdd({slideshow}) {
    let lastTriggeredCold = false;
    let initialized = false;
    if (initialized) { return; }

    const q = window.btDevices.bbq;
    q.onUpdate(value => {
      initialized = true;
      thermometerDriven = true;
      const realValue = value.getUint16(12, true);

      const lowThreshold = 60;
      const highThreshold = 85;

      if (realValue !== 3686.3) {
        const reading = realValue / 10;
        if (reading < lowThreshold && !lastTriggeredCold) {
          lastTriggeredCold = true;
          slideshow.gotoNextSlide();
        }
        if (reading > highThreshold && lastTriggeredCold) {
          lastTriggeredCold = false;
          slideshow.gotoNextSlide();
        }
      }
    });
  }

  elfy() {
    const elfy = bt('elfy');

    const reduce = (color) => Math.floor(parseInt(color, 16));

    document.querySelector('.elfy-input').addEventListener('change', async ({ target }) => {
      try {
        const { value } = target;
        const r = value.substring(1, 3);
        const g = value.substring(3, 5);
        const b = value.substring(5, 7);
        console.log(r,g,b, reduce(r));
        await elfy.writeColors(reduce(r), reduce(g), reduce(b));
      } catch(error) {
        console.error(error);
      }
    });

    /*
    const q = bt('elfy');
    q.onUpdate(async value => {
      const [r, g, b] = [Math.random(), Math.random(), Math.random()]
      .map(e => e * 256);

      await elfy.writeColors(r, g, b);
    });
    */
  }

  xstreamBbq() {
    const q = window.btDevices.bbq;
    if (!q.rawChar()) { return }
    const thermometerReading$ = fromEvent(q.rawChar(), 'characteristicvaluechanged');
    thermometerReading$
    .map(({ target: { value } }) => value.getUint16(12, true))
    .map(e => e / 10)
    .compose(dropRepeats())
    .addListener({
      next(val) { 
        update('.bbq-stream', `Reading: ${val} degrees`); 
      }
    });
  }

  async rawCycling() {
    const asHexString = (value) => {
      let a = [];
      for (let i = 0; i < value.byteLength; i++) {
        a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
      }
      return a.join(' ');
    };

    const bike = bt('bike');
    if (!bike.isReady) { return; }
    bike.rawMeasurement$()
    .map(v => asHexString(v))
    .addListener({ 
      next(val) {
        update('.raw-cycling', val);
      }
    });
  }

  cadenceAndSpeed() {
    const bike = bt('bike');
    if (!bike.isReady) { return; }
    bike.parsedCadence$()
    .addListener({
      next(val) { 
        val = Math.round(val * 100) / 100;
        const str = `cadence: ${val} rpm`;
        update('.cadence-calc', str);
      },
      error(err) { console.error(err) }
    });

    bike.parsedSpeed$()
    .addListener({
      next(val) { 
        val = Math.round(val * 100) / 100;
        update('.speed-calc', `speed: ${val} kph`);
      },
      error(err) { console.error(err) }
    });
  }

  streamCycling() {
    const bike = bt('bike');
    if (!bike.isReady) { return; }
    bike.parsedMeasurement$()
    .addListener({ 
      next(val) { 
        update('.parsed-cycling', JSON.stringify(val, null, 2));
      },
      error(err) { console.error(err) }
    });
  }

  flappy() {
    const bike = bt('bike');
    if (!bike.isReady) { return; }
    if (game) { return; }
    [game, mainState] = makeGame(document.querySelector('.flappy-bike'));
    bike.parsedCadence$().addListener({
      next: (val) => { 
        mainState.moveBird(val);
      },
      error(err) { console.error(err) }
    });
    // Start the state to actually start the game
    game.state.start('main');
  }
}

export default Callbacks;
