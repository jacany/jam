import {on} from 'use-minimal-state';
import log from '../lib/causal-log';

export {arrayRemove, debug, until, domEvent};

function arrayRemove(arr, el) {
  let i = arr.indexOf(el);
  if (i !== -1) arr.splice(i, 1);
}

function debug(state) {
  on(state, (key, value, oldValue) => {
    if (oldValue !== undefined) {
      log(key, oldValue, '->', value);
    } else {
      log(key, value);
    }
  });
}

async function until(state, key, condition) {
  return new Promise(resolve => {
    let off = on(state, key, value => {
      if (condition(value)) {
        off();
        resolve(value);
      }
    });
  });
}

function domEvent(el, event) {
  return new Promise(resolve => {
    el.addEventListener(event, function onEvent() {
      console.log(event);
      el.removeEventListener(event, onEvent);
      resolve();
    });
  });
}
