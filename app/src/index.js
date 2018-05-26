import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import MainScreen from './react/MainScreen';

import config from './config';
import SculptureApp from './app';

// Read all all local storage and overwrite the corresponding values in the given config object
// Returns a promise
function applyFromLocalStorage(config) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      else {
        for (let key of Object.keys(items)) {
          config[key] = items[key];
        }
        resolve(true);
      }
    });
  });
}

window.onload = async () => {
  const manifest = chrome.runtime.getManifest();
  console.log(`Version: ${manifest.version}`);

  // Apply config from Chrome local storage to anyware_config
  await applyFromLocalStorage(anyware_config);
  // Apply config from the global variable anyware_config
  config.applyLocalConfig(anyware_config);
  const app = new SculptureApp(config);
  ReactDOM.render(<MainScreen app={app}/>, document.getElementById('anyware-root'));
};
