import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import MainScreen from './react/MainScreen';

import config from './config';
import SculptureApp from './app';

// TODO: Don't expose this
window.app = new SculptureApp(config);

window.onload = () => {
  const manifest = chrome.runtime.getManifest();
  console.log(`Version: ${manifest.version}`);

  ReactDOM.render(<MainScreen app={window.app} restart={() => chrome.runtime.reload()}/>, document.getElementById('anyware-root'));
};


const connectionOptions = Object.assign({}, config.CLIENT_CONNECTION_OPTIONS.default);

if (process.argv.length === 4) {
  console.log("Using authentication information provided by command arguments");
  connectionOptions.username = process.argv[2];
  connectionOptions.password = process.argv[3];
}

window.app.connectAndSetup(connectionOptions);
