import BtControls from './bt-controls';
import Callbacks from './callbacks';
import './heart-rate';

var slideshow = remark.create({
  sourceUrl: 'web-bluetooth.md',
  ratio: '16:9',
  highlightLanguage: 'javaScript',
  highlightLines: true,
  highlightSpans: false,
  highlightStyle: 'zenburn',
  navigation: {
    scroll: false,
    touch: false
  },
  slideNumberFormat() {
    return '@mattdsteele';
  }
});

const callbacks = new Callbacks();
window._slideshow = slideshow;
slideshow.on('showSlide', slide => {
  const {
    properties: { name }
  } = slide;
  if (name && callbacks[name]) {
    callbacks[name]({ slide, slideshow });
  }
});
