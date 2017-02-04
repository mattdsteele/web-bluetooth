import './sw';
import BtControls from './bt-controls';
import Callbacks from './callbacks';

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
  slideNumberFormat() { return ''; }
});

const callbacks = new Callbacks();
slideshow.on('showSlide', slide => {
  const { properties: { name } } = slide;
  if (name && callbacks[name]) {
    callbacks[name]({ slide, slideshow});
  }
});
