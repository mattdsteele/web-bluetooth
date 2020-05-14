import keyboard from 'keyboardjs';
import 'bt-device';

let original;
console.log('yup');
const advanceSlide = () => {
  console.log('advancing');
  window._slideshow.gotoNextSlide();
};
keyboard.bind('ctrl + /', async () => {
  const device = document.querySelector('bt-device');
  await device.connect();
  device.parse = (data) => {
    console.log('parsing');
    if (!original) {
      original = data;
      document.title += '✔';
      return;
    }
    if (original !== data) {
      original = data;
      advanceSlide();
    }
  };
});
