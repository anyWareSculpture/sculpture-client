import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';

import MainScreen from './react/MainScreen';

import config from './config';
import localConfig from '../config';
import SculptureApp from './app';

window.onload = () => {
  const manifest = chrome.runtime.getManifest();
  console.log(`Version: ${manifest.version}`);

  config.applyLocalConfig(localConfig);
  const app = new SculptureApp(config);
  ReactDOM.render(<MainScreen app={app} restart={() => chrome.runtime.reload()}/>, document.getElementById('anyware-root'));
};
